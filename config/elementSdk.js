import { defaultConfig } from './defaultConfig.js';

export function initElementSdk() {
  if (!window.elementSdk) return;

  window.elementSdk.init({
    defaultConfig,
    onConfigChange,
    mapToCapabilities: (config) => ({
      recolorables: [
        { get: () => config.background_color, set: (v) => window.elementSdk.setConfig({ background_color: v }) },
        { get: () => config.primary_color, set: (v) => window.elementSdk.setConfig({ primary_color: v }) },
        { get: () => config.accent_color, set: (v) => window.elementSdk.setConfig({ accent_color: v }) },
        { get: () => config.surface_color, set: (v) => window.elementSdk.setConfig({ surface_color: v }) },
        { get: () => config.text_color, set: (v) => window.elementSdk.setConfig({ text_color: v }) },
      ],
      fontEditable: { get: () => config.font_family, set: (v) => window.elementSdk.setConfig({ font_family: v }) },
      fontSizeable: { get: () => config.font_size, set: (v) => window.elementSdk.setConfig({ font_size: v }) }
    }),
    mapToEditPanelValues: (config) => new Map([
      ['page_title', config.page_title],
      ['user_name', config.user_name],
      ['worked_time_label', config.worked_time_label],
      ['assigned_tasks_label', config.assigned_tasks_label],
      ['available_tasks_label', config.available_tasks_label]
    ])
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
