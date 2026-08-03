
function formatCompletedAt(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function historyCardHtml(order) {
  return (
    '<div class="info-card">' +
    '<div class="info-card-header">' +
    '<span class="info-card-ref">#' +
    order.id +
    "</span>" +
    '<span class="status-badge status-badge--success"><i class="fa-solid fa-circle-check"></i> Delivered</span>' +
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
    '<span class="history-timestamp"><i class="fa-regular fa-clock"></i> ' +
    formatCompletedAt(order.completedAt) +
    "</span>" +
    '<span class="info-card-meta"><i class="fa-solid fa-naira-sign"></i> ₦' +
    order.estEarnings.toLocaleString() +
    "</span>" +
    "</div>" +
    "</div>"
  );
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  const countEl = document.getElementById("historyCount");
  if (!list) return;

  const orders = window.RiderOrders.getHistory();
  list.innerHTML = orders.map(historyCardHtml).join("");
  if (empty) empty.classList.toggle("hidden", orders.length > 0);
  if (countEl) {
    countEl.textContent = orders.length + (orders.length === 1 ? " completed delivery" : " completed deliveries");
  }
}

document.addEventListener("fl:moduleLoaded", (e) => {
  if (e.detail && e.detail.name === "history") renderHistory();
});