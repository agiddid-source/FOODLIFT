/**
 * products.js
 * Logic for fetching products, quick filter chips, and the product details modal.
 */
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { isGuest, triggerAuthGateModal } from './view-toggle.js';

let productsData = [];

export async function initProducts() {
  await fetchProducts();
  renderHomeCategories();
  setupSearch();
  setupQuickFilters();
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

  if (data.length === 0) {
    const searchTerm = document.getElementById('ght-product-search')?.value || '';
    grid.innerHTML = `
      <div id="ght-search-empty-state" class="col-span-full py-16 px-4 text-center bg-white border border-ght-border rounded-[24px] shadow-sm space-y-4">
        <div class="w-16 h-16 bg-ght-surface rounded-full flex items-center justify-center mx-auto border border-ght-border text-ght-muted">
          <iconify-icon icon="solar:magnifer-linear" class="text-3xl text-ght-muted/60"></iconify-icon>
        </div>
        <div>
          <h3 class="font-bold text-lg text-ght-dark mb-1">No products found</h3>
          <p class="text-xs text-ght-muted max-w-sm mx-auto leading-relaxed">
            We couldn't find any products matching "<strong class="text-ght-dark">${searchTerm}</strong>". Try searching for rice, beans, oil, or garri.
          </p>
        </div>
        <div class="pt-2">
          <button id="ght-btn-reset-search" class="bg-ght-surface border border-ght-border text-ght-dark hover:bg-slate-200 px-5 py-2 rounded-xl text-xs font-bold transition-all">
            Clear Search
          </button>
        </div>
      </div>
    `;

    document.getElementById('ght-btn-reset-search')?.addEventListener('click', () => {
      const searchInput = document.getElementById('ght-product-search');
      if (searchInput) searchInput.value = '';
      renderProducts(productsData.slice(0, 8));
    });
    return;
  }

  grid.innerHTML = data.map((prod, i) => `
    <div class="bg-white border border-ght-border flex flex-col h-full cursor-pointer hover:shadow-md hover:border-ght-accent/50 transition-all group rounded-[20px] overflow-hidden relative" data-id="${prod.id}" style="animation-delay: ${i * 50}ms">
      <!-- Full Bleed Image Top -->
      <div class="aspect-[4/3] w-full relative overflow-hidden bg-ght-surface">
        <img src="${prod.image || 'assets/img/rices (1).jpg'}" alt="${prod.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null;this.src='assets/img/rices (1).jpg';">
        <div class="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded shadow-sm">
          <span class="text-[9px] font-bold text-ght-primary uppercase tracking-widest">${prod.category}</span>
        </div>
        <button class="ght-wishlist-btn absolute top-2 right-2 shadow-sm" aria-label="Add to wishlist" data-id="${prod.id}">
          <iconify-icon icon="solar:heart-bold" class="text-sm"></iconify-icon>
        </button>
      </div>
      
      <!-- Card Content -->
      <div class="flex-1 flex flex-col p-4">
        <h3 class="font-bold text-sm text-ght-dark line-clamp-2 leading-tight group-hover:text-ght-accent transition-colors">${prod.name}</h3>
        <p class="text-[10px] text-ght-muted mt-1 font-medium">${prod.unit}</p>
        
        <div class="mt-4 flex items-end justify-between">
          <div class="flex flex-col">
            <span class="text-base font-bold text-ght-dark tracking-tight leading-none">${window.FoodLiftCatalog.money(prod.price_per_unit)}</span>
            <div class="flex items-center gap-1 mt-1">
              <iconify-icon icon="solar:star-bold" class="text-[10px] text-yellow-500"></iconify-icon>
              <span class="text-[9px] font-bold text-ght-muted">${prod.rating} (128)</span>
            </div>
          </div>
          <button class="bg-ght-accent text-white hover:bg-orange-600 rounded-lg flex items-center justify-center px-3 py-2 text-[11px] font-bold transition-colors shadow-sm add-btn shrink-0">
            Add
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Attach click listeners to cards and inner buttons
  grid.querySelectorAll('[data-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      const wishlistBtn = e.target.closest('.ght-wishlist-btn');
      if (wishlistBtn) {
        e.stopPropagation();
        if (isGuest()) {
          triggerAuthGateModal("Save to Favorites", "Sign in or create an account to save products to your custom wholesale restock list.");
        } else {
          wishlistBtn.classList.toggle('is-active');
          const isActive = wishlistBtn.classList.contains('is-active');
          showToast(isActive ? "Saved to your favorites!" : "Removed from favorites.", "success");
        }
        return;
      }

      if (e.target.closest('.add-btn')) {
        e.stopPropagation();
        if (isGuest()) {
          triggerAuthGateModal("Add to Cart", "Create an account or log in to build your cart and fund your wallet for 1-click checkout.");
        } else {
          const id = parseInt(card.getAttribute('data-id'));
          const product = productsData.find(item => item.id === id);
          if (product) window.FoodLiftCart.add(product);
          showToast("Added to cart.", "success");
        }
        return;
      }

      const id = parseInt(card.getAttribute('data-id'));
      openProductModal(id);
    });
  });
}

function renderHomeCategories() {
  const list = document.getElementById('ght-category-list');
  if (!list) return;

  const categories = window.FoodLiftCatalog.getCategories(productsData).slice(0, 3);
  list.innerHTML = categories.map(category => `
    <a href="${window.FoodLiftCatalog.categoryUrl(category.name)}" class="relative overflow-hidden bg-white border border-ght-border rounded-2xl p-5 group hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div class="flex items-center justify-between mb-4">
        <div class="w-12 h-12 bg-ght-surface rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-ght-border group-hover:scale-105 transition-transform">
          <img src="${category.image}" alt="${category.name}" class="w-full h-full object-cover" onerror="window.FoodLiftCatalog.safeImage(event)">
        </div>
        <span class="text-[10px] font-bold text-green-700 bg-green-100/60 px-2.5 py-1 rounded-full uppercase tracking-wider">${category.products.length} items</span>
      </div>
      <h3 class="font-bold text-ght-dark text-base group-hover:text-green-700 transition-colors">${category.name}</h3>
      <p class="text-xs text-ght-muted mt-1">${category.products.slice(0, 3).map(product => product.name.split(' ')[0]).join(', ')}</p>
    </a>
  `).join('');
}

function setupSearch() {
  const input = document.getElementById('ght-product-search');
  
  if (input) {
    input.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderProducts(productsData.slice(0, 8));
        return;
      }
      const filtered = productsData.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
      renderProducts(filtered);
    });
  }
}

function setupQuickFilters() {
  const filterChips = document.querySelectorAll('.ght-filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => {
        c.className = "ght-filter-chip px-4 py-2 rounded-full border border-ght-border bg-white text-ght-muted font-bold text-xs hover:text-ght-dark flex items-center gap-1.5";
      });
      chip.className = "ght-filter-chip px-4 py-2 rounded-full border border-ght-primary bg-green-50 text-ght-primary font-bold text-xs flex items-center gap-1.5";
      
      const filterText = chip.textContent.trim().toLowerCase();
      if (filterText.includes('recommended')) {
        renderProducts(productsData.slice(0, 8));
      } else if (filterText.includes('best sellers')) {
        renderProducts([...productsData].sort((a, b) => b.rating - a.rating).slice(0, 8));
      } else if (filterText.includes('new arrivals')) {
        renderProducts([...productsData].reverse().slice(0, 8));
      } else if (filterText.includes('offers')) {
        renderProducts(productsData.filter(p => p.wholesale_tiers && p.wholesale_tiers.length > 0).slice(0, 8));
      }
    });
  });
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
  document.getElementById('ght-pm-price').textContent = `â‚¦${currentProduct.price_per_unit.toLocaleString()}`;
  document.getElementById('ght-pm-unit').textContent = `/ ${currentProduct.unit}`;
  const detailsLink = document.getElementById('ght-pm-view-details');
  if (detailsLink) detailsLink.href = window.FoodLiftCatalog.productUrl(currentProduct);
  
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
  document.getElementById('ght-pm-est-total').textContent = `â‚¦${total.toLocaleString()}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ght-pm-add-to-cart')?.addEventListener('click', () => {
    if (isGuest()) {
      closeModal('product-modal');
      triggerAuthGateModal("Add to Cart", "Sign in or create an account to add items to your cart, fund your wallet, and lock in wholesale pricing.");
      return;
    }

    window.FoodLiftCart.add(currentProduct, {
      qty: currentMode === 'whole' ? currentQty : 1,
      unitLabel: currentMode === 'whole' ? currentProduct.unit : document.getElementById('ght-partial-unit-name')?.textContent || currentProduct.unit,
      unitPrice: currentMode === 'whole' ? getCurrentWholeUnitPrice() : currentProduct.price_per_unit * currentPartialFactor
    });
    showToast(`Added ${currentProduct.name} to cart.`, "success");
    closeModal('product-modal');
  });
});

function getCurrentWholeUnitPrice() {
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
  return priceToUse;
}

