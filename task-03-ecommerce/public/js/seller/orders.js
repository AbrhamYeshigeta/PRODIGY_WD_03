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

const date = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Date unavailable'
    : parsed.toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' });
};

const titleCase = (value = '') => value.replace(/_/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

let allOrders = [];
let currentFilter = 'all';
let searchTerm = '';

function getOrderSearchText(order) {
  return [
    order.id,
    order.buyer?.name,
    order.buyer?.email,
    order.delivery?.city,
    ...(order.items || []).map((item) => item.productName),
  ].join(' ').toLowerCase();
}

function renderOrder(order) {
  const delivery = order.delivery || {};
  const items = order.items || [];
  const fulfillmentStatus = order.fulfillmentStatus || 'pending_payment';
  const isCodUnpaid = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';
  const displayStatus = (status) => isCodUnpaid && status === 'paid'
    ? 'Confirmed'
    : titleCase(status);
  const nextStatus = fulfillmentStatus === 'paid'
    ? 'processing'
    : fulfillmentStatus === 'processing'
      ? 'shipped'
      : null;
  const canFulfill = nextStatus && !['pending', 'failed', 'cancelled'].includes(order.paymentStatus);
  const paymentLabel = titleCase(order.paymentStatus || 'unknown');
  const fulfillmentLabel = displayStatus(fulfillmentStatus);
  const settlementNote = order.settlementStatus === 'held'
    ? 'Online payment is held until the buyer confirms delivery.'
    : order.settlementStatus === 'eligible'
      ? 'Eligible for the platform payout process.'
      : order.paymentMethod === 'cod'
        ? 'Cash on delivery is collected outside the platform.'
        : '';

  return `
    <article class="seller-order-card" data-status="${escapeHTML(fulfillmentStatus)}">
      <header class="seller-order-card__head">
        <div class="seller-order-card__reference">
          <span class="seller-order-card__eyebrow">Order</span>
          <strong>#${escapeHTML(order.id.slice(0, 8).toUpperCase())}</strong>
          <time datetime="${escapeHTML(order.createdAt)}">${escapeHTML(date(order.createdAt))}</time>
        </div>
        <div class="seller-order-card__badges" aria-label="Order status">
          <span class="seller-order-badge ${escapeHTML(order.paymentStatus || 'unknown')}">${escapeHTML(paymentLabel)}</span>
          <span class="seller-order-badge ${escapeHTML(fulfillmentStatus)}">${escapeHTML(fulfillmentLabel)}</span>
        </div>
      </header>

      <div class="seller-order-card__main">
        <section class="seller-order-products" aria-label="Products in this order">
          <h2 class="seller-order-section-title">Items <span>${items.length}</span></h2>
          <div class="seller-order-products__list">
            ${items.map((item) => `
              <div class="seller-order-product">
                <img
                  class="seller-order-product__image"
                  src="${escapeHTML(item.productImage || '/img/logo.png')}"
                  alt="${escapeHTML(item.productName)}"
                  loading="lazy"
                />
                <div class="seller-order-product__details">
                  <strong>${escapeHTML(item.productName)}</strong>
                  <span>${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${escapeHTML(item.unit)}</span>
                  <small>${escapeHTML(displayStatus(item.status || fulfillmentStatus))}</small>
                </div>
                <strong class="seller-order-product__price">${money(item.sellerAmount ?? item.lineTotal)}</strong>
              </div>
            `).join('')}
          </div>
        </section>

        <aside class="seller-order-earnings">
          <span class="seller-order-earnings__label">Your earnings</span>
          <strong>${money(order.total)}</strong>
          <small>After marketplace commission</small>
        </aside>
      </div>

      <section class="seller-order-customer" aria-label="Customer and delivery details">
        <div class="seller-order-customer__item">
          <span class="seller-order-customer__icon" aria-hidden="true">👤</span>
          <div><small>Customer</small><strong>${escapeHTML(order.buyer?.name || 'Customer')}</strong></div>
        </div>
        <div class="seller-order-customer__item">
          <span class="seller-order-customer__icon" aria-hidden="true">☎</span>
          <div><small>Contact</small><strong>${escapeHTML(delivery.phone || order.buyer?.phone || 'Not provided')}</strong></div>
        </div>
        <div class="seller-order-customer__item">
          <span class="seller-order-customer__icon" aria-hidden="true">⌖</span>
          <div><small>Delivery address</small><strong>${escapeHTML([delivery.city, delivery.address].filter(Boolean).join(', ') || 'Not provided')}</strong></div>
        </div>
        <div class="seller-order-customer__item">
          <span class="seller-order-customer__icon" aria-hidden="true">✉</span>
          <div><small>Email</small><strong>${escapeHTML(order.buyer?.email || 'Not provided')}</strong></div>
        </div>
      </section>

      <footer class="seller-order-card__foot">
        <div class="seller-order-payment">
          <span>Payment: <strong>${escapeHTML(titleCase(order.paymentMethod || 'unknown'))}</strong></span>
          ${order.transactionRef ? `<span>Reference: <strong>${escapeHTML(order.transactionRef)}</strong></span>` : ''}
          ${order.courierName ? `<span>Courier: <strong>${escapeHTML(order.courierName)}</strong></span>` : ''}
          ${order.courierPhone ? `<span>Driver phone: <strong>${escapeHTML(order.courierPhone)}</strong></span>` : ''}
          ${order.vehicleReference ? `<span>Vehicle / trip: <strong>${escapeHTML(order.vehicleReference)}</strong></span>` : ''}
          ${order.trackingReference ? `<span>Tracking: <strong>${escapeHTML(order.trackingReference)}</strong></span>` : ''}
          ${order.estimatedDeliveryAt ? `<span>ETA: <strong>${escapeHTML(date(order.estimatedDeliveryAt))}</strong></span>` : ''}
          ${settlementNote ? `<span class="seller-order-payment__note">${escapeHTML(settlementNote)}</span>` : ''}
        </div>
        ${canFulfill
          ? `<button type="button" class="btn ${nextStatus === 'processing' ? 'btn-primary' : 'btn-gold'} seller-order-action" data-order-action="${nextStatus}" data-order="${escapeHTML(order.id)}">
              ${nextStatus === 'processing' ? 'Start processing' : 'Mark as shipped'}
              <span aria-hidden="true">→</span>
            </button>`
          : ''}
      </footer>
    </article>
  `;
}

function filteredOrders() {
  return allOrders.filter((order) => {
    const matchesStatus = currentFilter === 'all'
      || (currentFilter === 'pending' && ['pending_payment', 'paid'].includes(order.fulfillmentStatus))
      || order.fulfillmentStatus === currentFilter;
    return matchesStatus && (!searchTerm || getOrderSearchText(order).includes(searchTerm));
  });
}

function renderOrders() {
  const list = document.getElementById('seller-orders-list');
  const visibleOrders = filteredOrders();
  const count = document.getElementById('seller-orders-count');
  if (!list || !count) return;

  count.textContent = `${visibleOrders.length} order${visibleOrders.length === 1 ? '' : 's'}`;

  if (!allOrders.length) {
    list.innerHTML = `
      <div class="seller-orders-empty">
        <div class="seller-orders-empty__icon" aria-hidden="true">📦</div>
        <h2>No orders yet</h2>
        <p>When customers place an order from your offers, it will appear here with payment and delivery details.</p>
        <a class="btn btn-gold" href="/seller/offers.html">View my offers</a>
      </div>
    `;
    return;
  }

  if (!visibleOrders.length) {
    list.innerHTML = `
      <div class="seller-orders-empty seller-orders-empty--compact">
        <h2>No matching orders</h2>
        <p>Try changing your search or order status filter.</p>
        <button type="button" class="btn btn-ghost" data-clear-filters>Clear filters</button>
      </div>
    `;
    return;
  }

  list.innerHTML = `<div class="seller-orders-list">${visibleOrders.map(renderOrder).join('')}</div>`;
  list.querySelectorAll('.seller-order-product__image').forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallbackApplied) return;
      image.dataset.fallbackApplied = 'true';
      image.src = '/img/logo.png';
    });
  });
}

