// js/warehouse/inventory.js
//
// Inventory module for the Warehouse dashboard.
//
// Fetches data/products.json, filters it to the active warehouse, renders
// #inventoryTableBody, builds #categoryFilter options from the data (no
// hardcoded category list), and wires live search + category filtering plus
// the Add/Edit stock modal.
//
// Usage (from js/dashboard.js, after pages/inventory.html has been injected
// into #moduleContent):
//
//   import { initInventory } from "./warehouse/inventory.js";
//   initInventory();
//
// Items are keyed by `sku` throughout, matching data/products.json,
// data/orders.json and overview.js.
//
// Stock status ("In Stock" / "Low Stock" / "Out of Stock") is NOT stored in
// the data — it's calculated from quantity by deriveStatus(). Storing it
// would let the badge contradict the number sitting next to it.
//
// PERSISTENCE: edits live in the in-memory `inventoryItems` array only.
// Switching modules re-reads the feed and discards them. That's deliberate —
// writing to disk needs a real backend, and faking it in localStorage would
// hide the gap.

import { LOW_STOCK_THRESHOLD } from "./overview.js";
import {
  getProducts,
  getActiveWarehouse,
  createProduct,
  updateProduct,
} from "./data-store.js";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const STATUS_BADGE_CLASSES = {
  "In Stock": "bg-[#8DC63F]/15 text-[#8DC63F]",
  "Low Stock": "bg-[#F7931E]/15 text-[#F7931E]",
  "Out of Stock": "bg-red-100 text-red-700",
};

// Category vocabulary for the modal dropdown, derived from products.json at
// load rather than hardcoded — a new category shouldn't need a code change.
// Anything outside the list still round-trips via the "Custom…" option.
let presetCategories = [];
const CUSTOM_CATEGORY_VALUE = "__custom__";

// This hub's items — a filtered VIEW of allProducts, used for rendering.
let inventoryItems = [];

// Every warehouse's items: the loader's own cached array, not a copy. Writes
// go through data-store.js so this stays the one shared in-memory truth —
// otherwise adding stock in Inventory wouldn't move the dashboard's totals.
let allProducts = [];

// Set once per initInventory() call, so a submit knows which warehouse a
// newly-created item belongs to.
let activeWarehouse = { id: "WH-UNKNOWN", name: "Unknown Hub" };

// Returned by wireStockModal(); called by the delegated click handler.
let openStockModal = null;

// Guards against stacking duplicate listeners when the fragment is loaded
// more than once in a session (nav to Orders and back).
let modalWired = false;

/**
 * Derives the stock status from quantity so the badge can never contradict
 * the number beside it. Uses the same threshold as the dashboard's Low Stock
 * metric.
 */
function deriveStatus(quantity) {
  if (quantity <= 0) return "Out of Stock";
  if (quantity < LOW_STOCK_THRESHOLD) return "Low Stock";
  return "In Stock";
}

/* ------------------------------------------------------------------ */
/* SKU generation                                                      */
/* ------------------------------------------------------------------ */
//
// SKUs are generated, never typed — a hand-keyed SKU is the single easiest
// way for a staffer to silently corrupt inventory (typos create phantom
// items; a reused code merges two products). The format mirrors the codes
// already in products.json: SKU-<PRODUCT>-<SIZE>.
//
// The scheme is deliberately DETERMINISTIC: the same product entered at two
// hubs derives the same SKU, which is what makes "Basmati Rice" comparable
// across Ikeja and Lekki. It is not random, so it stays readable on a
// printed pick-list.

/**
 * Builds the identity half of the SKU from an item name: the product noun
 * plus the word qualifying it — "Groundnut Oil" → GROUNDNUT-OIL.
 *
 * The qualifier is essential, not decoration. On the noun alone, Groundnut Oil
 * and Palm Oil both derive SKU-OIL-5L, so the second one entered gets a "-2"
 * ordinal — and which product wins the base code then depends on data-entry
 * order, differing per warehouse. That would defeat the whole point of a
 * deterministic scheme.
 *
 * Size-like words are skipped ("Semovita 10kg" → SEMOVITA, not 10KG) since
 * size belongs in the other half of the code.
 */
