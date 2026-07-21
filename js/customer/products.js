/**
 * products.js
 * Logic for fetching products, filtering, and the product details modal.
 */
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';

let productsData = [];

export async function initProducts() {
  await fetchProducts();
  setupSearch();
}

async function fetchProducts() {
  try {
    const res = await fetch('data/products.json');
    productsData = await res.json();
    renderProducts(productsData.slice(0, 8));
  } catch (error) {
    console.error("Failed to load products:", error);
    showToast("Failed to load products.", "error");
  }
}

function renderProducts(data) {
  const grid = document.getElementById('ght-products-grid');
  
  if (!grid) return;

  grid.innerHTML = data.map((prod, i) => `
    <div class="bg-white border border-ght-border flex flex-col h-full cursor-pointer hover:shadow-md hover:border-ght-accent/50 transition-all group rounded-[20px] overflow-hidden" data-id="${prod.id}" style="animation-delay: ${i * 50}ms">
      <!-- Full Bleed Image Top -->
      <div class="aspect-[4/3] w-full relative overflow-hidden bg-ght-surface">
        <img src="${prod.image || 'assets/img/rices (1).jpg'}" alt="${prod.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null;this.src='assets/img/rices (1).jpg';">
        <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded shadow-sm">
          <span class="text-[9px] font-bold text-ght-primary uppercase tracking-widest">${prod.category}</span>
        </div>
      </div>
      
      <!-- Card Content -->
      <div class="flex-1 flex flex-col p-4">
        <h3 class="font-bold text-sm text-ght-dark line-clamp-2 leading-tight group-hover:text-ght-accent transition-colors">${prod.name}</h3>
        <p class="text-[10px] text-ght-muted mt-1 font-medium">${prod.unit}</p>
        
        <div class="mt-4 flex items-end justify-between">
          <div class="flex flex-col">
            <span class="text-base font-bold text-ght-dark tracking-tight leading-none">₦${prod.price_per_unit.toLocaleString()}</span>
            <div class="flex items-center gap-1 mt-1">
              <iconify-icon icon="solar:star-bold" class="text-[10px] text-yellow-500"></iconify-icon>
              <span class="text-[9px] font-bold text-ght-muted">${prod.rating} (128)</span>
            </div>
          </div>
          <button class="bg-white border border-ght-border text-ght-accent hover:bg-ght-accent hover:text-white hover:border-ght-accent rounded-lg flex items-center justify-center px-4 py-1.5 text-[11px] font-bold transition-colors shadow-sm add-btn shrink-0">
            + Add
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach click listeners to cards
  grid.querySelectorAll('.bg-white').forEach(card => {
    card.addEventListener('click', (e) => {
      // Prevent opening modal if clicking directly on the cart button
      if (e.target.closest('.add-btn')) {
        showToast("Added directly to cart!", "success");
        return;
      }
      const id = parseInt(card.getAttribute('data-id'));
      openProductModal(id);
    });
  });
}

function setupSearch() {
  const input = document.getElementById('ght-product-search');
  
  if (input) {
    input.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = productsData.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      renderProducts(filtered);
    });
  }
}

// ----------------------------------------------------
// PRODUCT MODAL LOGIC
// ----------------------------------------------------
let currentProduct = null;
let currentQty = 1;
let currentMode = 'whole'; // 'whole' | 'partial'
let currentPartialFactor = 0;

function openProductModal(id) {
  currentProduct = productsData.find(p => p.id === id);
  if (!currentProduct) return;

  currentQty = currentProduct.min_order;
  currentMode = 'whole';
  currentPartialFactor = 0;

  document.getElementById('ght-pm-name').textContent = currentProduct.name;
  document.getElementById('ght-pm-category').textContent = currentProduct.category;
  document.getElementById('ght-pm-desc').textContent = currentProduct.description;
  document.getElementById('ght-pm-image').src = currentProduct.image || 'assets/img/rices (1).jpg';
  document.getElementById('ght-pm-rating').textContent = currentProduct.rating;
  document.getElementById('ght-pm-price').textContent = `₦${currentProduct.price_per_unit.toLocaleString()}`;
  document.getElementById('ght-pm-unit').textContent = `/ ${currentProduct.unit}`;
  
  if (currentProduct.stock > 0) {
    document.getElementById('ght-pm-stock-badge').textContent = `In Stock (${currentProduct.stock})`;
    document.getElementById('ght-pm-stock-badge').className = "text-green-700 font-bold text-[11px]";
  } else {
    document.getElementById('ght-pm-stock-badge').textContent = `Out of Stock`;
    document.getElementById('ght-pm-stock-badge').className = "text-red-700 font-bold text-[11px]";
  }

  setupPurchaseModes();
  updateModalPrice();
  openModal('product-modal');
}

function setupPurchaseModes() {
  const modeWrapper = document.getElementById('ght-purchase-mode-wrapper');
  const wholeContainer = document.getElementById('ght-whole-qty-container');
  const partialContainer = document.getElementById('ght-partial-qty-container');
  
  const btnWhole = document.getElementById('ght-btn-mode-whole');
  const btnPartial = document.getElementById('ght-btn-mode-partial');

  if (currentProduct.supports_partial && currentProduct.partial_units.length > 0) {
    modeWrapper.classList.remove('hidden');
    
    setModeUI('whole');

    btnWhole.onclick = () => setModeUI('whole');
    btnPartial.onclick = () => setModeUI('partial');

    const presetsDiv = document.getElementById('ght-partial-presets');
    presetsDiv.innerHTML = currentProduct.partial_units.map((pu, i) => `
      <button class="ght-btn-partial py-2 px-3 text-xs font-bold rounded-lg border ${i === 0 ? 'bg-ght-primary/10 border-ght-primary text-ght-primary' : 'bg-white border-ght-border text-ght-muted hover:text-ght-dark'} transition-all" data-factor="${pu.factor}" data-name="${pu.name}">
        ${pu.name}
      </button>
    `).join('');

    currentPartialFactor = currentProduct.partial_units[0].factor;
    document.getElementById('ght-partial-unit-name').textContent = currentProduct.partial_units[0].name;

    presetsDiv.querySelectorAll('.ght-btn-partial').forEach(btn => {
      btn.addEventListener('click', (e) => {
        presetsDiv.querySelectorAll('.ght-btn-partial').forEach(b => {
          b.classList.remove('bg-ght-primary/10', 'border-ght-primary', 'text-ght-primary');
          b.classList.add('bg-white', 'text-ght-muted', 'border-ght-border');
        });
        const target = e.currentTarget;
        target.classList.remove('bg-white', 'text-ght-muted', 'border-ght-border');
        target.classList.add('bg-ght-primary/10', 'border-ght-primary', 'text-ght-primary');
        
        currentPartialFactor = parseFloat(target.getAttribute('data-factor'));
        document.getElementById('ght-partial-unit-name').textContent = target.getAttribute('data-name');
        updateModalPrice();
      });
    });

  } else {
    modeWrapper.classList.add('hidden');
    setModeUI('whole');
  }

  document.getElementById('ght-qty-val').textContent = currentQty;
  document.getElementById('ght-qty-minus').onclick = () => {
    if (currentQty > currentProduct.min_order) {
      currentQty--;
      document.getElementById('ght-qty-val').textContent = currentQty;
      updateModalPrice();
    }
  };
  document.getElementById('ght-qty-plus').onclick = () => {
    if (currentQty < currentProduct.stock) {
      currentQty++;
      document.getElementById('ght-qty-val').textContent = currentQty;
      updateModalPrice();
    }
  };
}

function setModeUI(mode) {
  currentMode = mode;
  const btnWhole = document.getElementById('ght-btn-mode-whole');
  const btnPartial = document.getElementById('ght-btn-mode-partial');
  const wholeContainer = document.getElementById('ght-whole-qty-container');
  const partialContainer = document.getElementById('ght-partial-qty-container');

  if (mode === 'whole') {
    btnWhole.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-white shadow-sm text-ght-dark border border-ght-border transition-all";
    btnPartial.className = "flex-1 py-2 text-xs font-bold rounded-lg text-ght-muted hover:text-ght-dark border border-transparent transition-all";
    wholeContainer.classList.remove('hidden');
    partialContainer.classList.add('hidden');
  } else {
    btnPartial.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-white shadow-sm text-ght-dark border border-ght-border transition-all";
    btnWhole.className = "flex-1 py-2 text-xs font-bold rounded-lg text-ght-muted hover:text-ght-dark border border-transparent transition-all";
    partialContainer.classList.remove('hidden');
    wholeContainer.classList.add('hidden');
  }
  updateModalPrice();
}

function updateModalPrice() {
  let total = 0;
  if (currentMode === 'whole') {
    let priceToUse = currentProduct.price_per_unit;
    if (currentProduct.wholesale_tiers) {
      const tiers = [...currentProduct.wholesale_tiers].sort((a,b) => b.qty - a.qty);
      for (const t of tiers) {
        if (currentQty >= t.qty) {
          priceToUse = t.price;
          break;
        }
      }
    }
    total = priceToUse * currentQty;
  } else {
    total = currentProduct.price_per_unit * currentPartialFactor;
  }
  document.getElementById('ght-pm-est-total').textContent = `₦${total.toLocaleString()}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ght-pm-add-to-cart')?.addEventListener('click', () => {
    showToast(`Added ${currentProduct.name} to cart.`, "success");
    import('../components/modal.js').then(({closeModal}) => {
      closeModal('product-modal');
    });
  });
});
