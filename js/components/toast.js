/**
 * toast.js
 * Dynamic toast triggers for success, warning, and error banners.
 */

export function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('ght-toast-container');
  if (!container) return;

  // Keep it to one toast at a time
  container.innerHTML = '';

  const toast = document.createElement('div');
  
  // Base classes for the liquid glass look
  let baseClasses = 'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-300 translate-y-full opacity-0 pointer-events-auto border ';
  
  let icon = '';
  if (type === 'success') {
    baseClasses += 'bg-green-50/90 border-green-200 text-green-800 backdrop-blur-md';
    icon = '<iconify-icon icon="solar:check-circle-bold" class="text-xl text-green-600"></iconify-icon>';
  } else if (type === 'error') {
    baseClasses += 'bg-red-50/90 border-red-200 text-red-800 backdrop-blur-md';
    icon = '<iconify-icon icon="solar:danger-circle-bold" class="text-xl text-red-600"></iconify-icon>';
  } else if (type === 'warning') {
    baseClasses += 'bg-orange-50/90 border-orange-200 text-orange-800 backdrop-blur-md';
    icon = '<iconify-icon icon="solar:info-circle-bold" class="text-xl text-orange-600"></iconify-icon>';
  }

  toast.className = baseClasses;
  toast.innerHTML = `
    ${icon}
    <span class="font-medium text-sm">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-full', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  // Animate out
  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-full', 'opacity-0');
    
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