function productToken(name) {
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    // Drop pure measurements ("10kg", "5L", "500") — they're size, not identity.
    .filter((word) => !/^\d+(KG|ML|CL|L|G)?$/i.test(word));

  if (!words.length) return "ITEM";

  // Trailing plurals are trimmed so "Fresh Tomatoes" and "Fresh Tomato" can't
  // split one product into two SKUs.
  const noun = singularize(words[words.length - 1].toUpperCase()).slice(0, 10);
  if (words.length === 1) return noun;

  const qualifier = words[words.length - 2].toUpperCase().slice(0, 10);
  return `${qualifier}-${noun}`;
}

/**
 * Crude but predictable de-pluralisation — enough for product nouns, and
 * deliberately not a full inflector. Leaves short words and double-s endings
 * alone ("GLASS" stays GLASS).
 */
function singularize(word) {
  if (word.length > 4 && word.endsWith("IES")) return `${word.slice(0, -3)}Y`;
  if (word.length > 4 && word.endsWith("OES")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("S") && !word.endsWith("SS")) return word.slice(0, -1);
  return word;
}

/**
 * Prefers an explicit pack size found anywhere in the name or unit
 * ("50kg" → 50KG, "5L" → 5L), since that's the most useful discriminator.
 * Otherwise falls back to the unit's own noun — "Full Bag" → BAG,
 * "Basket" → BASKET.
 */
function sizeToken(name, unit) {
  const haystack = `${name} ${unit}`;
  const explicitSize = haystack.match(/(\d+)\s*(KG|ML|CL|L|G)\b/i);
  if (explicitSize) {
    return `${explicitSize[1]}${explicitSize[2].toUpperCase()}`;
  }

  const unitWords = unit.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (!unitWords.length) return "UNIT";
  return singularize(unitWords[unitWords.length - 1].toUpperCase()).slice(0, 6);
}

/**
 * Builds the SKU and guarantees it's unused at this warehouse. A collision
 * on the base code usually means the item genuinely already exists, so the
 * caller surfaces a hint — but a numeric suffix is still appended so two
 * legitimately different products can't be blocked from coexisting.
 *
 * Returns { sku, collided } — `collided` drives that hint.
 */
function generateSku(name, unit, items, { ignoreSku = null } = {}) {
  const base = `SKU-${productToken(name)}-${sizeToken(name, unit)}`;

  const taken = new Set(
    items
      .map((item) => item.sku)
      .filter((sku) => sku !== ignoreSku)
  );

  if (!taken.has(base)) return { sku: base, collided: false };

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return { sku: `${base}-${suffix}`, collided: true };
}

/**
 * Boots the inventory module. Safe to call once per fragment load — bails
 * out quietly (with a console warning) if the markup isn't mounted yet.
 */
