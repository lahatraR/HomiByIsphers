// main.js
import { bootstrapApp } from './bootstrap.js';

// Modules Dashboard
import { initDashboard } from './modules/dahsboard/dashboard.controller.js';

// Modules Auth (si tu gères l’auth)
import { authDom } from './modules/auth/aut.dom.js';
import { initAuth } from './modules/auth/auth.controller.js';

// Modules Layout / Navigation / Search
import { layoutDom } from './modules/layout/layout.dom.js';
import { initLayout } from './modules/layout/layout.controller.js';
import { initNavigation } from './modules/navigation/navigation.controller.js';
import { initSearch } from './modules/search/search.controller.js';

// 1️⃣ Initialisation globale de l'app (SDK, config, etc.)
bootstrapApp();

// 2️⃣ Initialisation des modules fonctionnels
initAuth(authDom);         // Authentification & login
initLayout(layoutDom);     // Header, sidebar, structure principale
initNavigation();          // Menu / navigation
initSearch(layoutDom);     // Barre de recherche
initDashboard();// Dashboard principal (stats + tâches)