function updateStats() {
  const countBy = (...statuses) => allOrders.filter((order) => statuses.includes(order.fulfillmentStatus)).length;
  const earnings = allOrders
    .filter((order) => !['cancelled', 'failed'].includes(order.paymentStatus))
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  document.getElementById('orders-stat-total').textContent = String(allOrders.length);
  document.getElementById('orders-stat-pending').textContent = String(countBy('paid', 'pending_payment'));
  document.getElementById('orders-stat-processing').textContent = String(countBy('processing'));
  document.getElementById('orders-stat-earnings').textContent = money(earnings);
}

async function loadOrders(notice = '') {
  const refresh = document.getElementById('refresh-orders');
  const noticeEl = document.getElementById('orders-notice');
  if (refresh) {
    refresh.disabled = true;
    refresh.textContent = 'Refreshing…';
  }
  if (noticeEl) {
    noticeEl.hidden = !notice;
    noticeEl.textContent = notice;
  }

  try {
    const response = await fetch('/api/sellers/me/orders', { credentials: 'include' });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.location.href = '/seller/login.html';
      return;
    }
    if (!response.ok) throw new Error(body.message || `Orders could not be loaded (${response.status})`);

    allOrders = Array.isArray(body.data) ? body.data : [];
    updateStats();
    renderOrders();
  } catch (error) {
    console.error('Seller orders could not be loaded:', error);
    document.getElementById('seller-orders-list').innerHTML = `
      <div class="seller-orders-error" role="alert">
        <strong>We couldn't load your orders.</strong>
        <span>${escapeHTML(error.message)}</span>
        <button type="button" class="btn btn-ghost" id="retry-orders">Try again</button>
      </div>
    `;
  } finally {
    if (refresh) {
      refresh.disabled = false;
      refresh.textContent = 'Refresh';
    }
  }
}

