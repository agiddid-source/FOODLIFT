
const EN_ROUTE_DELAY_MS = 8000;

const DELIVERY_STATUS_META = {
  "awaiting-confirmation": { badgeClass: "status-badge--neutral", icon: "fa-qrcode", label: "Awaiting Confirmation" },
  "delivery-confirmed": { badgeClass: "status-badge--info", icon: "fa-box-open", label: "Delivery Confirmed" },
  "en-route": { badgeClass: "status-badge--info", icon: "fa-truck-fast", label: "En Route" },
  delivered: { badgeClass: "status-badge--success", icon: "fa-circle-check", label: "Delivered" },
};

function badgeHtml(status) {
  const meta = DELIVERY_STATUS_META[status];
  return (
    '<span class="status-badge ' +
    meta.badgeClass +
    '"><i class="fa-solid ' +
    meta.icon +
    '"></i> ' +
    meta.label +
    "</span>"
  );
}

function statusBodyHtml(order) {
  if (order.status === "awaiting-confirmation") {
    return (
      '<div class="qr-block">' +
      '<div class="qr-code-box" id="qr-' +
      order.id +
      '"></div>' +
      '<div class="qr-caption">Show this QR code to warehouse staff. Package releases automatically once they scan it.</div>' +
      "</div>" +
      '<div class="dev-sim-container" style="margin-top:0.85rem;">' +
      '<button type="button" class="btn-dev-sim" data-delivery-action="simulate-warehouse-scan">' +
      '<i class="fa-solid fa-flask"></i> Simulate Warehouse Scan (dev only)</button>' +
      "</div>"
    );
  }

  if (order.status === "delivery-confirmed") {
    return (
      '<div class="eta-note"><i class="fa-solid fa-circle-notch fa-spin"></i> Heading out shortly…</div>' +
      '<div style="margin-top:0.85rem;">' +
      '<button type="button" class="btn-secondary" data-delivery-action="navigate">' +
      '<i class="fa-solid fa-route"></i> Navigate to Customer</button>' +
      "</div>"
    );
  }

  if (order.status === "en-route") {
    return (
      '<div class="eta-note"><i class="fa-solid fa-location-arrow"></i> On the way to the customer</div>' +
      '<div style="margin-top:0.85rem;display:flex;gap:0.6rem;flex-wrap:wrap;">' +
      '<button type="button" class="btn-secondary" data-delivery-action="navigate">' +
      '<i class="fa-solid fa-route"></i> Navigate to Customer</button>' +
      '<button type="button" class="btn-action-green" data-delivery-action="scan-customer-qr">' +
      '<i class="fa-solid fa-qrcode"></i> Scan Customer QR</button>' +
      "</div>"
    );
  }

  return "";
}

function cardHtml(order) {
  return (
    '<div class="info-card" data-order-id="' +
    order.id +
    '" data-status="' +
    order.status +
    '">' +
    '<div class="info-card-header">' +
    '<span class="info-card-ref">#' +
    order.id +
    "</span>" +
    badgeHtml(order.status) +
    "</div>" +
    '<div class="route-line">' +
    '<div class="route-stop"><i class="fa-solid fa-warehouse"></i><span><strong>Pickup</strong>' +
    order.warehouse +
    "</span></div>" +
    '<div class="route-stop"><i class="fa-solid fa-location-dot"></i><span><strong>' +
    order.customerName +
    "</strong>" +
    order.customerAddress +
    "</span></div>" +
    "</div>" +
    '<div class="status-body">' +
    statusBodyHtml(order) +
    "</div>" +
    "</div>"
  );
}

function renderQrCodes() {
  document.querySelectorAll('[id^="qr-"]').forEach((box) => {
    const orderId = box.id.replace("qr-", "");
    if (typeof QRCode !== "undefined") {
      box.innerHTML = "";
      new QRCode(box, { text: orderId, width: 80, height: 80 });
    } 
    else {
      box.innerHTML = '<div class="qr-fallback">' + orderId + "</div>";
    }
  });
}

function renderDeliveries() {
  const list = document.getElementById("deliveriesList");
  const empty = document.getElementById("deliveriesEmpty");
  if (!list) return;

  const orders = window.RiderOrders.getActive();
  list.innerHTML = orders.map(cardHtml).join("");
  empty.classList.toggle("hidden", orders.length > 0);
  updateCount();
  renderQrCodes();
}

function updateCount() {
  const countEl = document.getElementById("deliveriesCount");
  if (!countEl) return;
  const remaining = window.RiderOrders.getActive().length;
  countEl.textContent = remaining + (remaining === 1 ? " active delivery" : " active deliveries");
}

function refreshCard(card, order) {
  card.dataset.status = order.status;
  card.querySelector(".status-badge").outerHTML = badgeHtml(order.status);
  card.querySelector(".status-body").innerHTML = statusBodyHtml(order);
  renderQrCodes();
}

function setButtonLoading(btn, isLoading) {
  if (isLoading) {
    btn.dataset.originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-spinner-sm"></span>';
  } else if (btn.dataset.originalHtml) {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalHtml;
  }
}

function mockLatency(minMs = 600, maxMs = 1200) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// Status transitions 

