import { renderShell, guardSeller } from '/js/seller/shell.js';

const seller = await guardSeller();
if (!seller) {
  throw new Error('Seller not available');
}

const page = renderShell({ active: 'dashboard' });
const money = new Intl.NumberFormat('en-ET', {
  style: 'currency',
  currency: 'ETB',
  maximumFractionDigits: 0,
});

const defaultStats = {
  revenueToday: 0,
  revenueTodayFormatted: '0 ETB',
  ordersNew: 0,
  offersActive: 0,
  offersTotal: 0,
  rating: seller.rating || 0,
  ratingCount: seller.ratingCount || 0,
  fulfillmentRate: seller.fulfillmentRate || 100,
  lowStock: [],
  recentOrders: [],
};

let stats = defaultStats;
try {
  const res = await fetch('/api/sellers/me/stats', { credentials: 'include' });
  if (res.ok) {
    const json = await res.json();
    stats = { ...defaultStats, ...json.data };
  }
} catch {
  // keep a safe empty dashboard while real data comes in
}

const recentOrders = (stats.recentOrders || []).length
  ? stats.recentOrders
  : [{
      _id: 'No orders yet',
      buyer: 'Waiting for your first buyer',
      items: [{ product: { name: 'Your products will appear here' } }],
      total: 0,
      status: 'pending_payment',
      quantity: 0,
    }];

const orderRows = recentOrders.map((order) => {
  const productName = order.items?.[0]?.product?.name || 'New product listing';
  const status = order.status || 'pending_payment';
  const total = Number(order.total || 0);

  return `
    <tr>
      <td><strong style="color:var(--brand)">${order._id || '—'}</strong></td>
      <td>
        <div class="prod-cell">
          <div class="prod-thumb">📦</div>
          <div>
            <div class="prod-name">${productName}</div>
            <div class="prod-sub">${seller.city || 'Your city'}</div>
          </div>
        </div>
      </td>
      <td>${order.buyer || seller.businessName || 'Buyer'}</td>
      <td><strong>${order.quantity || 0}</strong></td>
      <td><strong style="color:var(--brand)">${total ? `${money.format(total)} ETB` : '0 ETB'}</strong></td>
      <td><span class="pill ${status}">${status.replace(/_/g, ' ')}</span></td>
    </tr>
  `;
}).join('');

const lowStockItems = (stats.lowStock || []).length
  ? stats.lowStock.map((item) => `
      <div class="row-item">
        <div class="ico amber">⚠️</div>
        <div class="body">
          <strong>${item.name}</strong>
          <small>Only ${item.qty} ${item.unit || 'unit'} left</small>
        </div>
        <a class="btn btn-soft btn-sm" href="/seller/offers.html">Restock</a>
      </div>
    `).join('')
  : `
      <div class="row-item">
        <div class="ico green">✓</div>
        <div class="body">
          <strong>Stock is healthy</strong>
          <small>No low-stock alerts right now</small>
        </div>
      </div>
    `;

const verificationTag = seller.verificationStatus === 'verified'
  ? '<div class="dot-btn"><span class="dot"></span> Verified seller</div>'
  : '<div class="dot-btn"><span class="dot" style="background:var(--gold)"></span> Application under review</div>';

