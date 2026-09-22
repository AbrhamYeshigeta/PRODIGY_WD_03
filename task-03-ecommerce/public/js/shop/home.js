import { API } from '../api.js';

/* ============================================
   Session chip
   ============================================ */
(async function checkSession() {
  try {
    const { user } = await API.get('/api/auth/me');
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0];
    document.getElementById('user-menu').onclick = () => {
      window.location.href = user.role === 'admin' || user.role === 'staff'
        ? '/admin/index.html'
        : '/orders.html';
    };
  } catch {
    document.getElementById('user-menu').onclick = () => {
      window.location.href = '/login.html';
    };
  }
})();

/* ============================================
   Cart count
   ============================================ */
(async function loadCartCount() {
  try {
    const { data } = await API.get('/api/cart');
    const count = (data.items || []).reduce((s, i) => s + i.quantity, 0);
    document.getElementById('cart-count').textContent = count;
  } catch {
    document.getElementById('cart-count').textContent = '0';
  }
})();

/* ============================================
   Sample fallback catalog
   ============================================ */
const SAMPLE_PRODUCTS = [
  { id: 'sample-1',  slug: 'organic-broccoli-500g',     name: 'Organic Broccoli 500g',              category: 'Leafy Greens',    price: 12000, compareAtPrice: 15000, ratingAvg: 4.8, ratingCount: 142, stock: 45, badge: 'best', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-2',  slug: 'vine-tomatoes-1kg',         name: 'Vine-Ripened Tomatoes 1kg',          category: 'Tomatoes',        price: 8500,  compareAtPrice: 10500, ratingAvg: 4.9, ratingCount: 218, stock: 60, badge: 'best', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-3',  slug: 'fresh-carrots-1kg',         name: 'Farm-Fresh Carrots 1kg',             category: 'Root Vegetables', price: 7000,  ratingAvg: 4.7, ratingCount: 189, stock: 80, image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-4',  slug: 'baby-spinach-250g',         name: 'Baby Spinach 250g',                  category: 'Leafy Greens',    price: 9500,  ratingAvg: 4.9, ratingCount: 156, stock: 22, badge: 'new', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-5',  slug: 'bell-peppers-trio',         name: 'Bell Peppers Trio (Red, Yellow, Green)', category: 'Peppers',      price: 13500, compareAtPrice: 16000, ratingAvg: 4.6, ratingCount: 97,  stock: 40, badge: 'sale', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-6',  slug: 'cucumber-500g',             name: 'Crisp Cucumbers 500g',               category: 'Salad Vegetables', price: 5500, ratingAvg: 4.5, ratingCount: 76,  stock: 55, image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-7',  slug: 'red-onions-1kg',            name: 'Red Onions 1kg',                     category: 'Root Vegetables', price: 6000,  ratingAvg: 4.4, ratingCount: 112, stock: 8,  image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-8',  slug: 'fresh-herbs-mix',           name: 'Fresh Herbs Mix (Rosemary, Thyme, Basil)', category: 'Herbs',     price: 10500, ratingAvg: 4.8, ratingCount: 64,  stock: 30, badge: 'new', image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-9',  slug: 'avocado-pack-4',            name: 'Organic Hass Avocados (Pack of 4)',  category: 'Fruits',          price: 18500, compareAtPrice: 22000, ratingAvg: 4.9, ratingCount: 340, stock: 25, badge: 'best', image: 'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-10', slug: 'sweet-corn-2pcs',           name: 'Fresh Sweet Corn (2 pcs)',           category: 'Corn',            price: 4500,  ratingAvg: 4.6, ratingCount: 82,  stock: 70, badge: 'new', image: 'https://images.unsplash.com/photo-1601593768799-76d2f1d0f8a9?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-11', slug: 'green-beans-500g',          name: 'Tender Green Beans 500g',            category: 'Beans',           price: 9000,  compareAtPrice: 11000, ratingAvg: 4.7, ratingCount: 128, stock: 35, badge: 'sale', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=500&q=70' },
  { id: 'sample-12', slug: 'portobello-mushrooms-300g', name: 'Portobello Mushrooms 300g',          category: 'Mushrooms',       price: 14000, ratingAvg: 4.8, ratingCount: 91,  stock: 18, image: 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=500&q=70' },
];

/* ============================================
   State
   ============================================ */
let allProducts = [];
const state = {
  search: '',
  category: '',         // single category now (from chips)
  priceMin: null,
  priceMax: null,
  inStockOnly: false,
  onSaleOnly: false,
  sort: 'popular',
};

/* ============================================
   Format helpers
   ============================================ */
function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ETB';
}

function starBar(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty);
}

function stockInfo(stock) {
  if (stock === 0) return { class: 'out', label: 'Out of stock' };
  if (stock <= 10) return { class: 'low', label: `Only ${stock} left` };
  return { class: 'in', label: 'In stock' };
}

