// js/warehouse/agent-selector.js
//

//
// This file does two things and nothing else:
//
//   1. Fills the dropdown with the hubs that actually exist in the data.
//   2. When the agent picks one, tells data-store about it.


import {
  getProducts,
  getOrders,
  getActiveWarehouse,
  setActiveWarehouse,
} from "./data-store.js";

import { initOverview } from "./overview.js";
import { initInventory } from "./inventory.js";
import { initOrders } from "./orders.js";

async function listWarehouses() {
  const [products, orders] = await Promise.all([getProducts(), getOrders()]);

  const byId = new Map();
  [...products, ...orders].forEach((record) => {
    if (!record.warehouseId) return;
    if (!byId.has(record.warehouseId)) {
      byId.set(record.warehouseId, record.warehouseName || record.warehouseId);
    }
  });

  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Redraws the currently visible module (overview, inventory, or orders) to reflect
// the new hub. This is called when the hub changes, not when the page first
// loads, so it doesn't need to do any of the initial setup that init*() does.
function refreshVisibleModule() {
  if (document.getElementById("ezz-overviewModule")) initOverview();
  if (document.getElementById("inventoryModule")) initInventory();
  if (document.getElementById("ezz-ordersModule")) initOrders();
}

export async function initWarehouseSelector() {
  const select = document.getElementById("fl-warehouseSelect");
  if (!select) return;

  let warehouses;
  try {
    warehouses = await listWarehouses();
  } catch (error) {
    console.error("Couldn't load the warehouse list:", error);
    select.innerHTML = `<option value="">Unable to load hubs</option>`;
    select.disabled = true;
    return;
  }

  if (!warehouses.length) {
    select.innerHTML = `<option value="">No hubs found</option>`;
    select.disabled = true;
    return;
  }

  const active = getActiveWarehouse();

  select.innerHTML = warehouses
    .map(
      (hub) =>
        `<option value="${hub.id}"${hub.id === active.id ? " selected" : ""}>${hub.name}</option>`
    )
    .join("");

  // If localStorage held a hub that no longer exists (renamed, removed), fall
  // back to the first real one instead of leaving every screen empty with no
  // explanation.
  if (!warehouses.some((hub) => hub.id === active.id)) {
    setActiveWarehouse(warehouses[0]);
    select.value = warehouses[0].id;
  }

  select.addEventListener("change", () => {
    const chosen = warehouses.find((hub) => hub.id === select.value);
    if (!chosen) return;
    setActiveWarehouse(chosen);
  });
}

// The redraw. Registered once at import time, not inside the init above —
// the selector is built after the header is injected, but a hub change can
// come from anywhere, and this needs to be listening before that happens.
document.addEventListener("fl:warehouseChanged", (event) => {
  const label = document.getElementById("fl-activeWarehouseLabel");
  if (label) label.textContent = event.detail.name || event.detail.id;
  refreshVisibleModule();
});
