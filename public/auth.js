import { showToast } from './src/ui/toast.js';
// Simple authentication client
let authToken = null;
let userTier = 'free';

async function authRequest(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Request failed');
  }
  return res.json();
}

function applyTierGate() {
  const btn = document.getElementById('generateBtn');
  if (!btn) return;
  if (userTier === 'free') {
    btn.setAttribute('disabled', '');
    btn.title = 'Upgrade to Pro to use this feature';
  } else {
    btn.removeAttribute('disabled');
    btn.title = '';
  }
}

function updateUser(username) {
  document.getElementById('userDisplay').textContent = username;
  document.getElementById('tierDisplay').textContent = userTier;
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('userInfo').style.display = 'block';
}

async function handleAuth(endpoint) {
  try {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const tier = document.getElementById('tier').value;
    const data = await authRequest(endpoint, { username, password, tier });
    authToken = data.token;
    userTier = data.tier;
    updateUser(username);
    applyTierGate();
    showToast('Authenticated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('loginBtn').addEventListener('click', () => handleAuth('/api/auth/login'));
document.getElementById('registerBtn').addEventListener('click', () => handleAuth('/api/auth/register'));

applyTierGate();
