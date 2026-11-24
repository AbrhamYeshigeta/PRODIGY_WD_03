import { API } from '../api.js';
import { Cart } from '../cart.js';

let currentUser = null;

function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ETB';
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
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

function getSummary() {
  const items = Cart.getAll();
  const subtotal = Cart.getSubtotal();
  const standardShipping = subtotal >= 50000 ? 0 : 5000;
  const deliveryMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
  const shipping = standardShipping + (deliveryMethod === 'express' ? 12000 : 0);
  const total = subtotal + shipping;
  return { items, subtotal, shipping, total };
}

function renderOrderSummary() {
  const summary = getSummary();
  const itemsEl = document.getElementById('checkout-items');
  const countEl = document.getElementById('summary-count');
  const subtotalEl = document.getElementById('subtotal-value');
  const shippingEl = document.getElementById('shipping-value');
  const totalEl = document.getElementById('total-value');
  const shippingNoteEl = document.getElementById('shipping-note');

  if (!itemsEl || !countEl || !subtotalEl || !shippingEl || !totalEl || !shippingNoteEl) return;

  if (summary.items.length === 0) {
    itemsEl.innerHTML = `
      <div class="checkout-empty">
        <div class="checkout-empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some fresh produce to continue.</p>
        <a href="/" class="btn btn-green btn-lg">Continue shopping</a>
      </div>
    `;
    countEl.textContent = '0 items';
    subtotalEl.textContent = '0.00 ETB';
    shippingEl.textContent = '0.00 ETB';
    totalEl.textContent = '0.00 ETB';
    shippingNoteEl.textContent = 'Add items to checkout';
    document.getElementById('pay-with-chapa').disabled = true;
    return;
  }

  countEl.textContent = `${summary.items.length} item${summary.items.length === 1 ? '' : 's'}`;
  subtotalEl.textContent = formatPrice(summary.subtotal);
  shippingEl.textContent = summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping);
  totalEl.textContent = formatPrice(summary.total);
  const deliveryMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
  shippingNoteEl.textContent = deliveryMethod === 'express'
    ? 'Priority delivery selected'
    : summary.shipping === 0
      ? 'Free delivery unlocked'
      : `Add ${formatPrice(50000 - summary.subtotal)} more for free delivery`;

  itemsEl.innerHTML = summary.items.map((item) => `
    <div class="checkout-item-row">
      <div class="checkout-thumb">
        <img src="${esc(item.image)}" alt="${esc(item.name)}" />
      </div>
      <div class="checkout-item-meta">
        <strong>${esc(item.name)}</strong>
        <span>${esc(item.merchant || 'Prodigy Farms')}</span>
        <small>${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${esc(item.unit)}</small>
      </div>
      <div class="checkout-item-price">${formatPrice(Math.round(item.price * item.quantity))}</div>
    </div>
  `).join('');
}

async function loadSession() {
  const userName = document.getElementById('user-name');
  const userAvatar = document.getElementById('user-avatar');
  const userMenu = document.getElementById('user-menu');

  try {
    const { user } = await API.get('/api/auth/me');
    currentUser = user;
    const name = user.name || user.username || user.email;
    if (userName) userName.textContent = name;
    if (userAvatar) userAvatar.textContent = name[0]?.toUpperCase() || '?';
    if (userMenu) {
      userMenu.onclick = () => {
        window.location.href = user.role === 'admin' || user.role === 'staff' ? '/admin/index.html' : '/orders.html';
      };
    }

    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');

    if (nameInput) nameInput.value = user.name || user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
  } catch (error) {
    if (error.message.includes('(401)') || /not authorized/i.test(error.message)) {
      window.location.href = `/login.html?${new URLSearchParams({ redirect: '/checkout.html' })}`;
      return;
    }
    throw error;
  }
}

