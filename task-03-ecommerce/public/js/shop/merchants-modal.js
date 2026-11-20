// public/js/shop/merchants-modal.js

const fmtETB = (n) => (n / 100).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

let currentMerchants = [];
let currentProduct = null;

function closeMerchantsModal() {
  document.getElementById('merchants-backdrop')?.classList.add('hidden');
  document.body.style.overflow = '';
}

/* ============================================
   Open Modal, Fetch Merchants, Render
   ============================================ */
window.openMerchantsModal = async function(slug, productName) {
  window.currentProductSlug = slug;
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
    const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Could not load merchants (${res.status})`);
    }

    const data = await res.json();
    currentProduct = data.data?.product || data.data;
    currentMerchants = currentProduct?.offers || data.data?.offers || [];

    if (currentMerchants.length === 0) {
      showEmptyState();
      return;
    }

    count.textContent = `${currentMerchants.length} merchant${currentMerchants.length === 1 ? '' : 's'}`;

    // Render each merchant row with an accessible disclosure control.
    list.innerHTML = currentMerchants.map((offer) => {
      const seller = offer.seller;
      const isVerified = seller.verificationStatus === 'verified';
      const joinYear = new Date(seller.createdAt || Date.now()).getFullYear();
      const detailsId = `merchant-details-${encodeURIComponent(offer.id)}`;

      return `
        <div class="merchant-item" data-offer-id="${escapeHTML(offer.id)}">

          <div class="merchant-summary">
            <div class="merchant-avatar">🚜</div>

            <div class="merchant-main">
              <div class="merchant-name-row">
                <span class="merchant-shop">${escapeHTML(seller.businessName)}</span>
                ${isVerified ? '<span class="merchant-verified">✓ VERIFIED</span>' : ''}
              </div>
              <div class="merchant-meta-row">
                <span>📍 ${escapeHTML(seller.city || 'Location unavailable')}</span>
                <span class="dot">·</span>
                <span>⭐ ${Number(seller.rating || 0).toFixed(1)}</span>
              </div>
            </div>

            <div class="merchant-stock">
              <span class="merchant-price">${fmtETB(offer.pricePerKg)}<small>/ kg</small></span>
              <small>${Number(offer.stock).toLocaleString()} ${escapeHTML(offer.unit)} available</small>
            </div>

            <button class="merchant-select-btn" type="button" data-select>
              Select →
            </button>

            <button
              class="merchant-chevron"
              type="button"
              data-toggle
              aria-expanded="false"
              aria-controls="${escapeHTML(detailsId)}"
              aria-label="Toggle details for ${escapeHTML(seller.businessName)}"
            >▼</button>
          </div>

          <div class="merchant-extra-details" id="${escapeHTML(detailsId)}" aria-hidden="true" inert>
            <div class="merchant-extra-inner">

              <div class="trust-signals">
                <span>⚡ ${Number(seller.fulfillmentRate ?? 100)}% fulfillment rate</span>
              </div>

              <div style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--ink-3); margin-bottom: 8px; letter-spacing: 0.05em;">🔒 Verified Business Details</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; color: var(--ink-2);">
                  <div>🏢 <strong>Type:</strong> ${escapeHTML(seller.businessType || 'Farm')}</div>
                  <div>📅 <strong>Joined:</strong> ${joinYear}</div>
                  <div>📄 <strong>TIN:</strong> ${isVerified ? 'Verified ✓' : 'Pending'}</div>
                  <div>🪪 <strong>Fayda ID:</strong> ${isVerified ? 'Verified ✓' : 'Pending'}</div>
                </div>
              </div>

              <p class="merchant-bio">${escapeHTML(seller.bio || 'Verified Etfruit merchant offering fresh produce directly from the farm.')}</p>

              <div style="display: flex; gap: 10px;">
                <a href="/seller/storefront.html?id=${encodeURIComponent(seller.id)}" class="btn-visit-store" target="_blank" rel="noopener noreferrer">Visit Storefront →</a>
              </div>

            </div>
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
        <p>We couldn't load merchant details right now. Please try again.</p>
        <button class="btn btn-green" type="button" data-retry>Retry</button>
      </div>
    `;
    list.querySelector('[data-retry]')?.addEventListener('click', () => {
      window.openMerchantsModal(slug, productName);
    });
  }
};

/* ============================================
   Handle Accordion Toggle & Merchant Selection
   ============================================ */
function attachMerchantListeners() {
  const list = document.getElementById('merchants-list');
  if (list.dataset.wired === 'true') return;
  list.dataset.wired = 'true';

  list.addEventListener('click', (e) => {
    const summaryRow = e.target.closest('.merchant-summary');
    const isSelectBtn = e.target.closest('[data-select]');

    if (summaryRow && !isSelectBtn) {
      const currentItem = summaryRow.closest('.merchant-item');

      document.querySelectorAll('.merchant-item.expanded').forEach(item => {
        if (item !== currentItem) setMerchantExpanded(item, false);
      });

      setMerchantExpanded(currentItem, !currentItem.classList.contains('expanded'));
      return;
    }

    if (isSelectBtn) {
      const item = isSelectBtn.closest('.merchant-item');
      const offerId = item?.dataset.offerId;
      if (!offerId) return;

      const selectedOffer = currentMerchants.find(o => o.id === offerId);

      if (selectedOffer) {
        closeMerchantsModal();

        setTimeout(() => {
          window.openQuickViewModal({
            offerId: selectedOffer.id,
            name: currentProduct.name,
            image: currentProduct.image,
            category: currentProduct.category,
            pricePerUnit: selectedOffer.pricePerUnit,
            pricePerKg: selectedOffer.pricePerKg,
            unit: selectedOffer.unit,
            estimatedWeightKg: selectedOffer.estimatedWeightKg,
            stock: selectedOffer.stock,
            sellerName: selectedOffer.seller.businessName,
            sellerCity: selectedOffer.seller.city,
          });
        }, 150);
      }
    }
  });
}

function setMerchantExpanded(item, expanded) {
  item.classList.toggle('expanded', expanded);
  item.querySelector('[data-toggle]')?.setAttribute('aria-expanded', String(expanded));
  const details = item.querySelector('.merchant-extra-details');
  details?.setAttribute('aria-hidden', String(!expanded));
  details?.toggleAttribute('inert', !expanded);
}

// Close Modal Logic (Backdrop & Close Button)
document.getElementById('merchants-close')?.addEventListener('click', closeMerchantsModal);

document.getElementById('merchants-backdrop')?.addEventListener('click', (e) => {
  if (e.target.id === 'merchants-backdrop') {
    closeMerchantsModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMerchantsModal();
  }
});