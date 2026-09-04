const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");
const { requireLogin } = require("../middleware/authMiddleware");

router.get("/favorites", requireLogin, favoriteController.listFavorites);
router.get("/favorites/toggle/:vehicleId", favoriteController.toggleFavorite);
router.post("/favorites/toggle/:vehicleId", favoriteController.toggleFavorite);

module.exports = router;
