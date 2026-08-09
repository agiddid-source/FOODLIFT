// load-static.js
// Fetches the shared header + nav fragments and injects them into the
// page's placeholders. Requires the page to be served over http(s)

// Reusable across roles: a page can override which component files to
// fetch by setting window.FL_COMPONENTS BEFORE this script runs, e.g.
//   <script>
//     window.FL_COMPONENTS = {
//       header: "_components/rider-header.html",
//       sidebar: "_components/rider-sidebar.html"
//     };
//   </script>
//   <script src="js/load-static.js"></script>
// With no override, it falls back to the original warehouse paths, so
// existing pages need no changes.
//
// Dispatches "fl:componentsReady" on `document` once both are in place,
// so page-specific scripts (see dashboard.js) can safely wire up
// behavior on elements that only exist after this injection runs.

window.addEventListener("DOMContentLoaded", function () {
  const components = Object.assign(
    {
      header: "_components/header.html",
      sidebar: "_components/sidebar.html",
    },
    window.FL_COMPONENTS || {}
  );

  const headerRequest = fetch(components.header)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load " + components.header + " (HTTP " + response.status + ")");
      return response.text();
    })
    .then((html) => {
      document.querySelector("header").outerHTML = html;
    });

  const navRequest = fetch(components.sidebar)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load " + components.sidebar + " (HTTP " + response.status + ")");
      return response.text();
    })
    .then((html) => {
      document.getElementById("navPlaceholder").innerHTML = html;
    });

  Promise.all([headerRequest, navRequest])
    .then(() => {
      document.dispatchEvent(new CustomEvent("fl:componentsReady"));
    })
    .catch((err) => {
      console.error("Failed to load shared components:", err);
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<div style="background:#fef2f2;color:#dc2626;padding:1rem;font-family:sans-serif;font-size:0.875rem;">' +
          err.message +
          " — check the file exists at this path relative to your project root." +
          "</div>"
      );
    });
});