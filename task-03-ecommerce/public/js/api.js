export const API = {
  async request(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  },

  get(url)        { return this.request(url); },
  post(url, body) { return this.request(url, { method: 'POST', body: JSON.stringify(body) }); },
};

export function showMessage(el, text, type = 'info') {
  el.textContent = text;
  el.className = `msg ${type}`;
}

export async function requireAuth(requiredRole = null) {
  try {
    const { user } = await API.get('/api/auth/me');
    if (requiredRole && user.role !== requiredRole) {
      window.location.href = '/login.html';
      return null;
    }
    return user;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

export async function redirectIfLoggedIn() {
  try {
    const { user } = await API.get('/api/auth/me');
    if (user.role === 'admin' || user.role === 'staff') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/';
    }
  } catch { /* not logged in */ }
}

/* ============================================
   Mobile drawer — auto-wire on every page
   ============================================ */
function initMobileDrawer() {
  const btn      = document.getElementById('mobile-menu-btn');
  const sidebar  = document.querySelector('.sidebar');
  const backdrop = document.getElementById('mobile-backdrop');
  if (!btn || !sidebar || !backdrop) return;

  const open  = () => { sidebar.classList.add('open');  backdrop.classList.add('visible'); document.body.style.overflow = 'hidden'; };
  const close = () => { sidebar.classList.remove('open'); backdrop.classList.remove('visible'); document.body.style.overflow = ''; };

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    sidebar.classList.contains('open') ? close() : open();
  });
  backdrop.addEventListener('click', close);
  sidebar.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', close));
  window.addEventListener('resize', () => { if (window.innerWidth > 720) close(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileDrawer);
} else {
  initMobileDrawer();
}