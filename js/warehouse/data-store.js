// js/warehouse/data-store.js
//
// One place that reads the mock data feeds. Every warehouse module
// (overview, inventory, orders) asks this file for data instead of calling
// fetch() itself.
//
// WHY THIS EXISTS
//
// Before this, three modules each called fetch("data/products.json") on
// their own. That caused three problems:
//
//   1. The same file was downloaded once per module. Open the dashboard,
//      then Inventory, and the browser fetched products.json twice.
//   2. Each module re-implemented "did the request work?" checks, slightly
//      differently. One of them forgot, which is how a 404 turned into a
//      confusing "Unexpected token <" error instead of "file not found".
//   3. Each module decided for itself what "the active warehouse" meant.
//      Three copies of one rule is three chances for them to disagree.
//
// Now there is one copy of each of those things, here.
//
// WHAT IT GIVES YOU
//
//   getProducts()   -> all products, every warehouse
//   getOrders()     -> all orders, every warehouse
//   getActiveWarehouse() -> { id, name } from localStorage
//   getScopedProducts() / getScopedOrders() -> filtered to the active hub
//   setActiveWarehouse() -> switch hub (used by the agent page)
//   invalidate()    -> forget the cache, force a fresh read
//
// NOTE ON PERSISTENCE
// Writes go through createProduct() / updateProduct() / updateOrderStatus()
// at the bottom of this file. Every one of them ends at persist(), which is
// the single switch between "in memory" and "real backend":
//
//   API.baseUrl === null  -> the change updates the cached array and stops
//                            there. Lost on reload.
//   API.baseUrl set       -> the same change is also sent over HTTP.
//
// localStorage is deliberately NOT used to fake saving. It would make the
// app look finished while the gap is still there, and the gap is the thing
// you need to see.

const FEEDS = {
  products: "data/products.json",
  orders: "data/orders.json",
};

// Finished results, kept so a second caller doesn't re-download.
const cache = {};

// Requests that are still in flight.
//
// This is the part that's easy to miss. Imagine the dashboard and inventory
// both start loading at the same moment. Without this, BOTH check the cache,
// BOTH find it empty, and BOTH start a download — the cache only helps
// callers that arrive *after* the first one finished.
//
// So we store the promise itself, immediately. The second caller finds that
// promise and waits on the same request instead of starting another.
const inFlight = {};

/**
 * Reads one feed. Safe to call as often as you like — the file is only
 * actually downloaded once.
 */
