/**
 * modal.js
 * Controller to show/hide modals with backdrop blur.
 */

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // A small delay allows the display: block to apply before animating opacity/transform
  requestAnimationFrame(() => {
    const backdrop = modal.querySelector('div[class*="backdrop-blur"]');
    const panel = modal.querySelector('.relative');
    
    if (backdrop) backdrop.style.opacity = '1';
    if (panel) {
      panel.classList.remove('opacity-0', 'translate-y-4', 'scale-95');
      panel.classList.add('opacity-100', 'translate-y-0', 'scale-100');
    }
  });
  
  document.body.style.overflow = 'hidden';
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  const backdrop = modal.querySelector('div[class*="backdrop-blur"]');
  const panel = modal.querySelector('.relative');
  
  if (backdrop) backdrop.style.opacity = '0';
  if (panel) {
    panel.classList.remove('opacity-100', 'translate-y-0', 'scale-100');
    panel.classList.add('opacity-0', 'translate-y-4', 'scale-95');
  }
  
  setTimeout(() => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300); // Wait for transition
}

export function initModalClosers() {
  document.querySelectorAll('[id$="-close"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('[role="dialog"]');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Backdrop clicks
  document.querySelectorAll('[role="dialog"]').forEach(modal => {
    modal.addEventListener('click', (e) => {
      // If clicking the modal container itself (which is the flex wrapper)
      if (e.target === modal || e.target.id.includes('backdrop')) {
        closeModal(modal.id);
      }
    });
  });
}
