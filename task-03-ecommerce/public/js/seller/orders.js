import { renderShell } from './shell.js';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));

const money = (cents) => `${(Number(cents || 0) / 100).toLocaleString('en-ET', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ETB`;

const date = (value) => new Date(value).toLocaleString('en-ET', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function renderOrder(order) {
  const delivery = order.delivery || {};
  const items = order.items || [];
  const nextStatus = order.status === 'paid' ? 'processing'
    : order.status === 'processing' ? 'shipped'
      : order.status === 'shipped' ? 'delivered'
        : null;

  return `
    <article class="order-card">
      <header class="order-card-head">
        <div>
          <strong>Order #${escapeHTML(order.id.slice(0, 8).toUpperCase())}</strong>
          <div class="order-card-date">${escapeHTML(date(order.createdAt))}</div>
        </div>
        <div>
          <span class="pill ${escapeHTML(order.paymentStatus)}">${escapeHTML(order.paymentStatus)}</span>
          <span class="pill ${escapeHTML(order.status)}">${escapeHTML(order.status.replace(/_/g, ' '))}</span>
        </div>
      </header>
      <div class="order-card-body">
        <div class="order-items-text">
          ${items.map((item) => `
            <div class="prod-cell" style="margin-bottom:10px">
              <img class="prod-thumb" src="${escapeHTML(item.productImage || '/img/logo.png')}" alt="" />
              <div>
                <strong class="prod-name">${escapeHTML(item.productName)}</strong>
                <div class="prod-sub">${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${escapeHTML(item.unit)} · ${escapeHTML(item.status)}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="order-card-total">
          <div class="order-total-label">Your earnings</div>
          <div class="order-total-value">${money(order.total)}</div>
          <div class="order-items-sub">After marketplace commission</div>
        </div>
      </div>
      <footer class="order-card-foot">
        <div>
          <strong>${escapeHTML(order.buyer?.name || 'Customer')}</strong>
          <div class="order-items-sub">${escapeHTML(order.buyer?.email || '')} · ${escapeHTML(delivery.phone || order.buyer?.phone || '')}</div>
          <div class="order-items-sub">${escapeHTML(delivery.city || '')}${delivery.address ? ` · ${escapeHTML(delivery.address)}` : ''}</div>
          <div class="order-items-sub">Payment: ${escapeHTML(order.paymentMethod)} (${escapeHTML(order.paymentStatus)})${order.transactionRef ? ` · Ref: ${escapeHTML(order.transactionRef)}` : ''}</div>
        </div>
        ${nextStatus && order.paymentStatus === 'paid'
          ? `<button type="button" class="btn btn-gold" data-order="${escapeHTML(order.id)}" data-status="${nextStatus}">Mark ${nextStatus}</button>`
          : ''}
      </footer>
    </article>
  `;
}

async function loadOrders(page, notice = '') {
  page.innerHTML = `
    ${notice}
    <div class="page-top">
      <div class="ph">
        <div>
          <h1 class="welcome-line">Orders & transactions</h1>
          <p>Customer purchases and verified payment status update here automatically.</p>
        </div>
        <div class="actions"><button type="button" class="btn btn-ghost" id="refresh-orders">Refresh</button></div>
      </div>
    </div>
    <div id="seller-orders-list"><div class="empty-state">Loading your orders…</div></div>
  `;
  document.getElementById('refresh-orders')?.addEventListener('click', () => loadOrders(page));

  try {
    const response = await fetch('/api/sellers/me/orders', { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.location.href = '/seller/login.html';
      return;
    }
    if (!response.ok) throw new Error(body.message || `Orders could not be loaded (${response.status})`);

    const orders = body.data || [];
    const list = document.getElementById('seller-orders-list');
    if (!orders.length) {
      list.innerHTML = `
        <div class="empty-state" style="padding:48px 24px;background:#fff;border:1px solid var(--border)">
          <div class="es-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Verified customer purchases will appear here with their payment and delivery status.</p>
          <a class="btn btn-gold" href="/seller/offers.html">View my offers</a>
        </div>
      `;
      return;
    }

    list.innerHTML = `<div class="orders-list">${orders.map(renderOrder).join('')}</div>`;
  } catch (error) {
    console.error('Seller orders could not be loaded:', error);
    document.getElementById('seller-orders-list').innerHTML = `
      <div class="notif-banner" role="alert">
        <strong>Orders unavailable:</strong> ${escapeHTML(error.message)}
        <button type="button" class="btn btn-ghost" id="retry-orders">Try again</button>
      </div>
    `;
    document.getElementById('retry-orders')?.addEventListener('click', () => loadOrders(page));
  }
}

const page = renderShell({ active: 'orders' });
page.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-order]');
  if (!button) return;
  button.disabled = true;
  try {
    const update = await fetch(`/api/sellers/me/orders/${encodeURIComponent(button.dataset.order)}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: button.dataset.status }),
    });
    const result = await update.json().catch(() => ({}));
    if (!update.ok) throw new Error(result.message || 'Order status could not be updated.');
    await loadOrders(page, '<p class="notif-banner" role="status">Order status updated.</p>');
  } catch (error) {
    button.disabled = false;
    window.alert(error.message);
  }
});
loadOrders(page);