function badgeInfo(badge) {
  switch (badge) {
    case 'best': return { class: 'badge-best', text: 'Best Seller' };
    case 'sale': return { class: 'badge-sale', text: 'Sale' };
    case 'new':  return { class: 'badge-new',  text: 'New' };
    default: return null;
  }
}

function discountPercent(price, compare) {
  if (!compare || compare <= price) return null;
  return Math.round(((compare - price) / compare) * 100);
}

/* ============================================
   Card markup
   ============================================ */
function renderProductCard(p) {
  const badge = badgeInfo(p.badge);
  const stock = stockInfo(p.stock ?? 0);
  const discount = discountPercent(p.price, p.compareAtPrice);

  const badgesHTML = (badge || discount) ? `
    <div class="product-badges">
      ${badge ? `<span class="product-badge ${badge.class}">${badge.text}</span>` : ''}
      ${discount ? `<span class="product-badge discount">-${discount}%</span>` : ''}
    </div>` : '';

  const ratingHTML = p.ratingAvg ? `
    <div class="product-rating">
      <span class="stars">${starBar(p.ratingAvg)}</span>
      <span>${p.ratingAvg.toFixed(1)} (${p.ratingCount || 0})</span>
    </div>` : '';

  const compareHTML = p.compareAtPrice
    ? `<span class="product-compare">${formatPrice(p.compareAtPrice)}</span>`
    : '';

  return `
    <a href="/product.html?slug=${encodeURIComponent(p.slug)}" class="product-card">
      <div class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none'" />
        ${badgesHTML}
      </div>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        ${ratingHTML}
        <span class="product-stock ${stock.class}">${stock.label}</span>
        <div class="product-price-row">
          <div class="product-prices">
            <span class="product-price">${formatPrice(p.price)}</span>
            ${compareHTML}
          </div>
          <button class="product-add" data-add="${p.id}" type="button" aria-label="Add to cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </a>
  `;
}

/* ============================================
   Filter + sort pipeline
   ============================================ */
function getFilteredProducts() {
  let list = allProducts.filter((p) => {
    // Search
    if (state.search) {
      const q = state.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)) return false;
    }

    // Category (single)
    if (state.category && p.category !== state.category) return false;

    // Price (inputs are in ETB, products stored in cents)
    if (state.priceMin !== null && p.price < state.priceMin * 100) return false;
    if (state.priceMax !== null && p.price > state.priceMax * 100) return false;

    // Stock
    if (state.inStockOnly && (p.stock ?? 0) === 0) return false;

    // On sale
    if (state.onSaleOnly && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;

    return true;
  });

  // Sort
  switch (state.sort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating':     list.sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0)); break;
    case 'newest':     list.sort((a, b) => (b.badge === 'new') - (a.badge === 'new')); break;
    default:           list.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-results');
  const countEl = document.getElementById('result-count');

  const visible = getFilteredProducts();
  const total = allProducts.length;

  if (visible.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    emptyState?.classList.remove('hidden');
  } else {
    grid.style.display = '';
    emptyState?.classList.add('hidden');
    grid.innerHTML = visible.map(renderProductCard).join('');
    wireAddToCartButtons();
  }

  if (countEl) {
    countEl.textContent = visible.length === total
      ? `${total} product${total === 1 ? '' : 's'}`
      : `Showing ${visible.length} of ${total}`;
  }
}

/* ============================================
   Add-to-cart wiring
   ============================================ */
function wireAddToCartButtons() {
  document.querySelectorAll('#product-grid [data-add]').forEach((btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await API.post('/api/cart/items', { productId: btn.dataset.add, quantity: 1 });
        const countEl = document.getElementById('cart-count');
        countEl.textContent = (parseInt(countEl.textContent, 10) || 0) + 1;
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
      } catch {
        alert('Cart API not available yet — coming in the next block.');
      }
    });
  });
}

/* ============================================
   Boot
   ============================================ */
async function loadProducts() {
  try {
    const res = await API.get('/api/products?limit=48');
    if (!res.data || res.data.length === 0) throw new Error('empty');
    allProducts = res.data;
  } catch {
    allProducts = SAMPLE_PRODUCTS;
  }
  renderProducts();
}

/* ============================================
   Category chips — single-select
   ============================================ */
document.querySelectorAll('#category-chips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#category-chips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.category = chip.dataset.category || '';
    renderProducts();
  });
});

/* ============================================
   Search (debounced)
   ============================================ */
let searchTimer;
document.getElementById('product-search')?.addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value.trim();
    renderProducts();
  }, 200);
});

/* ============================================
   Filters panel toggle
   ============================================ */
const filterPanel  = document.getElementById('filters-panel');
const filterToggle = document.getElementById('filter-toggle');
const filterBadge  = document.getElementById('filter-badge');

