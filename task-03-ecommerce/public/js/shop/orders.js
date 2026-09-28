import { API } from '../api.js';
import { Orders } from '../order-store.js';

/* ---------- Helpers ---------- */
function formatPrice(cents) {
  return (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' ETB';
}

function formatDate(ts) {
  const value = Number.isNaN(Number(ts)) ? ts : Number(ts);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function statusLabel(s) {
  const map = {
    pending_payment: 'Pending Payment',
    paid:            'Paid',
    processing:      'Processing',
    shipped:         'Shipped',
    delivered:       'Delivered',
    cancelled:       'Cancelled',
  };
  return map[s] || s;
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

let currentUser = null;

/* ---------- Session + user dropdown (protected) ---------- */
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

    render();
  } catch {
    sessionStorage.setItem('post_login_redirect', '/orders.html');
    window.location.href = '/login.html';
  }
})();

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

/* ---------- Cart badge ---------- */
(function updateCartBadge() {
  try {
    const key = getActiveCartKey();
    const cart = key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
    const badge = document.getElementById('cart-count');
    if (badge) badge.textContent = cart.length;
  } catch {}
})();

function getCurrentUserOrders() {
  if (!currentUser) return [];
  return Orders.getForUser(currentUser);
}

function renderUserSummary() {
  if (!currentUser) return '';

  return `
    <div class="orders-user-summary">
      <div class="orders-user-badge">${esc(currentUser.username[0].toUpperCase())}</div>
      <div>
        <div class="orders-user-name">${esc(currentUser.username)}</div>
        <div class="orders-user-email">${esc(currentUser.email)}</div>
      </div>
    </div>
  `;
}

/* ---------- Render one order card ---------- */
function renderOrder(order) {
  const previewItems = order.items.slice(0, 3);
  const moreCount = order.items.length - previewItems.length;
  const totalQty = order.items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);

  const thumbs = previewItems.map((it) => `
    <div class="order-thumb">
      <img src="${esc(it.image)}" alt="${esc(it.name)}" />
    </div>
  `).join('') + (moreCount > 0
    ? `<div class="order-thumb order-thumb-more">+${moreCount}</div>`
    : '');

  const itemsTitle = order.items.length === 1
    ? order.items[0].name
    : `${order.items[0].name} + ${order.items.length - 1} more`;

  const addr = order.shippingAddress || {};

  return `
    <div class="order-card">
      <div class="order-card-head">
        <div>
          <div class="order-card-id">Order ${esc(order.id)}</div>
          <div class="order-card-date">Placed on ${formatDate(order.createdAt)}</div>
        </div>
        <span class="order-status order-status-${esc(order.status)}">
          ${esc(statusLabel(order.status))}
        </span>
      </div>

      <div class="order-card-body">
        <div class="order-thumbs">${thumbs}</div>
        <div class="order-items-text">
          <div class="order-items-title">${esc(itemsTitle)}</div>
          <div class="order-items-sub">
            ${totalQty} item${totalQty === 1 ? '' : 's'}
            · ${esc(order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer')}
          </div>
        </div>
        <div class="order-card-total">
          <div class="order-total-label">Total</div>
          <div class="order-total-value">${formatPrice(order.total)}</div>
        </div>
      </div>

      <div class="order-card-foot">
        <div class="order-address">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>${esc(addr.fullName || 'Customer')}</span>
          <span>•</span>
          <span>${esc(addr.city || 'Addis Ababa')}</span>
        </div>
        <div class="order-actions">
          <button type="button" class="order-btn order-btn-outline" data-reorder="${esc(order.id)}">
            🔄 Reorder
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ---------- Render list ---------- */
function render() {
  const orders = getCurrentUserOrders();
  const container = document.getElementById('orders-container');
  const countEl = document.getElementById('orders-count');

  if (countEl) {
    countEl.textContent = orders.length === 0
      ? 'No orders yet'
      : `${orders.length} order${orders.length === 1 ? '' : 's'}`;
  }

  if (!container) return;

  const userSummary = renderUserSummary();

  if (orders.length === 0) {
    container.innerHTML = `
      ${userSummary}
      <div class="orders-empty">
        <div class="orders-empty-icon">📦</div>
        <h2>No orders yet</h2>
        <p>When you place your first order, it will appear here.</p>
        <a href="/" class="btn btn-green btn-lg">Start Shopping →</a>
      </div>`;
    return;
  }

  container.innerHTML = `
    ${userSummary}
    <div class="orders-list">${orders.map(renderOrder).join('')}</div>
  `;

  // Wire Reorder buttons
  container.querySelectorAll('[data-reorder]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = Orders.getById(btn.dataset.reorder);
      if (!order) return;

      const key = getActiveCartKey();
      const cart = key ? JSON.parse(localStorage.getItem(key) || '[]') : [];
      order.items.forEach((it) => {
        const existing = cart.find((c) => c.id === it.id);
        if (existing) {
          existing.quantity = Math.round((existing.quantity + it.quantity) * 10) / 10;
        } else {
          cart.push({ ...it, addedAt: Date.now() });
        }
      });
      if (key) localStorage.setItem(key, JSON.stringify(cart));
      showToast('Items added to cart');
      setTimeout(() => { window.location.href = '/cart.html'; }, 600);
    });
  });
}

render();