// load-static.js
// Fetches the shared header + nav fragments and injects them into the
// page's placeholders. Requires the page to be served over http(s) —
// fetch() of local files will fail under file:// due to CORS.
//
// Dispatches "fl:componentsReady" on `document` once both are in place,
// so page-specific scripts (see dashboard.js) can safely wire up
// behavior on elements that only exist after this injection runs.

window.addEventListener("DOMContentLoaded", function () {
  const headerRequest = fetch("_components/header.html")
    .then((response) => response.text())
    .then((html) => {
      document.querySelector("header").outerHTML = html;
    });

  const navRequest = fetch("_components/sidebar.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("navPlaceholder").innerHTML = html;
    });

  Promise.all([headerRequest, navRequest])
    .then(() => {
      document.dispatchEvent(new CustomEvent("fl:componentsReady"));
    })
    .catch((err) => {
      console.error("Failed to load shared components:", err);
    });
});