import { API } from '../api.js';
import { Cart } from '../cart.js';

/* ---------- Session chip ---------- */
(async function checkSession() {
  try {
    const { user } = await API.get('/api/auth/me');
    const name = user.name || user.username || user.email;
    document.getElementById('user-name').textContent = name;
    document.getElementById('user-avatar').textContent = name[0].toUpperCase();
    document.getElementById('user-menu').onclick = () => {
      window.location.href = '/orders.html';
    };
  } catch (error) {
    if (!error.message.includes('(401)') && !/not authorized/i.test(error.message)) {
      console.error('[cart] Could not load the customer session:', error);
    }
    document.getElementById('user-menu').onclick = () => {
      window.location.href = `/login.html?${new URLSearchParams({ redirect: '/cart.html' })}`;
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

function formatQuantity(quantity) {
  return Number(quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 });
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

async function setCartQuantity(itemId, quantity) {
  const updated = await Cart.setQuantity(itemId, quantity);
  if (!updated) {
    showToast('Could not update the cart quantity. Please try again.', 'error');
    render();
  }
}

/* ---------- Render ---------- */
function render() {
  const items = Cart.getAll();
  const emptyEl   = document.getElementById('cart-empty');
  const itemsEl   = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary-wrap');

  if (Cart.isLoading) {
    emptyEl.style.display = 'none';
    itemsEl.style.display = '';
    summaryEl.style.display = 'none';
    itemsEl.innerHTML = '<div class="cart-load-error" role="status">Loading your cart…</div>';
    return;
  }

  if (Cart.loadError) {
    emptyEl.style.display = 'none';
    itemsEl.style.display = '';
    summaryEl.style.display = 'none';
    itemsEl.innerHTML = `
      <div class="cart-load-error" role="alert">
        <strong>We couldn't load your cart.</strong>
        <p>${esc(Cart.loadError)}</p>
        <button type="button" class="btn btn-green" id="retry-cart">Try again</button>
      </div>
    `;
    document.getElementById('retry-cart')?.addEventListener('click', () => Cart.fetchCart());
    return;
  }

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
            <button type="button" class="qty-btn" data-act="minus" data-id="${it.id}" ${it.quantity <= it.quantityStep ? 'disabled' : ''}>−</button>
              <input type="number" class="qty-input" data-act="input" data-id="${it.id}"
            value="${formatQuantity(it.quantity)}" min="${it.quantityStep}" max="${it.stock}" step="${it.quantityStep}" inputmode="decimal" />
            <span class="qty-unit">${esc(it.unit || 'unit')}</span>
            <button type="button" class="qty-btn" data-act="plus" data-id="${it.id}" ${it.quantity >= it.stock ? 'disabled' : ''}>+</button>
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
      el.addEventListener('click', async () => {
        if (item.quantity > item.quantityStep) {
          await setCartQuantity(id, item.quantity - item.quantityStep);
        }
      });
    }

    if (act === 'plus') {
      el.addEventListener('click', async () => {
        if (item.quantity < item.stock) {
          await setCartQuantity(id, Math.min(item.stock, item.quantity + item.quantityStep));
        }
      });
    }

    if (act === 'remove') {
      el.addEventListener('click', async () => {
        el.disabled = true;
        if (!await Cart.remove(id)) {
          showToast('Could not remove this item. Please try again.', 'error');
          el.disabled = false;
        }
      });
    }

    if (act === 'input') {
      el.addEventListener('change', async () => {
        const quantity = Number(el.value);
        const step = item.quantityStep;
        if (!Number.isFinite(quantity) || quantity < step || quantity > item.stock
          || Math.abs(quantity / step - Math.round(quantity / step)) > 1e-8) {
          showToast(`Choose a quantity from ${formatQuantity(step)} to ${formatQuantity(item.stock)} ${item.unit} in ${formatQuantity(step)} ${item.unit} steps.`, 'error');
          render();
          return;
        }
        await setCartQuantity(id, quantity);
      });
    }
  });

  document.getElementById('clear-cart')?.addEventListener('click', async () => {
    if (!confirm('Clear the entire cart?')) return;
    try {
      await Cart.clear();
    } catch (error) {
      console.error('[cart] Could not clear cart:', error);
      showToast(error.message || 'Could not clear the cart.', 'error');
    }
  });
}

Cart.onChange(render);
render();
Cart.fetchCart();