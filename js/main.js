/**
 * main.js
 * Global module bootstrapper
 */

import { initModalClosers, openModal } from './components/modal.js';
import { initDrawerClosers, openDrawer } from './components/drawer.js';
import { initProducts } from './customer/products.js';

document.addEventListener('DOMContentLoaded', () => {
  initModalClosers();
  initDrawerClosers();

  // Initialize Pages (now unified)
  initProducts();

  // Top Nav Actions
  document.getElementById('ght-header-cart-btn')?.addEventListener('click', () => {
    openDrawer('cart-drawer');
  });
  
  document.getElementById('ght-action-fund')?.addEventListener('click', () => {
    openModal('wallet-modal');
  });

  document.getElementById('ght-action-fund-widget')?.addEventListener('click', () => {
    openModal('wallet-modal');
  });

  document.getElementById('ght-action-track')?.addEventListener('click', () => {
    openModal('order-modal');
  });

  // Mobile Menu Toggle
  document.getElementById('ght-mobile-menu-btn')?.addEventListener('click', () => {
    openDrawer('mobile-menu-drawer');
  });

  // Profile Dropdown Toggle
  const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
  const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
  const profileDropdownContainer = document.getElementById('profile-dropdown-container');

  if (profileDropdownBtn && profileDropdownMenu && profileDropdownContainer) {
    profileDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!profileDropdownContainer.contains(e.target)) {
        profileDropdownMenu.classList.add('hidden');
      }
    });
  }

  // Hero Countdown Timer
  const hoursEl = document.getElementById('timer-hours');
  const minutesEl = document.getElementById('timer-minutes');
  const secondsEl = document.getElementById('timer-seconds');
  
  if (hoursEl && minutesEl && secondsEl) {
    let targetTime = Date.now() + (5 * 60 * 60 * 1000) + (45 * 60 * 1000);
    
    function updateTimer() {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        targetTime = Date.now() + (12 * 60 * 60 * 1000);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      hoursEl.textContent = String(hours).padStart(2, '0');
      minutesEl.textContent = String(minutes).padStart(2, '0');
      secondsEl.textContent = String(seconds).padStart(2, '0');
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
  }
});
