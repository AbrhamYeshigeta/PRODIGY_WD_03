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
  const shipping = subtotal >= 50000 ? 0 : 5000;
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
  shippingNoteEl.textContent = summary.shipping === 0
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
        <small>${item.quantity} kg</small>
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
    if (userName) userName.textContent = user.username;
    if (userAvatar) userAvatar.textContent = user.username?.[0]?.toUpperCase() || '?';
    if (userMenu) {
      userMenu.onclick = () => {
        window.location.href = user.role === 'admin' || user.role === 'staff' ? '/admin/index.html' : '/orders.html';
      };
    }

    const nameInput = document.getElementById('checkout-name');
    const emailInput = document.getElementById('checkout-email');
    const phoneInput = document.getElementById('checkout-phone');

    if (nameInput) nameInput.value = user.username || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
  } catch {
    sessionStorage.setItem('post_login_redirect', '/checkout.html');
    window.location.href = '/login.html';
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
    } catch {
      sessionStorage.setItem('post_login_redirect', '/checkout.html');
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
    const nameValue = document.getElementById('checkout-name').value.trim();
    const emailValue = document.getElementById('checkout-email').value.trim();
    const phoneValue = document.getElementById('checkout-phone').value.trim();
    const cityValue = document.getElementById('checkout-city').value.trim();
    const addressValue = document.getElementById('checkout-address').value.trim();
    const notesValue = document.getElementById('checkout-notes').value.trim();

    const name = String(nameValue || user.username || 'Customer');
    const email = String(emailValue || user.email || 'customer@prodigy.store');
    const phone = String(phoneValue || user.phone || '0911111111').replace(/\D/g, '');
    const normalizedPhone = phone.startsWith('251') ? `0${phone.slice(3)}` : phone.startsWith('0') ? phone : `0${phone}`;

    sessionStorage.setItem('prodigy_checkout_session', JSON.stringify({
      name,
      email,
      phone: normalizedPhone,
      city: cityValue,
      address: addressValue,
      notes: notesValue,
      amount,
      tx_ref: txRef,
    }));

    const { checkout_url } = await API.post('/api/payments/initialize', {
      tx_ref: txRef,
      amount,
      currency: 'ETB',
      email,
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
    console.error('[checkout] payment failed:', err);
    showToast(err.message || 'Unable to connect to Chapa.', 'error');
    button.disabled = false;
    button.textContent = originalText;
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
    });
  });

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.payment-option').forEach((label) => label.classList.toggle('selected', label.querySelector('input').checked));
    });
  });
}

(async function init() {
  bindEvents();
  renderOrderSummary();

  try {
    await loadSession();
  } catch {
    // handled in loadSession
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
