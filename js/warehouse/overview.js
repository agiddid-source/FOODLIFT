// js/warehouse/overview.js

import { getScopedOrders, getScopedProducts, getActiveWarehouse } from "./data-store.js";

export async function initOverview() {
  const root = document.getElementById("ezz-overviewModule");
  if (!root) return;

  // Falls back to a placeholder rather than throwing, so a missing/cleared
  // localStorage shows an empty dashboard instead of a broken one.
  const { name: currentWarehouseName } = getActiveWarehouse();

  const subtitle = document.getElementById("ezz-dashboardSubtitle");
  if (subtitle) subtitle.textContent = `Viewing data for ${currentWarehouseName}`;

  try {
    // The loader handles fetching, status checks, caching, and filtering to
    // the active warehouse — see data-store.js.
    const [localOrders, localProducts] = await Promise.all([
      getScopedOrders(),
      getScopedProducts(),
    ]);

    calculateMetrics(localOrders, localProducts);

  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    // Without this the cards sit on "--" forever and look like a slow load
    // rather than a failure.
    if (subtitle) {
      subtitle.textContent = "Couldn't load warehouse data. Check your connection and refresh.";
      subtitle.classList.add("text-red-500");
    }
  }
}





// Threshold for the "Low Stock" card. 

export const LOW_STOCK_THRESHOLD = 5;

function calculateMetrics(orders, products) {
  // Pending Orders — the manual-confirmation queue. This is the
  const pendingOrders = orders.filter(order => order.status === "Pending Verification").length;
  setMetric("ezz-metricPending", pendingOrders);

  // Dispatched Today. Compares against the local calendar date
  const today = toLocalDateKey(new Date());
  const dispatchedToday = orders.filter(order => order.status === "Handed to Rider" && order.date === today).length;
  setMetric("ezz-metricDispatched", dispatchedToday);

  // Low Stock. Excludes zero deliberately — something fully out of
  const lowStock = products.filter(
    product => product.quantity > 0 && product.quantity < LOW_STOCK_THRESHOLD
  ).length;
  setMetric("ezz-metricLowStock", lowStock);

  // Total Inventory Value — quantity × unit price across the hub.
  const totalValue = products.reduce(
    (sum, product) => sum + (product.quantity * product.unitPrice),
    0
  );

  setMetric("ezz-metricValue", NAIRA.format(totalValue));
}

const NAIRA = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

// Returns YYYY-MM-DD in the browser's own timezone, matching the plain date
// strings used in orders.json.
function toLocalDateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

// Guards every write: one renamed id in the fragment shouldn't throw and
// abort the remaining metrics mid-render.
function setMetric(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}