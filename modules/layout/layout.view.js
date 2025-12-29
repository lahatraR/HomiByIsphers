export function toggle(el, className) {
  el?.classList.toggle(className);
}

export function show(el, className) {
  el?.classList.add(className);
}

export function hide(el, className) {
  el?.classList.remove(className);
}

export function setSidebarCollapsed(sideMenu, collapsed) {
  sideMenu.classList.toggle('collapsed', collapsed);
}
