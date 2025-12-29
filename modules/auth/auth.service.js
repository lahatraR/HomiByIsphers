import { AUTH_ERRORS } from './auth.constants.js';

export function login(credentials) {
  const { email, password } = credentials;

  if (email === 'demo@homi.com' && password === 'password123') {
    return { success: true };
  }

  return {
    success: false,
    error: AUTH_ERRORS.INVALID_CREDENTIALS
  };
}
