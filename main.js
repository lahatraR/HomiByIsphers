import { authDom } from './modules/auth/auth.dom.js';
import { initAuth } from './modules/auth/auth.controller.js';
import { bootstrapApp } from './bootstrap.js';

bootstrapApp();
initAuth(authDom);