const page = renderShell({ active: 'orders' });
page.innerHTML = `
  <section class="seller-orders-page" aria-labelledby="seller-orders-title">
    <header class="seller-orders-header">
      <div>
        <span class="seller-orders-eyebrow">SELLER CENTER</span>
        <h1 id="seller-orders-title">Orders &amp; transactions</h1>
        <p>Manage customer orders, prepare deliveries, and keep every buyer updated.</p>
      </div>
      <button type="button" class="btn btn-ghost" id="refresh-orders" aria-label="Refresh orders">
        <span aria-hidden="true">↻</span> Refresh
      </button>
    </header>

    <p class="seller-orders-notice" id="orders-notice" role="status" hidden></p>

    <section class="seller-orders-stats" aria-label="Order overview">
      <article class="seller-orders-stat">
        <span class="seller-orders-stat__icon">🧾</span>
        <div><small>Total orders</small><strong id="orders-stat-total">—</strong></div>
      </article>
      <article class="seller-orders-stat">
        <span class="seller-orders-stat__icon is-amber">⏳</span>
        <div><small>Needs attention</small><strong id="orders-stat-pending">—</strong></div>
      </article>
      <article class="seller-orders-stat">
        <span class="seller-orders-stat__icon is-blue">📦</span>
        <div><small>Being prepared</small><strong id="orders-stat-processing">—</strong></div>
      </article>
      <article class="seller-orders-stat">
        <span class="seller-orders-stat__icon is-gold">↗</span>
        <div><small>Order value</small><strong id="orders-stat-earnings">—</strong></div>
      </article>
    </section>

    <section class="seller-orders-toolbar" aria-label="Find orders">
      <div class="seller-orders-toolbar__title">
        <h2>Recent orders</h2>
        <span id="seller-orders-count" aria-live="polite">Loading…</span>
      </div>
      <div class="seller-orders-toolbar__controls">
        <label class="seller-orders-search">
          <span aria-hidden="true">⌕</span>
          <span class="visually-hidden">Search orders</span>
          <input type="search" id="seller-order-search" placeholder="Search order, customer, product…" autocomplete="off" />
        </label>
        <label class="seller-orders-filter">
          <span class="visually-hidden">Filter by order status</span>
          <select id="seller-order-filter">
            <option value="all">All statuses</option>
            <option value="pending">Needs attention</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
    </section>

    <div id="seller-orders-list" aria-live="polite">
      <div class="seller-orders-loading"><span class="seller-orders-spinner" aria-hidden="true"></span>Loading your orders…</div>
    </div>

    <dialog class="seller-shipment-dialog" id="shipment-dialog" aria-labelledby="shipment-title">
      <form id="shipment-form">
        <div class="seller-shipment-dialog__top">
          <span class="seller-orders-stat__icon is-blue" aria-hidden="true">🚚</span>
          <button type="button" class="seller-shipment-dialog__close" data-close-shipment aria-label="Close dialog">×</button>
        </div>
        <h2 id="shipment-title">Mark order as shipped</h2>
        <p>Share verified delivery contact details and an arrival estimate. These details will be visible to the customer.</p>
        <label for="courier-name">Courier company or driver name <span aria-hidden="true">*</span></label>
        <input id="courier-name" name="courierName" required minlength="2" maxlength="80" autocomplete="organization" placeholder="e.g. Sami Express or Sami Bekele" />
        <label for="courier-phone">Courier or driver phone <span aria-hidden="true">*</span></label>
        <input id="courier-phone" name="courierPhone" required type="tel" inputmode="tel" autocomplete="tel" maxlength="24" placeholder="e.g. +251 911 234 567" />
        <label for="vehicle-reference">Vehicle plate or trip reference <span>(optional)</span></label>
        <input id="vehicle-reference" name="vehicleReference" maxlength="80" placeholder="e.g. 3-A12345 or Trip 2841" />
        <label for="shipment-eta">Estimated delivery date and time <span aria-hidden="true">*</span></label>
        <input id="shipment-eta" name="estimatedDeliveryAt" type="datetime-local" required />
        <label for="shipment-reference">Courier tracking reference <span>(optional)</span></label>
        <input id="shipment-reference" name="trackingReference" maxlength="120" placeholder="Courier tracking number" />
        <p class="seller-shipment-dialog__error" id="shipment-error" role="alert" hidden></p>
        <div class="seller-shipment-dialog__actions">
          <button type="button" class="btn btn-ghost" data-close-shipment>Cancel</button>
          <button type="submit" class="btn btn-gold" id="confirm-shipment">Confirm shipment</button>
        </div>
      </form>
    </dialog>
  </section>
`;

