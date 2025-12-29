import { defaultConfig } from './defaultConfig.js';

export function initElementSdk() {
  if (!window.elementSdk) return;

  window.elementSdk.init({
    defaultConfig,
    onConfigChange
  });
}

function onConfigChange(config) {
  document.querySelector('.app-name').textContent = config.app_name;
   document.body.style.fontFamily =
    `${config.font_family}, system-ui, sans-serif`;

  mapText('.app-name-text', config.app_name);
  mapText('.nav-dashboard-text', config.nav_dashboard);
  mapText('.nav-tasks-text', config.nav_tasks);
  mapText('.nav-executors-text', config.nav_executors);
  mapText('.nav-messages-text', config.nav_messages);
  mapText('.nav-analytics-text', config.nav_analytics);
  mapText('.nav-settings-text', config.nav_settings);

  document.querySelector('.search-input').placeholder =
    config.search_placeholder;
}

function mapText(selector, value) {
  document.querySelectorAll(selector)
    .forEach(el => el.textContent = value);
}
