import { API } from '../api.js';
import { Cart } from '../cart.js';

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
  isAuthed: false,
  user: null,
};

function saveAuthRedirect(path = window.location.pathname + window.location.search) {
  sessionStorage.setItem('post_login_redirect', path || '/');
}

function goToLogin(path = window.location.pathname + window.location.search) {
  saveAuthRedirect(path);
  window.location.href = '/login.html';
}

function scrollToProducts() {
  const target = document.getElementById('product-grid') || document.getElementById('section-title');
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ============================================
   Session check + header user menu
   ============================================ */
async function initSession() {
  const userMenu = document.getElementById('user-menu');
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const dropdown = document.getElementById('user-dropdown');
  const dropdownName = document.getElementById('dropdown-name');
  const dropdownEmail = document.getElementById('dropdown-email');
  const dropdownAvatar = document.getElementById('dropdown-avatar');
  const logoutBtn = document.getElementById('logout-btn');

  try {
    const { user } = await API.get('/api/auth/me');
    state.isAuthed = true;
    state.user = user;

    // Show user info in header
    userName.textContent = user.username;
    userAvatar.textContent = user.username[0].toUpperCase();
    userMenu.classList.add('logged-in');

    // Fill dropdown
    if (dropdownName) dropdownName.textContent = user.username;
    if (dropdownEmail) dropdownEmail.textContent = user.email;
    if (dropdownAvatar) dropdownAvatar.textContent = user.username[0].toUpperCase();

    // Toggle dropdown on click
    userMenu.onclick = (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    };

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!dropdown) return;
      if (!dropdown.contains(e.target) && !userMenu.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });

    // Logout
    logoutBtn?.addEventListener('click', async () => {
      try {
        await API.post('/api/auth/logout', {});
      } catch {}
      window.location.href = '/';
    });

  } catch {
    state.isAuthed = false;

    // Not logged in: clicking the chip goes to login
    userMenu.onclick = () => {
      goToLogin(window.location.pathname + window.location.search);
    };

    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      goToLogin('/');
      return;
    }
  }
}

/* ============================================
   Login gate
   ============================================ */
function requireLogin() {
  if (state.isAuthed) return true;

  goToLogin(window.location.pathname + window.location.search);
  return false;
}

/* ============================================
   Cart badge
   ============================================ */
const cartLink = document.querySelector('.cart-btn');
cartLink?.addEventListener('click', (e) => {
  if (!state.isAuthed) {
    e.preventDefault();
    requireLogin();
  }
});
Cart.refresh();

/* ============================================
   Sample catalog
   ============================================ */
