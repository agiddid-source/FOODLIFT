/**
 * badge.js
 * Status-badge generators based on status strings.
 */

export function getStatusBadge(status) {
  const normalized = status.toLowerCase();
  
  let type = 'neutral';
  
  if (['delivered', 'completed', 'success', 'active'].includes(normalized)) {
    type = 'success';
  } else if (['pending', 'processing', 'transit', 'in-transit'].includes(normalized)) {
    type = 'warning';
  } else if (['cancelled', 'failed', 'error'].includes(normalized)) {
    type = 'error';
  } else if (['new', 'primary'].includes(normalized)) {
    type = 'primary';
  }
  
  return `<span class="ght-badge ght-badge-${type}">${status}</span>`;
}
