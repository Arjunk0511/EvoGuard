const { logSecurityEvent } = require("../utils/auditLogger");
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logSecurityEvent({ 
        event: "AUTHORIZATION_FAILED", 
        userId: req.user.id, 
        email: req.user.email,
         req, 
         details: `Role ${req.user.role} is not authorized. Required role: ${allowedRoles.join( ", " )}`,
         });
      return res.status(403).json({
        message: "Forbidden",
      });
    }

    next();
  };
};

module.exports = authorizeRoles;