const SAMPLE_PRODUCTS = [
  /* ─────────── LEAFY GREENS ─────────── */
  { id: 'p-broccoli', slug: 'organic-broccoli', name: 'Organic Broccoli', category: 'Leafy Greens', price: 12000, compareAtPrice: 15000, ratingAvg: 4.8, ratingCount: 142, stock: 45, badge: 'best', merchant: 'Green Valley Farm', location: 'Bishoftu, Ethiopia', image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-spinach', slug: 'baby-spinach', name: 'Baby Spinach 250g', category: 'Leafy Greens', price: 9500, ratingAvg: 4.9, ratingCount: 156, stock: 22, badge: 'new', merchant: 'Addis Greens Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-lettuce', slug: 'romaine-lettuce', name: 'Romaine Lettuce Head', category: 'Leafy Greens', price: 6500, ratingAvg: 4.6, ratingCount: 88, stock: 40, merchant: 'Addis Greens Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-kale', slug: 'fresh-kale', name: 'Fresh Kale Bunch', category: 'Leafy Greens', price: 8000, compareAtPrice: 9500, ratingAvg: 4.7, ratingCount: 73, stock: 30, badge: 'sale', merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1524179091875-bf99a9a6af57?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-swiss-chard', slug: 'swiss-chard', name: 'Swiss Chard Bunch', category: 'Leafy Greens', price: 7000, ratingAvg: 4.5, ratingCount: 52, stock: 35, merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1581775382776-bd1a4b3ee6ad?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-cabbage', slug: 'green-cabbage', name: 'Green Cabbage', category: 'Leafy Greens', price: 5500, ratingAvg: 4.6, ratingCount: 96, stock: 60, merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80' },

  /* ─────────── ROOT VEGETABLES ─────────── */
  { id: 'p-carrots', slug: 'fresh-carrots', name: 'Farm-Fresh Carrots 1kg', category: 'Root Vegetables', price: 7000, ratingAvg: 4.7, ratingCount: 189, stock: 80, merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-onions', slug: 'red-onions', name: 'Red Onions 1kg', category: 'Root Vegetables', price: 6000, ratingAvg: 4.4, ratingCount: 112, stock: 8, merchant: 'Merkato Fresh', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-white-onions', slug: 'white-onions', name: 'White Onions 1kg', category: 'Root Vegetables', price: 5800, ratingAvg: 4.3, ratingCount: 84, stock: 50, merchant: 'Merkato Fresh', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-potatoes', slug: 'red-potatoes', name: 'Red Potatoes 2kg', category: 'Root Vegetables', price: 9000, ratingAvg: 4.6, ratingCount: 210, stock: 90, merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-sweet-potatoes', slug: 'sweet-potatoes', name: 'Sweet Potatoes 1kg', category: 'Root Vegetables', price: 8500, ratingAvg: 4.8, ratingCount: 132, stock: 45, badge: 'new', merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-beetroot', slug: 'beetroot', name: 'Fresh Beetroot (3 pcs)', category: 'Root Vegetables', price: 7500, ratingAvg: 4.5, ratingCount: 64, stock: 45, merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1593105544727-e9d5eaab7768?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-garlic', slug: 'fresh-garlic', name: 'Fresh Garlic 250g', category: 'Root Vegetables', price: 4500, ratingAvg: 4.7, ratingCount: 168, stock: 70, merchant: 'Merkato Fresh', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-ginger', slug: 'fresh-ginger', name: 'Fresh Ginger 250g', category: 'Root Vegetables', price: 5200, ratingAvg: 4.6, ratingCount: 91, stock: 60, merchant: 'Merkato Fresh', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-cauliflower', slug: 'cauliflower', name: 'Cauliflower Head', category: 'Root Vegetables', price: 9500, ratingAvg: 4.5, ratingCount: 58, stock: 30, merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia', image: 'https://images.unsplash.com/photo-1568584711271-6c929fb49b6c?auto=format&fit=crop&w=800&q=80' },

  /* ─────────── FRUIT VEGETABLES ─────────── */
  { id: 'p-tomatoes', slug: 'vine-tomatoes', name: 'Vine-Ripened Tomatoes 1kg', category: 'Fruit Vegetables', price: 8500, compareAtPrice: 10500, ratingAvg: 4.9, ratingCount: 218, stock: 60, badge: 'best', merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-cherry-tomatoes', slug: 'cherry-tomatoes', name: 'Cherry Tomatoes 500g', category: 'Fruit Vegetables', price: 7200, ratingAvg: 4.8, ratingCount: 143, stock: 50, badge: 'new', merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-cucumbers', slug: 'cucumbers', name: 'Crisp Cucumbers 500g', category: 'Fruit Vegetables', price: 5500, ratingAvg: 4.5, ratingCount: 76, stock: 55, merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-zucchini', slug: 'zucchini', name: 'Green Zucchini 500g', category: 'Fruit Vegetables', price: 6500, ratingAvg: 4.4, ratingCount: 62, stock: 40, merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1563252722-6434563a985d?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-eggplant', slug: 'eggplant', name: 'Purple Eggplant (2 pcs)', category: 'Fruit Vegetables', price: 7000, ratingAvg: 4.5, ratingCount: 55, stock: 40, merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia', image: 'https://images.unsplash.com/photo-1615485291234-9d694218aeb3?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-green-beans', slug: 'green-beans', name: 'Tender Green Beans 500g', category: 'Fruit Vegetables', price: 9000, compareAtPrice: 11000, ratingAvg: 4.7, ratingCount: 128, stock: 35, badge: 'sale', merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?auto=format&fit=crop&w=800&q=80' },

  /* ─────────── PEPPERS ─────────── */
  { id: 'p-bell-trio', slug: 'bell-peppers-trio', name: 'Bell Peppers Trio (Red, Yellow, Green)', category: 'Peppers', price: 13500, compareAtPrice: 16000, ratingAvg: 4.6, ratingCount: 97, stock: 40, badge: 'sale', merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-green-chili', slug: 'green-chili', name: 'Fresh Green Chili 200g', category: 'Peppers', price: 3500, ratingAvg: 4.7, ratingCount: 145, stock: 65, merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia', image: 'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-red-bell', slug: 'red-bell-peppers', name: 'Red Bell Peppers 500g', category: 'Peppers', price: 9500, ratingAvg: 4.8, ratingCount: 78, stock: 35, badge: 'new', merchant: 'Sunrise Greenhouse', location: 'Debre Zeit, Ethiopia', image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=800&q=80' },

  /* ─────────── HERBS ─────────── */
  { id: 'p-cilantro', slug: 'fresh-cilantro', name: 'Fresh Cilantro Bunch', category: 'Herbs', price: 4500, ratingAvg: 4.6, ratingCount: 92, stock: 50, merchant: 'Herb Garden Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-parsley', slug: 'fresh-parsley', name: 'Fresh Parsley Bunch', category: 'Herbs', price: 4000, ratingAvg: 4.5, ratingCount: 67, stock: 45, merchant: 'Herb Garden Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1592673416370-3e42da8e1a4e?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-mint', slug: 'fresh-mint', name: 'Fresh Mint Bunch', category: 'Herbs', price: 4000, compareAtPrice: 5000, ratingAvg: 4.7, ratingCount: 47, stock: 45, badge: 'sale', merchant: 'Herb Garden Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1628557084295-ca76bc8322f9?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-rosemary', slug: 'fresh-rosemary', name: 'Fresh Rosemary Bunch', category: 'Herbs', price: 5500, ratingAvg: 4.8, ratingCount: 54, stock: 30, badge: 'new', merchant: 'Herb Garden Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-basil', slug: 'fresh-basil', name: 'Fresh Basil Bunch', category: 'Herbs', price: 5000, ratingAvg: 4.6, ratingCount: 63, stock: 35, merchant: 'Herb Garden Co-op', location: 'Addis Ababa', image: 'https://images.unsplash.com/photo-1618375569909-3c8616cf7733?auto=format&fit=crop&w=800&q=80' },

  /* ─────────── FRUITS ─────────── */
  { id: 'p-avocado', slug: 'avocado-pack', name: 'Organic Hass Avocados (Pack of 4)', category: 'Fruits', price: 18500, compareAtPrice: 22000, ratingAvg: 4.9, ratingCount: 340, stock: 25, badge: 'best', merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia', image: 'https://images.unsplash.com/photo-1601039641847-7857b994d704?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-banana', slug: 'sweet-banana', name: 'Sweet Banana Bunch', category: 'Fruits', price: 6000, ratingAvg: 4.8, ratingCount: 256, stock: 80, merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-mango', slug: 'ripe-mangoes', name: 'Ripe Mangoes (Pack of 3)', category: 'Fruits', price: 12500, ratingAvg: 4.9, ratingCount: 178, stock: 40, badge: 'new', merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia', image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-apple', slug: 'red-apples', name: 'Red Apples 1kg', category: 'Fruits', price: 15000, ratingAvg: 4.7, ratingCount: 143, stock: 55, merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia', image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-orange', slug: 'sweet-oranges', name: 'Sweet Oranges (Pack of 6)', category: 'Fruits', price: 9000, compareAtPrice: 11000, ratingAvg: 4.6, ratingCount: 118, stock: 60, badge: 'sale', merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia', image: 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-lemon', slug: 'fresh-lemons', name: 'Fresh Lemons (Pack of 4)', category: 'Fruits', price: 6500, ratingAvg: 4.7, ratingCount: 84, stock: 50, merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-mandarin', slug: 'fresh-mandarins', name: 'Sweet Mandarins (Pack of 8)', category: 'Fruits', price: 8500, ratingAvg: 4.8, ratingCount: 96, stock: 45, badge: 'new', merchant: 'Rift Valley Farms', location: 'Ziway, Ethiopia', image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-watermelon', slug: 'whole-watermelon', name: 'Whole Watermelon', category: 'Fruits', price: 14000, ratingAvg: 4.7, ratingCount: 112, stock: 20, merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-strawberry', slug: 'fresh-strawberries', name: 'Fresh Strawberries 250g', category: 'Fruits', price: 11000, ratingAvg: 4.9, ratingCount: 187, stock: 30, badge: 'best', merchant: 'Highland Roots', location: 'Holeta, Ethiopia', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-pineapple', slug: 'whole-pineapple', name: 'Whole Pineapple', category: 'Fruits', price: 10500, ratingAvg: 4.7, ratingCount: 89, stock: 35, merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia', image: 'https://images.unsplash.com/photo-1589820296156-2454bb8a6ad1?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-papaya', slug: 'ripe-papaya', name: 'Ripe Papaya', category: 'Fruits', price: 9500, ratingAvg: 4.6, ratingCount: 74, stock: 25, merchant: 'Arba Minch Tropicals', location: 'Arba Minch, Ethiopia', image: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?auto=format&fit=crop&w=800&q=80' },
  { id: 'p-passion-fruit', slug: 'passion-fruits', name: 'Passion Fruits (Pack of 6)', category: 'Fruits', price: 12000, ratingAvg: 4.8, ratingCount: 68, stock: 40, merchant: 'Yirgalem Organics', location: 'Yirgalem, Ethiopia', image: 'https://images.unsplash.com/photo-1604495772376-9657f00335f1?auto=format&fit=crop&w=800&q=80' },
];

/* ============================================
   Slug → Category
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
   Render card HTML
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
    <div class="product-card" data-slug="${p.slug}" style="cursor:pointer;">
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
          <button class="product-add" type="button" aria-label="Add to cart">
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
   Filter + sort
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
   Slug extraction
   ============================================ */
function getSlugFromCard(card) {
  if (card.dataset.slug) return card.dataset.slug;

  const href = card.getAttribute('href');
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    return url.searchParams.get('slug');
  } catch {
    return null;
  }
}

/* ============================================
   Wire cards → modal (with login gate)
   ============================================ */
function wireProductInteractions() {
  document.querySelectorAll('#product-grid .product-card').forEach((card) => {
    if (card.dataset.wired === 'true') return;
    card.dataset.wired = 'true';

    card.addEventListener('click', (e) => {
      if (e.target.closest('.product-add')) return;

      e.preventDefault();
      e.stopPropagation();

      if (!state.isAuthed) {
        requireLogin();
        return;
      }

      const slug = getSlugFromCard(card);
      const product = allProducts.find((p) => p.slug === slug);
      if (product) openProductModal(product);
    });
  });

  document.querySelectorAll('#product-grid .product-add').forEach((btn) => {
    if (btn.dataset.wired === 'true') return;
    btn.dataset.wired = 'true';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!state.isAuthed) {
        requireLogin();
        return;
      }

      btn.style.transform = 'scale(0.82)';
      setTimeout(() => { btn.style.transform = ''; }, 150);

      const card = btn.closest('.product-card');
      if (!card) return;

      const slug = getSlugFromCard(card);
      const product = allProducts.find((p) => p.slug === slug);
      if (product) {
        setTimeout(() => openProductModal(product), 120);
      }
    });
  });
}

