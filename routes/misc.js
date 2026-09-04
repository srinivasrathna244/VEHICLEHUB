const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const reportController = require("../controllers/reportController");
const notificationController = require("../controllers/notificationController");
const { requireLogin } = require("../middleware/authMiddleware");

// Reviews
router.post("/reviews/add", requireLogin, reviewController.addReview);
router.get("/reviews/add", (req, res) => res.redirect("/vehicles"));

// Reports (Publicly accessible to protect buyers from fraud, spam, and scams)
router.post("/reports/submit", reportController.submitReport);
router.get("/reports/submit", (req, res) => res.redirect("/vehicles"));

// Notifications
router.get("/notifications", requireLogin, notificationController.listNotifications);
router.post("/notifications/read-all", requireLogin, notificationController.markAllAsRead);

module.exports = router;
