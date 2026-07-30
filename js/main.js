/**
 * main.js
 * Global module bootstrapper
 */

import { initModalClosers, openModal, closeModal } from './components/modal.js';
import { initDrawerClosers, openDrawer, closeDrawer } from './components/drawer.js';
import { initProducts } from './customer/products.js';
import { initViewToggle, isGuest, triggerAuthGateModal } from './customer/view-toggle.js';
import { showToast } from './components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  initModalClosers();
  initDrawerClosers();

  // Initialize View Switcher & Products
  initViewToggle();
  initProducts();

  // Top Nav Actions
  document.getElementById('ght-header-cart-btn')?.addEventListener('click', () => {
    renderCartDrawer();
    openDrawer('cart-drawer');
  });

  document.getElementById('ght-btn-empty-cart-browse')?.addEventListener('click', () => {
    window.location.href = 'ProductList.html';
  });

  document.getElementById('ght-cart-clear')?.addEventListener('click', () => {
    window.FoodLiftCart.clear();
    renderCartDrawer();
  });

  window.FoodLiftCart?.syncBadges();
  window.addEventListener('foodlift:cart-change', renderCartDrawer);
  
  document.getElementById('ght-action-fund')?.addEventListener('click', () => {
    if (isGuest()) {
      triggerAuthGateModal("Top up Wallet", "Sign in or create an account to fund your FoodLift digital wallet for instant 1-click ordering.");
      return;
    }
    openModal('wallet-modal');
  });

  document.getElementById('ght-action-fund-widget')?.addEventListener('click', () => {
    if (isGuest()) {
      triggerAuthGateModal("Top up Wallet", "Sign in or create an account to fund your FoodLift digital wallet for instant 1-click ordering.");
      return;
    }
    openModal('wallet-modal');
  });

  document.getElementById('ght-action-track')?.addEventListener('click', () => {
    if (isGuest()) {
      triggerAuthGateModal("Track Orders", "Log in to track your live deliveries with QR custody verification.");
      return;
    }
    openModal('order-modal');
  });

  // Guest Auth Button & Hero Triggers
  document.getElementById('ght-btn-login')?.addEventListener('click', () => {
    triggerAuthGateModal("Welcome Back", "Log in to access your digital wallet, order history, and saved restock lists.");
  });

  document.getElementById('ght-btn-register')?.addEventListener('click', () => {
    triggerAuthGateModal("Create an Account", "Join FoodLift to unlock wholesale tier discounts, wallet cashback, and fast Lagos delivery.");
  });

  // Logged-Out Guest Action Triggers
  const heroShopBtn = document.getElementById('ght-guest-hero-shop-btn');
  if (heroShopBtn) {
    heroShopBtn.addEventListener('click', () => {
      window.location.href = 'ProductList.html';
    });
  }

  const heroHowBtn = document.getElementById('ght-guest-hero-how-btn');
  if (heroHowBtn) {
    heroHowBtn.addEventListener('click', () => {
      document.getElementById('ght-guest-process-banner')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.ght-guest-action-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerAuthGateModal("Create an Account", "Join FoodLift to unlock digital wallet rewards, first order discounts, and 1-click ordering.");
    });
  });

  document.getElementById('ght-btn-welcome-signup')?.addEventListener('click', () => {
    triggerAuthGateModal("Join FoodLift Today", "Sign up in under 60 seconds to lock in wholesale market rates and 15% off your first order.");
  });

  document.getElementById('ght-btn-welcome-login')?.addEventListener('click', () => {
    triggerAuthGateModal("Welcome Back", "Log in to access your digital wallet and active order tracking.");
  });

  // Auth Gate Modal Buttons
  document.getElementById('ght-auth-modal-register-btn')?.addEventListener('click', () => {
    closeModal('ght-auth-gate-modal');
    showToast("Registration requested.", "info");
  });

  document.getElementById('ght-auth-modal-login-btn')?.addEventListener('click', () => {
    closeModal('ght-auth-gate-modal');
    showToast("Log in requested.", "info");
  });

  document.getElementById('ght-auth-modal-close-btn')?.addEventListener('click', () => {
    closeModal('ght-auth-gate-modal');
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

  // Live Countdown Timer for Limited Offer
  initCountdownTimer();
});

