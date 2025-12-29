export function clearMessages(...elements) {
  elements.forEach(el => el.classList.remove('show'));
}

export function showError(el, message) {
  el.textContent = message;
  el.classList.add('show');
}

export function showSuccess(el, message) {
  el.textContent = message;
  el.classList.add('show');
}

export function setLoading(button, textEl, loading) {
  button.disabled = loading;
  textEl.innerHTML = loading
    ? '<span class="spinner"></span>Signing in...'
    : 'Sign In';
}
