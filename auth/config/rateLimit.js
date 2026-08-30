const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,                 // Maximum 5 login requests
};

const REGISTER_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3,                 // Maximum 3 registration requests
};

const ADMIN_RATE_LIMIT = {
  windowMs: 1 * 60 * 1000, // 15 minutes
  limit: 30,                // Maximum 30 admin requests
};

module.exports = {
  LOGIN_RATE_LIMIT,
  REGISTER_RATE_LIMIT,
  ADMIN_RATE_LIMIT,
};