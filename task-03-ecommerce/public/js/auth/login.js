import { API, showMessage } from '../api.js';

const form      = document.getElementById('login-form');
const msg       = document.getElementById('msg');
const submitBtn = document.getElementById('submit-btn');
const password  = document.getElementById('password');
const pwWrap    = document.getElementById('pw-wrap');
const pwToggle  = document.getElementById('pw-toggle');

async function redirectIfAlreadyLoggedIn() {
  try {
    const { user } = await API.get('/api/auth/me');
    if (user) {
      window.location.href = '/';
    }
  } catch {
    // Not logged in yet — stay on the login screen.
  }
}

redirectIfAlreadyLoggedIn();

// Inside your login submit handler:
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const { user } = await API.post('/api/auth/login', { email, password });

    // 1. Read the URL for a redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUrl = urlParams.get('redirect');

    // 2. Route the user
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (user.role === 'seller') {
      window.location.href = '/seller/dashboard.html';
    } else if (user.role === 'admin' || user.role === 'staff') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/';
    }
  } catch (err) {
    // Show error message
    alert("Invalid email or password");
  }
}

/* ============================================
   SHOW / HIDE PASSWORD TOGGLE
   ============================================ */
pwToggle.addEventListener('click', () => {
  const isVisible = pwWrap.classList.toggle('is-visible');

  password.type = isVisible ? 'text' : 'password';

  pwToggle.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  pwToggle.setAttribute('title',      isVisible ? 'Hide password' : 'Show password');

  const end = password.value.length;
  password.focus();
  try { password.setSelectionRange(end, end); } catch (e) { /* ignore */ }

  console.log('[pw-toggle] password visible:', isVisible);
});

/* ============================================
   Submit
   ============================================ */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(msg, '');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const { user } = await API.post('/api/auth/login', {
      email: form.email.value.trim(),
      password: form.password.value,
    });

    sessionStorage.setItem('prodigy_active_user', JSON.stringify({
      id: user._id || user.id || user.email,
      username: user.username,
      email: user.email,
    }));

    // 👇 Return to the page the user came from (saved by requireLogin())
    const returnTo = sessionStorage.getItem('post_login_redirect');
    sessionStorage.removeItem('post_login_redirect');

    if (returnTo && returnTo !== '/' && returnTo !== '/index.html') {
      window.location.href = returnTo;
    } else {
      if (returnTo === '/' || returnTo === '/index.html') {
        sessionStorage.setItem('shop_now_after_login', '1');
      }

      if (user.role === 'admin' || user.role === 'staff') {
        window.location.href = '/admin/index.html';
      } else {
        window.location.href = '/';
      }
    }
  } catch (err) {
    showMessage(msg, err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});