function simulateWarehouseScan(card, btn, id) {
  setButtonLoading(btn, true);
  setTimeout(() => {
    const order = window.RiderOrders.setStatus(id, "delivery-confirmed");
    if (!order) return;
    refreshCard(card, order);
    scheduleEnRoute(card, id);
  }, mockLatency());
}

function scheduleEnRoute(card, id) {
  setTimeout(() => {
   
    const current = document.querySelector('.info-card[data-order-id="' + id + '"]');
    if (!current) return;
    const order = window.RiderOrders.setStatus(id, "en-route");
    if (!order) return;
    refreshCard(current, order);
  }, EN_ROUTE_DELAY_MS);
}

function completeDelivery(id) {
  const order = window.RiderOrders.setStatus(id, "delivered");
  const card = document.querySelector('.info-card[data-order-id="' + id + '"]');
  if (!order || !card) return;

  refreshCard(card, order);
  card.querySelector(".status-body").innerHTML =
    '<span class="success-note"><i class="fa-solid fa-circle-check"></i> Delivered — moved to Delivery History</span>';

  setTimeout(() => {
    card.classList.add("is-removing");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.RiderOrders.completeOrder(id);
      card.remove();
      updateCount();
      const list = document.getElementById("deliveriesList");
      const empty = document.getElementById("deliveriesEmpty");
      if (list && empty) empty.classList.toggle("hidden", list.children.length > 0);
    };
    card.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 500);
  }, 1400);
}

// Customer-QR scan modal 

function openScanModal(id) {
  console.log("[FoodLift] openScanModal called for order", id);

  const overlay = document.createElement("div");
  
  overlay.className = "scan-modal-overlay is-visible";
  overlay.innerHTML =
    '<div class="scan-modal">' +
    '<h3 style="font-weight:700;font-size:1.1rem;">Scan Customer QR</h3>' +
    '<p style="font-size:0.85rem;color:var(--fl-text-secondary);margin-top:0.35rem;">Point the camera at the customer\'s QR code to confirm handoff.</p>' +
    '<div class="scan-viewfinder"><div class="scan-viewfinder-line"></div></div>' +
    '<button type="button" class="btn-action-green" style="width:100%;justify-content:center;" data-modal-action="simulate-customer-scan">' +
    '<i class="fa-solid fa-flask"></i> Simulate Successful Scan (dev only)</button>' +
    '<button type="button" class="btn-secondary" style="width:100%;justify-content:center;margin-top:0.6rem;" data-modal-action="cancel">Cancel</button>' +
    "</div>";
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  console.log("[FoodLift] scan modal appended to body:", document.body.contains(overlay));

  function closeModal() {
    document.body.style.overflow = "";
    overlay.remove();
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();

    const actionEl = e.target.closest("[data-modal-action]");
    if (!actionEl) return;

    if (actionEl.dataset.modalAction === "cancel") {
      closeModal();
    } else if (actionEl.dataset.modalAction === "simulate-customer-scan") {
      actionEl.disabled = true;
      actionEl.innerHTML = '<span class="btn-spinner-sm"></span> Scanning…';
      setTimeout(() => {
        closeModal();
        completeDelivery(id);
      }, mockLatency(800, 1400));
    }
  });
}

// Wiring 

function refreshDeliveries() {
  const btn = document.getElementById("refreshDeliveriesBtn");
  const list = document.getElementById("deliveriesList");
  if (!btn || !list) return;

  btn.classList.add("is-loading");
  btn.disabled = true;
  list.innerHTML =
    '<div class="module-loading" style="min-height: 12rem;"><span class="module-spinner"></span><p>Refreshing deliveries…</p></div>';

  setTimeout(() => {
    btn.classList.remove("is-loading");
    btn.disabled = false;
    renderDeliveries();
  }, mockLatency(700, 1300));
}

document.addEventListener("fl:moduleLoaded", (e) => {
  if (e.detail && e.detail.name === "deliveries") renderDeliveries();
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#refreshDeliveriesBtn")) {
    refreshDeliveries();
    return;
  }

  const actionBtn = e.target.closest("[data-delivery-action]");
  if (!actionBtn) return;

  const card = actionBtn.closest(".info-card");
  if (!card) return;
  const id = card.dataset.orderId;
  const action = actionBtn.dataset.deliveryAction;

  console.log("[FoodLift] delivery action clicked:", action, "order:", id);

  try {
    if (action === "simulate-warehouse-scan") simulateWarehouseScan(card, actionBtn, id);
    else if (action === "scan-customer-qr") openScanModal(id);
    else if (action === "navigate") {
      const order = window.RiderOrders.getActive().find((o) => o.id === id);
      if (order) {
        window.RiderNavTarget = order;
        loadModule("route"); // defined in dashboard.js — shared global scope
      }
    }
  } catch (err) {
    console.error("Delivery action failed:", action, err);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<div style="background:#fef2f2;color:#dc2626;padding:1rem;font-family:sans-serif;font-size:0.875rem;position:fixed;top:0;left:0;right:0;z-index:999;">' +
        "Action \"" + action + "\" failed: " + err.message +
        " — check the browser console for details." +
        "</div>"
    );
  }
});