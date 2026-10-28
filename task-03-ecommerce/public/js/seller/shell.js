// public/js/seller/shell.js
export function renderShell({ active = 'dashboard' }) {
  const seller = JSON.parse(localStorage.getItem('etfruit.seller') || '{}');
  const name   = seller.businessName || 'Merchant';
  const scale  = seller.scale || 'wholesale';
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const scaleLabel = scale === 'retail' ? '🌾 Kilo Seller'
                   : scale === 'bulk'   ? '🏭 Ton Seller'
                   : '📦 Quintal Seller';

  const nav = [
    { section: 'Menu' },
    { key:'dashboard',  href:'/seller/dashboard.html',  ico:'🏠', label:'Dashboard' },
    { key:'orders',     href:'/seller/orders.html',     ico:'🧾', label:'Orders', id: 'nav-orders' },
    { section: 'Catalog' },
    { key:'offers',     href:'/seller/offers.html',     ico:'🏷️', label:'My Offers' },
    { key:'offers-new', href:'/seller/offers-new.html', ico:'➕', label:'Add Offer' },
    { section: 'Insights' },
    { key:'analytics',  href:'/seller/analytics.html',  ico:'📈', label:'Analytics' },
    { key:'customers',  href:'/seller/customers.html',  ico:'👥', label:'Customers' },
    { section: 'Store' },
    { key:'storefront', href:'/seller/storefront.html', ico:'🏪', label:'Storefront' },
    { key:'payouts',    href:'/seller/payouts.html',    ico:'💳', label:'Payouts' },
    { key:'settings',   href:'/seller/settings.html',   ico:'⚙️', label:'Settings' },
  ];

  const navHTML = nav.map(i => i.section
    ? `<div class="sb__section">${i.section}</div>`
    : `<a class="sb__link ${i.key === active ? 'active' : ''}" href="${i.href}" id="${i.id || ''}">
         <span class="ico">${i.ico}</span>
         <span class="label">${i.label}</span>
       </a>`
  ).join('');

  document.body.innerHTML = `
    <div class="shell">
      <aside class="sb" id="sb">
        <div class="sb__brand">
          <div class="logo">🦬</div>
          <div>
            <div class="wordmark">Etfruit</div>
            <span class="sub">Seller Console</span>
          </div>
        </div>
        ${navHTML}
        <div class="sb__foot">
          <div class="sb__user">
            <div class="av">${initials}</div>
            <div style="min-width:0;flex:1">
              <strong title="${name}">${name}</strong>
              <small>${scaleLabel}</small>
            </div>
          </div>
          <a class="sb__logout" href="/login.html">↩ Log out</a>
        </div>
      </aside>

      <main class="main">
        <header class="tb">
          <button class="menu-btn" id="menuBtn">☰</button>
          <div class="search">
            <span>🔍</span>
            <input placeholder="Search products, orders, buyers…" />
          </div>
          <div class="spacer"></div>
          <button class="iconbtn" title="Notifications">🔔<span class="dot"></span></button>
          <button class="iconbtn" title="Help">❔</button>
        </header>
        <div id="page-root"></div>
      </main>
    </div>
  `;

  const menuBtn = document.getElementById('menuBtn');
  const sb = document.getElementById('sb');
  menuBtn?.addEventListener('click', () => sb.classList.toggle('open'));

  // DYNAMIC BADGE LOGIC: Fetch real order count
  if (active !== 'apply' && active !== 'pending' && active !== 'login') {
    fetch('/api/sellers/me/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const newOrders = data.data?.ordersNew || 0;
        if (newOrders > 0) {
          const ordersLink = document.getElementById('nav-orders');
          if (ordersLink) {
            ordersLink.innerHTML += ` <span class="badge">${newOrders}</span>`;
          }
        }
      })
      .catch(() => {});
  }

  const root = document.getElementById('page-root');
  const page = document.createElement('div');
  page.className = 'page';
  root.appendChild(page);
  return page;
}

export function guardSeller() {
  const s = JSON.parse(localStorage.getItem('etfruit.seller') || 'null');
  return s || { businessName: 'Merchant', scale: 'wholesale', verificationStatus: 'pending' };
}