
window.RiderOrders = (function () {
  // TODO : Mock data — replace with a real orders feed.
  const AVAILABLE_ORDERS = [
    {
      id: "ORD-7734",
      warehouse: "FoodLift Warehouse A, Ikeja",
      warehouseLat: 6.6059,
      warehouseLng: 3.3491,
      customerName: "Mrs. Adaeze Okonkwo",
      customerAddress: "14 Allen Avenue, Ikeja, Lagos",
      customerLat: 6.6018,
      customerLng: 3.3515,
      distanceKm: 3.2,
      estEarnings: 7200,
    },
    {
      id: "ORD-7735",
      warehouse: "FoodLift Warehouse A, Ikeja",
      warehouseLat: 6.6059,
      warehouseLng: 3.3491,
      customerName: "Chidi's Kitchen",
      customerAddress: "22 Opebi Road, Ikeja, Lagos",
      customerLat: 6.5975,
      customerLng: 3.3629,
      distanceKm: 5.8,
      estEarnings: 10500,
    },
    {
      id: "ORD-7731",
      warehouse: "FoodLift Warehouse A, Ikeja",
      warehouseLat: 6.6059,
      warehouseLng: 3.3491,
      customerName: "Mr. Tunde Bakare",
      customerAddress: "7 Awolowo Road, Ikoyi, Lagos",
      customerLat: 6.4507,
      customerLng: 3.4353,
      distanceKm: 9.1,
      estEarnings: 15600,
    },
  ];

  const ACTIVE_ORDERS = [];
  const COMPLETED_ORDERS = [];

  function findIndex(list, id) {
    return list.findIndex((o) => o.id === id);
  }

  return {
    getAvailable() {
      return AVAILABLE_ORDERS.slice();
    },

    getActive() {
      return ACTIVE_ORDERS.slice();
    },

    // Moves an order from the available pool into this rider's active
    // list, tagging it with the first stage of the accepted lifecycle.
    acceptOrder(id) {
      const idx = findIndex(AVAILABLE_ORDERS, id);
      if (idx === -1) return null;
      const [order] = AVAILABLE_ORDERS.splice(idx, 1);
      order.status = "awaiting-confirmation";
      ACTIVE_ORDERS.push(order);
      return order;
    },

    // Removes an order from the available pool. In a real system other
    // riders would still see it — for this single-rider prototype it
    // just disappears from view.
    rejectOrder(id) {
      const idx = findIndex(AVAILABLE_ORDERS, id);
      if (idx === -1) return false;
      AVAILABLE_ORDERS.splice(idx, 1);
      return true;
    },

    setStatus(id, status) {
      const order = ACTIVE_ORDERS.find((o) => o.id === id);
      if (order) order.status = status;
      return order || null;
    },

    // Moves a delivered order out of the active list and into history,
    // tagged with when it was completed.
    completeOrder(id) {
      const idx = findIndex(ACTIVE_ORDERS, id);
      if (idx === -1) return false;
      const [order] = ACTIVE_ORDERS.splice(idx, 1);
      order.completedAt = new Date().toISOString();
      COMPLETED_ORDERS.unshift(order); // newest first
      return true;
    },

    getHistory() {
      return COMPLETED_ORDERS.slice();
    },
  };
})();