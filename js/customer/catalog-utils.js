window.FoodLiftCatalog = (() => {
  const fallbackImage = 'assets/img/rices (1).jpg';

  async function getProducts() {
    const response = await fetch('data/products.json');
    if (!response.ok) throw new Error('Unable to load product catalog');
    return response.json();
  }

  function money(value) {
    return `₦${Number(value || 0).toLocaleString()}`;
  }

  function byId(products, id) {
    return products.find(product => String(product.id) === String(id));
  }

  function categorySlug(category) {
    return encodeURIComponent(category || 'All');
  }

  function productUrl(product) {
    return `Product view.html?id=${encodeURIComponent(product.id)}`;
  }

  function categoryUrl(category) {
    return `ProductList.html?category=${categorySlug(category)}`;
  }

  function categoryImage(category) {
    const key = String(category || '').toLowerCase();
    if (key.includes('rice') || key.includes('grain')) return 'assets/img/categories img/rice.png';
    if (key.includes('oil')) return 'assets/img/categories img/vegetable oil.png';
    if (key.includes('garri') || key.includes('flour') || key.includes('tuber')) return 'assets/img/categories img/garri.png';
    if (key.includes('bean')) return 'assets/img/categories img/beans.png';
    if (key.includes('spag')) return 'assets/img/categories img/spahgetti.png';
    if (key.includes('tomato')) return 'assets/img/categories img/Tin tomatoes.png';
    return 'assets/img/categories img/hero.png';
  }

  function getCategories(products) {
    return Array.from(new Set(products.map(product => product.category))).map(category => ({
      name: category,
      products: products.filter(product => product.category === category),
      image: categoryImage(category)
    }));
  }

  function tierPrice(product, qty) {
    const tiers = [...(product.wholesale_tiers || [])].sort((a, b) => b.qty - a.qty);
    const tier = tiers.find(item => qty >= item.qty);
    return tier ? tier.price : product.price_per_unit;
  }

  function safeImage(event) {
    event.currentTarget.src = fallbackImage;
  }

  return {
    byId,
    categoryImage,
    categoryUrl,
    fallbackImage,
    getCategories,
    getProducts,
    money,
    productUrl,
    safeImage,
    tierPrice
  };
})();