async function loadFeed(key) {
  const path = FEEDS[key];
  if (!path) throw new Error(`Unknown feed "${key}" — expected one of: ${Object.keys(FEEDS).join(", ")}`);

  if (cache[key]) return cache[key];
  if (inFlight[key]) return inFlight[key];

  inFlight[key] = (async () => {
    const response = await fetch(path);

    // fetch() does NOT throw on 404 or 500. It only rejects if the network
    // itself failed (no connection, DNS died). A 404 gives you a perfectly
    // successful response whose body is an HTML error page — so calling
    // .json() on it throws a confusing parse error instead of telling you
    // the file is missing. Checking .ok is what turns that into a clear
    // message.
    if (!response.ok) {
      throw new Error(`Could not load ${path} — HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(`${path} should contain a JSON array, got ${typeof data}`);
    }

    cache[key] = data;
    return data;
  })();

  try {
    return await inFlight[key];
  } finally {
    // Cleared whether it worked or failed. On failure this matters: without
    // it, one flaky request would be remembered forever and every later
    // retry would return the same rejected promise.
    delete inFlight[key];
  }
}

export function getProducts() {
  return loadFeed("products");
}

export function getOrders() {
  return loadFeed("orders");
}

/**
 * Which warehouse the logged-in user is looking at.
 *
 * warehouse.html sets this once at login (one fixed hub). warehouse-agent.html
 * changes it when the agent picks a different hub from the selector.
 */
export function getActiveWarehouse() {
  return {
    id: localStorage.getItem("activeWarehouseId") || "WH-UNKNOWN",
    name: localStorage.getItem("activeWarehouseName") || "Unknown Hub",
  };
}

/**
 * Switches the active warehouse and announces it, so any module currently on
 * screen can redraw with the new hub's data.
 *
 * The event is what keeps this simple: this file doesn't need to know which
 * modules exist or which one is visible. It just says "the hub changed" and
 * whoever cares listens. Adding a new module later needs no change here.
 */
export function setActiveWarehouse({ id, name }) {
  if (!id) throw new Error("setActiveWarehouse() needs an id");

  localStorage.setItem("activeWarehouseId", id);
  localStorage.setItem("activeWarehouseName", name || id);

  document.dispatchEvent(
    new CustomEvent("fl:warehouseChanged", { detail: { id, name } })
  );
}

/** Products belonging to the active warehouse only. */
export async function getScopedProducts() {
  const { id } = getActiveWarehouse();
  const all = await getProducts();
  return all.filter((item) => item.warehouseId === id);
}

/** Orders belonging to the active warehouse only. */
export async function getScopedOrders() {
  const { id } = getActiveWarehouse();
  const all = await getOrders();
  return all.filter((order) => order.warehouseId === id);
}

/**
 * Throws away cached data so the next read re-downloads.
 *
 * Call with no arguments to clear everything, or invalidate("products") for
 * just one feed.
 */
export function invalidate(key) {
  if (key) {
    delete cache[key];
    delete inFlight[key];
    return;
  }
  Object.keys(cache).forEach((k) => delete cache[k]);
  Object.keys(inFlight).forEach((k) => delete inFlight[k]);
}

/* ------------------------------------------------------------------ */
/* WRITES                                                              */
/* ------------------------------------------------------------------ */
//
// READ THIS BEFORE CHANGING ANYTHING BELOW.
//
// A browser cannot write to data/products.json. There is no way around
// that — JavaScript on a web page has no access to the file system, and a
// plain static server (python3 -m http.server, Live Server, GitHub Pages)
// only knows how to hand files out, not take them back. This is a security
// rule of the web, not a limitation of our setup.
//
// So writing needs a server that accepts a request and saves the file. That
// is the backend.
//
// What we CAN do today, and what this section does, is write the saving code
// now and point it at a switch. Until the backend exists, saves update the
// in-memory copy so the whole app stays consistent for the session. When the
// backend lands, you set API.baseUrl and the same calls start hitting real
// endpoints. No module below this file changes.
//
// That's the answer to "once the backend is set, I don't want to start
// editing that" — the call sites are already final.

export const API = {
  // Set this to your API root when the backend exists, e.g.
  //   API.baseUrl = "https://api.foodlift.ng";
  // While it's null, saves are in-memory only.
  baseUrl: null,
};

let warnedNoBackend = false;

/**
 * Sends a change to the backend, if there is one.
 *
 * Returns { persisted } so callers can tell the difference between "saved to
 * the server" and "session only" — the inventory UI uses this to be honest
 * with the user rather than showing a success message for something that
 * didn't leave the browser.
 */
async function persist(method, path, body) {
  if (!API.baseUrl) {
    if (!warnedNoBackend) {
      console.info(
        "[data-store] No backend configured (API.baseUrl is null). " +
        "Changes are kept in memory for this session only and will be lost on reload. " +
        "Set API.baseUrl once the API exists — no other code needs to change."
      );
      warnedNoBackend = true;
    }
    return { persisted: false };
  }

  const response = await fetch(`${API.baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Save failed — HTTP ${response.status} ${response.statusText}`);
  }

  return { persisted: true, data: await response.json().catch(() => null) };
}

/**
 * Adds a product.
 *
 * Note it pushes onto the CACHED array, not a copy. That matters: inventory
 * holds a filtered view of this same array, and so does the dashboard. If we
 * added to a copy, you'd add stock in Inventory and the dashboard's Inventory
 * Value wouldn't move — two screens disagreeing about the same session.
 */
export async function createProduct(item) {
  const products = await getProducts();
  products.push(item);
  return persist("POST", "/products", item);
}

/**
 * Updates a product, matched on sku + warehouseId.
 *
 * BOTH are needed. The same sku exists at more than one hub by design
 * (Basmati Rice at Ikeja and at Lekki), so matching on sku alone would edit
 * whichever record happened to come first in the file.
 *
 * Changes are merged over the existing record, so fields the caller doesn't
 * mention keep their current values.
 */
export async function updateProduct(sku, warehouseId, changes) {
  const products = await getProducts();
  const index = products.findIndex(
    (p) => p.sku === sku && p.warehouseId === warehouseId
  );

  if (index === -1) {
    throw new Error(`No product ${sku} at ${warehouseId}`);
  }

  products[index] = { ...products[index], ...changes };

  // warehouseId travels in the path too, for the same reason the local lookup
  // above needs it: sku alone identifies a product, not a product AT A HUB.
  // Sending PATCH /products/SKU-RICE-5KG would leave the backend guessing
  // which hub's row to touch — the bug this function exists to avoid.
  return persist(
    "PATCH",
    `/warehouses/${encodeURIComponent(warehouseId)}/products/${encodeURIComponent(sku)}`,
    products[index]
  );
}

/**
 * Updates an order's status, matched on orderId.
 * Used by the orders module when confirming availability or handing off.
 */
export async function updateOrderStatus(orderId, status) {
  const orders = await getOrders();
  const order = orders.find((o) => o.orderId === orderId);

  if (!order) throw new Error(`No order ${orderId}`);

  order.status = status;
  return persist("PATCH", `/orders/${encodeURIComponent(orderId)}`, { status });
}