function renderCartDrawer() {
  const items = window.FoodLiftCart?.read() || [];
  const emptyState = document.getElementById('ght-cart-empty-state');
  const itemsWrap = document.getElementById('ght-cart-items');
  const summary = document.getElementById('ght-cart-summary');
  const subtotal = document.getElementById('ght-cart-subtotal');

  if (!emptyState || !itemsWrap || !summary || !subtotal) return;

  emptyState.classList.toggle('hidden', items.length > 0);
  itemsWrap.classList.toggle('hidden', items.length === 0);
  summary.classList.toggle('hidden', items.length === 0);
  subtotal.textContent = window.FoodLiftCatalog.money(window.FoodLiftCart.subtotal());

  itemsWrap.innerHTML = items.map(item => `
    <div class="border border-ght-border rounded-2xl p-3 bg-white">
      <div class="flex gap-3">
        <img src="${item.image || window.FoodLiftCatalog.fallbackImage}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover bg-ght-surface" onerror="window.FoodLiftCatalog.safeImage(event)">
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h4 class="text-sm font-bold text-ght-dark truncate">${item.name}</h4>
              <p class="text-[11px] text-ght-muted font-medium">${item.unit}</p>
            </div>
            <button class="text-ght-muted hover:text-ght-accent" data-cart-remove="${item.key}" aria-label="Remove ${item.name}">
              <iconify-icon icon="solar:trash-bin-minimalistic-linear" class="text-base"></iconify-icon>
            </button>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-2 bg-ght-surface border border-ght-border rounded-full p-1">
              <button class="w-7 h-7 rounded-full bg-white border border-ght-border font-bold" data-cart-dec="${item.key}">-</button>
              <span class="text-xs font-bold w-5 text-center">${item.qty}</span>
              <button class="w-7 h-7 rounded-full bg-white border border-ght-border font-bold" data-cart-inc="${item.key}">+</button>
            </div>
            <p class="text-sm font-bold text-ght-dark">${window.FoodLiftCatalog.money(item.unitPrice * item.qty)}</p>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  itemsWrap.querySelectorAll('[data-cart-inc]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = window.FoodLiftCart.read().find(entry => entry.key === btn.dataset.cartInc);
      if (item) window.FoodLiftCart.update(item.key, item.qty + 1);
    });
  });
  itemsWrap.querySelectorAll('[data-cart-dec]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = window.FoodLiftCart.read().find(entry => entry.key === btn.dataset.cartDec);
      if (item) window.FoodLiftCart.update(item.key, item.qty - 1);
    });
  });
  itemsWrap.querySelectorAll('[data-cart-remove]').forEach(btn => {
    btn.addEventListener('click', () => window.FoodLiftCart.remove(btn.dataset.cartRemove));
  });
}

function initCountdownTimer() {
  let totalSeconds = 2 * 3600 + 45 * 60 + 12; // 2h 45m 12s initial duration

  function updateDisplay() {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    // Guest Hero Timer
    const guestH = document.getElementById('guest-timer-hours');
    const guestM = document.getElementById('guest-timer-minutes');
    const guestS = document.getElementById('guest-timer-seconds');
    if (guestH) guestH.textContent = pad(hours);
    if (guestM) guestM.textContent = pad(minutes);
    if (guestS) guestS.textContent = pad(seconds);

    // Logged-in Hero Timer
    const authH = document.getElementById('timer-hours');
    const authM = document.getElementById('timer-minutes');
    const authS = document.getElementById('timer-seconds');
    if (authH) authH.textContent = pad(hours);
    if (authM) authM.textContent = pad(minutes);
    if (authS) authS.textContent = pad(seconds);

    if (totalSeconds > 0) {
      totalSeconds--;
    } else {
      totalSeconds = 3 * 3600; // Reset loop for demo
    }
  }

  updateDisplay();
  setInterval(updateDisplay, 1000);
}
