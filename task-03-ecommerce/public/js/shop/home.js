// public/js/shop/home.js
import { API } from '../api.js';
import { Cart } from '../cart.js';

let allProducts = [];

const filters = {
  search: '',
  category: '', // Empty string means 'All Products'
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  sort: 'popular',
};

// Define the exact 7 categories you requested
const CATEGORIES = [
  'All Products', 
  'Leafy Greens', 
  'Root Vegetables', 
  'Fruit Vegetables', 
  'Peppers', 
  'Herbs', 
  'Fruits'
];

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const formatETB = (cents) => `${(cents / 100).toLocaleString('en-ET', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ETB`;

/* Render the 7 Categories into the HTML */
function renderCategoryChips() {
  const container = document.getElementById('category-chips');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(cat => {
    // 'All Products' maps to empty string for the backend filter
    const filterValue = cat === 'All Products' ? '' : cat;
    const isActive = filters.category === filterValue ? 'active' : '';
    
    return `
      <button type="button" class="chip ${isActive}" data-category="${filterValue}">
        ${cat}
      </button>
    `;
  }).join('');
}

/* Load the live catalog and its verified, in-stock offer summaries. */
async function fetchAndRenderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '<p class="product-grid-message">Loading fresh products…</p>';

  try {
    const res = await API.get('/api/products');
    allProducts = res.data || [];
    renderProducts();
  } catch (err) {
    console.error('Failed to load products', err);
    grid.innerHTML = `<p class="product-grid-message error" role="alert">
      Products could not be loaded. ${escapeHTML(err.message)}
      <button type="button" class="btn btn-green" id="retry-products">Try again</button>
    </p>`;
    document.getElementById('retry-products')?.addEventListener('click', fetchAndRenderProducts);
  }
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-results');
  const countEl = document.getElementById('result-count');
  const titleEl = document.getElementById('section-title');
  const visible = getFilteredProducts();
  updateFilterBadge();

  if (titleEl) titleEl.textContent = filters.category || 'All Products';
  if (countEl) {
    countEl.textContent = visible.length === allProducts.length
      ? `${visible.length} product${visible.length === 1 ? '' : 's'}`
      : `Showing ${visible.length} of ${allProducts.length}`;
  }

  if (!visible.length) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    emptyState?.classList.remove('hidden');
    return;
  }

  grid.style.display = '';
  emptyState?.classList.add('hidden');
  grid.innerHTML = visible.map(renderProductCard).join('');
}

function getFilteredProducts() {
  const visible = allProducts.filter((product) => {
    const query = filters.search.trim().toLowerCase();
    if (query && !`${product.name} ${product.category}`.toLowerCase().includes(query)) return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.inStockOnly && !(product.totalStock > 0)) return false;
    if (filters.minPrice !== null
      && (!product.sellerCount || product.lowestPricePerKg < filters.minPrice * 100)) return false;
    if (filters.maxPrice !== null
      && (!product.sellerCount || product.lowestPricePerKg > filters.maxPrice * 100)) return false;
    return true;
  });

  if (filters.sort === 'price-asc') {
    visible.sort((a, b) => a.lowestPricePerKg - b.lowestPricePerKg);
  } else if (filters.sort === 'price-desc') {
    visible.sort((a, b) => b.lowestPricePerKg - a.lowestPricePerKg);
  } else {
    visible.sort((a, b) => b.sellerCount - a.sellerCount || a.name.localeCompare(b.name));
  }

  return visible;
}

function updateFilterBadge() {
  const badge = document.getElementById('filter-badge');
  const activeCount = Number(filters.minPrice !== null || filters.maxPrice !== null)
    + Number(filters.inStockOnly);
  if (!badge) return;
  badge.textContent = String(activeCount);
  badge.classList.toggle('hidden', activeCount === 0);
}

function renderProductCard(product) {
  const hasOffers = product.sellerCount > 0;
  const image = product.image ? escapeHTML(product.image) : '/img/placeholder.png';
  const name = escapeHTML(product.name);
  const category = escapeHTML(product.category);
  const price = hasOffers ? `${formatETB(product.lowestPricePerKg)} / kg` : 'No current offers';
  const merchantCount = `${product.sellerCount || 0} verified merchant${product.sellerCount === 1 ? '' : 's'}`;

  return `
        <article class="product-card" data-slug="${escapeHTML(product.slug)}">
          <div class="product-thumb">
            <img src="${image}" alt="${name}" loading="lazy" />
          </div>
          <div class="product-body">
            <span class="product-cat">${category}</span>
            <h3 class="product-name">${name}</h3>
            <span class="product-stock ${hasOffers ? 'in' : 'out'}">${hasOffers ? 'In stock' : 'No offers'}</span>
            <div class="product-price-row">
              <div class="product-prices">
                <span class="product-price">${price}</span>
                <span class="product-compare">${merchantCount}</span>
              </div>
              <button class="product-add" type="button" aria-label="View merchants for ${name}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </article>
  `;
}

