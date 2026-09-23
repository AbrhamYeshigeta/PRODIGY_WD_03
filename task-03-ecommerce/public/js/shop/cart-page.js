import { API } from '../api.js';
import { Cart } from '../cart.js';

/* ---------- Session chip ---------- */
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
    document.getElementById('user-menu').onclick = () => {
      window.location.href = '/login.html';
    };
  }
})();

/* ---------- Helpers ---------- */
function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ETB';
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/* ---------- Render ---------- */
function render() {
  const items = Cart.getAll();
  const emptyEl   = document.getElementById('cart-empty');
  const itemsEl   = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary-wrap');

  if (items.length === 0) {
    emptyEl.style.display = '';
    itemsEl.style.display = 'none';
    summaryEl.style.display = 'none';
    return;
  }

  emptyEl.style.display = 'none';
  itemsEl.style.display = '';
  summaryEl.style.display = '';

  itemsEl.innerHTML = `
    <div class="cart-items-list">
      ${items.map((it) => `
        <div class="cart-row" data-id="${it.id}">
          <a href="/product.html?slug=${encodeURIComponent(it.slug)}" class="cart-row-img">
            <img src="${esc(it.image)}" alt="${esc(it.name)}" />
          </a>
          <div class="cart-row-info">
            <span class="cart-row-cat">${esc(it.category)}</span>
            <a href="/product.html?slug=${encodeURIComponent(it.slug)}" class="cart-row-name">${esc(it.name)}</a>
            <span class="cart-row-merchant">by ${esc(it.merchant)}</span>
          </div>
          <div class="cart-row-qty">
            <div class="qty-stepper">
              <button type="button" class="qty-btn" data-act="minus" data-id="${it.id}">−</button>
              <input type="number" class="qty-input" data-act="input" data-id="${it.id}"
                     value="${it.quantity}" min="0.5" max="99" step="0.5" inputmode="decimal" />
              <span class="qty-unit">kg</span>
              <button type="button" class="qty-btn" data-act="plus" data-id="${it.id}">+</button>
            </div>
          </div>
          <div class="cart-row-total">${formatPrice(Math.round(it.price * it.quantity))}</div>
          <button type="button" class="cart-row-remove" data-act="remove" data-id="${it.id}" title="Remove">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('')}
    </div>
  `;

  const subtotal = Cart.getSubtotal();
  const shipping = subtotal >= 50000 ? 0 : 5000;   // free over 500 ETB
  const total = subtotal + shipping;

  summaryEl.innerHTML = `
    <div class="cart-summary">
      <h3>Order Summary</h3>
      <div class="summary-row">
        <span>Subtotal</span><span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span><span>${shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
      </div>
      ${shipping > 0 ? `<div class="summary-note">Add ${formatPrice(50000 - subtotal)} more for free delivery</div>` : ''}
      <div class="summary-row total">
        <span>Total</span><span>${formatPrice(total)}</span>
      </div>
      <a href="/checkout.html" class="btn-checkout">
        Proceed to Checkout →
      </a>
      <button type="button" class="btn-clear-cart" id="clear-cart">Clear cart</button>
    </div>
  `;

  /* Wire up quantity changes */
  itemsEl.querySelectorAll('[data-act]').forEach((el) => {
    const act = el.dataset.act;
    const id = el.dataset.id;
    const item = Cart.getAll().find((i) => i.id === id);
    if (!item) return;

    if (act === 'minus') {
      el.addEventListener('click', () => {
        if (item.quantity > 0.5) {
          Cart.setQuantity(id, Math.round((item.quantity - 0.5) * 10) / 10);
          render();
        }
      });
    }

    if (act === 'plus') {
      el.addEventListener('click', () => {
        Cart.setQuantity(id, Math.round((item.quantity + 0.5) * 10) / 10);
        render();
      });
    }

    if (act === 'remove') {
      el.addEventListener('click', () => {
        Cart.remove(id);
        render();
      });
    }

    if (act === 'input') {
      el.addEventListener('change', () => {
        let v = parseFloat(el.value);
        if (isNaN(v) || v <= 0) { Cart.remove(id); }
        else {
          v = Math.max(0.5, Math.min(99, Math.round(v * 2) / 2));
          Cart.setQuantity(id, v);
        }
        render();
      });
    }
  });

  document.getElementById('clear-cart')?.addEventListener('click', () => {
    if (confirm('Clear the entire cart?')) {
      Cart.clear();
      render();
    }
  });
}

/* ---------- Header badge updates automatically via cart.js ---------- */
render();