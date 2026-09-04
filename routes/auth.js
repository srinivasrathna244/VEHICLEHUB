const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { redirectIfAuthenticated } = require("../middleware/authMiddleware");
const { registerValidationRules, loginValidationRules, handleValidationErrors } = require("../middleware/validationMiddleware");

// Login
router.get("/login", redirectIfAuthenticated, authController.showLogin);
router.post("/login", redirectIfAuthenticated, loginValidationRules, handleValidationErrors("/login"), authController.loginUser);

// Register
router.get("/register", redirectIfAuthenticated, authController.showRegister);
router.post("/register", redirectIfAuthenticated, registerValidationRules, handleValidationErrors("/register"), authController.registerUser);

// Logout
router.get("/logout", authController.logoutUser);
router.post("/logout", authController.logoutUser);

// Password Reset
router.get("/forgot-password", redirectIfAuthenticated, authController.showForgotPassword);
router.post("/forgot-password", redirectIfAuthenticated, authController.sendResetLink);
router.get("/reset-password", redirectIfAuthenticated, authController.showResetPassword);
router.post("/reset-password", redirectIfAuthenticated, authController.processResetPassword);

module.exports = router;