export async function initInventory() {
  const root = document.getElementById("inventoryModule");
  const tableBody = document.getElementById("inventoryTableBody");
  const searchInput = document.getElementById("inventorySearch");
  const categoryFilter = document.getElementById("categoryFilter");
  const emptyState = document.getElementById("inventoryEmptyState");

  if (!root || !tableBody) {
    console.warn("initInventory(): inventory markup not found — is pages/inventory.html mounted in #moduleContent?");
    return;
  }

  // Single source for "which hub am I?" — see data-store.js.
  activeWarehouse = getActiveWarehouse();

  try {
    // No fetch here: the loader owns reading the feed, checking the HTTP
    // status, and caching. Called from three modules, downloaded once.
    allProducts = await getProducts();

    inventoryItems = allProducts.filter((item) => item.warehouseId === activeWarehouse.id);

    // Modal dropdown vocabulary: derived from EVERY warehouse's products, not
    // just this hub's. Lekki should still be offered "Legumes" when only Ikeja
    // stocks it — otherwise adding the first legume item at a new hub is forced
    // down the Custom… path for a category the business already uses.
    presetCategories = [...new Set(allProducts.map((item) => item.category))].sort();
  } catch (error) {
    console.error("Could not load inventory data:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-6 text-center text-sm text-[rgba(0,0,0,0.45)]">
          ${error.message || "Couldn't load inventory data."}
        </td>
      </tr>`;
    return;
  }

  populateCategoryOptions(categoryFilter, inventoryItems);
  renderRows(tableBody, emptyState, inventoryItems);

  // Listeners are bound to the ELEMENT, flagged on the element.
  //
  // On warehouse.html this init runs once per fragment load, and a fresh
  // fragment means fresh elements — so a plain addEventListener would be
  // fine. The agent page breaks that assumption: switching hubs re-runs this
  // against the SAME nodes that are already on screen. Without the flag,
  // every switch stacks another copy of each listener, and after three
  // switches one keystroke runs applyFilters three times.
  //
  // Marking the element (rather than a module-level boolean) is what makes
  // both cases correct: a new element has no flag and gets wired, an existing
  // one is skipped.
  if (searchInput && !searchInput.dataset.flWired) {
    searchInput.addEventListener("input", () =>
      applyFilters(tableBody, emptyState, searchInput, categoryFilter)
    );
    searchInput.dataset.flWired = "1";
  }

  if (categoryFilter && !categoryFilter.dataset.flWired) {
    categoryFilter.addEventListener("change", () =>
      applyFilters(tableBody, emptyState, searchInput, categoryFilter)
    );
    categoryFilter.dataset.flWired = "1";
  }

  // The modal lives in the persistent shell (warehouse.html /
  // warehouse-agent.html), not in this fragment, so its listeners survive
  // module swaps and must only be bound once.
  if (!modalWired) {
    openStockModal = wireStockModal({ tableBody, emptyState, categoryFilter });
    modalWired = true;
  }

  // Delegated: covers "+ Add New Item" and every row's Edit button,
  // including rows rendered after a later filter change.
  if (!root.dataset.flWired) {
    root.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-modal-target]");
      if (!trigger || !openStockModal) return;

      const editSku = trigger.dataset.editItem;
      if (editSku) {
        const item = inventoryItems.find((entry) => entry.sku === editSku);
        if (item) openStockModal({ mode: "EDIT", item });
      } else {
        openStockModal({ mode: "CREATE" });
      }
    });
    root.dataset.flWired = "1";
  }
}

function applyFilters(tableBody, emptyState, searchInput, categoryFilter) {
  const query = (searchInput?.value || "").trim().toLowerCase();
  const category = categoryFilter?.value || "all";

  const filtered = inventoryItems.filter((item) => {
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  renderRows(tableBody, emptyState, filtered);
}

function populateCategoryOptions(select, items) {
  if (!select) return;
  const previous = select.value;
  const categories = [...new Set(items.map((item) => item.category))].sort();

  // Keep "All Categories", drop anything else, rebuild from the data.
  select.querySelectorAll("option:not([value='all'])").forEach((opt) => opt.remove());
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  // Preserve the active filter across a rebuild (e.g. after adding an item),
  // falling back to "all" if that category no longer exists.
  select.value = categories.includes(previous) ? previous : "all";
}

function renderRows(tableBody, emptyState, items) {
  tableBody.innerHTML = "";

  if (items.length === 0) {
    emptyState?.classList.remove("hidden");
    emptyState?.classList.add("flex");
    return;
  }
  emptyState?.classList.add("hidden");
  emptyState?.classList.remove("flex");

  items.forEach((item) => {
    const status = deriveStatus(item.quantity);
    const badgeClasses = STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES["Out of Stock"];
    const unitLabel = item.unit ? `<span class="text-[rgba(0,0,0,0.45)]"> ${item.unit}${item.quantity === 1 ? "" : "s"}</span>` : "";

    const row = document.createElement("tr");
    row.className = "border-b border-[rgba(0,0,0,0.08)] last:border-0";
    row.dataset.sku = item.sku;
    row.innerHTML = `
      <td class="p-4 text-[rgba(0,0,0,0.45)]">${item.sku}</td>
      <td class="p-4 font-medium text-[#0A0A0A]">${item.name}</td>
      <td class="p-4 text-[rgba(0,0,0,0.45)]">${item.category}</td>
      <td class="p-4 text-[#0A0A0A]">${item.quantity.toLocaleString()}${unitLabel}</td>
      <td class="p-4 text-[#0A0A0A]">${CURRENCY_FORMATTER.format(item.unitPrice)}</td>
      <td class="p-4">
        <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badgeClasses}">${status}</span>
      </td>
      <td class="p-4 text-right">
        <button type="button" data-modal-target="stock-modal" data-edit-item="${item.sku}" class="rounded-lg bg-[#F7931E] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e08216]">Edit</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

/* ------------------------------------------------------------------ */
/* Stock modal: CREATE / EDIT state + submit handling                  */
/* ------------------------------------------------------------------ */
function wireStockModal({ tableBody, emptyState, categoryFilter }) {
  const modal = document.getElementById("stock-modal");
  const form = document.getElementById("stock-item-form");

  if (!modal || !form) {
    console.warn("wireStockModal(): #stock-modal / #stock-item-form not found in the DOM.");
    return null;
  }

  const modalTitle = document.getElementById("stockModalTitle");
  const skuInput = document.getElementById("stock-item-sku");
  const skuHint = document.getElementById("stock-item-sku-hint");
  const nameInput = document.getElementById("stock-item-name");
  const categorySelect = document.getElementById("stock-item-category");
  const categoryCustomInput = document.getElementById("stock-item-category-custom");
  const quantityInput = document.getElementById("stock-item-quantity");
  const unitInput = document.getElementById("stock-item-unit");
  const priceInput = document.getElementById("stock-item-price");
  const closeBtn = document.getElementById("stock-modal-close-btn");
  const cancelBtn = document.getElementById("stock-modal-cancel-btn");

  // Rebuild the preset options from the data on every init, so a category
  // introduced by a newly-added item shows up without a reload. Runs here
  // rather than in wireStockModal() because that only executes once.
  categorySelect.innerHTML = "";
  presetCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  const customOption = document.createElement("option");
  customOption.value = CUSTOM_CATEGORY_VALUE;
  customOption.textContent = "Custom…";
  categorySelect.appendChild(customOption);

  // Toggle the free-text category field alongside the preset dropdown.
  categorySelect.addEventListener("change", () => {
    const isCustom = categorySelect.value === CUSTOM_CATEGORY_VALUE;
    categoryCustomInput.classList.toggle("hidden", !isCustom);
    categoryCustomInput.required = isCustom;
    if (isCustom) categoryCustomInput.focus();
  });

  closeBtn?.addEventListener("click", () => modal.close());
  cancelBtn?.addEventListener("click", () => modal.close());

  // Clicking the ::backdrop (outside the form panel) closes the dialog.
  // <dialog> also handles Esc natively.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });

  // Live SKU preview: regenerate as the name/unit are typed so the staffer
  // sees the code they're about to create before committing.
  const refreshSkuPreview = () => {
    if (form.dataset.mode === "EDIT") return; // SKU is fixed once assigned
    const name = nameInput.value.trim();
    if (!name) {
      skuInput.value = "";
      skuHint.textContent = "Generated once you enter an item name.";
      skuHint.classList.remove("text-[#F7931E]");
      return;
    }
    const { sku, collided } = generateSku(name, unitInput.value.trim(), inventoryItems);
    skuInput.value = sku;
    if (collided) {
      skuHint.textContent = `A similar item already exists at ${activeWarehouse.name} — check you're not duplicating it.`;
      skuHint.classList.add("text-[#F7931E]");
    } else {
      skuHint.textContent = "Generated automatically from the item name and unit.";
      skuHint.classList.remove("text-[#F7931E]");
    }
  };

  nameInput.addEventListener("input", refreshSkuPreview);
  unitInput.addEventListener("input", refreshSkuPreview);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const category =
      categorySelect.value === CUSTOM_CATEGORY_VALUE
        ? categoryCustomInput.value.trim()
        : categorySelect.value;

    const quantity = Number(quantityInput.value);
    const name = nameInput.value.trim();
    const unit = unitInput.value.trim();
    const isEdit = form.dataset.mode === "EDIT";

    // Regenerated at submit rather than trusting the preview field, so a
    // stale or tampered input can't introduce a duplicate. On EDIT the
    // original SKU is kept: it's the record's identity and orders.json line
    // items already reference it.
    const sku = isEdit
      ? form.dataset.editingSku
      : generateSku(name, unit, inventoryItems).sku;

    const itemData = {
      sku,
      name,
      category,
      quantity,
      unit,
      unitPrice: Number(priceInput.value),
      // Status is deliberately absent — deriveStatus() computes it from
      // quantity at render time, so a stored value can't contradict the
      // number beside it.
      warehouseId: activeWarehouse.id,
      warehouseName: activeWarehouse.name,
    };

    // Disabled while saving so a double-click can't submit twice — with a real
    // backend that would create two records.
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving…";
    }

    try {
      if (isEdit) {
        // Scoped to this item's OWN warehouse, not the active one. On the
        // agent page the active hub can change while this modal is open;
        // without this the edit would silently land on the wrong warehouse.
        const owningWarehouse = form.dataset.editingWarehouseId || activeWarehouse.id;
        await updateProduct(sku, owningWarehouse, itemData);
      } else {
        await createProduct(itemData);
      }

      // Re-derive the view from the shared array so this table reflects what
      // every other module will also see.
      inventoryItems = allProducts.filter((item) => item.warehouseId === activeWarehouse.id);
      presetCategories = [...new Set(allProducts.map((item) => item.category))].sort();

      populateCategoryOptions(categoryFilter, inventoryItems);
      applyFilters(tableBody, emptyState, document.getElementById("inventorySearch"), categoryFilter);

      modal.close();
    } catch (error) {
      console.error("Could not save item:", error);
      skuHint.textContent = error.message || "Couldn't save. Please try again.";
      skuHint.classList.add("text-red-500");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
    }
  });

  function openStockModalImpl({ mode, item = null }) {
    form.reset();
    categoryCustomInput.classList.add("hidden");
    categoryCustomInput.required = false;
    skuHint.classList.remove("text-[#F7931E]", "text-red-500");

    if (mode === "EDIT" && item) {
      form.dataset.mode = "EDIT";
      form.dataset.editingSku = item.sku;
      // Pinned so the save targets the record's own hub even if the active
      // warehouse changes while this modal is open (agent page).
      form.dataset.editingWarehouseId = item.warehouseId;

      // The SKU is the record's identity and orders.json line items already
      // reference it, so it's displayed but never regenerated on edit.
      skuInput.value = item.sku;
      skuHint.textContent = "SKUs are fixed once assigned.";

      nameInput.value = item.name;
      quantityInput.value = item.quantity;
      unitInput.value = item.unit || "";
      priceInput.value = item.unitPrice;

      if (presetCategories.includes(item.category)) {
        categorySelect.value = item.category;
      } else {
        categorySelect.value = CUSTOM_CATEGORY_VALUE;
        categoryCustomInput.classList.remove("hidden");
        categoryCustomInput.value = item.category;
        categoryCustomInput.required = true;
      }

      modalTitle.textContent = `Update Item: ${item.sku}`;
    } else {
      form.dataset.mode = "CREATE";
      delete form.dataset.editingSku;
      delete form.dataset.editingWarehouseId;

      skuInput.value = "";
      skuHint.textContent = "Generated once you enter an item name.";
      if (presetCategories.length) categorySelect.value = presetCategories[0];

      modalTitle.textContent = `Add New Item — ${activeWarehouse.name}`;
    }

    modal.showModal();
    // Always the name: the SKU field is read-only in both modes now, and the
    // name is what drives generation.
    nameInput.focus();
  }

  return openStockModalImpl;
}
