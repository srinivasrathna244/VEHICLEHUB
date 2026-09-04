const express = require("express");
const router = express.Router();
const homeController = require("../controllers/homeController");
const { requireLogin } = require("../middleware/authMiddleware");

router.get("/", homeController.landingPage);
router.get("/dashboard", requireLogin, homeController.dashboard);

module.exports = router;