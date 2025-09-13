export function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
