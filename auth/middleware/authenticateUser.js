const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { logSecurityEvent } = require("../utils/auditLogger");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await logSecurityEvent({
    event: "AUTHENTICATION_FAILED",
    req,
    details: "Missing or invalid Authorization header",
  });

      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);

    if (!user) {
       await logSecurityEvent({
    event: "AUTHENTICATION_FAILED",
    req,
    details: "Token user does not exist",
  });

      return res.status(401).json({
        message: "Authentication required",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    await logSecurityEvent({
    event: "AUTHENTICATION_FAILED",
    req,
    details: "Invalid or expired authentication token",
  });

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authenticateUser;