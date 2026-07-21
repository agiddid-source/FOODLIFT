/**
 * loader.js
 * Injects and toggles loading states.
 */

export function toggleButtonLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  if (isLoading) {
    buttonEl.setAttribute('data-state', 'loading');
    buttonEl.disabled = true;
  } else {
    buttonEl.removeAttribute('data-state');
    buttonEl.disabled = false;
  }
}

export function toggleCardLoading(cardEl, isLoading) {
  if (!cardEl) return;
  if (isLoading) {
    cardEl.setAttribute('data-state', 'loading');
  } else {
    cardEl.removeAttribute('data-state');
  }
}
