
function buildOsmEmbedUrl(lat, lng, deltaDeg = 0.012) {
  const latMin = lat - deltaDeg;
  const latMax = lat + deltaDeg;
  const lngMin = lng - deltaDeg;
  const lngMax = lng + deltaDeg;
  return (
    "https://www.openstreetmap.org/export/embed.html?bbox=" +
    lngMin + "%2C" + latMin + "%2C" + lngMax + "%2C" + latMax +
    "&layer=mapnik&marker=" + lat + "%2C" + lng
  );
}

function renderRoute() {
  const container = document.getElementById("routeContent");
  if (!container) return;

  const target = window.RiderNavTarget;

  if (!target) {
    container.innerHTML =
      '<div class="dash-empty-state py-16">' +
      '<i class="fa-regular fa-compass"></i>' +
      '<p>No delivery selected. Open an active delivery in Deliveries and tap "Navigate to Customer" to see its route here.</p>' +
      '<a href="#" data-module="deliveries" class="btn-action-green" style="margin-top:1rem;">View Active Deliveries</a>' +
      "</div>";
    return;
  }

  const mapUrl = buildOsmEmbedUrl(target.customerLat, target.customerLng);

  container.innerHTML =
    '<div class="route-header">' +
    "<div>" +
    '<span class="info-card-ref">#' + target.id + "</span>" +
    '<div class="route-stop" style="margin-top:0.6rem;">' +
    '<i class="fa-solid fa-location-dot"></i>' +
    "<span><strong>" + target.customerName + "</strong>" + target.customerAddress + "</span>" +
    "</div>" +
    "</div>" +
    '<a href="#" data-module="deliveries" class="btn-secondary">' +
    '<i class="fa-solid fa-arrow-left"></i> Back to Deliveries</a>' +
    "</div>" +
    '<div class="route-map-frame">' +
    '<iframe src="' + mapUrl + '" loading="lazy" title="Route to ' + target.customerName + '"></iframe>' +
    "</div>";
}

document.addEventListener("fl:moduleLoaded", (e) => {
  if (e.detail && e.detail.name === "route") renderRoute();
});