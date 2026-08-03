
function orderCardHtml(order) {
  return (
    '<div class="info-card" data-order-id="' +
    order.id +
    '">' +
    '<div class="info-card-header">' +
    '<span class="info-card-ref">#' +
    order.id +
    "</span>" +
    '<span class="status-badge status-badge--neutral"> ' +
    "₦" +
    order.estEarnings.toLocaleString() +
    " est.</span>" +
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
    '<div class="info-card-footer">' +
    '<span class="info-card-meta"><i class="fa-solid fa-route"></i> ' +
    order.distanceKm +
    " km</span>" +
    '<div style="display:flex;gap:0.6rem;">' +
    '<button type="button" class="btn-reject" data-order-action="reject">' +
    '<i class="fa-solid fa-xmark"></i> Reject</button>' +
    '<button type="button" class="btn-action-green" data-order-action="accept">' +
    '<i class="fa-solid fa-check"></i> Accept Order</button>' +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function renderAvailableOrders() {
  const list = document.getElementById("availableList");
  const empty = document.getElementById("availableEmpty");
  if (!list) return;

  const orders = window.RiderOrders.getAvailable();
  list.innerHTML = orders.map(orderCardHtml).join("");
  empty.classList.toggle("hidden", orders.length > 0);
  updateAvailableCount();
}

function updateAvailableCount() {
  const countEl = document.getElementById("availableCount");
  if (!countEl) return;
  const remaining = window.RiderOrders.getAvailable().length;
  countEl.textContent = remaining + (remaining === 1 ? " available order" : " available orders");
}

function removeCardWithAnimation(card, onDone) {
  card.classList.add("is-removing");
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    card.remove();
    if (onDone) onDone();
  };
  card.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 500); // fallback in case transitionend never fires
}

function handleAccept(card, id) {
  const btns = card.querySelectorAll("button");
  btns.forEach((b) => (b.disabled = true));

  setTimeout(() => {
    window.RiderOrders.acceptOrder(id);
    removeCardWithAnimation(card, () => {
      updateAvailableCount();
      const list = document.getElementById("availableList");
      const empty = document.getElementById("availableEmpty");
      if (list && empty) empty.classList.toggle("hidden", list.children.length > 0);
    });
  }, 500 + Math.random() * 400);
}

function handleReject(card, id) {
  const btns = card.querySelectorAll("button");
  btns.forEach((b) => (b.disabled = true));

  setTimeout(() => {
    window.RiderOrders.rejectOrder(id);
    removeCardWithAnimation(card, () => {
      updateAvailableCount();
      const list = document.getElementById("availableList");
      const empty = document.getElementById("availableEmpty");
      if (list && empty) empty.classList.toggle("hidden", list.children.length > 0);
    });
  }, 500 + Math.random() * 400);
}

function refreshAvailableOrders() {
  const btn = document.getElementById("refreshAvailableBtn");
  const list = document.getElementById("availableList");
  if (!btn || !list) return;

  btn.classList.add("is-loading");
  btn.disabled = true;
  list.innerHTML =
    '<div class="module-loading" style="min-height: 12rem;"><span class="module-spinner"></span><p>Refreshing available orders…</p></div>';

  setTimeout(() => {
    btn.classList.remove("is-loading");
    btn.disabled = false;
    renderAvailableOrders();
  }, 700 + Math.random() * 500);
}

document.addEventListener("fl:moduleLoaded", (e) => {
  if (e.detail && e.detail.name === "dashboard") renderAvailableOrders();
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#refreshAvailableBtn")) {
    refreshAvailableOrders();
    return;
  }

  const actionBtn = e.target.closest("[data-order-action]");
  if (!actionBtn) return;

  const card = actionBtn.closest(".info-card");
  if (!card) return;
  const id = card.dataset.orderId;
  const action = actionBtn.dataset.orderAction;

  if (action === "accept") handleAccept(card, id);
  else if (action === "reject") handleReject(card, id);
});