import { initElementSdk } from './config/elementSdk.js';
import { defaultConfig } from './config/defaultConfig.js';
import { renderDashboard } from './modules/dahsboard/dashboard.controller.js';

/**
 * Initialise l'application.
 * - SDK Homi
 * - Configuration par défaut
 * - UI principale
 */
export function bootstrapApp() {
  // 1️⃣ Initialiser l'Element SDK avec config par défaut
  initElementSdk(defaultConfig);

  // 2️⃣ Render le dashboard dans #app
  renderDashboard();

  // 3️⃣ Eventuelle logique de mise à jour dynamique via SDK
  // Exemple : onConfigChange du SDK mettra à jour la UI
}
