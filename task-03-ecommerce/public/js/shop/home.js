import { API } from '../api.js';

/* ============================================
   Session check (shows user in header if logged in)
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
    // Not logged in — leave as "Sign in"
    document.getElementById('user-menu').onclick = () => {
      window.location.href = '/login.html';
    };
  }
})();

/* ============================================
   Cart count (reads from API; falls back to 0)
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
   Sample vegetable catalog (fallback)
   Used until the Product API exists
   ============================================ */
const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    slug: 'organic-broccoli-500g',
    name: 'Organic Broccoli',
    category: 'Leafy Greens',
    price: 12000,              // 120.00 ETB
    compareAtPrice: 15000,
    ratingAvg: 4.8,
    ratingCount: 142,
    stock: 45,
    badge: 'sale',
    image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-2',
    slug: 'vine-tomatoes-1kg',
    name: 'Vine-Ripened Tomatoes',
    category: 'Tomatoes',
    price: 8500,
    ratingAvg: 4.9,
    ratingCount: 218,
    stock: 60,
    badge: 'best',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-3',
    slug: 'fresh-carrots-1kg',
    name: 'Farm-Fresh Carrots',
    category: 'Root Vegetables',
    price: 7000,
    ratingAvg: 4.7,
    ratingCount: 189,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-4',
    slug: 'baby-spinach-250g',
    name: 'Baby Spinach',
    category: 'Leafy Greens',
    price: 9500,
    ratingAvg: 4.9,
    ratingCount: 156,
    stock: 22,
    badge: 'new',
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-5',
    slug: 'bell-peppers-trio',
    name: 'Bell Peppers Trio',
    category: 'Peppers',
    price: 13500,
    compareAtPrice: 16000,
    ratingAvg: 4.6,
    ratingCount: 97,
    stock: 40,
    badge: 'sale',
    image: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-6',
    slug: 'cucumber-500g',
    name: 'Crisp Cucumbers',
    category: 'Salad Vegetables',
    price: 5500,
    ratingAvg: 4.5,
    ratingCount: 76,
    stock: 55,
    image: 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-7',
    slug: 'red-onions-1kg',
    name: 'Red Onions',
    category: 'Root Vegetables',
    price: 6000,
    ratingAvg: 4.4,
    ratingCount: 112,
    stock: 8,              // low stock demo
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=70',
  },
  {
    id: 'sample-8',
    slug: 'fresh-herbs-mix',
    name: 'Fresh Herbs Mix',
    category: 'Herbs',
    price: 10500,
    ratingAvg: 4.8,
    ratingCount: 64,
    stock: 30,
    badge: 'new',
    image: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?auto=format&fit=crop&w=500&q=70',
  },
];

/* ============================================
   Product rendering
   ============================================ */
function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ETB';
}

function starBar(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(empty);
}

function stockInfo(stock) {
  if (stock === 0)  return { class: 'out', label: 'Out of stock' };
  if (stock <= 10)  return { class: 'low', label: `Only ${stock} left` };
  return               { class: 'in',  label: 'In stock' };
}

function badgeLabel(badge) {
  if (badge === 'sale') return 'Sale';
  if (badge === 'new')  return 'New';
  if (badge === 'best') return 'Best Seller';
  return null;
}

function renderProductCard(p) {
  const compare = p.compareAtPrice
    ? `<span class="product-compare">${formatPrice(p.compareAtPrice)}</span>`
    : '';
  const badge = badgeLabel(p.badge);
  const stock = stockInfo(p.stock ?? 0);
  const rating = p.ratingAvg
    ? `<div class="product-rating">
         <span class="stars">${starBar(p.ratingAvg)}</span>
         <span>${p.ratingAvg.toFixed(1)} (${p.ratingCount || 0})</span>
       </div>`
    : '';

  const badges = badge
    ? `<div class="product-badges">
         <span class="product-badge badge-${p.badge}">${badge}</span>
       </div>`
    : '';

  return `
    <a href="/product.html?slug=${encodeURIComponent(p.slug)}" class="product-card">
      <div class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#e8f3ee,#d9ece1)'" />
        ${badges}
        <button class="product-add" data-add="${p.id}" aria-label="Add to cart" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        ${rating}
        <span class="product-stock ${stock.class}">${stock.label}</span>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${compare}
        </div>
      </div>
    </a>
  `;
}

/* ============================================
   Boot: try API, fall back to sample data
   ============================================ */
async function loadFeatured() {
  const grid = document.getElementById('featured-grid');

  try {
    const res = await API.get('/api/products?featured=true&limit=8');
    const products = res.data || [];
    if (products.length === 0) throw new Error('empty');
    grid.innerHTML = products.map(renderProductCard).join('');
  } catch {
    // API not ready — render sample vegetables so the design is visible
    grid.innerHTML = SAMPLE_PRODUCTS.map(renderProductCard).join('');
  }

  // Wire add-to-cart buttons
  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.add;
      try {
        await API.post('/api/cart/items', { productId: id, quantity: 1 });
        const countEl = document.getElementById('cart-count');
        countEl.textContent = (parseInt(countEl.textContent, 10) || 0) + 1;
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
      } catch (err) {
        alert('Cart not available yet — the API is being built.');
      }
    });
  });
}

/* ============================================
   Newsletter (stub — friendly toast)
   ============================================ */
document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  alert(`Thanks! We'll send weekly harvest updates to ${input.value}`);
  input.value = '';
});

/* ============================================
   Mobile hamburger (opens sidebar — not used yet, but hooked)
   ============================================ */
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  alert('Menu — coming soon with the mobile drawer.');
});

/* ============================================
   Boot
   ============================================ */
loadFeatured();