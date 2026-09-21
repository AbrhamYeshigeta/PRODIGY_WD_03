import { API, showMessage } from '../api.js';

const form      = document.getElementById('login-form');
const msg       = document.getElementById('msg');
const submitBtn = document.getElementById('submit-btn');
const password  = document.getElementById('password');
const pwWrap    = document.getElementById('pw-wrap');
const pwToggle  = document.getElementById('pw-toggle');

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

    if (user.role === 'admin' || user.role === 'staff') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/';
    }
  } catch (err) {
    showMessage(msg, err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign in';
  }
});