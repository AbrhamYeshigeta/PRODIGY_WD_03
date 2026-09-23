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
   Sample catalog — same as before
   ============================================ */
const SAMPLE_PRODUCTS = [
  { id: 'sample-1',  slug: 'organic-broccoli-500g',     name: 'Organic Broccoli 500g',              category: 'Leafy Greens',     price: 12000, compareAtPrice: 15000, ratingAvg: 4.8, ratingCount: 142, stock: 45, badge: 'best',
    merchant: 'Green Valley Farm', location: 'Bishoftu, Ethiopia',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-4',  slug: 'baby-spinach-250g',         name: 'Baby Spinach 250g',                  category: 'Leafy Greens',     price: 9500, ratingAvg: 4.9, ratingCount: 156, stock: 22, badge: 'new',
    merchant: 'Addis Greens Co-op', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-13', slug: 'romaine-lettuce',           name: 'Romaine Lettuce Head',               category: 'Leafy Greens',     price: 6500, ratingAvg: 4.6, ratingCount: 88, stock: 40,
    merchant: 'Addis Greens Co-op', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-14', slug: 'kale-bunch',                name: 'Fresh Kale Bunch',                   category: 'Leafy Greens',     price: 8000, compareAtPrice: 9500, ratingAvg: 4.7, ratingCount: 73, stock: 30, badge: 'sale',
    merchant: 'Highland Roots', location: 'Holeta, Ethiopia',
    image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=800&q=80' },

  { id: 'sample-3',  slug: 'fresh-carrots-1kg',         name: 'Farm-Fresh Carrots 1kg',             category: 'Root Vegetables',  price: 7000, ratingAvg: 4.7, ratingCount: 189, stock: 80,
    merchant: 'Highland Roots', location: 'Holeta, Ethiopia',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-7',  slug: 'red-onions-1kg',            name: 'Red Onions 1kg',                     category: 'Root Vegetables',  price: 6000, ratingAvg: 4.4, ratingCount: 112, stock: 8,
    merchant: 'Merkato Fresh', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-15', slug: 'beetroot-bunch',            name: 'Fresh Beetroot (3 pcs)',             category: 'Root Vegetables',  price: 7500, ratingAvg: 4.5, ratingCount: 64, stock: 45, badge: 'new',
    merchant: 'Highland Roots', location: 'Holeta, Ethiopia',
    image: 'https://images.unsplash.com/photo-1593105544727-e9d5eaab7768?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-16', slug: 'potatoes-2kg',              name: 'Red Potatoes 2kg',                   category: 'Root Vegetables',  price: 9000, ratingAvg: 4.6, ratingCount: 210, stock: 90,
    merchant: 'Highland Roots', location: 'Holeta, Ethiopia',
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80' },

  { id: 'sample-2',  slug: 'vine-tomatoes-1kg',         name: 'Vine-Ripened Tomatoes 1kg',          category: 'Fruit Vegetables', price: 8500, compareAtPrice: 10500, ratingAvg: 4.9, ratingCount: 218, stock: 60, badge: 'best',
    merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-6',  slug: 'cucumber-500g',             name: 'Crisp Cucumbers 500g',               category: 'Fruit Vegetables', price: 5500, ratingAvg: 4.5, ratingCount: 76, stock: 55,
    merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia',
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-10', slug: 'sweet-corn-2pcs',           name: 'Fresh Sweet Corn (2 pcs)',           category: 'Fruit Vegetables', price: 4500, ratingAvg: 4.6, ratingCount: 82, stock: 70, badge: 'new',
    merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia',
    image: 'https://images.unsplash.com/photo-1601593768799-76d2f1d0f8a9?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-11', slug: 'green-beans-500g',          name: 'Tender Green Beans 500g',            category: 'Fruit Vegetables', price: 9000, compareAtPrice: 11000, ratingAvg: 4.7, ratingCount: 128, stock: 35, badge: 'sale',
    merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia',
    image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=800&q=80' },

  { id: 'sample-5',  slug: 'bell-peppers-trio',         name: 'Bell Peppers Trio (Red, Yellow, Green)', category: 'Peppers',      price: 13500, compareAtPrice: 16000, ratingAvg: 4.6, ratingCount: 97, stock: 40, badge: 'sale',
    merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-18', slug: 'green-chili-200g',          name: 'Fresh Green Chili 200g',             category: 'Peppers',          price: 3500, ratingAvg: 4.7, ratingCount: 145, stock: 65,
    merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia',
    image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-19', slug: 'red-bell-pepper-500g',      name: 'Red Bell Peppers 500g',              category: 'Peppers',          price: 9500, ratingAvg: 4.8, ratingCount: 78, stock: 35, badge: 'new',
    merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80' },

  { id: 'sample-8',  slug: 'fresh-herbs-mix',           name: 'Fresh Herbs Mix (Rosemary, Thyme, Basil)', category: 'Herbs',      price: 10500, ratingAvg: 4.8, ratingCount: 64, stock: 30, badge: 'new',
    merchant: 'Herb Garden Co-op', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-20', slug: 'fresh-cilantro',            name: 'Fresh Cilantro Bunch',               category: 'Herbs',            price: 4500, ratingAvg: 4.6, ratingCount: 92, stock: 50,
    merchant: 'Herb Garden Co-op', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-21', slug: 'mint-bunch',                name: 'Fresh Mint Bunch',                   category: 'Herbs',            price: 4000, compareAtPrice: 5000, ratingAvg: 4.7, ratingCount: 47, stock: 45, badge: 'sale',
    merchant: 'Herb Garden Co-op', location: 'Addis Ababa',
    image: 'https://images.unsplash.com/photo-1628557084295-ca76bc8322f9?auto=format&fit=crop&w=800&q=80' },

  { id: 'sample-9',  slug: 'avocado-pack-4',            name: 'Organic Hass Avocados (Pack of 4)',  category: 'Fruits',           price: 18500, compareAtPrice: 22000, ratingAvg: 4.9, ratingCount: 340, stock: 25, badge: 'best',
    merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia',
    image: 'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-22', slug: 'banana-bunch',              name: 'Sweet Banana Bunch',                 category: 'Fruits',           price: 6000, ratingAvg: 4.8, ratingCount: 256, stock: 80,
    merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia',
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-23', slug: 'mango-pack-3',              name: 'Ripe Mangoes (Pack of 3)',           category: 'Fruits',           price: 12500, ratingAvg: 4.9, ratingCount: 178, stock: 40, badge: 'new',
    merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia',
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-24', slug: 'red-apples-1kg',            name: 'Red Apples 1kg',                     category: 'Fruits',           price: 15000, ratingAvg: 4.7, ratingCount: 143, stock: 55,
    merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia',
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80' },
  { id: 'sample-25', slug: 'orange-pack-6',             name: 'Sweet Oranges (Pack of 6)',          category: 'Fruits',           price: 9000, compareAtPrice: 11000, ratingAvg: 4.6, ratingCount: 118, stock: 60, badge: 'sale',
    merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia',
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80' },
];

/* ============================================
   Slug ↔ Category mapping
   ============================================ */
const SLUG_TO_CATEGORY = {
  'leafy-greens':     'Leafy Greens',
  'root-vegetables':  'Root Vegetables',
  'fruit-vegetables': 'Fruit Vegetables',
  'peppers':          'Peppers',
  'herbs':            'Herbs',
  'fruits':           'Fruits',
};

/* ============================================
   State
   ============================================ */
let allProducts = [];
const state = {
  search: '',
  category: '',
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
    <div class="product-card" data-id="${p.id}" data-slug="${p.slug}" style="cursor:pointer;">
      <div class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
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
    </div>
  `;
}

/* ============================================
   Filter + sort pipeline
   ============================================ */
function getFilteredProducts() {
  let list = allProducts.filter((p) => {
    if (state.search) {
      const q = state.search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)) return false;
    }
    if (state.category && p.category !== state.category) return false;
    if (state.priceMin !== null && p.price < state.priceMin * 100) return false;
    if (state.priceMax !== null && p.price > state.priceMax * 100) return false;
    if (state.inStockOnly && (p.stock ?? 0) === 0) return false;
    if (state.onSaleOnly && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
    return true;
  });

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
  const titleEl = document.getElementById('section-title');

  const visible = getFilteredProducts();
  const total = allProducts.length;

  if (titleEl) titleEl.textContent = state.category || 'All Products';

  if (visible.length === 0) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    emptyState?.classList.remove('hidden');
  } else {
    grid.style.display = '';
    emptyState?.classList.add('hidden');
    grid.innerHTML = visible.map(renderProductCard).join('');
    wireProductInteractions();
  }

  if (countEl) {
    countEl.textContent = visible.length === total
      ? `${total} product${total === 1 ? '' : 's'}`
      : `Showing ${visible.length} of ${total}`;
  }
}

/* ============================================
   Wire card click → modal, and + button → quick add
   ============================================ */
function wireProductInteractions() {
  document.querySelectorAll('#product-grid .product-card').forEach((card) => {
    // Click card → open modal
    card.addEventListener('click', (e) => {
      // If user clicked the + button, don't open modal
      if (e.target.closest('.product-add')) return;
      const slug = card.dataset.slug;
      const product = allProducts.find((p) => p.slug === slug);
      if (product) openProductModal(product);
    });
  });

  // + button → quick add 1 kg to cart
  document.querySelectorAll('#product-grid [data-add]').forEach((btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.add;
      try {
        await API.post('/api/cart/items', { productId: id, quantity: 1 });
        const countEl = document.getElementById('cart-count');
        countEl.textContent = (parseFloat(countEl.textContent) || 0) + 1;
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
        showToast('Added 1 kg to cart', 'success');
      } catch {
        showToast('Cart API coming in the next block', 'error');
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
  applyCategoryFromURL();
  renderProducts();
}

/* ============================================
   Category chips
   ============================================ */
document.querySelectorAll('#category-chips .chip').forEach((chip) => {
  chip.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('#category-chips .chip').forEach((c) => {
      c.classList.remove('active');
      c.blur();
    });
    chip.classList.add('active');
    state.category = chip.dataset.category || '';
    updateFilterBadge();
    renderProducts();
  });
});

/* ============================================
   URL ?category= handling
   ============================================ */
function applyCategoryFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('category');
  if (!slug) return;
  const categoryName = SLUG_TO_CATEGORY[slug];
  if (!categoryName) return;

  state.category = categoryName;
  document.querySelectorAll('#category-chips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.category === categoryName);
  });
  updateFilterBadge();
}

/* ============================================
   Search
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
   Filters panel
   ============================================ */
const filterPanel  = document.getElementById('filters-panel');
const filterToggle = document.getElementById('filter-toggle');
const filterBadge  = document.getElementById('filter-badge');

filterToggle?.addEventListener('click', () => {
  filterPanel?.classList.toggle('hidden');
  filterToggle.classList.toggle('active');
});

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

function updateFilterBadge() {
  let n = 0;
  if (state.category) n++;
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
   Sort
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
   Toast
   ============================================ */
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ==========================================================
   QUICK-VIEW PRODUCT MODAL
   ========================================================== */
const modal = {
  backdrop:    document.getElementById('product-modal-backdrop'),
  el:          document.getElementById('product-modal'),
  closeBtn:    document.getElementById('product-modal-close'),
  img:         document.getElementById('pm-image'),
  category:    document.getElementById('pm-category'),
  title:       document.getElementById('pm-title'),
  stars:       document.getElementById('pm-stars'),
  ratingText:  document.getElementById('pm-rating-text'),
  merchant:    document.getElementById('pm-merchant'),
  location:    document.getElementById('pm-location'),
  price:       document.getElementById('pm-price'),
  compare:     document.getElementById('pm-compare'),
  badges:      document.getElementById('pm-badges'),
  input:       document.getElementById('pm-input'),
  minus:       document.getElementById('pm-minus'),
  plus:        document.getElementById('pm-plus'),
  total:       document.getElementById('pm-total'),
  addBtn:      document.getElementById('pm-add-to-cart'),
  presets:     document.querySelectorAll('#product-modal .qty-preset'),
};

let currentProduct = null;
let currentQty = 1;

function openProductModal(product) {
  currentProduct = product;
  currentQty = 1;

  // Populate
  modal.img.src = product.image;
  modal.category.textContent = product.category;
  modal.title.textContent = product.name;
  modal.stars.textContent = starBar(product.ratingAvg || 5);
  modal.ratingText.textContent = `${(product.ratingAvg || 5).toFixed(1)} · ${product.ratingCount || 0} reviews`;
  modal.merchant.textContent = product.merchant || 'Prodigy Farms';
  modal.location.textContent = '📍 ' + (product.location || 'Addis Ababa');
  modal.price.textContent = formatPrice(product.price);

  if (product.compareAtPrice && product.compareAtPrice > product.price) {
    modal.compare.textContent = formatPrice(product.compareAtPrice);
    modal.compare.style.display = '';
  } else {
    modal.compare.style.display = 'none';
  }

  // Badges
  const badges = [];
  if (product.badge === 'best') badges.push('<span class="product-badge badge-best">Best Seller</span>');
  if (product.badge === 'new')  badges.push('<span class="product-badge badge-new">New</span>');
  if (product.badge === 'sale') badges.push('<span class="product-badge badge-sale">Sale</span>');
  const d = discountPercent(product.price, product.compareAtPrice);
  if (d) badges.push(`<span class="product-badge discount">-${d}%</span>`);
  modal.badges.innerHTML = badges.join('');

  // Reset quantity to 1
  modal.input.value = '1';
  modal.presets.forEach((b) => b.classList.toggle('active', parseFloat(b.dataset.qty) === 1));
  updateModalTotal();

  // Show
  modal.backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  modal.backdrop.classList.add('hidden');
  document.body.style.overflow = '';
  currentProduct = null;
}

function updateModalTotal() {
  if (!currentProduct) return;
  const total = Math.round(currentProduct.price * currentQty);
  modal.total.textContent = formatPrice(total);
  modal.minus.disabled = currentQty <= 0.5;
  modal.input.value = currentQty.toFixed(1).replace(/\.0$/, '');
  modal.presets.forEach((b) => b.classList.toggle('active', parseFloat(b.dataset.qty) === currentQty));
}

// Close events
modal.closeBtn?.addEventListener('click', closeProductModal);

modal.backdrop?.addEventListener('click', (e) => {
  if (e.target === modal.backdrop) closeProductModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.backdrop.classList.contains('hidden')) {
    closeProductModal();
  }
});

// Quantity controls
modal.minus?.addEventListener('click', () => {
  if (currentQty > 0.5) {
    currentQty = Math.round((currentQty - 0.5) * 10) / 10;
    updateModalTotal();
  }
});

modal.plus?.addEventListener('click', () => {
  currentQty = Math.round((currentQty + 0.5) * 10) / 10;
  updateModalTotal();
});

modal.input?.addEventListener('input', (e) => {
  let v = parseFloat(e.target.value);
  if (isNaN(v)) return;
  v = Math.max(0.5, Math.min(99, Math.round(v * 2) / 2));
  currentQty = v;
  updateModalTotal();
});

modal.input?.addEventListener('blur', () => {
  modal.input.value = currentQty.toFixed(1).replace(/\.0$/, '');
});

modal.presets.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentQty = parseFloat(btn.dataset.qty);
    updateModalTotal();
  });
});

// Add to cart from modal
modal.addBtn?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Adding…</span>';

  try {
    await API.post('/api/cart/items', {
      productId: currentProduct.id,
      quantity: currentQty,
    });
    const countEl = document.getElementById('cart-count');
    countEl.textContent = (parseFloat(countEl.textContent) || 0) + currentQty;
    showToast(`Added ${currentQty} kg × ${formatPrice(currentProduct.price)} = ${formatPrice(currentProduct.price * currentQty)}`, 'success');
    closeProductModal();
  } catch {
    showToast(`Cart ready to receive ${currentQty} kg — API coming in Block 2`, 'success');
    closeProductModal();
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

/* ============================================
   Boot
   ============================================ */
loadProducts();