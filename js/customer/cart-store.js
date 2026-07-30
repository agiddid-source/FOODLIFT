window.FoodLiftCart = (() => {
  let cartItems = [];

  function read() {
    return cartItems.map(item => ({ ...item }));
  }

  function write(items) {
    cartItems = items.map(item => ({ ...item }));
    syncBadges();
    window.dispatchEvent(new CustomEvent('foodlift:cart-change', { detail: read() }));
    return read();
  }

  function add(product, options = {}) {
    const qty = Math.max(1, Number(options.qty || 1));
    const unitLabel = options.unitLabel || product.unit;
    const unitPrice = Number(options.unitPrice || product.price_per_unit);
    const cartKey = `${product.id}:${unitLabel}`;
    const items = read();
    const existing = items.find(item => item.key === cartKey);

    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        key: cartKey,
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        unit: unitLabel,
        unitPrice,
        qty
      });
    }

    return write(items);
  }

  function update(itemKey, qty) {
    const nextQty = Number(qty);
    const items = read();
    const next = nextQty <= 0 ? items.filter(item => item.key !== itemKey) : items.map(item => item.key === itemKey ? { ...item, qty: nextQty } : item);
    return write(next);
  }

  function remove(itemKey) {
    return write(read().filter(item => item.key !== itemKey));
  }

  function clear() {
    return write([]);
  }

  function count() {
    return read().reduce((sum, item) => sum + item.qty, 0);
  }

  function subtotal() {
    return read().reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  }

  function syncBadges() {
    const total = count();
    document.querySelectorAll('[data-cart-count], #ght-cart-badge-count').forEach(badge => {
      badge.textContent = total;
      badge.classList.toggle('hidden', total === 0);
    });
  }

  return { add, clear, count, read, remove, subtotal, syncBadges, update };
})();
