const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { requireLogin } = require("../middleware/authMiddleware");
const { handleAvatarUpload } = require("../middleware/uploadMiddleware");
const { profileValidationRules, handleValidationErrors } = require("../middleware/validationMiddleware");

router.get("/profile", requireLogin, profileController.viewProfile);
router.get("/profile/edit", requireLogin, profileController.showEditProfile);
router.post("/profile/edit", requireLogin, handleAvatarUpload, profileValidationRules, handleValidationErrors("/profile/edit"), profileController.updateProfile);
router.get("/profile/change-password", requireLogin, profileController.showChangePassword);
router.post("/profile/change-password", requireLogin, profileController.updatePassword);

// Legacy redirect
router.get("/edit-profile", requireLogin, (req, res) => res.redirect("/profile/edit"));

module.exports = router;