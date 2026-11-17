// Helper to format money
const fmtETB = (cents) => (cents / 100).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Global Cart Function (Make sure this exists or link to your actual cart logic)
window.addToCart = async function(offerId) {
  // Replace this with your actual cart logic (e.g., fetching POST /api/cart)
  alert(`Offer ${offerId} added to cart!`);
};

async function loadProductOffers() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const titleEl = document.getElementById('product-title');
  const imageEl = document.getElementById('product-image');
  const offersList = document.getElementById('offers-list');
  const marketBanner = document.getElementById('market-average-banner');

  if (!slug) {
    if (offersList) offersList.innerHTML = `<p class="text-red">No product selected.</p>`;
    return;
  }

  try {
    // 1. Show Loading State
    if (offersList) offersList.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--ink-3);">Loading offers...</div>`;

    // 2. Fetch Data
    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Product not found');

    const product = json.data;

    // 3. Update Product Header Info
    if (titleEl) titleEl.textContent = product.name;
    if (imageEl) imageEl.src = product.image || '/img/placeholder.png';

    // 4. Check if there are offers
    if (!product.offers || product.offers.length === 0) {
      if (offersList) {
        offersList.innerHTML = `
          <div class="empty-state" style="padding: 40px 20px;">
            <div class="es-icon">📦</div>
            <h3>No offers available</h3>
            <p>There are currently no verified merchants selling this product.</p>
          </div>
        `;
      }
      if (marketBanner) marketBanner.style.display = 'none';
      return;
    }

    // 5. Calculate Market Average (using pricePerKg for fair comparison)
    const totalPricePerKg = product.offers.reduce((sum, offer) => sum + offer.pricePerKg, 0);
    const averageMarketPrice = Math.round(totalPricePerKg / product.offers.length);

    // Render Market Banner
    if (marketBanner) {
      marketBanner.style.display = 'flex';
      marketBanner.innerHTML = `
        <div class="market-icon">📊</div>
        <div>
          <h4>Market Average: ${fmtETB(averageMarketPrice)} ETB / kg</h4>
          <p>Based on ${product.offers.length} verified merchants</p>
        </div>
      `;
    }

    // 6. Render the Merchant List
    if (offersList) {
      offersList.innerHTML = product.offers.map(offer => {
        const pricePerUnit = fmtETB(offer.pricePerUnit);
        const pricePerKg = fmtETB(offer.pricePerKg);
        
        // Build the unit display (e.g., "100 ETB / piece" or "8,500 ETB / quintal")
        let unitLabel = offer.unit;
        let equivText = '';

        // If it's a piece/bunch/pack, show the estimated weight
        if (['piece', 'bunch', 'pack'].includes(offer.unit)) {
          const estWeight = offer.estimatedWeightKg ? ` (≈ ${offer.estimatedWeightKg}kg)` : '';
          equivText = `<div style="font-size: 12px; color: var(--ink-3); margin-top: 4px;">(≈ ${pricePerKg} ETB/kg${estWeight})</div>`;
        } else {
          // If it's kg/quintal/ton, just show the normalized kg price
          equivText = `<div style="font-size: 12px; color: var(--ink-3); margin-top: 4px;">(≈ ${pricePerKg} ETB/kg)</div>`;
        }

        // Check if it's below market average
        const isGoodDeal = offer.pricePerKg < averageMarketPrice;
        const dealBadge = isGoodDeal ? `<span class="badge" style="background:#dcfce7; color:#15803d; font-size:10px; padding:2px 6px; border-radius:4px; margin-bottom:8px; display:inline-block;">🔥 Below Market Avg</span>` : '';

        return `
          <div class="offer-card" style="display:flex; justify-content:space-between; align-items:center; padding:20px; border:1px solid var(--border); border-radius:12px; margin-bottom:16px; background:var(--card);">
            
            <!-- Merchant Info -->
            <div class="merchant-info" style="flex:1;">
              <h4 style="margin:0 0 4px 0; font-size:16px; color:var(--ink); display:flex; align-items:center; gap:8px;">
                🚜 ${offer.seller.businessName} 
                ${offer.seller.verificationStatus === 'verified' ? '<span style="font-size:11px; background:#dcfce7; color:#15803d; padding:2px 6px; border-radius:4px;">✓ Verified</span>' : ''}
              </h4>
              <div style="font-size:13px; color:var(--ink-3);">
                ⭐ ${offer.seller.rating || 'New'} · 📍 ${offer.seller.city}
              </div>
            </div>

            <!-- Price Info -->
            <div class="offer-pricing" style="text-align:right; padding: 0 20px;">
              ${dealBadge}
              <div style="font-family:var(--serif); font-size:20px; font-weight:700; color:var(--brand);">
                ${pricePerUnit} ETB <span style="font-size:14px; font-weight:500; color:var(--ink-3);">/ ${unitLabel}</span>
              </div>
              ${equivText}
            </div>

            <!-- Action -->
            <div>
              <button class="btn btn-gold" onclick="addToCart('${offer.id}')">
                Select
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Failed to load product details', err);
    if (offersList) {
      offersList.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; border: 1px solid #fecaca; background: #fef2f2;">
          <h3 style="color: #dc2626;">Error loading product</h3>
          <p>${err.message}</p>
          <button class="btn btn-ghost" onclick="window.location.reload()">Try Again</button>
        </div>
      `;
    }
  }
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', loadProductOffers);