page.addEventListener('input', (event) => {
  if (event.target.id !== 'seller-order-search') return;
  searchTerm = event.target.value.trim().toLowerCase();
  renderOrders();
});

page.addEventListener('change', (event) => {
  if (event.target.id !== 'seller-order-filter') return;
  currentFilter = event.target.value;
  renderOrders();
});

page.addEventListener('click', async (event) => {
  const closeButton = event.target.closest('[data-close-shipment]');
  if (closeButton) {
    document.getElementById('shipment-dialog').close();
    return;
  }

  if (event.target.closest('#refresh-orders, #retry-orders')) {
    await loadOrders();
    return;
  }

  if (event.target.closest('[data-clear-filters]')) {
    currentFilter = 'all';
    searchTerm = '';
    document.getElementById('seller-order-filter').value = 'all';
    document.getElementById('seller-order-search').value = '';
    renderOrders();
    return;
  }

  const button = event.target.closest('[data-order-action]');
  if (!button) return;
  if (button.dataset.orderAction === 'shipped') {
    const dialog = document.getElementById('shipment-dialog');
    const form = document.getElementById('shipment-form');
    form.dataset.order = button.dataset.order;
    form.reset();
    document.getElementById('shipment-error').hidden = true;
    const etaInput = document.getElementById('shipment-eta');
    const localDateTimeValue = (value) => {
      const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
      return localValue.toISOString().slice(0, 16);
    };
    const now = new Date();
    etaInput.min = localDateTimeValue(new Date(now.getTime() + 15 * 60 * 1000));
    etaInput.value = localDateTimeValue(new Date(now.getTime() + 2 * 60 * 60 * 1000));
    dialog.showModal();
    return;
  }

  button.disabled = true;
  try {
    const update = await fetch(`/api/sellers/me/orders/${encodeURIComponent(button.dataset.order)}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: button.dataset.orderAction }),
    });
    const result = await update.json().catch(() => ({}));
    if (!update.ok) throw new Error(result.message || 'Order status could not be updated.');
    await loadOrders('Order moved to processing.');
  } catch (error) {
    button.disabled = false;
    window.alert(error.message);
  }
});

page.addEventListener('submit', async (event) => {
  if (event.target.id !== 'shipment-form') return;
  event.preventDefault();
  const form = event.target;
  const button = document.getElementById('confirm-shipment');
  const errorEl = document.getElementById('shipment-error');
  const etaValue = form.elements.estimatedDeliveryAt.value;
  const phoneValue = form.elements.courierPhone.value.trim();
  const phoneDigits = phoneValue.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errorEl.textContent = 'Enter a valid courier phone number with 7–15 digits.';
    errorEl.hidden = false;
    form.elements.courierPhone.focus();
    return;
  }
  if (!etaValue || new Date(etaValue).getTime() <= Date.now()) {
    errorEl.textContent = 'Choose an estimated delivery time in the future.';
    errorEl.hidden = false;
    form.elements.estimatedDeliveryAt.focus();
    return;
  }
  button.disabled = true;
  button.textContent = 'Saving…';
  errorEl.hidden = true;

  try {
    const update = await fetch(`/api/sellers/me/orders/${encodeURIComponent(form.dataset.order)}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'shipped',
        courierName: form.elements.courierName.value.trim(),
        courierPhone: phoneValue,
        vehicleReference: form.elements.vehicleReference.value.trim() || undefined,
        trackingReference: form.elements.trackingReference.value.trim() || undefined,
        estimatedDeliveryAt: new Date(etaValue).toISOString(),
      }),
    });
    const result = await update.json().catch(() => ({}));
    if (!update.ok) throw new Error(result.message || 'Order status could not be updated.');
    document.getElementById('shipment-dialog').close();
    await loadOrders('Shipment details saved and customer order updated.');
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.hidden = false;
  } finally {
    button.disabled = false;
    button.textContent = 'Confirm shipment';
  }
});

loadOrders();
