export function getSelectors() {
  return {
    app: document.getElementById('app')
  };
}

export function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}
