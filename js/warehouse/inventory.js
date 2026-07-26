// js/warehouse/inventory.js
//
// Inventory module for the Warehouse dashboard.
// Fetches data/inventory.json, renders #inventoryTableBody, builds the
// #categoryFilter options dynamically (no hardcoded categories), and
// wires live search + category filtering.
//
// Usage (from js/dashboard.js, after pages/inventory.html has been
// injected into #moduleContent):
//
//   import { initInventory } from "./warehouse/inventory.js";
//   await loadFragment("pages/inventory.html", "#moduleContent");
//   initInventory();




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

let inventoryItems = [];

/**
 * Boots the inventory module. Safe to call once per fragment load —
 * bails out quietly (with a console warning) if the fragment markup
 * isn't in the DOM yet.
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

  try {
    const response = await fetch("data/products.json");
    if (!response.ok) throw new Error(`Failed to load inventory (${response.status})`);
    inventoryItems = await response.json();
  } catch (error) {
    console.error("Could not load inventory data:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="p-6 text-center text-sm text-[rgba(0,0,0,0.45)]">
          Couldn't load inventory data. Check that data/inventory.json is reachable.
        </td>
      </tr>`;
    return;
  }

  populateCategoryOptions(categoryFilter, inventoryItems);
  renderRows(tableBody, emptyState, inventoryItems);

  searchInput?.addEventListener("input", () =>
    applyFilters(tableBody, emptyState, searchInput, categoryFilter)
  );
  categoryFilter?.addEventListener("change", () =>
    applyFilters(tableBody, emptyState, searchInput, categoryFilter)
  );

  // Delegated click listener on the module root: covers "+ Add New Item"
  // and every row's "Edit" button, including rows added after re-render.
  // Assumes the target modal (e.g. #stock-modal) lives in the persistent
  // warehouse.html shell, not in this fragment.
  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal-target]");
    if (!trigger) return;
    const modal = document.getElementById(trigger.dataset.modalTarget);
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
  });
}

function applyFilters(tableBody, emptyState, searchInput, categoryFilter) {
  const query = (searchInput?.value || "").trim().toLowerCase();
  const category = categoryFilter?.value || "all";

  const filtered = inventoryItems.filter((item) => {
    const matchesQuery =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  renderRows(tableBody, emptyState, filtered);
}

function populateCategoryOptions(select, items) {
  if (!select) return;
  const categories = [...new Set(items.map((item) => item.category))].sort();

  // Keep "All Categories", drop anything else, rebuild from the data.
  select.querySelectorAll("option:not([value='all'])").forEach((opt) => opt.remove());
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
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
    const badgeClasses = STATUS_BADGE_CLASSES[item.status] || STATUS_BADGE_CLASSES["Out of Stock"];

    const row = document.createElement("tr");
    row.className = "border-b border-[rgba(0,0,0,0.08)] last:border-0";
    row.dataset.itemId = item.id;
    row.innerHTML = `
      <td class="p-4 text-[rgba(0,0,0,0.45)]">${item.id}</td>
      <td class="p-4 font-medium text-[#0A0A0A]">${item.name}</td>
      <td class="p-4 text-[rgba(0,0,0,0.45)]">${item.category}</td>
      <td class="p-4 text-[#0A0A0A]">${item.quantity.toLocaleString()}</td>
      <td class="p-4 text-[#0A0A0A]">${CURRENCY_FORMATTER.format(item.unitPrice)}</td>
      <td class="p-4">
        <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-700 ${badgeClasses}">${item.status}</span>
      </td>
      <td class="p-4 text-right">
        <button type="button" data-modal-target="stock-modal" data-edit-item="${item.id}" class="rounded-lg bg-[#F7931E] px-3 py-1.5 text-xs font-700 text-white hover:bg-[#e08216]">Edit</button>
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
    return () => {};
  }
 
  const modalTitle = document.getElementById("stockModalTitle");
  const skuInput = document.getElementById("stock-item-sku");
  const nameInput = document.getElementById("stock-item-name");
  const categorySelect = document.getElementById("stock-item-category");
  const categoryCustomInput = document.getElementById("stock-item-category-custom");
  const quantityInput = document.getElementById("stock-item-quantity");
  const priceInput = document.getElementById("stock-item-price");
  const statusSelect = document.getElementById("stock-item-status");
  const closeBtn = document.getElementById("stock-modal-close-btn");
  const cancelBtn = document.getElementById("stock-modal-cancel-btn");
 
  // Toggle the custom-category text field alongside the preset dropdown.
  categorySelect?.addEventListener("change", () => {
    const isCustom = categorySelect.value === CUSTOM_CATEGORY_VALUE;
    categoryCustomInput.classList.toggle("hidden", !isCustom);
    categoryCustomInput.required = isCustom;
    if (isCustom) categoryCustomInput.focus();
  });
 
  closeBtn?.addEventListener("click", () => modal.close());
  cancelBtn?.addEventListener("click", () => modal.close());
 
  // Clicking the ::backdrop (outside the form panel) closes the dialog.
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
 
  // Clear any stale "duplicate SKU" validity message as soon as the user edits it.
  skuInput?.addEventListener("input", () => skuInput.setCustomValidity(""));
 
  form.addEventListener("submit", (event) => {
    event.preventDefault();
 
    const category =
      categorySelect.value === CUSTOM_CATEGORY_VALUE
        ? categoryCustomInput.value.trim()
        : categorySelect.value;
 
    const itemData = {
      id: skuInput.value.trim(),
      name: nameInput.value.trim(),
      category,
      quantity: Number(quantityInput.value),
      unitPrice: Number(priceInput.value),
      status: statusSelect.value,
    };
 
    if (form.dataset.mode === "EDIT") {
      const index = inventoryItems.findIndex((item) => item.id === form.dataset.editingSku);
      if (index !== -1) {
        inventoryItems[index] = { ...inventoryItems[index], ...itemData };
      }
    } else {
      const isDuplicate = inventoryItems.some((item) => item.id === itemData.id);
      if (isDuplicate) {
        skuInput.setCustomValidity(`SKU "${itemData.id}" already exists — SKUs must be unique.`);
        skuInput.reportValidity();
        return;
      }
      inventoryItems.push(itemData);
    }
 
    renderRows(tableBody, emptyState, inventoryItems);
    populateCategoryOptions(categoryFilter, inventoryItems);
 
    modal.close();
 
    // Simulates persistence back to products.json.
    console.log("Updated inventoryItems (simulating persistence to products.json):", inventoryItems);
  });
 
  function openStockModal({ mode, item = null }) {
    form.reset();
    skuInput.setCustomValidity("");
    categoryCustomInput.classList.add("hidden");
    categoryCustomInput.required = false;
 
    if (mode === "EDIT" && item) {
      form.dataset.mode = "EDIT";
      form.dataset.editingSku = item.id;
 
      skuInput.value = item.id;
      skuInput.readOnly = true;
      skuInput.setAttribute("aria-readonly", "true");
 
      nameInput.value = item.name;
      quantityInput.value = item.quantity;
      priceInput.value = item.unitPrice;
      statusSelect.value = item.status;
 
      if (PRESET_CATEGORIES.includes(item.category)) {
        categorySelect.value = item.category;
      } else {
        categorySelect.value = CUSTOM_CATEGORY_VALUE;
        categoryCustomInput.classList.remove("hidden");
        categoryCustomInput.value = item.category;
        categoryCustomInput.required = true;
      }
 
      modalTitle.textContent = `Update Item: ${item.id}`;
    } else {
      form.dataset.mode = "CREATE";
      delete form.dataset.editingSku;
 
      skuInput.readOnly = false;
      skuInput.removeAttribute("aria-readonly");
      categorySelect.value = "Produce";
      statusSelect.value = "In Stock";
 
      modalTitle.textContent = "Add New Inventory Item";
    }
 
    modal.showModal();
    (mode === "EDIT" ? nameInput : skuInput).focus();
  }
 
  return openStockModal;
}
 
