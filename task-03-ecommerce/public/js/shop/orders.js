// public/js/shop/merchants-modal.js

const fmtETB = (n) => (n / 100).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';

let currentMerchants = [];

/* ============================================
   1. Fetch Merchants from DB and Render
   ============================================ */
window.openMerchantsModal = async function(slug, productName) {
  const backdrop = document.getElementById('merchants-backdrop');
  const list = document.getElementById('merchants-list');
  const title = document.getElementById('merchants-title');
  const count = document.getElementById('merchants-count');

  title.textContent = productName;
  list.innerHTML = '<div style="text-align:center; padding: 30px;">Loading merchants from database...</div>';
  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    // Fetch the product AND all its sellers (offers) from Prisma
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.message);
    
    currentMerchants = data.data.offers;

    if (currentMerchants.length === 0) {
      count.textContent = `0 merchants`;
      list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">No sellers are offering this product right now.</p>';
      return;
    }

    count.textContent = `${currentMerchants.length} merchant${currentMerchants.length === 1 ? '' : 's'}`;
    
    // Render each merchant row
    list.innerHTML = currentMerchants.map(offer => {
      const seller = offer.seller;
      const isVerified = seller.verificationStatus === 'verified';
      
      return `
        <div class="merchant-item" data-offer-id="${offer.id}">
          <div class="merchant-summary">
            <div class="merchant-avatar">🚜</div>
            <div class="merchant-main">
              <div class="merchant-name-row">
                <span class="merchant-shop">${seller.businessName}</span>
                ${isVerified ? '<span class="merchant-verified">Verified</span>' : '<span class="merchant-verified pending">Pending</span>'}
              </div>
              <div class="merchant-meta-row">
                <span>📍 ${seller.city}</span>
                <span class="dot">·</span>
                <span>⭐ ${seller.rating || 'New'}</span>
              </div>
            </div>
            <div class="merchant-stock">
              <span class="merchant-price">${fmtETB(offer.pricePerUnit)}<small>/ ${offer.unit}</small></span>
            </div>
            <button class="merchant-select-btn" data-select>
              Select →
            </button>
          </div>
        </div>
      `;
    }).join('');

    attachMerchantListeners();

  } catch (err) {
    list.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error: ${err.message}</p>`;
  }
};

/* ============================================
   2. Handle Merchant Selection
   ============================================ */
function attachMerchantListeners() {
  const list = document.getElementById('merchants-list');
  
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select]');
    if (!btn) return;

    const item = btn.closest('.merchant-item');
    const offerId = item.dataset.offerId;
    const selectedOffer = currentMerchants.find(o => o.id === offerId);

    if (selectedOffer) {
      // 1. Close Merchants Modal
      document.getElementById('merchants-backdrop').classList.add('hidden');
      
      // 2. Open Quick-View Modal (Function from home.js)
      // We pass all the exact data needed
      setTimeout(() => {
        window.openQuickViewModal({
          offerId: selectedOffer.id,
          name: selectedOffer.product.name,
          image: selectedOffer.product.image,
          category: selectedOffer.product.category,
          pricePerUnit: selectedOffer.pricePerUnit,
          unit: selectedOffer.unit,
          sellerName: selectedOffer.seller.businessName,
          sellerCity: selectedOffer.seller.city
        });
      }, 150); // Small delay for smooth transition
    }
  });
}

// Close Modal Logic
document.getElementById('merchants-close')?.addEventListener('click', () => {
  document.getElementById('merchants-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
});