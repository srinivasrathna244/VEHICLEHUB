const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/authMiddleware");

// Apply admin guard to all admin routes
router.use(requireAdmin);

router.get("/", adminController.dashboard);
router.get("/users", adminController.listUsers);
router.post("/users/suspend", adminController.suspendUser);
router.post("/users/unsuspend", adminController.unsuspendUser);

router.get("/vehicles", adminController.listVehicles);
router.post("/vehicles/approve", adminController.approveVehicle);
router.post("/vehicles/reject", adminController.rejectVehicle);
router.post("/vehicles/delete", adminController.deleteVehicleAdmin);

router.get("/reports", adminController.listReports);
router.post("/reports/update", adminController.updateReportStatus);

router.get("/categories", adminController.listCategories);
router.post("/categories/update", adminController.updateCategory);

router.get("/audit-logs", adminController.listAuditLogs);

router.get("/market-importer", adminController.showMarketImporter);
router.post("/market-importer/sync", adminController.importMarketData);

module.exports = router;
