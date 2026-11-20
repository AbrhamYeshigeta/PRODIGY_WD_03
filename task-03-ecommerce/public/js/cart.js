// public/js/cart.js

export const Cart = {
  // We store the cart data in memory so we don't have to fetch it on every single interaction
  currentCart: { items: [], total: 0 },
  listeners: new Set(),

  getAll() {
    return (this.currentCart.items || []).map((item) => {
      const offer = item.offer;
      const kgFactors = { kg: 1, quintal: 100, ton: 1000 };
      const kgFactor = kgFactors[offer.unit];
      const isWeightBased = kgFactor !== undefined;

      return {
        id: item.id,
        offerId: offer.id,
        quantity: item.quantity,
        price: isWeightBased ? offer.pricePerKg : offer.pricePerUnit,
        image: offer.product.image,
        name: offer.product.name,
        slug: offer.product.slug,
        category: offer.product.category,
        merchant: offer.seller?.businessName || 'Etfruit seller',
        unit: isWeightBased ? 'kg' : offer.unit,
        stock: isWeightBased
          ? Math.floor((offer.stock * kgFactor + 1e-8) / 0.5) * 0.5
          : offer.stock,
        quantityStep: isWeightBased ? 0.5 : 1,
        estimatedWeightKg: offer.estimatedWeightKg,
      };
    });
  },

  getSubtotal() {
    return Number(this.currentCart.total || 0);
  },

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },

  notifyChange() {
    this.listeners.forEach((listener) => listener(this.getAll()));
  },

  /* ============================================
     Fetch the cart from PostgreSQL via Prisma
     ============================================ */
  async fetchCart() {
    try {
      const res = await fetch('/api/cart', { credentials: 'include' });
      
      // If the user is not logged in (401), just return empty
      if (res.status === 401) {
        this.currentCart = { items: [], total: 0 };
        this.updateHeaderBadge();
        this.notifyChange();
        return this.currentCart;
      }

      const json = await res.json();
      if (json.success) {
        this.currentCart = json.data;
        this.updateHeaderBadge();
        this.notifyChange();

        // If we are on the cart page, render the items
        if (window.location.pathname.includes('cart.html')) {
          this.renderCartPage();
        }
      }
      return this.currentCart;
    } catch (err) {
      console.error("[Cart] Failed to fetch from DB:", err);
      return { items: [], total: 0 };
    }
  },

  /* ============================================
     Update the red badge in the header
     ============================================ */
  updateHeaderBadge() {
    const badge = document.getElementById('cart-count');
    if (badge) {
      // Count total quantity (e.g., 2kg + 3kg = 5)
      // Or just count distinct items: this.currentCart.items.length
      // Let's count distinct items for the badge
      badge.textContent = this.currentCart.items.length;
    }
  },

  /* ============================================
     Render the Cart Page (if on cart.html)
     ============================================ */
  renderCartPage() {
    const container = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping');
    const totalEl = document.getElementById('cart-total');
    
    if (!container) return;

    if (this.currentCart.items.length === 0) {
      container.innerHTML = `
        <div class="empty-cart" style="text-align:center; padding: 40px;">
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any fresh produce yet.</p>
          <a href="/" class="btn-checkout" style="display:inline-block; margin-top:20px; width:auto;">Start Shopping</a>
        </div>
      `;
      if (subtotalEl) subtotalEl.textContent = '0.00 ETB';
      if (shippingEl) shippingEl.textContent = '0.00 ETB';
      if (totalEl) totalEl.textContent = '0.00 ETB';
      return;
    }

    // Render the actual items
    container.innerHTML = this.currentCart.items.map(item => {
      const offer = item.offer;
      const product = offer.product;
      const seller = offer.seller;
      
      // Convert cents to ETB
      const kgFactors = { kg: 1, quintal: 100, ton: 1000 };
      const kgFactor = kgFactors[offer.unit];
      const quantityUnit = kgFactor === undefined ? offer.unit : 'kg';
      const unitPrice = kgFactor === undefined ? offer.pricePerUnit : offer.pricePerKg;
      const lineTotal = ((unitPrice * item.quantity) / 100).toFixed(2);
      const quantityStep = kgFactor === undefined ? 1 : 0.5;

      return `
        <div class="cart-row">
          <div class="cart-row-img">
            <img src="${product.image || '/img/placeholder.png'}" alt="${product.name}" />
          </div>
          <div class="cart-row-info">
            <div class="cart-row-cat">${product.category}</div>
            <a href="/product.html?slug=${product.slug}" class="cart-row-name">${product.name}</a>
            <div class="cart-row-merchant">Sold by ${seller.businessName}</div>
          </div>
          
          <div class="cart-row-qty">
            <div class="qty-stepper" style="border: 1px solid var(--border); border-radius: 999px; display: inline-flex; align-items: center;">
              <button class="qty-btn" onclick="window.Cart.updateQty('${item.id}', ${item.quantity - quantityStep})" style="padding: 5px 10px;">−</button>
              <span style="padding: 0 10px; font-weight: bold;">${item.quantity}</span>
              <button class="qty-btn" onclick="window.Cart.updateQty('${item.id}', ${item.quantity + quantityStep})" style="padding: 5px 10px;">+</button>
            </div>
            <span class="qty-unit" style="font-size:12px; color:var(--text-muted); margin-left:5px;">${quantityUnit}</span>
          </div>
          
          <div class="cart-row-total">
            ${lineTotal} ETB
          </div>
          
          <button class="cart-row-remove" onclick="window.Cart.removeItem('${item.id}')" aria-label="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `;
    }).join('');

    // Update Totals
    const subtotal = (this.currentCart.total / 100).toFixed(2);
    const shipping = 50.00; // Flat 50 ETB delivery
    const total = (Number(subtotal) + shipping).toFixed(2);

    if (subtotalEl) subtotalEl.textContent = `${subtotal} ETB`;
    if (shippingEl) shippingEl.textContent = `${shipping.toFixed(2)} ETB`;
    if (totalEl) totalEl.textContent = `${total} ETB`;
  },

  /* ============================================
     Actions (Update, Remove)
     ============================================ */
  async updateQty(cartItemId, newQty) {
    if (newQty <= 0) {
      return this.removeItem(cartItemId);
    }
    
    try {
      const response = await fetch(`/api/cart/update/${cartItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
        credentials: 'include'
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Could not update the cart quantity.');
      }
      await this.fetchCart();
      return true;
    } catch (err) {
      console.error("Failed to update quantity", err);
      return false;
    }
  },

  setQuantity(cartItemId, quantity) {
    return this.updateQty(cartItemId, quantity);
  },

  async remove(cartItemId) {
    return this.removeItem(cartItemId);
  },

  async clear() {
    await Promise.all((this.currentCart.items || []).map((item) => fetch(`/api/cart/remove/${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })));
    return this.fetchCart();
  },

  async removeItem(cartItemId) {
    try {
      await fetch(`/api/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      this.fetchCart(); // Refresh data from DB
    } catch (err) {
      console.error("Failed to remove item", err);
    }
  }
};

// Make it globally accessible so inline HTML onclick handlers can call it
window.Cart = Cart;

/* ============================================
   Auto-initialize on Page Load
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  Cart.fetchCart();
});