import { API } from './api.js';

const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}));

const money = (cents, currency = 'ETB') => `${(Number(cents || 0) / 100).toLocaleString('en-ET', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} ${escapeHTML(currency)}`;

const dateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-ET', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const humanize = (value = '') => value.replace(/_/g, ' ');
const orderId = new URLSearchParams(window.location.search).get('id');
const detail = document.getElementById('order-detail');
const fulfillmentSteps = [
  { title: 'Order placed', timestamp: (fulfillment) => fulfillment.createdAt },
  { title: 'Processing', timestamp: (fulfillment) => fulfillment.processingAt },
  { title: 'Shipped', timestamp: (fulfillment) => fulfillment.shippedAt },
  { title: 'Delivered', timestamp: (fulfillment) => fulfillment.deliveredAt },
];

function renderFulfillmentTimeline(fulfillment, order) {
  const status = fulfillment.status;
  const currentStep = ({
    pending_payment: 0,
    paid: 1,
    processing: 1,
    shipped: 2,
    delivered: 3,
    completed: 3,
  })[status] ?? -1;
  const descriptions = [
    status === 'pending_payment'
      ? 'Waiting for your payment.'
      : 'Your package has been received.',
    status === 'processing'
      ? 'Your order is being prepared and packed by the merchant.'
      : status === 'paid'
        ? order.paymentMethod === 'cod'
          ? 'Order confirmed. The merchant will prepare your package shortly.'
          : 'The merchant will begin preparing your package shortly.'
        : 'The merchant has prepared your package.',
    'Out for delivery. The driver is on the way to your address.',
    status === 'delivered'
      ? 'Receipt confirmed. This package will complete after the 24-hour review period.'
      : status === 'completed'
        ? 'Receipt confirmed. This package is complete.'
        : 'Package arrived. Please weigh and inspect your items.',
  ];

  return `
    <ol class="fulfillment-progress" aria-label="Package progress">
      ${fulfillmentSteps.map((step, index) => {
        const state = status === 'cancelled'
          ? 'waiting'
          : index < currentStep
            ? 'complete'
            : index === currentStep
              ? 'active'
              : 'waiting';
        const timestamp = step.timestamp(fulfillment);
        return `
          <li class="fulfillment-progress-step ${state}">
            <span class="fulfillment-progress-marker" aria-hidden="true">${state === 'complete' ? '✓' : ''}</span>
            <div class="fulfillment-progress-content">
              <strong>${escapeHTML(step.title)}</strong>
              ${index === currentStep ? `<p>${escapeHTML(descriptions[index])}</p>` : ''}
              ${timestamp ? `<time datetime="${escapeHTML(timestamp)}">${escapeHTML(dateTime(timestamp))}</time>` : ''}
            </div>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function renderOrder(order) {
  const items = order.items || [];
  const fulfillments = order.fulfillments || [];
  const heldPayment = order.paymentMethod === 'chapa'
    && order.paymentStatus === 'paid'
    && order.settlementStatus !== 'eligible';
  const settlementNote = order.settlementStatus === 'eligible'
    ? 'The 24-hour review period is complete. Seller payout is now eligible; funds are not automatically transferred by this app.'
    : heldPayment
      ? 'Funds are held securely. Confirm each package after checking it; payout becomes eligible after the 24-hour review period.'
      : order.paymentMethod === 'cod'
        ? 'Cash is due when each package is delivered.'
        : '';
  const statusLabel = order.status === 'paid'
    && order.paymentMethod === 'cod'
    && order.paymentStatus !== 'paid'
    ? 'Confirmed · pay on delivery'
    : humanize(order.status);
  const trackingSubtext = fulfillments.length > 1
    ? 'Your order contains items from multiple merchants. Track each package below.'
    : 'Track your package and delivery progress below.';

  return `
    <header class="order-detail-heading">
      <div>
        <p class="order-detail-eyebrow">ORDER TRACKING</p>
        <h1>Order Tracking</h1>
        <p>Order #${escapeHTML(order.id.slice(0, 8).toUpperCase())} · Placed ${escapeHTML(dateTime(order.createdAt))}</p>
        <p class="order-detail-subtext">${escapeHTML(trackingSubtext)}</p>
      </div>
      <span class="order-status order-status-${escapeHTML(order.status)}">${escapeHTML(statusLabel)}</span>
    </header>
    ${order.status === 'cancelled' ? '<p class="payment-result-notice error" role="status">This order was cancelled.</p>' : ''}
    <div class="order-detail-layout">
      <section class="order-detail-panel order-receipt" aria-labelledby="receipt-heading">
        <h2 id="receipt-heading">Your receipt</h2>
        <div class="order-detail-items">
          ${items.map((item) => `
            <article class="order-detail-item">
              <img src="${escapeHTML(item.productImage || '/img/logo.png')}" alt="" loading="lazy" />
              <div>
                <strong>${escapeHTML(item.productName)}</strong>
                <p>${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${escapeHTML(item.quantityUnit)} · ${escapeHTML(item.sellerName)}</p>
              </div>
              <strong>${money(item.lineTotal, order.currency)}</strong>
            </article>
          `).join('')}
        </div>
        <dl class="order-detail-totals">
          <div><dt>Subtotal</dt><dd>${money(order.subtotal, order.currency)}</dd></div>
          <div><dt>Delivery</dt><dd>${money(order.shipping, order.currency)}</dd></div>
          <div class="total"><dt>Order total</dt><dd>${money(order.totalAmount, order.currency)}</dd></div>
        </dl>
        <div class="order-payment-info">
          <span>Payment method</span>
          <strong>${order.paymentMethod === 'cod' ? 'Cash on delivery' : escapeHTML(humanize(order.paymentMethod))} · ${escapeHTML(humanize(order.paymentStatus))}</strong>
        </div>
        ${settlementNote ? `<p class="order-settlement-note">${escapeHTML(settlementNote)}</p>` : ''}
      </section>

      <section class="order-detail-panel order-tracking-panel" aria-labelledby="tracking-heading">
        <h2 id="tracking-heading">Delivery progress</h2>
        ${fulfillments.length ? `
          <div class="fulfillment-list" aria-label="Merchant shipments">
            ${fulfillments.map((fulfillment) => {
              const fulfillmentItems = fulfillment.items?.length
                ? fulfillment.items
                : items.filter((item) => item.fulfillmentId === fulfillment.id
                  || item.sellerId === fulfillment.sellerId);
              const courierPhone = String(fulfillment.courierPhone || '');
              const courierPhoneLink = courierPhone.replace(/[^\d+]/g, '');
              const statusLabel = fulfillment.status === 'paid'
                ? order.paymentMethod === 'cod'
                  ? 'Confirmed'
                  : 'Awaiting processing'
                : humanize(fulfillment.status);
              const canConfirm = fulfillment.status === 'shipped';
              return `
                <article class="fulfillment-card">
                  <div class="fulfillment-card-head">
                    <strong>${escapeHTML(fulfillment.seller?.businessName || 'Supermarket')}</strong>
                    <span class="fulfillment-status fulfillment-status-${escapeHTML(fulfillment.status)}">${escapeHTML(statusLabel)}</span>
                  </div>
                  <div class="fulfillment-package">
                    <strong>Package contents</strong>
                    <ul>
                      ${fulfillmentItems.map((item) => `
                        <li>
                          <span>${escapeHTML(item.productName)} × ${Number(item.quantity).toLocaleString('en-ET', { maximumFractionDigits: 2 })} ${escapeHTML(item.quantityUnit)}</span>
                          <span>${money(item.lineTotal, order.currency)}</span>
                        </li>
                      `).join('')}
                    </ul>
                  </div>
                  <div class="fulfillment-delivery-details">
                    <p>${fulfillment.estimatedDeliveryAt
                      ? `Estimated delivery: <strong>${escapeHTML(dateTime(fulfillment.estimatedDeliveryAt))}</strong>`
                      : 'Estimated delivery will be updated by the merchant.'}</p>
                    ${fulfillment.courierName ? `<p>Driver: <strong>${escapeHTML(fulfillment.courierName)}</strong></p>` : ''}
                    ${courierPhone ? `<p>Driver contact: <a href="tel:${escapeHTML(courierPhoneLink)}">${escapeHTML(courierPhone)}</a></p>` : ''}
                    ${fulfillment.vehicleReference ? `<p>Vehicle / trip: <strong>${escapeHTML(fulfillment.vehicleReference)}</strong></p>` : ''}
                    ${fulfillment.trackingReference ? `<p>Tracking: <strong>${escapeHTML(fulfillment.trackingReference)}</strong></p>` : ''}
                  </div>
                  ${renderFulfillmentTimeline(fulfillment, order)}
                  ${canConfirm ? `
                    <div class="fulfillment-confirmation">
                      <p>${order.paymentMethod === 'chapa'
                        ? 'Funds are held securely. Confirm this package after weighing and inspecting it; payout eligibility follows the 24-hour review period.'
                        : 'Please weigh and inspect this package before confirming receipt.'}</p>
                      <button type="button" class="btn btn-green btn-sm" data-confirm-fulfillment="${escapeHTML(fulfillment.id)}">
                        ${order.paymentMethod === 'chapa' ? 'Confirm Receipt & Release Payment' : 'Confirm receipt'}
                      </button>
                      <p class="fulfillment-feedback" aria-live="polite"></p>
                    </div>
                  ` : fulfillment.status === 'delivered'
                    ? '<p class="fulfillment-received" role="status">Receipt confirmed. This package will complete after the 24-hour review period.</p>'
                    : fulfillment.status === 'completed'
                      ? '<p class="fulfillment-received" role="status">Receipt confirmed. This package is complete.</p>'
                      : ''}
                </article>
              `;
            }).join('')}
          </div>
        ` : '<p class="fulfillment-empty">Shipment details will appear here once your order is split into merchant packages.</p>'}
      </section>
    </div>
  `;
}

async function loadOrder() {
  if (!orderId) {
    detail.innerHTML = '<section class="orders-empty" role="alert"><h2>Order not found</h2><p>Open an order from your My Orders page.</p><a class="btn btn-green" href="/orders.html">Back to my orders</a></section>';
    return;
  }

  try {
    const response = await API.get(`/api/orders/${encodeURIComponent(orderId)}`);
    detail.innerHTML = renderOrder(response.data);
  } catch (error) {
    if (error.message.includes('(401)') || /not authorized/i.test(error.message)) {
      window.location.href = `/login.html?${new URLSearchParams({ redirect: `/order-detail.html?id=${orderId}` })}`;
      return;
    }
    console.error('Order details could not be loaded:', error);
    detail.innerHTML = `
      <section class="orders-empty" role="alert">
        <h2>Order details unavailable</h2>
        <p>${escapeHTML(error.message || 'Please try again.')}</p>
        <button type="button" class="btn btn-green" id="retry-order-detail">Try again</button>
      </section>
    `;
  }
}

detail.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-confirm-fulfillment]');
  if (!button) return;
  const fulfillmentId = button.dataset.confirmFulfillment;
  if (!window.confirm('Confirm that you received and inspected this merchant package?')) return;

  button.disabled = true;
  const feedback = button.closest('.fulfillment-card')?.querySelector('.fulfillment-feedback');
  try {
    await API.post(
      `/api/orders/${encodeURIComponent(orderId)}/fulfillments/${encodeURIComponent(fulfillmentId)}/confirm-receipt`,
      {}
    );
    await loadOrder();
  } catch (error) {
    button.disabled = false;
    if (feedback) feedback.textContent = error.message || 'Package receipt could not be confirmed.';
  }
});

detail.addEventListener('click', (event) => {
  if (event.target.closest('#retry-order-detail')) loadOrder();
});

loadOrder();
