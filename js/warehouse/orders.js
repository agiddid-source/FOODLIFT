// js/warehouse/orders.js

let allOrders = [];
let currentFilter = "Pending Verification";
let searchQuery = ""; 

// We define the scanner variable globally so we can start/stop it from anywhere
let html5QrCode = null; 

export async function initOrders() {
  const root = document.getElementById("ezz-ordersModule");
  if (!root) return;

  try {
    const response = await fetch("data/orders.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    allOrders = await response.json();
  } catch (error) {
    console.error("Failed to load orders data:", error);
    document.getElementById("ezz-ordersListContainer").innerHTML = `
      <div class="col-span-full p-6 text-center text-red-500 font-medium border border-red-200 rounded-2xl">
        ⚠️ Unable to load orders data. Order Inventory.
      </div>
    `;
    return;
  }

  wireTabs();
  wireSearch();
  wireModals();
  renderOrders();
}

// ------------------------------------------------------------------
// SEARCH & TABS LOGIC
// ------------------------------------------------------------------
function wireSearch() {
  const searchInput = document.getElementById("ezz-orderSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderOrders(); 
  });
}

function wireTabs() {
  const tabs = document.querySelectorAll(".ezz-order-filter-btn");
  
  tabs.forEach(tab => {
    tab.addEventListener("click", (e) => {
      tabs.forEach(t => {
        t.classList.remove("text-[#F7931E]", "border-[#F7931E]", "font-bold");
        t.classList.add("text-[rgba(0,0,0,0.45)]", "border-transparent", "font-medium");
      });

      const clickedTab = e.currentTarget;
      clickedTab.classList.remove("text-[rgba(0,0,0,0.45)]", "border-transparent", "font-medium");
      clickedTab.classList.add("text-[#F7931E]", "border-[#F7931E]", "font-bold");

      currentFilter = clickedTab.dataset.status;
      renderOrders();
    });
  });
}

// ------------------------------------------------------------------
// RENDER ORDER CARDS
// ------------------------------------------------------------------
function renderOrders() {
  const listContainer = document.getElementById("ezz-ordersListContainer");
  const emptyState = document.getElementById("ezz-ordersEmptyState");
  
  if (!listContainer) return;
  listContainer.innerHTML = "";

  const filteredOrders = allOrders.filter(order => {
    const matchesTab = order.status === currentFilter;
    const matchesSearch = 
      searchQuery === "" || 
      order.orderId.toLowerCase().includes(searchQuery) ||
      order.customer.name.toLowerCase().includes(searchQuery);
    
    return matchesTab && matchesSearch;
  });

  if (filteredOrders.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.classList.add("flex");
    return;
  } 
  
  emptyState.classList.add("hidden");
  emptyState.classList.remove("flex");

  filteredOrders.forEach(order => {
    let actionBtnHTML = "";
    
    if (order.status === "Pending Verification") {
      actionBtnHTML = `
        <button data-action="review" data-id="${order.orderId}" class="w-full py-2.5 bg-[#F7931E] hover:bg-[#e08216] text-white text-sm font-bold rounded-xl transition shadow-sm">
          Review & Confirm Availability
        </button>
      `;
    } else if (order.status === "Awaiting Rider Pick-up") {
      actionBtnHTML = `
        <button data-action="handoff" data-id="${order.orderId}" class="w-full py-2.5 bg-[#8DC63F] hover:bg-[#7ab033] text-white text-sm font-bold rounded-xl transition shadow-sm">
          Process Rider Handoff
        </button>
      `;
    } else {
      actionBtnHTML = `
        <button disabled class="w-full py-2.5 bg-[#FAFAFA] text-[rgba(0,0,0,0.45)] text-sm font-bold rounded-xl border border-[rgba(0,0,0,0.08)] cursor-not-allowed">
          Completed
        </button>
      `;
    }

    const itemCountLabel = order.items.length === 1 ? "Item" : "Items";

    const card = document.createElement("div");
    card.className = "bg-white p-5 rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-sm flex flex-col gap-4 transition hover:shadow-md";
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-xs font-bold text-[rgba(0,0,0,0.45)]">${order.orderId}</span>
          <h4 class="text-lg font-bold text-[#0A0A0A] mt-1">${order.customer.name}</h4>
        </div>
        <span class="bg-[#FAFAFA] text-[#0A0A0A] border border-[rgba(0,0,0,0.08)] text-xs font-bold px-3 py-1.5 rounded-full">
          ${order.items.length} ${itemCountLabel}
        </span>
      </div>
      
      <div class="text-sm text-[rgba(0,0,0,0.45)] flex items-start gap-2">
        <svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>${order.customer.address}</span>
      </div>
      
      <div class="mt-auto pt-4 border-t border-[rgba(0,0,0,0.08)]">
        ${actionBtnHTML}
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// ------------------------------------------------------------------
// MODAL LOGIC & ACTIONS
// ------------------------------------------------------------------
function wireModals() {
  const listContainer = document.getElementById("ezz-ordersListContainer");
  const confirmModal = document.getElementById("ezz-confirm-order-modal");
  const handoffModal = document.getElementById("ezz-handoff-modal");

  listContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const orderId = btn.dataset.id;
    const order = allOrders.find(o => o.orderId === orderId);
    if (!order) return;

    if (btn.dataset.action === "review" && confirmModal) {
      openConfirmModal(order, confirmModal);
    } else if (btn.dataset.action === "handoff" && handoffModal) {
      openHandoffModal(order, handoffModal);
    }
  });

  // Action: Confirm Availability -> Moves to "Awaiting Pick-up"
  document.getElementById("ezz-btnConfirmAvailability")?.addEventListener("click", () => {
    const orderId = confirmModal.dataset.activeOrderId;
    updateOrderStatus(orderId, "Awaiting Rider Pick-up");
    if (typeof confirmModal.close === "function") confirmModal.close(); 
  });

  // Action: Manual Verify Handoff (Fallback if camera is broken)
  document.getElementById("ezz-btnVerifyHandoff")?.addEventListener("click", () => {
    const orderId = handoffModal.dataset.activeOrderId;
    const inputCode = document.getElementById("ezz-riderVerificationCode").value.trim();
    const errorMsg = document.getElementById("ezz-handoffError");
    
    if (inputCode.toUpperCase() !== orderId.toUpperCase()) {
      errorMsg.textContent = "Order ID does not match. Please check and try again.";
      errorMsg.classList.remove("hidden");
      return;
    }
    
    errorMsg.classList.add("hidden");
    updateOrderStatus(orderId, "Handed to Rider");
    stopScannerAndCloseModal(handoffModal);
  });

  // Global close button handlers (Custom logic to kill camera)
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.closeModal;
      const modal = document.getElementById(targetId);
      
      if (modal) {
        if (targetId === "ezz-handoff-modal") {
          stopScannerAndCloseModal(modal);
        } else if (typeof modal.close === "function") {
          modal.close();
        }
      }
    });
  });
}