page.innerHTML = `
  <div class="ph">
    <div>
      <h1 class="welcome-line">Good morning, ${seller.businessName || 'Your Merchant Shop'} 👋</h1>
      <p>Here is your merchant dashboard — <strong style="color:var(--brand)">${seller.city || 'Addis Ababa'}</strong> • ${seller.businessType || 'Merchant account'}</p>
    </div>
    <div class="actions">
      <a class="btn btn-ghost" href="/seller/orders.html">🧾 View Orders</a>
      <a class="btn btn-gold" href="/seller/offers-new.html">➕ Add New Offer</a>
    </div>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat__top">
        <div class="stat__ico">💰</div>
        <span class="stat__delta ${stats.revenueToday > 0 ? 'up' : 'flat'}">${stats.revenueToday > 0 ? '▲' : '—'} ${stats.revenueToday > 0 ? 'Live' : '0'}</span>
      </div>
      <div class="stat__label">Revenue today</div>
      <div class="stat__value">${stats.revenueTodayFormatted || '0 ETB'}</div>
      <div class="stat__foot">Sales will appear here once your first order is paid</div>
    </div>

    <div class="stat">
      <div class="stat__top">
        <div class="stat__ico blue">🧾</div>
        <span class="stat__delta ${stats.ordersNew > 0 ? 'up' : 'flat'}">${stats.ordersNew > 0 ? '▲' : '—'} ${stats.ordersNew}</span>
      </div>
      <div class="stat__label">New orders</div>
      <div class="stat__value">${stats.ordersNew}</div>
      <div class="stat__foot">Awaiting your review</div>
    </div>

    <div class="stat">
      <div class="stat__top">
        <div class="stat__ico gold">🏷️</div>
        <span class="stat__delta flat">— ${stats.offersTotal - stats.offersActive}</span>
      </div>
      <div class="stat__label">Active offers</div>
      <div class="stat__value">${stats.offersActive}</div>
      <div class="stat__foot">${stats.offersTotal} total listings</div>
    </div>

    <div class="stat">
      <div class="stat__top">
        <div class="stat__ico amber">⭐</div>
        <span class="stat__delta ${stats.fulfillmentRate >= 90 ? 'up' : 'flat'}">${stats.fulfillmentRate}%</span>
      </div>
      <div class="stat__label">Rating</div>
      <div class="stat__value">${Number(stats.rating || 0).toFixed(1)}<small>(${stats.ratingCount || 0})</small></div>
      <div class="stat__foot">Fulfillment performance</div>
    </div>
  </div>

  <div class="chips">
    <button class="chip active"><span class="ico">📊</span> Overview</button>
    <button class="chip">💰 Sales</button>
    <button class="chip">📦 Inventory</button>
    <button class="chip">👥 Customers</button>
    <button class="chip">📈 Trends</button>
  </div>

  <div class="card" style="grid-column: 1;">
    <div class="card__head">
      <div>
        <h3>Recent orders</h3>
        <span class="sub">Latest customer activity</span>
      </div>
      <a class="link" href="/seller/orders.html">View all →</a>
    </div>
    <table class="tbl">
      <thead>
        <tr>
          <th>Order</th>
          <th>Product</th>
          <th>Buyer</th>
          <th>Qty</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${orderRows}
      </tbody>
    </table>
  </div>

  <aside class="panel">
    <div class="mini">
      <div class="mini__head">
        <h3>💳 Next payout</h3>
        <a class="link" href="/seller/payouts.html">Details</a>
      </div>
      <div style="font-family:var(--serif);font-size:30px;font-weight:700;color:var(--brand);letter-spacing:-.8px;line-height:1">
        0 <span style="font-size:14px;color:var(--ink-3);font-weight:500">ETB</span>
      </div>
      <div class="muted" style="font-size:12px;margin-top:6px">Waiting for your first payout cycle</div>
      <div class="progress gold" style="margin-top:14px"><span style="width:0%"></span></div>
      <div class="muted" style="font-size:11.5px;margin-top:6px"><strong style="color:var(--brand)">0%</strong> of your first payout target</div>
      <div style="display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);align-items:center">
        <span style="font-size:11.5px;color:var(--ink-3)">${seller.bank?.name || 'Bank account pending'}</span>
        <span class="pill active" style="margin-left:auto">Awaiting setup</span>
      </div>
    </div>

    <div class="mini">
      <div class="mini__head">
        <h3>⚠️ Stock alerts</h3>
        <a class="link" href="/seller/offers.html">Manage</a>
      </div>
      ${lowStockItems}
    </div>

    <div class="mini">
      <div class="mini__head">
        <h3>🔔 Merchant status</h3>
      </div>
      <div class="feed">
        <div class="feed-item">
          <div class="dot-wrap green">✓</div>
          <div class="body">
            <p><strong>${seller.businessName || 'Merchant'}</strong> is ready to receive orders</p>
            <time>${seller.verificationStatus === 'verified' ? 'Verified' : 'Pending review'}</time>
          </div>
        </div>
        <div class="feed-item">
          <div class="dot-wrap blue">📍</div>
          <div class="body">
            <p>Business city: <strong>${seller.city || 'Not set yet'}</strong></p>
            <time>${seller.businessType || 'Merchant type pending'}</time>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <div class="foot-bar">
    <div class="helper">
      ${verificationTag}
      <div class="dot-btn"><span class="dot" style="background:var(--gold)"></span> Chapa payouts enabled</div>
      <div class="dot-btn"><span class="dot" style="background:var(--blue)"></span> Storefront live</div>
    </div>
    <a class="btn btn-gold" href="/seller/orders.html">Go to Orders →</a>
  </div>
`;