/* ============================================
   Cart button — login gate
   ============================================ */
// document.querySelector('.cart-btn')?.addEventListener('click', (e) => {
//   if (!state.isAuthed) {
//     e.preventDefault();
//     requireLogin();
//   }
// });

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
   URL ?category=
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
  renderProducts();
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
   Clear filters
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
  showToast(`Subscribed! We'll email ${input.value}`, 'success');
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
   PRODUCT MODAL
   ========================================================== */
const modal = {
  backdrop:    document.getElementById('product-modal-backdrop'),
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
  if (!modal.backdrop) return;

  currentProduct = product;
  currentQty = 1;

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

  const badges = [];
  if (product.badge === 'best') badges.push('<span class="product-badge badge-best">Best Seller</span>');
  if (product.badge === 'new')  badges.push('<span class="product-badge badge-new">New</span>');
  if (product.badge === 'sale') badges.push('<span class="product-badge badge-sale">Sale</span>');
  const d = discountPercent(product.price, product.compareAtPrice);
  if (d) badges.push(`<span class="product-badge discount">-${d}%</span>`);
  modal.badges.innerHTML = badges.join('');

  modal.input.value = '1';
  modal.presets.forEach((b) => b.classList.toggle('active', parseFloat(b.dataset.qty) === 1));
  updateModalTotal();

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

modal.closeBtn?.addEventListener('click', closeProductModal);
modal.backdrop?.addEventListener('click', (e) => {
  if (e.target === modal.backdrop) closeProductModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.backdrop && !modal.backdrop.classList.contains('hidden')) {
    closeProductModal();
  }
});

