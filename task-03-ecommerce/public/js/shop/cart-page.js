import { API } from '../api.js';
import { Cart } from '../cart.js';

let currentUser = null;

/* ---------- Session chip ---------- */
(async function checkSession() {
  try {
    const { user } = await API.get('/api/auth/me');
    currentUser = user;
    document.getElementById('user-name').textContent = user.username;
    document.getElementById('user-avatar').textContent = user.username[0];
    document.getElementById('user-menu').onclick = () => {
      window.location.href = user.role === 'admin' || user.role === 'staff'
        ? '/admin/index.html'
        : '/orders.html';
    };
  } catch {
    sessionStorage.setItem('post_login_redirect', '/cart.html');
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

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '⚠'}</span><span>${esc(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function handleChapaPayment() {
  const items = Cart.getAll();
  if (items.length === 0) {
    showToast('Your cart is empty.', 'error');
    return;
  }

  let user = currentUser;
  if (!user) {
    try {
      const response = await API.get('/api/auth/me');
      user = response.user;
      currentUser = user;
    } catch {
      sessionStorage.setItem('post_login_redirect', '/cart.html');
      window.location.href = '/login.html';
      return;
    }
  }

  const subtotal = Cart.getSubtotal();
  const shipping = subtotal >= 50000 ? 0 : 5000;
  const total = subtotal + shipping;
  const amount = Number((total / 100).toFixed(2));
  const button = document.getElementById('pay-with-chapa');

  if (!button) return;

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Opening Chapa...';

  try {
    const txRef = `PRODIGY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const name = String(user.username || 'Customer');
    const phone = String(user.phone || '0911111111').replace(/\D/g, '');
    const normalizedPhone = phone.startsWith('251') ? `0${phone.slice(3)}` : phone.startsWith('0') ? phone : `0${phone}`;

    const { checkout_url } = await API.post('/api/payments/initialize', {
      tx_ref: txRef,
      amount,
      currency: 'ETB',
      email: user.email || 'customer@prodigy.store',
      first_name: name.split(' ')[0] || 'Customer',
      last_name: name.split(' ').slice(1).join(' ') || 'Customer',
      phone_number: normalizedPhone,
      return_url: `${window.location.origin}/?payment=success&tx_ref=${encodeURIComponent(txRef)}`,
      callback_url: `${window.location.origin}/api/payments/webhook`,
      customization: {
        title: 'Prodigy Store',
        description: `Payment for ${items.length} item(s) in your cart`,
      },
      items: items.map((it) => ({
        offerId: it.id,
        sellerId: it.merchant || 'prodigy',
        quantity: it.quantity,
        price: it.price,
      })),
    });

    if (!checkout_url) throw new Error('Chapa checkout link was not returned.');
    window.location.href = checkout_url;
  } catch (err) {
    console.error('[cart] Chapa payment failed:', err);
    showToast(err.message || 'Unable to connect to Chapa. Please try again.', 'error');
    button.disabled = false;
    button.textContent = originalText;
  }
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
      <button type="button" class="btn-checkout" id="pay-with-chapa">
        Proceed to checkout • ${formatPrice(total)}
      </button>
      <button type="button" class="btn-clear-cart" id="clear-cart">Clear cart</button>
    </div>
  `;

  document.getElementById('pay-with-chapa')?.addEventListener('click', () => {
    window.location.href = '/checkout.html';
  });

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