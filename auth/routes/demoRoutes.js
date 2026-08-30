const express = require("express");

const authenticateUser = require("../middleware/authenticateUser");
const authorizeRoles = require("../middleware/authorizeRoles");

const router = express.Router();

// Public
router.get("/public", (req, res) => {
  res.status(200).json({
    message: "Public route accessible",
  });
});

// Authenticated users
router.get("/profile", authenticateUser, (req, res) => {
  res.status(200).json({
    message: "Profile accessed successfully",
    user: req.user,
  });
});

// Customers only
router.get(
  "/customer/orders",
  authenticateUser,
  authorizeRoles("CUSTOMER"),
  (req, res) => {
    res.status(200).json({
      message: "Customer orders accessed successfully",
      user: req.user,
      orders: [],
    });
  }
);

// Admin only
router.get(
  "/admin/dashboard",
  authenticateUser,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.status(200).json({
      message: "Admin dashboard accessed successfully",
      user: req.user,
    });
  }
);

module.exports = router;