import { AUTH_ERRORS } from './auth.constants.js';

export function validateCredentials({ email, password }) {
  if (!email || !password) {
    return { valid: false, error: AUTH_ERRORS.EMPTY_FIELDS };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: AUTH_ERRORS.INVALID_EMAIL };
  }

  return { valid: true };
}