async function handleChapaPayment() {
  const items = Cart.getAll();
  if (items.length === 0) {
    showToast('Your cart is empty.', 'error');
    return;
  }

  const form = document.getElementById('checkout-form');
  if (!form.reportValidity()) return;

  let user = currentUser;
  if (!user) {
    try {
      const response = await API.get('/api/auth/me');
      user = response.user;
      currentUser = user;
    } catch (error) {
      if (error.message.includes('(401)') || /not authorized/i.test(error.message)) {
        window.location.href = `/login.html?${new URLSearchParams({ redirect: '/checkout.html' })}`;
        return;
      }
      console.error('[checkout] Could not confirm the customer session:', error);
      showToast(error.message || 'Your session could not be verified.', 'error');
      return;
    }
  }

  const button = document.getElementById('pay-with-chapa');

  if (!button) return;

  button.disabled = true;
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'chapa';
  button.textContent = paymentMethod === 'cod' ? 'Placing order...' : 'Opening Chapa...';

  try {
    const nameValue = document.getElementById('checkout-name').value.trim();
    const emailValue = document.getElementById('checkout-email').value.trim();
    const phoneValue = document.getElementById('checkout-phone').value.trim();
    const cityValue = document.getElementById('checkout-city').value.trim();
    const addressValue = document.getElementById('checkout-address').value.trim();
    const notesValue = document.getElementById('checkout-notes').value.trim();

    const name = String(nameValue || user.name || user.username || 'Customer');
    const email = String(emailValue || user.email || 'customer@prodigy.store');
    const phone = String(phoneValue || user.phone || '0911111111').replace(/\D/g, '');
    const normalizedPhone = phone.startsWith('251') ? `0${phone.slice(3)}` : phone.startsWith('0') ? phone : `0${phone}`;

    const deliveryMethod = document.querySelector('input[name="shipping"]:checked')?.value || 'standard';
    const result = await API.post('/api/orders/checkout', {
      paymentMethod,
      deliveryMethod,
      shippingAddress: {
        name,
        email,
        phone: normalizedPhone,
        city: cityValue,
        address: addressValue,
        notes: notesValue,
      },
    });

    if (paymentMethod === 'cod') {
      window.location.href = '/orders.html?placed=1';
      return;
    }
    if (!result.data?.checkoutUrl) throw new Error('Secure checkout link was not returned.');
    window.location.href = result.data.checkoutUrl;
  } catch (err) {
    if (err.message.includes('(401)') || /not authorized/i.test(err.message)) {
      window.location.href = `/login.html?${new URLSearchParams({ redirect: '/checkout.html' })}`;
      return;
    }
    console.error('[checkout] payment failed:', err);
    showToast(err.message || 'Unable to connect to Chapa.', 'error');
    button.disabled = false;
    button.textContent = document.querySelector('input[name="payment"]:checked')?.value === 'cod'
      ? 'Place cash-on-delivery order'
      : 'Pay securely with Chapa';
  }
}

function bindEvents() {
  const payBtn = document.getElementById('pay-with-chapa');
  const backBtn = document.getElementById('checkout-back');

  payBtn?.addEventListener('click', handleChapaPayment);
  backBtn?.addEventListener('click', () => {
    window.location.href = '/cart.html';
  });

  document.querySelectorAll('input[name="shipping"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.shipping-option').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked));
      renderOrderSummary();
    });
  });

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked));
      const button = document.getElementById('pay-with-chapa');
      if (button) button.textContent = radio.checked && radio.value === 'cod' ? 'Place cash-on-delivery order' : 'Pay securely with Chapa';
    });
  });
}

(async function init() {
  bindEvents();
  try {
    await Cart.fetchCart();
    renderOrderSummary();
    await loadSession();
  } catch (error) {
    console.error('Checkout could not be initialized:', error);
    showToast(error.message || 'Checkout could not be loaded.', 'error');
  }

  const items = Cart.getAll();
  if (items.length === 0) {
    document.getElementById('pay-with-chapa').disabled = true;
  }

  Cart.onChange(() => {
    renderOrderSummary();
    const itemsNow = Cart.getAll();
    const button = document.getElementById('pay-with-chapa');
    if (button) button.disabled = itemsNow.length === 0;
  });
})();
