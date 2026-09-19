import { API, showMessage } from '../api.js';

const form = document.getElementById('login-form');
const msg  = document.getElementById('msg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(msg, '');
  try {
    const { user } = await API.post('/api/auth/login', {
      email: form.email.value.trim(),
      password: form.password.value,
    });

    if (user.role === 'admin' || user.role === 'staff') {
      window.location.href = '/admin/index.html';
    } else {
      window.location.href = '/home.html';
    }
  } catch (err) {
    showMessage(msg, err.message, 'error');
  }
});
