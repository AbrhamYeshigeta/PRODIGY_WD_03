import { renderShell } from '/js/seller/shell.js';

async function initDashboard() {
  const sellerResponse = await fetch('/api/sellers/me', { credentials: 'include' });
  if (sellerResponse.status === 401) {
    window.location.href = '/seller/login.html';
    return;
  }
  if (sellerResponse.status === 403 || sellerResponse.status === 404) {
    window.location.href = '/seller/apply.html';
    return;
  }
  if (!sellerResponse.ok) {
    const error = await sellerResponse.json().catch(() => ({}));
    throw new Error(error.message || `Seller profile could not be loaded (${sellerResponse.status})`);
  }

  const seller = (await sellerResponse.json()).data;
  localStorage.setItem('etfruit.seller', JSON.stringify(seller));

  // --- ONBOARDING GUARD ---
  let stats = null;
  try {
    const statsRes = await fetch('/api/sellers/me/stats', { credentials: 'include' });
    if (statsRes.ok) {
      stats = (await statsRes.json()).data;
    }
  } catch (err) {
    console.log("Stats not ready yet.");
  }

  const hasSkippedOnboarding = localStorage.getItem('onboarding_skipped') === 'true';
  const hasCompletedOnboarding = localStorage.getItem('onboarding_completed') === 'true';

  if (
    seller.verificationStatus === 'verified' && 
    (!stats || stats.offersTotal === 0) && 
    !hasSkippedOnboarding && 
    !hasCompletedOnboarding
  ) {
    window.location.href = '/seller/onboarding.html';
    return; 
  }

  const page = renderShell({ active: 'dashboard' });
  const money = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  });

  const defaultStats = {
    revenueToday: null,
    revenueTodayFormatted: null,
    ordersNew: null,
    orderTrackingAvailable: false,
    offersActive: 0,
    offersTotal: 0,
    offersDraft: 0,
    stockByUnit: {},
    rating: seller.rating || 0,
    ratingCount: 0,
    fulfillmentRate: seller.fulfillmentRate || 100,
    lowStock: [],
    recentOrders: [],
  };

  let statsError = '';
  try {
    const res = await fetch('/api/sellers/me/stats', { credentials: 'include' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || `Dashboard stats could not be loaded (${res.status})`);
    stats = { ...defaultStats, ...json.data };
  } catch (error) {
    statsError = error.message;
    stats = defaultStats;
  }

  const recentOrders = stats.recentOrders || [];

  const orderRows = recentOrders.length ? recentOrders.map((order) => {
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
  }).join('') : `
    <tr><td colspan="6" style="text-align:center;padding:40px 20px;color:var(--ink-3)">
      ${stats.orderTrackingAvailable ? 'No orders yet. Your first sale will appear here.' : 'Order and revenue reporting is not connected to seller offers yet.'}
    </td></tr>
  `;

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

  const inventoryRows = Object.entries(stats.stockByUnit || {}).length
    ? Object.entries(stats.stockByUnit).map(([unit, quantity]) => `
        <div class="row-item">
          <div class="ico blue">📦</div>
          <div class="body"><strong>${Number(quantity).toLocaleString()} ${unit}</strong><small>Available inventory</small></div>
        </div>
      `).join('')
    : '<div class="row-item"><div class="body"><strong>No active stock</strong><small>Published offer inventory appears here</small></div></div>';

  const verificationTag = seller.verificationStatus === 'verified'
    ? '<div class="dot-btn"><span class="dot"></span> Verified seller</div>'
    : '<div class="dot-btn"><span class="dot" style="background:var(--gold)"></span> Application under review</div>';

  const canPublishOffers = seller.verificationStatus === 'verified';
  const verificationMessage = canPublishOffers
    ? ''
    : `<div class="notif-banner" style="margin-bottom:20px">
        <div class="pulse" style="background:var(--gold-dark)"></div>
        <div class="body"><strong>Application under review:</strong> You can prepare offer drafts now. Publishing to customers will unlock after verification.</div>
      </div>`;

  const statsMessage = statsError
    ? `<div class="notif-banner" role="alert" style="margin-bottom:20px"><div class="body"><strong>Dashboard data unavailable:</strong> ${statsError}</div></div>`
    : '';

  page.innerHTML = `
    ${verificationMessage}
    ${statsMessage}
    <div class="ph">
      <div>
        <h1 class="welcome-line">Good morning, ${seller.businessName || 'Your Merchant Shop'} 👋</h1>
        <p>Here is your merchant dashboard — <strong style="color:var(--brand)">${seller.city || 'Addis Ababa'}</strong> • ${seller.businessType || 'Merchant account'}</p>
      </div>
      <div class="actions">
        <a class="btn btn-ghost ${stats.orderTrackingAvailable ? '' : 'disabled'}" href="${stats.orderTrackingAvailable ? '/seller/orders.html' : '#'}" aria-disabled="${!stats.orderTrackingAvailable}">🧾 View Orders</a>
        <a class="btn btn-gold" href="/seller/offers-new.html">➕ Add New Offer</a>
      </div>
    </div>

    <!-- TABS -->
    <div class="chips" id="dashboard-tabs">
      <button class="chip active" data-target="view-overview"><span class="ico">📊</span> Overview</button>
      <button class="chip" data-target="view-sales"><span class="ico">💰</span> Sales</button>
      <button class="chip" data-target="view-inventory"><span class="ico">📦</span> Inventory</button>
      <button class="chip" data-target="view-customers"><span class="ico">👥</span> Customers</button>
      <button class="chip" data-target="view-trends"><span class="ico">📈</span> Trends</button>
    </div>

    <!-- ============================================== -->
    <!-- TAB 1: OVERVIEW (Your original layout)         -->
    <!-- ============================================== -->
    <div class="tab-content active" id="view-overview">
      <div class="stats">
        <div class="stat">
          <div class="stat__top">
            <div class="stat__ico">💰</div>
            <span class="stat__delta ${stats.revenueToday > 0 ? 'up' : 'flat'}">${stats.revenueToday > 0 ? '▲' : '—'} ${stats.revenueToday > 0 ? 'Live' : '0'}</span>
          </div>
          <div class="stat__label">Revenue today</div>
          <div class="stat__value">${stats.revenueTodayFormatted || '—'}</div>
          <div class="stat__foot">${stats.orderTrackingAvailable ? 'Sales today' : 'Order reporting not connected'}</div>
        </div>

        <div class="stat">
          <div class="stat__top">
            <div class="stat__ico blue">🧾</div>
            <span class="stat__delta ${stats.ordersNew > 0 ? 'up' : 'flat'}">${stats.ordersNew ?? '—'}</span>
          </div>
          <div class="stat__label">New orders</div>
          <div class="stat__value">${stats.ordersNew ?? '—'}</div>
          <div class="stat__foot">${stats.orderTrackingAvailable ? 'Awaiting your review' : 'Order reporting not connected'}</div>
        </div>

        <div class="stat">
          <div class="stat__top">
            <div class="stat__ico gold">🏷️</div>
            <span class="stat__delta flat">— ${stats.offersTotal - stats.offersActive}</span>
          </div>
          <div class="stat__label">Active offers</div>
          <div class="stat__value">${stats.offersActive}</div>
          <div class="stat__foot">${stats.offersDraft} drafts · ${stats.offersTotal} total listings</div>
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

      <div class="card" style="grid-column: 1;">
        <div class="card__head">
          <div>
            <h3>Recent orders</h3>
            <span class="sub">Order tracking becomes available when order items are connected to seller offers.</span>
          </div>
        </div>
        <table class="tbl">
          <thead>
            <tr>
              <th>Order</th><th>Product</th><th>Buyer</th><th>Qty</th><th>Total</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>
      </div>

      <aside class="panel">
        <div class="mini">
          <div class="mini__head"><h3>💳 Next payout</h3><a class="link" href="/seller/payouts.html">Details</a></div>
          <div style="font-family:var(--serif);font-size:30px;font-weight:700;color:var(--brand);letter-spacing:-.8px;line-height:1">0 <span style="font-size:14px;color:var(--ink-3);font-weight:500">ETB</span></div>
          <div class="muted" style="font-size:12px;margin-top:6px">Waiting for your first payout cycle</div>
          <div class="progress gold" style="margin-top:14px"><span style="width:0%"></span></div>
          <div style="display:flex;gap:8px;margin-top:16px;padding-top:14px;border-top:1px dashed var(--line);align-items:center">
            <span style="font-size:11.5px;color:var(--ink-3)">${seller.bank?.name || 'Bank account pending'}</span>
            <span class="pill active" style="margin-left:auto">Awaiting setup</span>
          </div>
        </div>
        <div class="mini">
          <div class="mini__head"><h3>Inventory by measure</h3></div>
          ${inventoryRows}
        </div>
        <div class="mini">
          <div class="mini__head"><h3>⚠️ Stock alerts</h3><a class="link" href="/seller/offers.html">Manage</a></div>
          ${lowStockItems}
        </div>
        <div class="mini">
          <div class="mini__head"><h3>🔔 Merchant status</h3></div>
          <div class="feed">
            <div class="feed-item"><div class="dot-wrap green">✓</div><div class="body"><p><strong>${seller.businessName || 'Merchant'}</strong> is ready</p><time>${seller.verificationStatus === 'verified' ? 'Verified' : 'Pending review'}</time></div></div>
            <div class="feed-item"><div class="dot-wrap blue">📍</div><div class="body"><p>City: <strong>${seller.city || 'Not set'}</strong></p><time>${seller.businessType || 'Merchant type pending'}</time></div></div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ============================================== -->
    <!-- TAB 2: SALES                                   -->
    <!-- ============================================== -->
    <div class="tab-content" id="view-sales" style="display: none;">
      <div class="card" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
        <h2 style="font-family: var(--serif); color: var(--brand);">Sales Analytics</h2>
        <p class="muted" style="margin-bottom: 24px;">Once you start receiving orders, your daily revenue chart will appear here.</p>
        <div style="display: flex; gap: 20px; justify-content: center;">
          <div style="background: var(--bg-2); padding: 20px; border-radius: 12px; min-width: 150px;">
            <div class="muted" style="font-size: 12px; text-transform: uppercase;">This Week</div>
            <div style="font-family: var(--serif); font-size: 24px; font-weight: 700; color: var(--brand);">0 ETB</div>
          </div>
          <div style="background: var(--bg-2); padding: 20px; border-radius: 12px; min-width: 150px;">
            <div class="muted" style="font-size: 12px; text-transform: uppercase;">This Month</div>
            <div style="font-family: var(--serif); font-size: 24px; font-weight: 700; color: var(--brand);">0 ETB</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 3: INVENTORY                               -->
    <!-- ============================================== -->
    <div class="tab-content" id="view-inventory" style="display: none;">
      <div class="card">
        <div class="card__head">
          <h3>Current Stock Levels</h3>
          <a class="btn btn-sm btn-gold" href="/seller/offers.html">Manage Offers</a>
        </div>
        <div class="card__body">
          ${inventoryRows}
        </div>
      </div>
      <div class="card" style="margin-top: 20px;">
        <div class="card__head">
          <h3>Low Stock Alerts</h3>
        </div>
        <div class="card__body">
          ${lowStockItems}
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 4: CUSTOMERS                               -->
    <!-- ============================================== -->
    <div class="tab-content" id="view-customers" style="display: none;">
      <div class="card" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
        <h2 style="font-family: var(--serif); color: var(--brand);">Your Customers</h2>
        <p class="muted" style="margin-bottom: 24px;">Your top buyers and repeat customers will be listed here once you have sales.</p>
        <a href="/seller/customers.html" class="btn btn-gold">View Full Customer List</a>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- TAB 5: TRENDS                                  -->
    <!-- ============================================== -->
    <div class="tab-content" id="view-trends" style="display: none;">
      <div class="card" style="padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
        <h2 style="font-family: var(--serif); color: var(--brand);">Market Trends</h2>
        <p class="muted" style="margin-bottom: 24px;">See how your prices compare to the market average in real-time.</p>
        <div style="background: var(--brand-tint); padding: 20px; border-radius: 12px; display: inline-block; color: var(--brand);">
          <strong>Tip:</strong> Sellers with 4+ photos get 40% more orders.
        </div>
      </div>
    </div>

    <div class="foot-bar" style="grid-column: 1 / -1;">
      <div class="helper">
        ${verificationTag}
        <div class="dot-btn"><span class="dot" style="background:var(--gold)"></span> Chapa payouts enabled</div>
        <div class="dot-btn"><span class="dot" style="background:var(--blue)"></span> Storefront live</div>
      </div>
      <span class="muted">Order reporting will appear here when order items are linked to your offers.</span>
    </div>
  `;

  // --- TAB SWITCHING LOGIC ---
  const tabs = document.querySelectorAll('.chip');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. Reset all tabs
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.style.display = 'none');

      // 2. Activate clicked tab
      tab.classList.add('active');
      const targetId = tab.dataset.target;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.style.display = targetId === 'view-overview' ? 'grid' : 'block';
      }
    });
  });
}

initDashboard().catch((error) => {
  console.error('Failed to load seller dashboard', error);
  document.body.innerHTML = `
    <main style="max-width:640px;margin:12vh auto;padding:24px;font:16px/1.5 system-ui;color:#17221d">
      <h1>Dashboard unavailable</h1>
      <p>${error.message}</p>
      <a href="/seller/dashboard.html">Try again</a>
    </main>
  `;
});