filterToggle?.addEventListener('click', () => {
  filterPanel?.classList.toggle('hidden');
  filterToggle.classList.toggle('active');
});

/* ============================================
   Availability filters
   ============================================ */
document.getElementById('filter-instock')?.addEventListener('change', (e) => {
  state.inStockOnly = e.target.checked;
  updateFilterBadge();
  renderProducts();
});

document.getElementById('filter-onsale')?.addEventListener('change', (e) => {
  state.onSaleOnly = e.target.checked;
  updateFilterBadge();
  renderProducts();
});

/* ============================================
   Price range inputs
   ============================================ */
document.getElementById('price-min')?.addEventListener('input', (e) => {
  state.priceMin = e.target.value ? parseFloat(e.target.value) : null;
  document.querySelectorAll('.price-preset').forEach((b) => b.classList.remove('active'));
  updateFilterBadge();
  renderProducts();
});

document.getElementById('price-max')?.addEventListener('input', (e) => {
  state.priceMax = e.target.value ? parseFloat(e.target.value) : null;
  document.querySelectorAll('.price-preset').forEach((b) => b.classList.remove('active'));
  updateFilterBadge();
  renderProducts();
});

/* ============================================
   Price presets
   ============================================ */
document.querySelectorAll('.price-preset').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.price-preset').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    state.priceMin = btn.dataset.min ? parseFloat(btn.dataset.min) : null;
    state.priceMax = btn.dataset.max ? parseFloat(btn.dataset.max) : null;

    document.getElementById('price-min').value = state.priceMin ?? '';
    document.getElementById('price-max').value = state.priceMax ?? '';

    updateFilterBadge();
    renderProducts();
  });
});

/* ============================================
   Filter badge
   ============================================ */
function updateFilterBadge() {
  let n = 0;
  if (state.category) n++;   // include chip in the count
  if (state.priceMin !== null || state.priceMax !== null) n++;
  if (state.inStockOnly) n++;
  if (state.onSaleOnly) n++;

  if (!filterBadge) return;
  if (n > 0) {
    filterBadge.textContent = n;
    filterBadge.classList.remove('hidden');
  } else {
    filterBadge.classList.add('hidden');
  }
}

/* ============================================
   Clear all
   ============================================ */
function clearAllFilters() {
  state.search = '';
  state.category = '';
  state.priceMin = null;
  state.priceMax = null;
  state.inStockOnly = false;
  state.onSaleOnly = false;
  state.sort = 'popular';

  const searchInput = document.getElementById('product-search');
  if (searchInput) searchInput.value = '';

  document.querySelectorAll('#category-chips .chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.category === '');
  });

  const pMin = document.getElementById('price-min');
  const pMax = document.getElementById('price-max');
  if (pMin) pMin.value = '';
  if (pMax) pMax.value = '';

  document.querySelectorAll('.price-preset').forEach((b) => b.classList.remove('active'));

  const cbIn = document.getElementById('filter-instock');
  const cbSale = document.getElementById('filter-onsale');
  if (cbIn) cbIn.checked = false;
  if (cbSale) cbSale.checked = false;

  const label = document.getElementById('sort-label');
  if (label) label.textContent = 'Popular';
  document.querySelectorAll('#sort-menu button').forEach((b) => {
    b.classList.toggle('active', b.dataset.sort === 'popular');
  });

  updateFilterBadge();
  renderProducts();
}

document.getElementById('filter-clear')?.addEventListener('click', clearAllFilters);
document.getElementById('empty-reset')?.addEventListener('click', clearAllFilters);

/* ============================================
   Sort dropdown
   ============================================ */
const sortMenu   = document.getElementById('sort-menu');
const sortToggle = document.getElementById('sort-toggle');
const sortLabel  = document.getElementById('sort-label');

const SORT_LABELS = {
  popular:      'Popular',
  'price-asc':  'Price: Low to High',
  'price-desc': 'Price: High to Low',
  newest:       'Newest',
  rating:       'Top Rated',
};

sortToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  sortMenu?.classList.toggle('hidden');
});

sortMenu?.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.sort = btn.dataset.sort;
    if (sortLabel) sortLabel.textContent = SORT_LABELS[state.sort];
    sortMenu.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    sortMenu.classList.add('hidden');
    renderProducts();
  });
});

document.addEventListener('click', (e) => {
  if (!sortMenu || !sortToggle) return;
  if (!sortMenu.contains(e.target) && !sortToggle.contains(e.target)) {
    sortMenu.classList.add('hidden');
  }
});

/* ============================================
   Newsletter + mobile
   ============================================ */
document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  alert(`Thanks! We'll send weekly harvest updates to ${input.value}`);
  input.value = '';
});

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  alert('Menu — coming soon with the mobile drawer.');
});

/* ============================================
   Boot
   ============================================ */
loadProducts();