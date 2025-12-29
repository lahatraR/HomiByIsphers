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
}
