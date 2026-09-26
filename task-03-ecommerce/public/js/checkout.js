import { API } from '../api.js';
import { Orders } from '../order-store.js';

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

function getActiveCartKey() {
  try {
    const raw = sessionStorage.getItem('prodigy_active_user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = (user.email || user.username || user.id || 'guest').trim().toLowerCase();
    return `prodigy_cart_v1_for_${id.replace(/[^a-z0-9._-]+/g, '_')}`;
  } catch {
    return null;
  }
}

function readCart() {
  const key = getActiveCartKey();
  if (!key) return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); }
  catch { return []; }
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

let currentUser = null;

/* ---------- Session + user dropdown ---------- */
(async function initSession() {
  const userMenu      = document.getElementById('user-menu');
  const userName      = document.getElementById('user-name');
  const userAvatar    = document.getElementById('user-avatar');
  const dropdown      = document.getElementById('user-dropdown');
  const dropdownName  = document.getElementById('dropdown-name');
  const dropdownEmail = document.getElementById('dropdown-email');
  const dropdownAvatar= document.getElementById('dropdown-avatar');
  const logoutBtn     = document.getElementById('logout-btn');

  try {
    const { user } = await API.get('/api/auth/me');
    currentUser = user;
    sessionStorage.setItem('prodigy_active_user', JSON.stringify({
      id: user._id || user.id || user.email,
      username: user.username,
      email: user.email,
    }));

    userName.textContent = user.username;
    userAvatar.textContent = user.username[0].toUpperCase();
    userMenu.classList.add('logged-in');

    if (dropdownName)   dropdownName.textContent   = user.username;
    if (dropdownEmail)  dropdownEmail.textContent  = user.email;
    if (dropdownAvatar) dropdownAvatar.textContent = user.username[0].toUpperCase();

    // Prefill name
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput && !fullNameInput.value) fullNameInput.value = user.username;

    userMenu.onclick = (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    };
    document.addEventListener('click', (e) => {
      if (!dropdown) return;
      if (!dropdown.contains(e.target) && !userMenu.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
    logoutBtn?.addEventListener('click', async () => {
      try { await API.post('/api/auth/logout', {}); } catch {}
      sessionStorage.removeItem('prodigy_active_user');
      window.location.href = '/';
    });

  } catch {
    sessionStorage.setItem('post_login_redirect', '/checkout.html');
    window.location.href = '/login.html';
  }
})();

/* ---------- Cart badge ---------- */
(function updateCartBadge() {
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = readCart().length;
})();

/* ---------- Render Order Summary ---------- */
const SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE       = 5000;

function renderSummary() {
  const items = readCart();
  const container = document.getElementById('checkout-items');

  if (items.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  container.innerHTML = items.map((it) => `
    <div class="checkout-item">
      <div class="checkout-item-img">
        <img src="${esc(it.image)}" alt="${esc(it.name)}" />
        <span class="checkout-item-qty">×${it.quantity}</span>
      </div>
      <div class="checkout-item-info">
        <div class="checkout-item-name">${esc(it.name)}</div>
        <div class="checkout-item-meta">${formatPrice(it.price)} / kg</div>
      </div>
      <div class="checkout-item-total">${formatPrice(Math.round(it.price * it.quantity))}</div>
    </div>
  `).join('');

  const subtotal = items.reduce((s, i) => s + Math.round(i.price * i.quantity), 0);
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total    = subtotal + shipping;

  document.getElementById('sum-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('sum-shipping').textContent =
    shipping === 0 ? 'Free' : formatPrice(shipping);
  document.getElementById('sum-total').textContent = formatPrice(total);
}

renderSummary();

/* ---------- Place Order ---------- */
document.getElementById('checkout-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const btn  = document.getElementById('place-order-btn');

  // Validate required fields
  const required = ['fullName', 'phone', 'city', 'street', 'country'];
  for (const name of required) {
    const field = form[name];
    if (!field.value.trim()) {
      field.focus();
      field.style.borderColor = '#dc2626';
      setTimeout(() => { field.style.borderColor = ''; }, 1500);
      showToast(`Please fill in all required fields`, 'error');
      return;
    }
  }

  // Validate phone
  const phone = form.phone.value.trim();
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    form.phone.focus();
    form.phone.style.borderColor = '#dc2626';
    setTimeout(() => { form.phone.style.borderColor = ''; }, 1500);
    showToast('Phone must be in format +251911223344', 'error');
    return;
  }

  const items = readCart();
  if (items.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Placing order…';
  await new Promise((r) => setTimeout(r, 500));

  try {
    const shippingAddress = {
      fullName:   form.fullName.value.trim(),
      phone:      form.phone.value.trim(),
      street:     form.street.value.trim(),
      city:       form.city.value.trim(),
      postalCode: form.postalCode.value.trim(),
      country:    form.country.value.trim(),
    };

    const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked')?.value
      || 'cash_on_delivery';

    const order = Orders.create(items, shippingAddress, {
      paymentMethod,
      customerNote: form.customerNote?.value.trim() || '',
      customer: {
        id: currentUser?.id || '',
        username: currentUser?.username || form.fullName.value.trim(),
        email: currentUser?.email || '',
      },
    });

    // Clear cart for current user
    const key = getActiveCartKey();
    if (key) localStorage.setItem(key, '[]');

    showToast(`Order ${order.id} placed!`, 'success');

    setTimeout(() => {
      window.location.href = '/orders.html';
    }, 800);

  } catch (err) {
    console.error('[checkout] error:', err);
    showToast('Could not place order', 'error');
    btn.disabled = false;
    btn.textContent = 'Place Order →';
  }
});