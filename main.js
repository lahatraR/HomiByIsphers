import { authDom } from './modules/auth/aut.dom.js';
import { initAuth } from './modules/auth/auth.controller.js';
import { bootstrapApp,bootstrap } from './boostrap.js';
import { layoutDom } from './modules/layout/layout.dom.js';
import { initLayout } from './modules/layout/layout.controller.js';
import { initNavigation } from './modules/navigation/navigation.controller.js';
import { initSearch } from './modules/search/search.controller.js';

bootstrapApp();
initAuth(authDom);

bootstrap();
initLayout(layoutDom);
initNavigation();
initSearch(layoutDom);
