const MAX_FAILED_LOGIN_ATTEMPTS = 5;

// Account remains locked for 15 minutes.
const ACCOUNT_LOCK_DURATION_MS = 1 * 60 * 1000;

module.exports = {
  MAX_FAILED_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_DURATION_MS,
};