/* ============================================
   Event Listeners for Filters & Modals
   ============================================ */
document.getElementById('product-grid')?.addEventListener('click', (event) => {
  const card = event.target.closest('.product-card');
  if (!card || !window.openMerchantsModal) return;

  window.openMerchantsModal(card.dataset.slug, card.querySelector('.product-name').textContent);
});

document.getElementById('product-search')?.addEventListener('input', (event) => {
  filters.search = event.target.value;
  renderProducts();
});

document.getElementById('category-chips')?.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-category]');
  if (!chip) return;
  filters.category = chip.dataset.category;
  document.querySelectorAll('#category-chips [data-category]').forEach((item) => {
    item.classList.toggle('active', item === chip);
  });
  renderProducts();
});

document.getElementById('sort-menu')?.addEventListener('click', (event) => {
  const option = event.target.closest('[data-sort]');
  if (!option) return;
  filters.sort = option.dataset.sort;
  document.getElementById('sort-label').textContent = option.textContent.trim();
  document.querySelectorAll('#sort-menu [data-sort]').forEach((item) => {
    item.classList.toggle('active', item === option);
  });
  document.getElementById('sort-menu').classList.add('hidden');
  renderProducts();
});

document.getElementById('sort-toggle')?.addEventListener('click', (event) => {
  event.stopPropagation();
  document.getElementById('sort-menu')?.classList.toggle('hidden');
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.sort-wrap')) {
    document.getElementById('sort-menu')?.classList.add('hidden');
  }
});

document.getElementById('filter-toggle')?.addEventListener('click', () => {
  document.getElementById('filters-panel')?.classList.toggle('hidden');
});

document.getElementById('filters-panel')?.addEventListener('input', (event) => {
  if (event.target.id === 'price-min') {
    filters.minPrice = event.target.value === '' ? null : Number(event.target.value);
  }
  if (event.target.id === 'price-max') {
    filters.maxPrice = event.target.value === '' ? null : Number(event.target.value);
  }
  if (event.target.id === 'filter-instock') filters.inStockOnly = event.target.checked;
  renderProducts();
});

document.querySelectorAll('.price-preset').forEach((button) => {
  button.addEventListener('click', () => {
    filters.minPrice = button.dataset.min === '' ? null : Number(button.dataset.min);
    filters.maxPrice = button.dataset.max === '' ? null : Number(button.dataset.max);
    document.getElementById('price-min').value = button.dataset.min;
    document.getElementById('price-max').value = button.dataset.max;
    document.querySelectorAll('.price-preset').forEach((preset) => {
      preset.classList.toggle('active', preset === button);
    });
    renderProducts();
  });
});

document.getElementById('filter-clear')?.addEventListener('click', () => {
  filters.minPrice = null;
  filters.maxPrice = null;
  filters.inStockOnly = false;
  document.getElementById('price-min').value = '';
  document.getElementById('price-max').value = '';
  document.getElementById('filter-instock').checked = false;
  document.querySelectorAll('.price-preset').forEach((preset) => preset.classList.remove('active'));
  renderProducts();
});

document.getElementById('empty-reset')?.addEventListener('click', () => {
  filters.search = '';
  filters.category = '';
  document.getElementById('product-search').value = '';
  // Click the "All Products" chip
  document.querySelector('#category-chips [data-category=""]')?.click();
  document.getElementById('filter-clear')?.click();
});


/* ============================================
   User Header Logic
   ============================================ */
async function updateHeaderForCurrentUser() {
  const userMenu = document.getElementById('user-menu');
  const dropdown = document.getElementById('user-dropdown');
  const login = document.getElementById('login-link');
  if (!userMenu) return;

  try {
    const { user } = await API.get('/api/auth/me');
    const name = user.name || user.email;
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-avatar').textContent = name[0].toUpperCase();
    document.getElementById('dropdown-name').textContent = name;
    document.getElementById('dropdown-email').textContent = user.email;
    document.getElementById('dropdown-avatar').textContent = name[0].toUpperCase();
    userMenu.classList.add('logged-in');
    dropdown?.classList.add('hidden');
    if (login) login.hidden = true;
    
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        if (!response.ok) throw new Error(`Could not sign out (${response.status})`);
        window.location.reload();
      } catch (logoutError) {
        console.error('Sign out failed', logoutError);
      }
    });
  } catch (error) {
    if (error.message !== 'Request failed (401)' && error.message !== 'Not authorized, no token provided') {
      console.error('Could not load signed-in user', error);
    }
    if (login) login.hidden = false;
    dropdown?.classList.add('hidden');
  }

  userMenu.addEventListener('click', () => {
    if (userMenu.classList.contains('logged-in')) {
      dropdown?.classList.toggle('hidden');
      return;
    }
    window.location.href = '/login.html';
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.user-menu-wrap')) dropdown?.classList.add('hidden');
  });
}

