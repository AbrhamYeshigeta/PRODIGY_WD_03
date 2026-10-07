<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Payouts · Etfruit Seller</title>
  <link rel="stylesheet" href="/css/seller.css" />
</head>
<body>
<script type="module">
  import { renderShell, guardSeller } from '/js/seller/shell.js';

  const seller = guardSeller();
  const page = renderShell({ active: 'payouts' });

  const payouts = {
    next: 12000,
    nextDate: 'Friday, Oct 10',
    month: 145000,
    monthChange: 22,
    lifetime: 890000,
    lifetimeOrders: 234,
    pendingAmount: 4200,
    schedule: 'Weekly · every Friday',
  };

  const bank = {
    name: 'Commercial Bank of Ethiopia',
    logo: '🏦',
    account: '•••• 7890',
    holder: 'Highland Roots Ltd',
    subaccount: true,
    subaccountId: 'chapa_sub_HR_2024_88',
  };

  const history = [
    { date: 'Oct 1, 2025',  amount: 12000, method: 'CBE', ref: 'PO-20251001-A4X9', status: 'delivered' },
    { date: 'Sep 27, 2025', amount: 8500,  method: 'CBE', ref: 'PO-20250927-K2M1', status: 'delivered' },
    { date: 'Sep 20, 2025', amount: 5200,  method: 'CBE', ref: 'PO-20250920-P8Q3', status: 'delivered' },
    { date: 'Sep 13, 2025', amount: 14200, method: 'CBE', ref: 'PO-20250913-Z1B7', status: 'delivered' },
    { date: 'Sep 6, 2025',  amount: 7800,  method: 'CBE', ref: 'PO-20250906-R4C5', status: 'delivered' },
  ];

  const fmt = (n) => n.toLocaleString('en-ET');

  page.innerHTML = `
    <div class="page-top">
      <div class="ph">
        <div>
          <h1 class="welcome-line">Payouts</h1>
          <p>Every birr accounted for · powered by Chapa</p>
        </div>
        <div class="actions">
          <button class="btn btn-ghost">⬇ Download statement</button>
          <button class="btn btn-ghost">⚙️ Payout schedule</button>
        </div>
      </div>
    </div>

    <div class="page-body">
      <div class="orders-list">

        <!-- Payout stat cards -->
        <div class="payout-stats">
          <div class="payout-stat highlight">
            <div class="lbl">💰 Next payout</div>
            <div class="val">${fmt(payouts.next)}<small>ETB</small></div>
            <div class="sub">Arrives ${payouts.nextDate}</div>
          </div>
          <div class="payout-stat">
            <div class="lbl">📅 This month</div>
            <div class="val">${fmt(payouts.month)}<small>ETB</small></div>
            <div class="sub">${payouts.schedule}</div>
            <span class="delta up">▲ ${payouts.monthChange}% vs last month</span>
          </div>
          <div class="payout-stat">
            <div class="lbl">🏆 Lifetime</div>
            <div class="val">${fmt(payouts.lifetime)}<small>ETB</small></div>
            <div class="sub">Across ${payouts.lifetimeOrders} orders</div>
          </div>
        </div>

        <!-- Bank account -->
        <div class="sec-head">
          <h2>Payout account</h2>
          <a class="link" href="/seller/settings.html">Change →</a>
        </div>
        <div class="bank-card">
          <div class="bank-logo">${bank.logo}</div>
          <div class="info">
            <strong>${bank.name}</strong>
            <div class="acct">${bank.account}</div>
            <div class="holder">${bank.holder}</div>
          </div>
          <div class="badges">
            <span class="pill active">${bank.subaccount ? '✓ Subaccount active' : '⚠ Not connected'}</span>
            <span class="pill paid">🔒 Chapa secured</span>
          </div>
        </div>

        <!-- Pending clearance -->
        <div class="notif-banner" style="margin-bottom:0">
          <div class="pulse"></div>
          <div class="body">
            <strong>${fmt(payouts.pendingAmount)} ETB</strong> pending clearance
            <span class="sep">·</span>
            <span class="time">from recent orders · clears in ~2 days</span>
          </div>
          <button class="btn btn-sm btn-soft" style="background:#fff">View orders</button>
        </div>

        <!-- History -->
        <div class="sec-head" style="margin-top:24px">
          <h2>Payout history</h2>
          <a class="link" href="#">View all →</a>
        </div>
        <div class="card" style="padding:6px 22px">
          ${history.map(h => `
            <div class="payout-row">
              <div class="pico">✓</div>
              <div class="pinfo">
                <strong>${h.date}</strong>
                <small>Delivered to your bank</small>
              </div>
              <div class="amount">${fmt(h.amount)} ETB</div>
              <div class="method">${h.method}</div>
              <div class="ref">${h.ref}</div>
            </div>
          `).join('')}
        </div>

      </div>

      <aside class="panel">

        <div class="mini">
          <div class="mini__head"><h3>How payouts work</h3></div>
          <div class="notif-list">
            <div class="notif-item">
              <div class="nico blue">💳</div>
              <div class="nbody"><p>Buyer pays via <strong>Chapa</strong> (Telebirr / CBE / card)</p></div>
            </div>
            <div class="notif-item">
              <div class="nico gold">⏱</div>
              <div class="nbody"><p>Funds clear after <strong>2 days</strong> of confirmed delivery</p></div>
            </div>
            <div class="notif-item">
              <div class="nico green">🏦</div>
              <div class="nbody"><p>Auto-deposited to <strong>your bank</strong> every Friday</p></div>
            </div>
            <div class="notif-item">
              <div class="nico blue">🔒</div>
              <div class="nbody"><p>Bank details encrypted, only used for payouts</p></div>
            </div>
          </div>
        </div>

        <div class="mini">
          <div class="mini__head"><h3>Subaccount status</h3></div>
          <div class="row-item">
            <div class="ico green">✓</div>
            <div class="body">
              <strong>Active</strong>
              <small>Chapa subaccount linked</small>
            </div>
          </div>
          <div class="row-item">
            <div class="ico blue">🔗</div>
            <div class="body">
              <strong style="font-family:'SF Mono', Menlo, monospace;font-size:11.5px">${bank.subaccountId}</strong>
              <small>Subaccount ID</small>
            </div>
          </div>
          <div class="row-item">
            <div class="ico gold">💯</div>
            <div class="body">
              <strong>100% success rate</strong>
              <small>Last 5 payouts on time</small>
            </div>
          </div>
        </div>

        <div class="mini">
          <div class="mini__head"><h3>Quick actions</h3></div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-soft btn-block" style="justify-content:flex-start">⬇ Download tax statement</button>
            <button class="btn btn-soft btn-block" style="justify-content:flex-start">📧 Email payout summary</button>
            <button class="btn btn-soft btn-block" style="justify-content:flex-start">🔄 Request early payout</button>
          </div>
        </div>

      </aside>
    </div>

    <div class="foot-bar" style="margin-top:22px">
      <div class="helper">
        <div class="dot-btn"><span class="dot"></span> Chapa connected</div>
        <div class="dot-btn"><span class="dot" style="background:var(--gold)"></span> Weekly Friday payouts</div>
      </div>
      <span class="muted" style="font-size:12px">Statement updated 2 minutes ago</span>
    </div>
  `;
</script>
</body>
</html>