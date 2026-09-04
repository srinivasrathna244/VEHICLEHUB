const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { requireLogin } = require("../middleware/authMiddleware");

// Specific routes first
router.get("/messages", requireLogin, messageController.listConversations);
router.post("/messages/start", requireLogin, messageController.initiateConversation);
router.get("/messages/start", (req, res) => res.redirect("/messages"));

// Parameterized chat routes
router.get("/messages/:conversationId", requireLogin, messageController.viewChat);
router.post("/messages/:conversationId/send", requireLogin, messageController.sendMessage);

module.exports = router;
