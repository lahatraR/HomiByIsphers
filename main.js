import { authDom } from './modules/auth/auth.dom.js';
import { initAuth } from './modules/auth/auth.controller.js';
import { bootstrapApp } from './bootstrap.js';
import { layoutDom } from './modules/layout/layout.dom.js';
import { initLayout } from './modules/layout/layout.controller.js';
import { initNavigation } from './modules/navigation/navigation.controller.js';
import { initSearch } from './modules/search/search.controller.js';
import { bootstrap } from './bootstrap.js';

bootstrapApp();
initAuth(authDom);

bootstrap();
initLayout(layoutDom);
initNavigation();
initSearch(layoutDom);
