import {
    validateCredentials
} from './auth.validators.js';
import {
    login
} from './auth.service.js';
import {
    AUTH_ERRORS
} from './auth.constants.js';
import * as view from './auth.view.js';

export function initAuth(dom) {
    dom.form.addEventListener('submit', (e) => {
        e.preventDefault();

        view.clearMessages(dom.error, dom.success);

        const credentials = {
            email: dom.email.value.trim(),
            password: dom.password.value.trim()
        };

        const validation = validateCredentials(credentials);
        if (!validation.valid) {
            return view.showError(dom.error, mapError(validation.error));
        }

        view.setLoading(dom.submitBtn, dom.submitText, true);

        setTimeout(() => {
            const result = login(credentials);
            if (result.success) {
                const basePath = window.location.pathname.split('/').slice(0, 2).join('/');
                window.location.href = `${window.location.origin}${basePath}/home.html`;
                return;
            } else {
                view.showError(dom.error, mapError(result.error));
                view.setLoading(dom.submitBtn, dom.submitText, false);
                return;
            }

            view.showSuccess(dom.success, 'Login successful! Redirecting...');
        }, 1200);
    });

    dom.togglePassword.addEventListener('click', () => togglePassword(dom));
}

function togglePassword(dom) {
    const visible = dom.password.type === 'password';
    dom.password.type = visible ? 'text' : 'password';
    dom.eye.style.display = visible ? 'none' : 'block';
    dom.eyeOff.style.display = visible ? 'block' : 'none';
}

function mapError(error) {
    switch (error) {
        case AUTH_ERRORS.EMPTY_FIELDS:
            return 'Please fill in all fields.';
        case AUTH_ERRORS.INVALID_EMAIL:
            return 'Invalid email address.';
        case AUTH_ERRORS.INVALID_CREDENTIALS:
            return 'Invalid email or password.';
        default:
            return 'Unexpected error.';
    }
}