/**
 * drawer.js
 * Slide-in/slide-out navigation drawer controllers.
 */

export function openDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  
  drawer.classList.remove('hidden');
  
  requestAnimationFrame(() => {
    const backdrop = drawer.querySelector('[id$="-backdrop"]');
    const panel = drawer.querySelector('[id$="-panel"]');
    
    if (backdrop) backdrop.style.opacity = '1';
    if (panel) {
      panel.classList.remove('translate-x-full');
      panel.classList.add('translate-x-0');
    }
  });
  
  document.body.style.overflow = 'hidden';
}

export function closeDrawer(drawerId) {
  const drawer = document.getElementById(drawerId);
  if (!drawer) return;
  
  const backdrop = drawer.querySelector('[id$="-backdrop"]');
  const panel = drawer.querySelector('[id$="-panel"]');
  
  if (backdrop) backdrop.style.opacity = '0';
  if (panel) {
    panel.classList.remove('translate-x-0');
    panel.classList.add('translate-x-full');
  }
  
  setTimeout(() => {
    drawer.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

export function initDrawerClosers() {
  document.querySelectorAll('[id$="-close"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const drawer = e.target.closest('[role="dialog"]');
      if (drawer) {
        closeDrawer(drawer.id);
      }
    });
  });

  document.querySelectorAll('[id$="-backdrop"]').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      const drawer = e.target.closest('[role="dialog"]');
      if (drawer) {
        closeDrawer(drawer.id);
      }
    });
  });
}
