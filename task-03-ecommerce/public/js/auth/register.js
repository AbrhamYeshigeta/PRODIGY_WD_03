import { API, showMessage } from '../api.js';

const form      = document.getElementById('register-form');
const msg       = document.getElementById('msg');
const password  = document.getElementById('password');
const pwWrap    = document.getElementById('pw-wrap');
const pwToggle  = document.getElementById('pw-toggle');
const hint      = document.getElementById('pw-hint');
const parts     = hint.querySelectorAll('span[data-rule]');
const submitBtn = document.getElementById('submit-btn');
const strength  = document.getElementById('pw-strength');
const bars      = strength.querySelectorAll('.pw-bar');
const label     = document.getElementById('pw-label');

async function redirectIfAlreadyLoggedIn() {
  try {
    const { user } = await API.get('/api/auth/me');
    if (user) {
      window.location.href = '/';
    }
  } catch {
    // Not logged in yet — stay on the register screen.
  }
}

redirectIfAlreadyLoggedIn();

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
   Password strength rules
   ============================================ */
const RULES = {
  length:  (v) => v.length >= 8,
  upper:   (v) => /[A-Z]/.test(v),
  lower:   (v) => /[a-z]/.test(v),
  number:  (v) => /\d/.test(v),
  special: (v) => /[^A-Za-z0-9]/.test(v),
};

function computeStrength(value) {
  if (!value) return { score: 0, level: '', color: '' };

  let score = 0;
  Object.values(RULES).forEach((check) => { if (check(value)) score++; });
  if (value.length >= 12) score += 1;
  if (value.length >= 16) score += 1;

  const variety = [
    /[A-Z]/.test(value),
    /[a-z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  if (variety === 4) score += 1;

  if (score <= 2) return { score: 1, level: 'Weak',   color: 'weak'   };
  if (score <= 4) return { score: 2, level: 'Fair',   color: 'fair'   };
  if (score <= 6) return { score: 3, level: 'Good',   color: 'good'   };
  return                  { score: 4, level: 'Strong', color: 'strong' };
}

/* ============================================
   Live validation
   ============================================ */
password.addEventListener('input', () => {
  const value = password.value;

  let passed = 0;
  parts.forEach((s) => {
    const ok = RULES[s.dataset.rule](value);
    s.classList.toggle('ok', ok);
    if (ok) passed++;
  });

  const hasTyped = value.length > 0;
  submitBtn.disabled = hasTyped && passed < parts.length;
  hint.classList.toggle('complete', passed === parts.length && hasTyped);

  if (hasTyped) {
    const { score, level, color } = computeStrength(value);
    strength.classList.add('visible');
    bars.forEach((bar, i) => {
      bar.classList.remove('weak', 'fair', 'good', 'strong');
      if (i < score) bar.classList.add(color);
    });
    label.textContent = level;
    label.className = `pw-label ${color}`;
  } else {
    strength.classList.remove('visible');
    bars.forEach((bar) => bar.classList.remove('weak', 'fair', 'good', 'strong'));
    label.textContent = '';
    label.className = 'pw-label';
  }
});

/* ============================================
   Submit — register then AUTO-LOGIN
   ============================================ */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(msg, '');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account…';

  try {
    // 1. Create the account
    await API.post('/api/auth/register', {
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    });

    // 2. Auto-login with the same credentials
    try {
      await API.post('/api/auth/login', {
        email: form.email.value.trim(),
        password: form.password.value,
      });

      // 3. Redirect — return to the page the user came from, else landing page
      const returnTo = sessionStorage.getItem('post_login_redirect');
      sessionStorage.removeItem('post_login_redirect');

      if (returnTo === '/' || returnTo === '/index.html') {
        sessionStorage.setItem('shop_now_after_login', '1');
      }

      showMessage(msg, 'Account created! Redirecting…', 'success');
      setTimeout(() => {
        window.location.href = returnTo || '/';
      }, 800);

    } catch {
      // Auto-login failed → send to manual login
      showMessage(msg, 'Account created! Please sign in.', 'success');
      setTimeout(() => { window.location.href = '/login.html'; }, 1200);
    }
  } catch (err) {
    showMessage(msg, err.message, 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create account';
  }
});