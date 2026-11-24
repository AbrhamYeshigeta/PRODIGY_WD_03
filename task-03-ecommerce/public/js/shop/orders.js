import { API } from '../api.js';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const formatMoney = (cents) => `${(Number(cents || 0) / 100).toLocaleString('en-ET', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ETB`;

const formatDate = (value) => new Date(value).toLocaleString('en-ET', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const label = (value = '') => value.replace(/_/g, ' ');

function renderOrder(order) {
  const items = order.items || [];
  const previews = items.slice(0, 3).map((item) => `
    <div class="order-thumb">
      <img src="${escapeHTML(item.productImage || '/img/logo.png')}" alt="${escapeHTML(item.productName)}" loading="lazy" />
    </div>
  `).join('');
  const more = items.length > 3
    ? `<div class="order-thumb order-thumb-more">+${items.length - 3}</div>`
    : '';
  const itemSummary = items.map((item) => (
    `${escapeHTML(item.productName)} × ${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${escapeHTML(item.quantityUnit)}`
  )).join(' · ');
  const payment = order.payments?.[0];
  const statusText = order.status === 'cancelled'
    ? 'Cancelled'
    : order.paymentStatus === 'pending'
      ? 'Awaiting payment'
      : order.paymentStatus === 'failed'
        ? 'Payment failed'
        : order.status === 'paid'
          && order.paymentMethod === 'cod'
          && order.paymentStatus !== 'paid'
          ? 'Confirmed · pay on delivery'
          : label(order.status);

  return `
    <article class="order-card">
      <div class="order-card-head">
        <div>
          <div class="order-card-id">Order #${escapeHTML(order.id.slice(0, 8).toUpperCase())}</div>
          <div class="order-card-date">${escapeHTML(formatDate(order.createdAt))}</div>
        </div>
        <span class="order-status order-status-${escapeHTML(order.status)}">${escapeHTML(statusText)}</span>
      </div>
      <div class="order-card-body">
        <div class="order-thumbs">${previews}${more}</div>
        <div class="order-items-text">
          <div class="order-items-title">${items.length} item${items.length === 1 ? '' : 's'}</div>
          <div class="order-items-sub">${itemSummary || 'Order items unavailable'}</div>
        </div>
        <div class="order-card-total">
          <div class="order-total-label">Order total</div>
          <div class="order-total-value">${formatMoney(order.totalAmount)}</div>
        </div>
      </div>
      <div class="order-card-foot">
        <div class="order-address">
          <span>${escapeHTML(label(order.paymentMethod || ''))} · Payment ${escapeHTML(label(payment?.status || order.paymentStatus || 'pending'))}</span>
        </div>
        <div class="order-actions">
          <a class="order-btn order-btn-outline" href="/order-detail.html?id=${encodeURIComponent(order.id)}">
            ${order.status === 'shipped' ? 'Track Order & Confirm Receipt' : 'Track order'}
          </a>
          ${order.paymentStatus === 'pending' && payment?.transactionRef
            ? `<button type="button" class="order-btn order-btn-outline" data-verify="${escapeHTML(payment.transactionRef)}">Check payment</button>`
            : ''}
          ${order.paymentReference
            ? `<span class="order-items-sub">Ref: ${escapeHTML(order.paymentReference)}</span>`
            : ''}
        </div>
      </div>
    </article>
  `;
}

async function loadOrders() {
  const container = document.getElementById('orders-container');
  const count = document.getElementById('orders-count');
  container.innerHTML = '<div class="orders-empty" role="status">Loading your orders…</div>';

  try {
    const [{ user }, response] = await Promise.all([
      API.get('/api/auth/me'),
      API.get('/api/orders'),
    ]);
    const name = user.name || user.username || user.email;
    const avatar = document.getElementById('user-avatar');
    document.getElementById('user-name').textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    document.getElementById('dropdown-name')?.replaceChildren(document.createTextNode(name));
    document.getElementById('dropdown-email')?.replaceChildren(document.createTextNode(user.email || ''));
    document.getElementById('dropdown-avatar')?.replaceChildren(document.createTextNode(name.charAt(0).toUpperCase()));
    document.getElementById('user-menu')?.classList.add('logged-in');

    try {
      const cartResponse = await API.get('/api/cart');
      const badge = document.getElementById('cart-count');
      if (badge) badge.textContent = String(cartResponse.data?.items?.length || 0);
    } catch (error) {
      console.error('Cart count could not be refreshed:', error);
    }

    const orders = response.data || [];
    count.textContent = `${orders.length} order${orders.length === 1 ? '' : 's'}`;
    if (!orders.length) {
      container.innerHTML = `
        <section class="orders-empty">
          <div class="orders-empty-icon">📦</div>
          <h2>You haven't placed any orders yet</h2>
          <p>Your purchases and payment updates will appear here.</p>
          <a href="/" class="btn btn-green btn-lg">Start shopping</a>
        </section>
      `;
      return;
    }

    container.innerHTML = `<div class="orders-list">${orders.map(renderOrder).join('')}</div>`;
  } catch (error) {
    if (error.message.includes('(401)') || /not authorized/i.test(error.message)) {
      window.location.href = `/login.html?${new URLSearchParams({ redirect: '/orders.html' })}`;
      return;
    }
    console.error('Orders could not be loaded:', error);
    count.textContent = 'Unavailable';
    container.innerHTML = `
      <section class="orders-empty" role="alert">
        <div class="orders-empty-icon">⚠️</div>
        <h2>We couldn't load your orders</h2>
        <p>${escapeHTML(error.message || 'Please try again in a moment.')}</p>
        <button type="button" class="btn btn-green" id="retry-orders">Try again</button>
      </section>
    `;
    document.getElementById('retry-orders')?.addEventListener('click', loadOrders);
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const transactionRef = params.get('tx_ref');
  if (transactionRef) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '<div class="orders-empty" role="status">Confirming your payment securely…</div>';
    try {
      const result = await API.get(`/api/orders/verify/${encodeURIComponent(transactionRef)}`);
      const notice = document.createElement('p');
      notice.className = 'payment-result-notice';
      notice.setAttribute('role', 'status');
      notice.textContent = result.data?.status === 'paid'
        ? 'Payment confirmed. Your order is being prepared.'
        : 'Payment verification is still processing. You can check again below.';
      container.before(notice);
    } catch (error) {
      const notice = document.createElement('p');
      notice.className = 'payment-result-notice error';
      notice.setAttribute('role', 'alert');
      notice.textContent = `Payment status could not be confirmed yet: ${error.message}`;
      container.before(notice);
    }
    params.delete('tx_ref');
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }
  await loadOrders();
}

document.getElementById('user-menu')?.addEventListener('click', () => {
  document.getElementById('user-dropdown')?.classList.toggle('hidden');
});
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try {
    await API.post('/api/auth/logout', {});
    window.location.href = '/';
  } catch (error) {
    console.error('Sign out failed:', error);
    window.alert('Could not sign out. Please try again.');
  }
});
document.getElementById('orders-container')?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-verify]');
  if (!button) return;
  button.disabled = true;
  button.textContent = 'Checking…';
  try {
    await API.get(`/api/orders/verify/${encodeURIComponent(button.dataset.verify)}`);
    await loadOrders();
  } catch (error) {
    button.disabled = false;
    button.textContent = 'Check payment';
    window.alert(error.message || 'Payment status could not be checked.');
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.user-menu-wrap')) {
    document.getElementById('user-dropdown')?.classList.add('hidden');
  }
});

init();