/* ============================================
   Quick-View Modal & Cart
   ============================================ */
window.openQuickViewModal = function(merchantData) {
  document.getElementById('pm-image').src = merchantData.image;
  document.getElementById('pm-title').textContent = merchantData.name;
  document.getElementById('pm-category').textContent = merchantData.category;
  document.getElementById('pm-merchant').textContent = merchantData.sellerName;
  document.getElementById('pm-location').textContent = '📍 ' + merchantData.sellerCity;

  const weightUnits = { kg: 1, quintal: 100, ton: 1000 };
  const kgFactor = weightUnits[merchantData.unit];
  const isWeightBased = kgFactor !== undefined;
  const quantityUnit = isWeightBased ? 'kg' : merchantData.unit;
  const quantityStep = isWeightBased ? 0.5 : 1;
  const availableQuantity = isWeightBased
    ? Number(merchantData.stock) * kgFactor
    : Number(merchantData.stock);
  const maxQuantity = Math.floor((availableQuantity + 1e-8) / quantityStep) * quantityStep;
  const unitPrice = isWeightBased
    ? Number(merchantData.pricePerKg ?? merchantData.pricePerUnit / kgFactor)
    : Number(merchantData.pricePerUnit);
  const priceETB = (unitPrice / 100).toFixed(2);
  document.getElementById('pm-price').textContent = `${priceETB} ETB / ${quantityUnit}`;
  const priceLabel = document.querySelector('.pm-price-label');
  if (priceLabel) priceLabel.textContent = `Price per ${quantityUnit}`;
  
  const unitComparison = document.getElementById('pm-unit-comparison');
  if (unitComparison) {
    unitComparison.textContent = !isWeightBased && merchantData.estimatedWeightKg > 0
      ? `≈ ${(Number(priceETB) / merchantData.estimatedWeightKg).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB / kg (${merchantData.estimatedWeightKg} kg per ${merchantData.unit})`
      : '';
    unitComparison.hidden = isWeightBased || !merchantData.estimatedWeightKg;
  }
  
  const qtyHint = document.querySelector('.pm-quantity-hint');
  const qtyUnit = document.querySelector('.qty-unit');
  if (qtyHint) qtyHint.textContent = isWeightBased
    ? '(kg · 0.5 kg steps)'
    : `(${quantityUnit} · whole units)`;
  if (qtyUnit) qtyUnit.textContent = quantityUnit;
  
  window.currentOfferId = merchantData.offerId;
  window.currentOfferPrice = unitPrice;

  const qtyInput = document.getElementById('pm-input');
  if (qtyInput) {
    qtyInput.value = Math.min(1, maxQuantity);
    qtyInput.setAttribute('min', quantityStep);
    qtyInput.setAttribute('max', maxQuantity);
    qtyInput.setAttribute('step', quantityStep);
  }

  const addToCartButton = document.getElementById('pm-add-to-cart');
  if (addToCartButton) addToCartButton.disabled = maxQuantity < quantityStep;
  
  document.querySelectorAll('.qty-preset').forEach((preset) => {
    const quantity = Number(preset.dataset.qty);
    preset.hidden = (!isWeightBased && !Number.isInteger(quantity))
      || quantity > maxQuantity;
    preset.textContent = `${quantity} ${quantityUnit}`;
  });
  
  updateQuickViewQuantity();
  const totalEl = document.getElementById('pm-total');
  if (totalEl) totalEl.textContent = `${priceETB} ETB`;

  document.getElementById('product-modal-backdrop').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

function updateQuickViewQuantity() {
  const input = document.getElementById('pm-input');
  if (!input) return;
  const min = Number(input.min) || 1;
  const max = Number(input.max);
  const step = Number(input.step) || 1;
  if (!Number.isFinite(max) || max < min) {
    input.value = '';
    document.getElementById('pm-total').textContent = '0.00 ETB';
    document.getElementById('pm-minus').disabled = true;
    document.getElementById('pm-plus').disabled = true;
    document.querySelectorAll('.qty-preset').forEach((preset) => {
      preset.classList.remove('active');
    });
    return;
  }

  const requested = Number(input.value);
  const quantity = Math.min(max, Math.max(min, Math.round((Number.isFinite(requested) ? requested : min) / step) * step));
  input.value = quantity;
  const total = (Number(window.currentOfferPrice || 0) * quantity / 100).toLocaleString('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const totalEl = document.getElementById('pm-total');
  if (totalEl) totalEl.textContent = `${total} ETB`;
  document.querySelectorAll('.qty-preset').forEach((preset) => {
    preset.classList.toggle('active', Number(preset.dataset.qty) === quantity);
  });
  const minus = document.getElementById('pm-minus');
  const plus = document.getElementById('pm-plus');
  if (minus) minus.disabled = quantity <= min;
  if (plus) plus.disabled = quantity >= max;
}

document.getElementById('pm-minus')?.addEventListener('click', () => {
  const input = document.getElementById('pm-input');
  if (input) input.value = Math.max(Number(input.min) || 1, Number(input.value) - (Number(input.step) || 1));
  updateQuickViewQuantity();
});

document.getElementById('pm-plus')?.addEventListener('click', () => {
  const input = document.getElementById('pm-input');
  if (input) input.value = Math.min(Number(input.max), Number(input.value) + (Number(input.step) || 1));
  updateQuickViewQuantity();
});

document.getElementById('pm-input')?.addEventListener('change', updateQuickViewQuantity);

document.querySelector('.qty-presets')?.addEventListener('click', (event) => {
  const preset = event.target.closest('[data-qty]');
  const input = document.getElementById('pm-input');
  if (!preset || !input) return;
  input.value = preset.dataset.qty;
  updateQuickViewQuantity();
});

document.getElementById('pm-add-to-cart')?.addEventListener('click', async (e) => {
  if (!window.currentOfferId) {
    alert("Please select a merchant first.");
    return;
  }

  const btn = e.currentTarget;
  const originalText = btn.innerHTML;
  const qtyInput = document.getElementById('pm-input');
  const quantity = qtyInput ? Number(qtyInput.value) : 1;
  const step = Number(qtyInput?.step) || 1;
  if (!Number.isFinite(quantity) || quantity < Number(qtyInput?.min || 1)
    || quantity > Number(qtyInput?.max || 1)
    || Math.abs(quantity / step - Math.round(quantity / step)) > 1e-8) {
    alert('Choose a valid quantity within the available stock.');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span>Adding...</span>';

  try {
    try {
      await API.get('/api/auth/me');
    } catch (authError) {
      if (authError.message.includes('(401)') || /not authorized|token invalid|user no longer exists/i.test(authError.message)) {
        const returnTo = window.currentProductSlug
          ? `/?product=${encodeURIComponent(window.currentProductSlug)}`
          : '/';
        window.location.href = `/login.html?${new URLSearchParams({ redirect: returnTo })}`;
        return;
      }
      throw authError;
    }

    await API.post('/api/cart/add', {
      offerId: window.currentOfferId,
      quantity: quantity
    });

    alert("Added to cart successfully!");
    document.getElementById('product-modal-backdrop').classList.add('hidden');
    document.body.style.overflow = '';
    
    if (Cart && Cart.fetchCart) {
      await Cart.fetchCart();
    } else if (Cart && Cart.refresh) {
      Cart.refresh();
    }

  } catch (err) {
    console.error(err);
    alert(err.message || "Failed to add to cart. Please try again.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
    if (Number(qtyInput?.max) < (Number(qtyInput?.step) || 1)) btn.disabled = true;
  }
});

document.getElementById('product-modal-close')?.addEventListener('click', () => {
  document.getElementById('product-modal-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
});

/* ============================================
   Boot Sequence
   ============================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Render the strict 7 categories
  renderCategoryChips();

  // 2. Handle category query param from URL (e.g., /?category=Leafy%20Greens)
  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  if (requestedCategory) {
    const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
    const chip = [...document.querySelectorAll('#category-chips [data-category]')]
      .find((item) => normalize(item.dataset.category) === normalize(requestedCategory));
    if (chip) {
      filters.category = chip.dataset.category;
      document.querySelectorAll('#category-chips [data-category]').forEach((item) => {
        item.classList.toggle('active', item === chip);
      });
    }
  }

  // 3. Load user data and products
  await updateHeaderForCurrentUser();
  await fetchAndRenderProducts();

  const requestedProduct = new URLSearchParams(window.location.search).get('product');
  const product = allProducts.find((item) => item.slug === requestedProduct);
  if (product && window.openMerchantsModal) {
    window.openMerchantsModal(product.slug, product.name);
  }
});