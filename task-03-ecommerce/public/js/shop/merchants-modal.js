// public/js/shop/merchants-modal.js

const fmtETB = (n) => (n / 100).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

let currentMerchants = [];
let currentProduct = null;

/* ============================================
   Open Modal, Fetch Merchants, Render
   ============================================ */
window.openMerchantsModal = async function(slug, productName) {
  const backdrop = document.getElementById('merchants-backdrop');
  const list = document.getElementById('merchants-list');
  const title = document.getElementById('merchants-title');
  const count = document.getElementById('merchants-count');

  title.textContent = productName;
  list.innerHTML = '<div style="text-align:center; padding: 30px;">Loading merchants...</div>';
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const showEmptyState = () => {
    count.textContent = `0 merchants`;
    list.innerHTML = `
      <div class="merchant-empty">
        <div class="merchant-empty-icon" aria-hidden="true">🛒</div>
        <h3>No merchants currently supply this product</h3>
        <p>There are no verified sellers with available stock right now. Please check back soon.</p>
      </div>
    `;
  };

  try {
    const res = await fetch(`/api/products/${slug}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Could not load merchants (${res.status})`);
    }

    const data = await res.json();
    currentProduct = data.data.product;
    currentMerchants = data.data.offers || [];

    if (currentMerchants.length === 0) {
      showEmptyState();
      return;
    }

    count.textContent = `${currentMerchants.length} merchant${currentMerchants.length === 1 ? '' : 's'}`;
    
    // Render each merchant row
    list.innerHTML = currentMerchants.map(offer => {
      const seller = offer.seller;
      return `
        <div class="merchant-item" data-offer-id="${offer.id}">
          <div class="merchant-summary">
            <div class="merchant-avatar">🚜</div>
            <div class="merchant-main">
              <div class="merchant-name-row">
                <span class="merchant-shop">${escapeHTML(seller.businessName)}</span>
                <span class="merchant-verified">Verified</span>
              </div>
              <div class="merchant-meta-row">
                <span>📍 ${escapeHTML(seller.city || seller.country || 'Location unavailable')}</span>
                <span class="dot">·</span>
                <span>⭐ ${Number(seller.rating || 0).toFixed(1)}</span>
              </div>
            </div>
            <div class="merchant-stock">
              <span class="merchant-price">${fmtETB(offer.pricePerUnit)}<small>/ ${escapeHTML(offer.unit)}</small></span>
              <small>${Number(offer.stock).toLocaleString()} ${escapeHTML(offer.unit)} available</small>
            </div>
            <button class="merchant-select-btn" type="button" data-select>
              Select →
            </button>
          </div>
        </div>
      `;
    }).join('');

    attachMerchantListeners();

  } catch (err) {
    console.error(err);
    count.textContent = 'Unable to load';
    list.innerHTML = `
      <div class="merchant-empty" role="alert">
        <div class="merchant-empty-icon" aria-hidden="true">⚠️</div>
        <h3>Merchant list unavailable</h3>
        <p>${escapeHTML(err.message)}. Please try again.</p>
        <button class="btn btn-green" type="button" data-retry>Retry</button>
      </div>
    `;
    list.querySelector('[data-retry]')?.addEventListener('click', () => {
      window.openMerchantsModal(slug, productName);
    });
  }
};

/* ============================================
   Handle Merchant Selection
   ============================================ */
function attachMerchantListeners() {
  const list = document.getElementById('merchants-list');
  if (list.dataset.wired === 'true') return;
  list.dataset.wired = 'true';

  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select]');
    if (!btn) return;

    const item = btn.closest('.merchant-item');
    const offerId = item?.dataset.offerId;
    if (!offerId) return;
    const selectedOffer = currentMerchants.find(o => o.id === offerId);

    if (selectedOffer) {
      // 1. Close Merchants Modal
      document.getElementById('merchants-backdrop').classList.add('hidden');
      
      // 2. Open Quick-View Modal (Function from home.js)
      setTimeout(() => {
        window.openQuickViewModal({
          offerId: selectedOffer.id,
          name: currentProduct.name,
          image: currentProduct.image,
          category: currentProduct.category,
          pricePerUnit: selectedOffer.pricePerUnit,
          unit: selectedOffer.unit,
          estimatedWeightKg: selectedOffer.estimatedWeightKg,
          stock: selectedOffer.stock,
          sellerName: selectedOffer.seller.businessName,
          sellerCity: selectedOffer.seller.city,
        });
      }, 150);
    }
  });
}

// Close Modal Logic (Backdrop & Close Button)
document.getElementById('merchants-close')?.addEventListener('click', () => {
  document.getElementById('merchants-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
});

document.getElementById('merchants-backdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'merchants-backdrop') {
    document.getElementById('merchants-backdrop').classList.add('hidden');
    document.body.style.overflow = '';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.getElementById('merchants-backdrop')?.classList.add('hidden');
    document.body.style.overflow = '';
  }
});