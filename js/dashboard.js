// dashboard.js
// Presentation-layer behavior for the dashboard shell. Role-agnostic —
// reused as-is across warehouse, rider, etc.
// Uses event delegation throughout (listening on document, not on
// specific elements) because the header/nav are injected asynchronously
// by load-static.js — elements referenced by ID may not exist yet at
// the moment this script first runs.
//
// Reusable across roles: a page can supply its own module title map and
// fragment folder by setting these BEFORE this script runs, e.g.
//   <script>
//     window.FL_MODULE_TITLES = { dashboard: "Dashboard", deliveries: "Deliveries", ... };
//     window.FL_MODULE_BASE = "pages/rider/";
//   </script>
//   <script src="js/dashboard.js"></script>
// With no override, it falls back to the original warehouse defaults.

const MODULE_TITLES = Object.assign(
  {
    dashboard: "Dashboard",
    inventory: "Inventory",
    orders: "Orders",
    dispatch: "Dispatch",
    staff: "Warehouse Staff",
    reports: "Reports",
    settings: "Settings",
  },
  window.FL_MODULE_TITLES || {}
);

const MODULE_BASE = window.FL_MODULE_BASE || "pages/";

function openSidebar() {
  const sidebar = document.getElementById("dashSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const hamburger = document.getElementById("hamburgerBtn");
  if (!sidebar || !backdrop) return;
  sidebar.classList.add("is-open");
  backdrop.classList.add("is-visible");
  if (hamburger) hamburger.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  const sidebar = document.getElementById("dashSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const hamburger = document.getElementById("hamburgerBtn");
  if (!sidebar || !backdrop) return;
  sidebar.classList.remove("is-open");
  backdrop.classList.remove("is-visible");
  if (hamburger) hamburger.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

function setActiveModule(name) {
  document.querySelectorAll("[data-module]").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.module === name);
  });

  const title = document.getElementById("pageTitle");
  if (title && MODULE_TITLES[name]) {
    title.textContent = MODULE_TITLES[name];
  }
}

function loadModule(name) {
  const target = document.getElementById("moduleContent");
  if (!target) return;

  // Loading state — mock latency so the state is actually visible/reviewable
  // rather than flashing by instantly on a fast local fetch.
  target.innerHTML =
    '<div class="module-loading"><span class="module-spinner"></span><p>Loading ' +
    (MODULE_TITLES[name] || "module") +
    "…</p></div>";

  fetch(MODULE_BASE + name + ".html")
    .then((response) => {
      if (!response.ok) throw new Error("Module not found: " + name);
      return response.text();
    })
    .then((html) => {
      target.innerHTML = html;
      setActiveModule(name);
      // Lets a module's own script (e.g. rider-deliveries.js) know its
      // fragment just landed in the DOM — injected HTML can't carry its
      // own <script> tags (they're inert when set via innerHTML), so any
      // per-module JS has to live in a separately-loaded file and listen
      // for this instead of running inline.
      document.dispatchEvent(new CustomEvent("fl:moduleLoaded", { detail: { name } }));
    })
    .catch(() => {
      target.innerHTML =
        '<div class="module-loading"><i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;font-size:1.5rem;"></i>' +
        "<p>Couldn't load this section. Please try again.</p></div>";
    });
}

document.addEventListener("fl:componentsReady", function () {
  loadModule("dashboard");
});

document.addEventListener("click", function (e) {
  if (e.target.closest("#hamburgerBtn")) {
    openSidebar();
    return;
  }

  if (e.target.closest("#sidebarCloseBtn") || e.target.closest("#sidebarBackdrop")) {
    closeSidebar();
    return;
  }

  const moduleLink = e.target.closest("[data-module]");
  if (moduleLink) {
    e.preventDefault();
    loadModule(moduleLink.dataset.module);
    closeSidebar(); 
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeSidebar();
});

window.addEventListener("resize", function () {
  if (window.innerWidth >= 1024) closeSidebar();
});