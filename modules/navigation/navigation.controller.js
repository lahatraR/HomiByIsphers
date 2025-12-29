export function initNavigation() {
  document.querySelectorAll('[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      setActive(item.dataset.page);
    });
  });
}

function setActive(page) {
  document.querySelectorAll('[data-page]')
    .forEach(el => el.classList.remove('active'));

  document.querySelectorAll(`[data-page="${page}"]`)
    .forEach(el => el.classList.add('active'));

  document.getElementById('mobileMenu')?.classList.remove('show');
  document.getElementById('mobileMenuOverlay')?.classList.remove('show');

  document.querySelector('.main-content')?.scrollTo({ top: 0 });
}
