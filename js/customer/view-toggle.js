/**
 * view-toggle.js
 * Handles switching between Logged-In and Logged-Out (Guest) views
 * and manages customer authentication gate modals.
 */

import { openModal } from '../components/modal.js';

let isUserLoggedIn = true;

export function initViewToggle() {
  const switcherGuest = document.getElementById('ght-view-btn-guest');
  const switcherAuth = document.getElementById('ght-view-btn-auth');

  if (switcherGuest && switcherAuth) {
    switcherGuest.addEventListener('click', () => setLoggedState(false));
    switcherAuth.addEventListener('click', () => setLoggedState(true));
  }

  updateViewUI();
}

export function isGuest() {
  return !isUserLoggedIn;
}

export function setLoggedState(loggedIn) {
  isUserLoggedIn = loggedIn;
  updateViewUI();
}

function updateViewUI() {
  const switcherGuest = document.getElementById('ght-view-btn-guest');
  const switcherAuth = document.getElementById('ght-view-btn-auth');

  const navAuth = document.getElementById('ght-nav-auth-group');
  const navGuest = document.getElementById('ght-nav-guest-group');

  const mainColumn = document.getElementById('ght-main-feed-column');
  const sidebarColumn = document.getElementById('ght-sidebar-column');

  const authHero = document.getElementById('ght-auth-hero');
  const guestHero = document.getElementById('ght-guest-hero');
  const guestTrustStrip = document.getElementById('ght-guest-trust-strip');
  const guestProcessBanner = document.getElementById('ght-guest-process-banner');
  const guestBottomCards = document.getElementById('ght-guest-bottom-cards');
  const guestFooterTrust = document.getElementById('ght-guest-footer-trust');

  if (isUserLoggedIn) {
    switcherGuest?.classList.remove('is-active');
    switcherAuth?.classList.add('is-active');

    navAuth?.classList.remove('hidden');
    navAuth?.classList.add('flex');
    navGuest?.classList.add('hidden');
    navGuest?.classList.remove('flex');

    if (mainColumn) {
      mainColumn.classList.remove('lg:col-span-12');
      mainColumn.classList.add('lg:col-span-9');
    }
    if (sidebarColumn) {
      sidebarColumn.classList.remove('hidden');
    }

    authHero?.classList.remove('hidden');
    guestHero?.classList.add('hidden');
    guestTrustStrip?.classList.add('hidden');
    guestProcessBanner?.classList.add('hidden');
    guestBottomCards?.classList.add('hidden');
    guestFooterTrust?.classList.add('hidden');

  } else {
    switcherAuth?.classList.remove('is-active');
    switcherGuest?.classList.add('is-active');

    navAuth?.classList.add('hidden');
    navAuth?.classList.remove('flex');
    navGuest?.classList.remove('hidden');
    navGuest?.classList.add('flex');

    if (mainColumn) {
      mainColumn.classList.remove('lg:col-span-9');
      mainColumn.classList.add('lg:col-span-12');
    }
    if (sidebarColumn) {
      sidebarColumn.classList.add('hidden');
    }

    authHero?.classList.add('hidden');
    guestHero?.classList.remove('hidden');
    guestTrustStrip?.classList.remove('hidden');
    guestProcessBanner?.classList.remove('hidden');
    guestBottomCards?.classList.remove('hidden');
    guestFooterTrust?.classList.remove('hidden');
  }
}

/**
 * Triggers the Auth Gate modal when a guest attempts restricted actions.
 */
export function triggerAuthGateModal(actionTitle, actionDescription) {
  const modalTitleEl = document.getElementById('ght-auth-modal-title');
  const modalDescEl = document.getElementById('ght-auth-modal-desc');

  if (modalTitleEl) {
    modalTitleEl.textContent = actionTitle || "Sign in required";
  }
  if (modalDescEl) {
    modalDescEl.textContent = actionDescription || "Please log in or create an account to access wallet funding, order tracking, and wholesale discounts.";
  }

  openModal('ght-auth-gate-modal');
}
