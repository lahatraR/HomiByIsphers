import * as view from './layout.view.js';

export function initLayout(dom) {
  dom.menuToggle?.addEventListener('click', () => {
    view.toggle(dom.mobileMenu, 'show');
    view.toggle(dom.mobileOverlay, 'show');
  });

  dom.mobileOverlay?.addEventListener('click', () => {
    view.hide(dom.mobileMenu, 'show');
    view.hide(dom.mobileOverlay, 'show');
  });

  dom.collapseBtn?.addEventListener('click', () => {
    const collapsed = dom.sideMenu.classList.contains('collapsed');
    view.setSidebarCollapsed(dom.sideMenu, !collapsed);
    updateCollapseIcon(dom.collapseBtn, !collapsed);
  });

  dom.profileButton?.addEventListener('click', (e) => {
    e.stopPropagation();
    view.toggle(dom.profileDropdown, 'show');
  });

  document.addEventListener('click', () => {
    view.hide(dom.profileDropdown, 'show');
  });
}

function updateCollapseIcon(button, collapsed) {
  const polyline = button.querySelector('svg polyline');
  polyline.setAttribute(
    'points',
    collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'
  );
}
