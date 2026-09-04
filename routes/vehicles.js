const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { requireLogin } = require("../middleware/authMiddleware");
const { handleVehicleUpload } = require("../middleware/uploadMiddleware");
const { vehicleValidationRules, handleValidationErrors } = require("../middleware/validationMiddleware");

// 1. Static and Specific Routes
router.get("/vehicles", vehicleController.browseVehicles);
router.get("/vehicles/sell", requireLogin, vehicleController.showSellPage);
router.post("/vehicles/sell", requireLogin, handleVehicleUpload, vehicleValidationRules, handleValidationErrors("/vehicles/sell"), vehicleController.addVehicle);

router.get("/vehicles/edit/:id", requireLogin, vehicleController.showEditPage);
router.post("/vehicles/edit/:id", requireLogin, handleVehicleUpload, vehicleController.updateVehicle);

router.post("/vehicles/delete/:id", requireLogin, vehicleController.deleteVehicle);
router.post("/vehicles/sold/:id", requireLogin, vehicleController.markAsSold);
router.post("/vehicles/repost/:id", requireLogin, vehicleController.repostVehicle);

router.get("/my-listings", requireLogin, vehicleController.myListings);

// 2. Parameterized Routes (must come after specific /vehicles/sell, etc.)
router.get("/vehicles/:id", vehicleController.vehicleDetails);

// 3. Legacy Redirect Compatibility (from old /bikes/* routes)
router.get("/bikes", (req, res) => res.redirect("/vehicles"));
router.get("/bikes/:id", (req, res) => res.redirect(`/vehicles/${req.params.id}`));
router.get("/sell-bike", requireLogin, (req, res) => res.redirect("/vehicles/sell"));
router.get("/search", (req, res) => res.redirect(`/vehicles?search=${req.query.search || ""}`));

module.exports = router;
