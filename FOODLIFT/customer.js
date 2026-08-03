/* FoodLift Customer — vanilla JS */
(() => {
  const NGN = n => '₦' + Number(n).toLocaleString('en-NG');

  // ---------- State ----------
  const state = {
    wallet: 125000,
    cart: [], // {id, name, price, qty, icon, part?}
  };

  // ---------- Data ----------
  const categories = [
    { id:'produce',  name:'Fresh Produce', icon:'🥬' },
    { id:'oil',      name:'Cooking Oil',   icon:'🫒' },
    { id:'grains',   name:'Grains & Rice', icon:'🌾' },
    { id:'proteins', name:'Proteins',      icon:'🐟' },
    { id:'tubers',   name:'Tubers & Flour',icon:'🥔' },
    { id:'spices',   name:'Spices',        icon:'🌶️' },
  ];

  const products = [
    { id:'rice50',  name:'Premium Local Rice (Mama Gold)', sub:'50kg Bag',    price:65000, rating:'4.8 (128)', tag:'GRAINS',        media:'' },
    { id:'garri',   name:'Ijebu Garri (Yellow)',           sub:'50kg Bag',    price:22000, rating:'4.6 (128)', tag:'TUBERS & FLOURS', media:'tuber' },
    { id:'palm',    name:'Red Palm Oil',                   sub:'25 Liters Keg',price:38000, rating:'4.9 (128)', tag:'OILS & SPICES', media:'oil' },
    { id:'catfish', name:'Dried Catfish (Smoked)',         sub:'Large Carton',price:85000, rating:'4.7 (128)', tag:'PROTEINS',     media:'protein' },
    { id:'beans',   name:'Nigerian Brown Beans (Oloyin)',  sub:'100kg Bag',   price:78000, rating:'4.5 (128)', tag:'GRAINS',       media:'beans' },
    { id:'pepper',  name:'Dried Pepper Mix',               sub:'10kg Bag',    price:18500, rating:'4.6 (312)', tag:'SPICES',       media:'spice' },
    { id:'milk',    name:'Peak Powdered Milk',             sub:'Carton x 24', price:42000, rating:'4.8 (201)', tag:'DAIRY',        media:'dairy' },
    { id:'veg',     name:'Pure Vegetable Oil',             sub:'25L Keg',     price:29500, rating:'4.7 (176)', tag:'OILS & SPICES', media:'oil' },
  ];

  const parts = [
    { id:'rice50',  name:'Premium Local Rice', fullSize:50, unit:'kg', unitPrice:1400, min:5, max:50, step:5, icon:'🌾' },
    { id:'beans50', name:'Brown Beans (Oloyin)', fullSize:100, unit:'kg', unitPrice:820, min:10, max:100, step:10, icon:'🫘' },
    { id:'palm25',  name:'Red Palm Oil',       fullSize:25, unit:'L',  unitPrice:1600, min:2,  max:25, step:1,  icon:'🫒' },
  ];

  // ---------- Render ----------
  const el = id => document.getElementById(id);

  function renderCategories(){
    el('catRow').innerHTML = categories.map(c => `
      <button class="cat" data-cat="${c.id}">
        <div class="cat-ico">${c.icon}</div>
        <div class="cat-name">${c.name.toUpperCase()}</div>
      </button>
    `).join('');
  }

  function renderProducts(){
    el('productGrid').innerHTML = products.map(p => `
      <article class="product">
        <div class="product-media ${p.media}">
          <span class="product-tag">${p.tag}</span>
        </div>
        <div class="product-body">
          <div class="product-name">${p.name}</div>
          <div class="product-sub">${p.sub}</div>
          <div class="product-rate">⭐ ${p.rating}</div>
          <div class="product-foot">
            <div class="product-price">${NGN(p.price)}</div>
            <button class="add-btn" data-add="${p.id}">+ Add</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderParts(){
    el('partsGrid').innerHTML = parts.map(p => {
      const initial = p.min;
      return `
      <div class="part" data-part="${p.id}">
        <div class="part-head">
          <div>
            <div class="part-name">${p.icon} ${p.name}</div>
            <div class="part-full">Full: ${p.fullSize}${p.unit} · ${NGN(p.fullSize*p.unitPrice)}</div>
          </div>
        </div>
        <input type="range" class="part-slider" min="${p.min}" max="${p.max}" step="${p.step}" value="${initial}" />
        <div class="part-meta">
          <span><strong class="part-qty">${initial}</strong>${p.unit} @ ${NGN(p.unitPrice)}/${p.unit}</span>
          <span>${Math.round(initial/p.fullSize*100)}% of a full ${p.unit === 'kg' ? 'bag' : 'keg'}</span>
        </div>
        <div class="part-total">${NGN(initial*p.unitPrice)}</div>
        <button class="btn-primary" data-add-part="${p.id}">Add ${initial}${p.unit} to cart</button>
      </div>`;
    }).join('');

    document.querySelectorAll('.part').forEach(node => {
      const id = node.dataset.part;
      const cfg = parts.find(x=>x.id===id);
      const slider = node.querySelector('.part-slider');
      const qtyEl = node.querySelector('.part-qty');
      const totalEl = node.querySelector('.part-total');
      const btn = node.querySelector('[data-add-part]');
      const metaPct = node.querySelectorAll('.part-meta span')[1];
      slider.addEventListener('input', () => {
        const q = Number(slider.value);
        qtyEl.textContent = q;
        totalEl.textContent = NGN(q*cfg.unitPrice);
        metaPct.textContent = `${Math.round(q/cfg.fullSize*100)}% of a full ${cfg.unit==='kg'?'bag':'keg'}`;
        btn.textContent = `Add ${q}${cfg.unit} to cart`;
      });
      btn.addEventListener('click', () => {
        const q = Number(slider.value);
        addToCart({
          id: `${cfg.id}-${q}${cfg.unit}`,
          name: `${cfg.name} — ${q}${cfg.unit}`,
          price: q*cfg.unitPrice,
          icon: cfg.icon,
          part: true,
        });
      });
    });
  }

  // ---------- Cart ----------
  function addToCart(item){
    const existing = state.cart.find(x => x.id === item.id);
    if (existing) existing.qty += 1;
    else state.cart.push({ ...item, qty:1 });
    refreshCart();
    toast(`Added ${item.name}`);
  }

  function refreshCart(){
    const count = state.cart.reduce((s,x)=>s+x.qty,0);
    el('cartBadge').textContent = count;
    const body = el('cartBody');
    if (!state.cart.length){
      body.innerHTML = `<div class="empty-cart">Your cart is empty.<br/>Start shopping to fill it up.</div>`;
    } else {
      body.innerHTML = state.cart.map(x => `
        <div class="cart-line">
          <div class="cart-thumb">${x.icon || '🛒'}</div>
          <div class="cart-info">
            <div class="cart-name">${x.name}</div>
            <div class="cart-price">${NGN(x.price)} each</div>
            <div class="qty">
              <button data-dec="${x.id}">−</button>
              <span>${x.qty}</span>
              <button data-inc="${x.id}">+</button>
            </div>
          </div>
          <button class="cart-remove" data-rm="${x.id}">Remove</button>
        </div>
      `).join('');
    }
    const subtotal = state.cart.reduce((s,x)=>s + x.price*x.qty, 0);
    const delivery = subtotal >= 50000 || subtotal === 0 ? 0 : 2500;
    el('cartSubtotal').textContent = NGN(subtotal);
    el('cartDelivery').textContent = delivery === 0 ? 'FREE' : NGN(delivery);
    el('cartTotal').textContent = NGN(subtotal + delivery);
    el('walletInline').textContent = NGN(state.wallet);
    el('walletPill').textContent = NGN(state.wallet);
    el('walletBalance').textContent = NGN(state.wallet);
  }

  // ---------- Modals / drawers ----------
  const drawers = { cart: el('cartDrawer') };
  const modals = { wallet: el('walletModal'), confirm: el('confirmModal'), track: el('trackModal') };

  function open(name){
    if (drawers[name]) drawers[name].classList.add('open');
    if (modals[name])  modals[name].classList.add('open');
  }
  function closeAll(){
    Object.values(drawers).forEach(d=>d.classList.remove('open'));
    Object.values(modals).forEach(m=>m.classList.remove('open'));
  }

  document.addEventListener('click', (e) => {
    const openTarget = e.target.closest('[data-open]');
    const closeThen = e.target.closest('[data-close-then]');
    if (openTarget){
      const name = openTarget.dataset.open;
      if (closeThen) closeAll();
      open(name);
      return;
    }
    if (e.target.closest('[data-close]')){ closeAll(); return; }

    const add = e.target.closest('[data-add]');
    if (add){
      const p = products.find(x => x.id === add.dataset.add);
      if (p) addToCart({ id:p.id, name:p.name, price:p.price, icon:'🛒' });
      return;
    }
    if (e.target.closest('[data-add-bundle]')){
      addToCart({ id:'pantry-starter', name:'Pantry Starter Pack', price:98500, icon:'📦' });
      return;
    }
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rm  = e.target.closest('[data-rm]');
    if (inc || dec || rm){
      const id = (inc||dec||rm).dataset.inc || (inc||dec||rm).dataset.dec || (inc||dec||rm).dataset.rm;
      const item = state.cart.find(x=>x.id===id);
      if (!item) return;
      if (inc) item.qty += 1;
      if (dec) item.qty = Math.max(0, item.qty-1);
      if (rm || item.qty === 0) state.cart = state.cart.filter(x=>x.id!==id);
      refreshCart();
    }
  });

  // Close modal on backdrop
  Object.values(modals).forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) closeAll(); });
  });

  // ---------- Wallet top-up ----------
  document.querySelectorAll('.quick-amounts button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-amounts button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      el('topupInput').value = btn.dataset.amt;
    });
  });
  el('topupBtn').addEventListener('click', () => {
    const amt = Number(el('topupInput').value || 0);
    if (amt < 500){ toast('Enter at least ₦500'); return; }
    state.wallet += amt;
    refreshCart();
    closeAll();
    toast(`Wallet funded with ${NGN(amt)}`);
    el('topupInput').value = '';
  });

  // ---------- Checkout ----------
  el('checkoutBtn').addEventListener('click', () => {
    if (!state.cart.length){ toast('Your cart is empty'); return; }
    const subtotal = state.cart.reduce((s,x)=>s + x.price*x.qty, 0);
    const delivery = subtotal >= 50000 ? 0 : 2500;
    const total = subtotal + delivery;
    const payWallet = el('payWallet').checked;
    if (payWallet && state.wallet < total){
      toast('Insufficient wallet balance. Please top up.');
      open('wallet');
      return;
    }
    if (payWallet) state.wallet -= total;

    const orderId = 'FL-' + Math.floor(100000 + Math.random()*899999);
    const token = Math.floor(1000 + Math.random()*8999).toString();

    el('confirmId').textContent = orderId;
    el('confirmTotal').textContent = NGN(total);
    el('tokenCode').textContent = token;
    renderQR(orderId + ':' + token);

    state.cart = [];
    refreshCart();
    closeAll();
    open('confirm');
  });

  // Fake QR — deterministic pattern from string
  function renderQR(str){
    const size = 21;
    let hash = 0;
    for (let i=0;i<str.length;i++) hash = (hash*31 + str.charCodeAt(i)) >>> 0;
    const cells = [];
    for (let i=0;i<size*size;i++){
      hash = (hash*1103515245 + 12345) >>> 0;
      cells.push((hash & 1) ? '<i></i>' : '<i style="background:transparent"></i>');
    }
    // finder squares corners
    const setBlock = (r,c) => {
      for (let dr=0; dr<7; dr++) for (let dc=0; dc<7; dc++){
        const on = dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4);
        cells[(r+dr)*size+(c+dc)] = on ? '<i></i>' : '<i style="background:transparent"></i>';
      }
    };
    setBlock(0,0); setBlock(0,size-7); setBlock(size-7,0);
    el('qrCode').innerHTML = cells.join('');
  }

  // ---------- ETA ticker ----------
  let eta = 18;
  setInterval(() => {
    eta = Math.max(1, eta - 1);
    el('etaMins').textContent = eta;
    const tlEta = el('tlEta'); if (tlEta) tlEta.textContent = eta;
    const pct = Math.min(98, 66 + (18-eta)*1.7);
    el('trackFill').style.width = pct + '%';
  }, 30000);

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg){
    const t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
  }

  // ---------- Init ----------
  renderCategories();
  renderProducts();
  renderParts();
  refreshCart();
})();
