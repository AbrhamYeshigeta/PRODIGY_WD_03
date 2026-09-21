
import { API } from '../api.js';

(async function checkSession() {
  try {
    const { user } = await API.get('/api/auth/me');
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0];
    document.getElementById('user-menu').onclick = () => {
      window.location.href = (user.role === 'admin' || user.role === 'staff')
        ? '/admin/index.html'
        : '/orders.html';
    };
  } catch {
    document.getElementById('user-menu').onclick = () => {
      window.location.href = '/login.html';
    };
  }
})();

(async function loadCartCount() {
  try {
    const { data } = await API.get('/api/cart');
    const count = (data.items || []).reduce((s, i) => s + i.quantity, 0);
    document.getElementById('cart-count').textContent = count;
  } catch {
    document.getElementById('cart-count').textContent = '0';
  }
})();

const SAMPLE_PRODUCTS = [
  { id:'s1',  slug:'broccoli-500g',      name:'Organic Broccoli',       category:'Leafy Greens', price:12000, compareAtPrice:15000, ratingAvg:4.8, ratingCount:142, badge:'sale', image:null },
  { id:'s2',  slug:'tomatoes-1kg',       name:'Vine-Ripened Tomatoes',  category:'Tomatoes',     price:8500,  compareAtPrice:null,  ratingAvg:4.9, ratingCount:218, badge:'best', image:null },
  { id:'s3',  slug:'carrots-1kg',        name:'Farm-Fresh Carrots',     category:'Root Veg',     price:7000,  compareAtPrice:null,  ratingAvg:4.7, ratingCount:189, badge:null,   image:null },
  { id:'s4',  slug:'baby-spinach-250g',  name:'Baby Spinach',           category:'Leafy Greens', price:9500,  compareAtPrice:null,  ratingAvg:4.9, ratingCount:156, badge:'new',  image:null },
  { id:'s5',  slug:'bell-peppers-trio',  name:'Bell Peppers Trio',      category:'Peppers',      price:13500, compareAtPrice:16000, ratingAvg:4.6, ratingCount:97,  badge:'sale', image:null },
  { id:'s6',  slug:'cucumber-500g',      name:'Crisp Cucumbers',        category:'Salad Veg',    price:5500,  compareAtPrice:null,  ratingAvg:4.5, ratingCount:76,  badge:null,   image:null },
  { id:'s7',  slug:'red-onions-1kg',     name:'Red Onions',             category:'Root Veg',     price:6000,  compareAtPrice:null,  ratingAvg:4.4, ratingCount:112, badge:null,   image:null },
  { id:'s8',  slug:'fresh-herbs-mix',    name:'Fresh Herbs Mix',        category:'Herbs',        price:10500, compareAtPrice:null,  ratingAvg:4.8, ratingCount:64,  badge:'new',  image:null },
  { id:'s9',  slug:'red-cabbage-1kg',    name:'Red Cabbage',            category:'Leafy Greens', price:8000,  compareAtPrice:null,  ratingAvg:4.6, ratingCount:88,  badge:null,   image:null },
  { id:'s10', slug:'avocado-pack-3',     name:'Hass Avocado (3-pack)',  category:'Fruits',       price:14500, compareAtPrice:17000, ratingAvg:4.9, ratingCount:203, badge:'sale', image:null },
  { id:'s11', slug:'green-beans-500g',   name:'Green Beans',            category:'Salad Veg',    price:7500,  compareAtPrice:null,  ratingAvg:4.5, ratingCount:74,  badge:null,   image:null },
  { id:'s12', slug:'lemons-1kg',         name:'Fresh Lemons',           category:'Fruits',       price:9000,  compareAtPrice:null,  ratingAvg:4.7, ratingCount:131, badge:null,   image:null }
];

function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';
}
function starBar(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty);
}
function badgeLabel(b) {
  if (b === 'sale') return 'Sale';
  if (b === 'new')  return 'New';
  if (b === 'best') return 'Best Seller';
  return null;
}

function renderCard(p) {
  const badge = badgeLabel(p.badge);
  const badgeHTML = badge
    ? `<div class="product-badges"><span class="product-badge badge-${p.badge}">${badge}</span></div>`
    : '';

  const thumbInner = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" />`
    : `<div class="img-placeholder light">
         <span class="img-placeholder-icon">🥬</span>
         <span class="img-placeholder-text">Product Image<br/><small>800×800</small></span>
       </div>`;

  const compare = p.compareAtPrice
    ? `<span class="product-compare">${formatPrice(p.compareAtPrice)}</span>`
    : '';

  return `
    <a href="/product.html?slug=${encodeURIComponent(p.slug)}" class="product-card">
      <div class="product-thumb">
        ${thumbInner}
        ${badgeHTML}
        <button class="product-add" data-add="${p.id}" aria-label="Add to cart" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="product-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <div class="product-rating">
          <span class="stars">${starBar(p.ratingAvg)}</span>
          <span>${p.ratingAvg.toFixed(1)} (${p.ratingCount})</span>
        </div>
        <div class="product-price-row">
          <span class="product-price">${formatPrice(p.price)}</span>
          ${compare}
        </div>
      </div>
    </a>
  `;
}

async function loadProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  try {
    const res = await API.get('/api/products?limit=12');
    const products = res.data || [];
    if (products.length === 0) throw new Error('empty');
    grid.innerHTML = products.map(renderCard).join('');
  } catch {
    grid.innerHTML = SAMPLE_PRODUCTS.map(renderCard).join('');
  }

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await API.post('/api/cart/items', { productId: btn.dataset.add, quantity: 1 });
        const el = document.getElementById('cart-count');
        el.textContent = (parseInt(el.textContent, 10) || 0) + 1;
        btn.style.transform = 'scale(0.85)';
        setTimeout(() => { btn.style.transform = ''; }, 150);
      } catch {
        alert('Cart coming soon — API is next!');
      }
    });
  });
}

document.getElementById('newsletter-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  alert(`Thanks! Updates will go to ${input.value}`);
  input.value = '';
});

document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  alert('Mobile menu coming soon.');
});

loadProducts();