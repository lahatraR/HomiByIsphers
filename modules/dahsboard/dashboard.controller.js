import { getSelectors } from './dashboard.dom.js';
import { renderDashboard } from './dashboard.view.js';
import { assignedTasks, availableTasks, toggleTask } from './dashboard.service.js';
import { defaultConfig } from '../../config/defaultConfig.js';
import { initElementSdk } from '../../config/elementSdk.js';

export function initDashboard() {
  const { app } = getSelectors();

  function onConfigChange(config) {
    renderDashboard(app, config, assignedTasks, availableTasks, (id) => {
      toggleTask(id);
      renderDashboard(app, config, assignedTasks, availableTasks, (i) => toggleTask(i));
    });
  }

  initElementSdk(defaultConfig, onConfigChange);

  onConfigChange(defaultConfig);
}