document.querySelector('.hero-banner .btn-amber')?.addEventListener('click', (e) => {
  if (!state.isAuthed) {
    e.preventDefault();
    sessionStorage.setItem('shop_now_after_login', '1');
    goToLogin('/');
    return;
  }

  e.preventDefault();
  scrollToProducts();
});

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

/* Add to cart */
modal.addBtn?.addEventListener('click', (e) => {
  if (!state.isAuthed) {
    requireLogin();
    return;
  }

  const btn = e.currentTarget;
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span>Adding…</span>';

  try {
    Cart.add(currentProduct, currentQty);
    showToast(`${currentProduct.name} added to cart`, 'success');
    closeProductModal();
  } catch (err) {
    console.error('[cart] add failed:', err);
    showToast('Could not add to cart', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
});

/* ============================================
   Boot
   ============================================ */
(async function boot() {
  // 1. Try to fetch from API (falls back to samples)
  try {
    const res = await API.get('/api/products?limit=100');
    allProducts = (res.data && res.data.length > 0) ? res.data : SAMPLE_PRODUCTS;
  } catch {
    allProducts = SAMPLE_PRODUCTS;
  }

  console.log('[home.js] loaded', allProducts.length, 'products');

  await initSession();

  // 2. Render ALL products dynamically (single source of truth)
  renderProducts();

  if (sessionStorage.getItem('shop_now_after_login') === '1') {
    sessionStorage.removeItem('shop_now_after_login');
    setTimeout(() => {
      scrollToProducts();
    }, 250);
  }

  // 3. Apply ?category= from URL if present
  applyCategoryFromURL();
})();


/* ============================================
   HERO CAROUSEL — auto every 20s + manual
   ============================================ */
(function initHeroCarousel() {
  const slidesContainer = document.getElementById('hero-slides');
  const dots = document.querySelectorAll('#hero-dots .hero-dot');
  if (!slidesContainer || dots.length === 0) return;

  const totalSlides = slidesContainer.children.length;
  let currentIndex = 0;
  let autoTimer = null;
  const AUTO_DELAY = 20000;

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;
    slidesContainer.scrollTo({
      left: slidesContainer.clientWidth * currentIndex,
      behavior: 'smooth',
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goToSlide(currentIndex + 1), AUTO_DELAY);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function restartAuto() { stopAuto(); startAuto(); }

  // Click dots
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToSlide(parseInt(dot.dataset.index, 10));
      restartAuto();
    });
  });

  // Manual swipe/scroll detection
  let scrollTimer;
  slidesContainer.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = Math.round(slidesContainer.scrollLeft / slidesContainer.clientWidth);
      if (idx !== currentIndex && idx >= 0 && idx < totalSlides) {
        currentIndex = idx;
        dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
        restartAuto();
      }
    }, 100);
  });

  // Pause on hover
  slidesContainer.addEventListener('mouseenter', stopAuto);
  slidesContainer.addEventListener('mouseleave', startAuto);

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAuto(); else startAuto();
  });

  // Fix snap on resize
  window.addEventListener('resize', () => {
    slidesContainer.scrollTo({
      left: slidesContainer.clientWidth * currentIndex,
      behavior: 'auto',
    });
  });

  startAuto();
  console.log('[hero] carousel ready with', totalSlides, 'slides');
})();