function openConfirmModal(order, modal) {
  modal.dataset.activeOrderId = order.orderId;
  document.getElementById("ezz-confirmOrderId").textContent = order.orderId;

  const itemsContainer = document.getElementById("ezz-confirmOrderItems");
  itemsContainer.innerHTML = order.items.map(item => `
    <div class="flex justify-between items-center py-2 border-b border-[rgba(0,0,0,0.08)] last:border-0">
      <div class="flex flex-col">
        <span class="text-sm font-bold text-[#0A0A0A]">${item.name}</span>
        <span class="text-xs text-[rgba(0,0,0,0.45)]">SKU: ${item.sku}</span>
      </div>
      <span class="text-sm font-bold text-[#0A0A0A] px-3 py-1 bg-white rounded-lg border border-[rgba(0,0,0,0.08)]">
        Qty: ${item.quantity} ${item.unit ? item.unit : ''}
      </span>
    </div>
  `).join('');

  if (typeof modal.showModal === "function") modal.showModal();
}

// ------------------------------------------------------------------
// SCANNER LOGIC
// ------------------------------------------------------------------
function openHandoffModal(order, modal) {
  modal.dataset.activeOrderId = order.orderId;

  document.getElementById("ezz-riderVerificationCode").value = ""; 
  document.getElementById("ezz-handoffError").classList.add("hidden"); 

  if (typeof modal.showModal === "function") modal.showModal();

  // 1. Initialize Scanner if it doesn't exist yet
  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("ezz-qr-reader");
  }

  // 2. Define what happens when a QR code is read
  const onScanSuccess = (decodedText) => {
    if (decodedText.toUpperCase() === order.orderId.toUpperCase()) {
      // It's a match! Close modal and update order
      updateOrderStatus(order.orderId, "Handed to Rider");
      stopScannerAndCloseModal(modal);
    } else {
      // Wrong QR code scanned
      const errorMsg = document.getElementById("ezz-handoffError");
      errorMsg.textContent = `Scanned ID (${decodedText}) does not match this order.`;
      errorMsg.classList.remove("hidden");
    }
  };

  // 3. Start the Camera
  html5QrCode.start(
    { facingMode: "environment" }, // Forces rear camera
    { fps: 10, qrbox: { width: 250, height: 250 } }, // Scanner settings
    onScanSuccess,
    (errorMessage) => {
      // Ignored: This triggers every frame it doesn't see a QR code
    }
  ).catch(err => {
    console.error("Camera access failed", err);
    document.getElementById("ezz-qr-reader").innerHTML = `
      <p class="text-xs text-red-500 p-4 text-center">Camera not available. Please enter the Order ID manually below.</p>
    `;
  });
}

// Safe shutdown for the camera
function stopScannerAndCloseModal(modal) {
  if (html5QrCode && html5QrCode.isScanning) {
    html5QrCode.stop().then(() => {
      if (typeof modal.close === "function") modal.close();
    }).catch(err => {
      console.error("Failed to stop scanner", err);
      if (typeof modal.close === "function") modal.close();
    });
  } else {
    if (typeof modal.close === "function") modal.close();
  }
}

function updateOrderStatus(orderId, newStatus) {
  const order = allOrders.find(o => o.orderId === orderId);
  if (order) {
    order.status = newStatus;
    renderOrders(); 
  }
}