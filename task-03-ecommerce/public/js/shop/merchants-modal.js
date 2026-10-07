// public/js/shop/merchants-modal.js
// Intercepts product-card clicks → opens merchants list → then opens the
// existing quick-view product modal when a merchant is chosen.
// Does NOT modify home.js or any existing modal code.

/* ------------------------------------------------------------------ */
/*  Mock data — swap for fetch(`/api/products/${slug}/offers`) later  */
/* ------------------------------------------------------------------ */
function mockMerchantsFor(productName) {
  return [
    {
      id: 'm1',
      icon: '🚜',
      shopName: 'Highland Roots',
      ownerName: 'Getachew Alemu',
      type: 'Farm',
      location: 'Holeta, Oromia',
      verified: true,
      rating: 4.7, reviews: 43,
      fulfillment: 98,
      responseMins: 120,
      stockQty: 12, stockUnit: 'quintal', stockState: 'in',
      price: 8500, priceUnit: 'quintal',
      tin: '0012345678',
      nationalId: '1234 5678 9012',
      phone: '+251 911 223 344',
      address: 'Holeta, Oromia · 42 km from Addis Ababa',
      memberSince: '2024',
      bank: 'Commercial Bank of Ethiopia',
    },
    {
      id: 'm2',
      icon: '🏪',
      shopName: 'Merkato Fresh',
      ownerName: 'Fatuma Bekele',
      type: 'Wholesaler',
      location: 'Merkato, Addis Ababa',
      verified: true,
      rating: 4.5, reviews: 28,
      fulfillment: 95,
      responseMins: 90,
      stockQty: 40, stockUnit: 'quintal', stockState: 'in',
      price: 8300, priceUnit: 'quintal',
      tin: '0098765432',
      nationalId: '9876 5432 1098',
      phone: '+251 911 234 567',
      address: 'Merkato, Addis Ababa · Dubai Tera',
      memberSince: '2023',
      bank: 'Awash Bank',
    },
    {
      id: 'm3',
      icon: '🌾',
      shopName: 'Rift Valley Farms',
      ownerName: 'Abdi Hassan',
      type: 'Farm',
      location: 'Ziway, Oromia',
      verified: false,
      rating: 4.2, reviews: 6,
      fulfillment: 88,
      responseMins: 240,
      stockQty: 3, stockUnit: 'quintal', stockState: 'low',
      price: 7800, priceUnit: 'quintal',
      tin: '0055443322',
      nationalId: '5544 3322 1100',
      phone: '+251 911 345 678',
      address: 'Ziway, Oromia · Lake shore road',
      memberSince: '2025',
      bank: 'Dashen Bank',
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmtETB = (n) =>
  Number(n).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ETB';

const initials = (name) =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* ------------------------------------------------------------------ */
/*  Render one merchant card                                           */
/* ------------------------------------------------------------------ */
function renderMerchant(m) {
  const verifiedClass = m.verified ? '' : 'pending';
  const verifiedLabel = m.verified ? 'Verified' : 'Pending';
  const stockClass = m.stockState;
  const stockLabel =
    m.stockState === 'low' ? `Only ${m.stockQty} left` :
    m.stockState === 'out' ? 'Out of stock' :
    `${m.stockQty} ${m.stockUnit} in stock`;

  return `
    <div class="merchant-item" data-merchant-id="${m.id}">

      <!-- ░░ SUMMARY ROW ░░ -->
      <div class="merchant-summary" data-toggle>
        <div class="merchant-avatar">${m.icon}</div>

        <div class="merchant-main">
          <div class="merchant-name-row">
            <span class="merchant-shop">${m.shopName}</span>
            <span class="merchant-verified ${verifiedClass}">${verifiedLabel}</span>
          </div>
          <div class="merchant-meta-row">
            <span>${m.type}</span>
            <span class="dot">·</span>
            <span>📍 ${m.location}</span>
          </div>
          <div class="merchant-meta-row" style="margin-top:4px">
            <span class="stars">★★★★★</span>
            <span><strong style="color:var(--text)">${m.rating}</strong> (${m.reviews})</span>
            <span class="dot">·</span>
            <span>${m.fulfillment}% on-time</span>
          </div>
        </div>

        <div class="merchant-stock">
          <span class="merchant-stock-qty ${stockClass}">${stockLabel}</span>
          <span class="merchant-price">${fmtETB(m.price)}<small>/ ${m.priceUnit}</small></span>
        </div>

        <div class="merchant-chevron" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      <!-- ░░ EXPANDED DETAIL ░░ -->
      <div class="merchant-detail">
        <div class="merchant-detail-inner">
          <div class="merchant-detail-pad">

            <div class="merchant-detail-grid">
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">Owner name</span>
                <span class="merchant-detail-value">${m.ownerName}</span>
              </div>
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">Business type</span>
                <span class="merchant-detail-value">${m.type} · Since ${m.memberSince}</span>
              </div>
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">TIN Number</span>
                <span class="merchant-detail-value mono">${m.tin}</span>
              </div>
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">National ID (Fayda)</span>
                <span class="merchant-detail-value mono">${m.nationalId}</span>
              </div>
              <div class="merchant-detail-row" style="grid-column: 1 / -1">
                <span class="merchant-detail-label">Address</span>
                <span class="merchant-detail-value">📍 ${m.address}</span>
              </div>
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">Phone</span>
                <span class="merchant-detail-value">${m.phone}</span>
              </div>
              <div class="merchant-detail-row">
                <span class="merchant-detail-label">Payout bank</span>
                <span class="merchant-detail-value">${m.bank}</span>
              </div>
            </div>

            <div class="merchant-trust-strip">
              <span class="merchant-trust-pill">⭐ <strong>${m.rating}</strong> rating</span>
              <span class="merchant-trust-pill">📦 <strong>${m.fulfillment}%</strong> on-time</span>
              <span class="merchant-trust-pill">💬 responds in <strong>~${Math.round(m.responseMins/60)}h</strong></span>
              <span class="merchant-trust-pill">🛡️ <strong>Chapa</strong> secured</span>
            </div>

            <button type="button" class="merchant-select-btn" data-select>
              Select this merchant →
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/*  Open / close the merchants modal                                   */
/* ------------------------------------------------------------------ */
let currentCard = null;

function openMerchantsModal(card) {
  currentCard = card;

  // Pull product info from the card
  const nameEl = card.querySelector('.product-name');
  const productName = nameEl ? nameEl.textContent.trim() : 'Product';

  const backdrop = document.getElementById('merchants-backdrop');
  const list = document.getElementById('merchants-list');
  const title = document.getElementById('merchants-title');
  const count = document.getElementById('merchants-count');

  const merchants = mockMerchantsFor(productName);
  window.merchantsData = merchants;

  title.textContent = productName;
  count.textContent = `${merchants.length} merchant${merchants.length === 1 ? '' : 's'}`;
  list.innerHTML = merchants.map(renderMerchant).join('');

  backdrop.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeMerchantsModal() {
  const backdrop = document.getElementById('merchants-backdrop');
  backdrop.classList.add('hidden');
  document.body.style.overflow = '';
  currentCard = null;
}

/* ------------------------------------------------------------------ */
/*  Wire everything                                                    */
/* ------------------------------------------------------------------ */
function init() {
  const backdrop = document.getElementById('merchants-backdrop');
  const closeBtn = document.getElementById('merchants-close');
  const list = document.getElementById('merchants-list');
  if (!backdrop) return;

  /* --- 1. Intercept product-card clicks in CAPTURE phase --- */
  document.addEventListener('click', (e) => {
    const authState = window.prodigyStoreState;
    if (authState && !authState.isAuthed) return;

    const card = e.target.closest('.product-card');
    if (!card) return;

    // Skip if home.js has been given the go-ahead via the flag we set
    if (card.dataset.merchantChosen === '1') {
      delete card.dataset.merchantChosen;
      return;                         // let the original click through
    }

    // Also skip the "add to cart" button on the card — home.js handles it
    if (e.target.closest('.product-add')) return;

    // Otherwise: block the product modal and show merchants first
    e.preventDefault();
    e.stopPropagation();
    openMerchantsModal(card);
  }, true);

  /* --- 2. Toggle expand on merchant summary row --- */
  list.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-toggle]');
    const selectBtn = e.target.closest('[data-select]');

    if (selectBtn) {
      // MERCHANT CHOSEN → close merchants modal → re-trigger the card click
      const card = currentCard;
      const item = selectBtn.closest('.merchant-item');
      const merchantId = item?.dataset.merchantId;

      const chosenMerchant = (window.merchantsData || []).find((m) => m.id === merchantId) || null;

      if (card && chosenMerchant) {
        card._selectedMerchant = {
          shopName: chosenMerchant.shopName,
          location: chosenMerchant.location,
          price: chosenMerchant.price,
        };
        card.dataset.selectedMerchant = JSON.stringify(card._selectedMerchant);
      }

      closeMerchantsModal();

      // Give the browser a tick so the modal animates out before product modal opens
      if (card) {
        setTimeout(() => {
          card.dataset.merchantChosen = '1';   // tells the interceptor to stand down
          card.click();                        // home.js opens the quick-view
        }, 120);
      }
      return;
    }

    if (toggle) {
      const item = toggle.closest('.merchant-item');
      item.classList.toggle('expanded');
    }
  });

  /* --- 3. Close on backdrop / close button / Escape --- */
  closeBtn?.addEventListener('click', closeMerchantsModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeMerchantsModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !backdrop.classList.contains('hidden')) {
      closeMerchantsModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}