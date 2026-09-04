const db = require("../database/db");

/**
 * Admin Dashboard Overview
 */
const dashboard = async (req, res) => {
    try {
        const [
            [usersStats],
            [vehicleStats],
            [reportStats],
            [messageStats],
            [recentReports],
            [pendingVehicles],
            [recentUsers]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS total, SUM(CASE WHEN is_suspended=1 THEN 1 ELSE 0 END) AS suspended FROM users"),
            db.query(`SELECT COUNT(*) AS total, 
                SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status='SOLD' THEN 1 ELSE 0 END) AS sold,
                SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status='REJECTED' THEN 1 ELSE 0 END) AS rejected
             FROM vehicles`),
            db.query("SELECT COUNT(*) AS total, SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending FROM reports"),
            db.query("SELECT COUNT(*) AS total FROM messages"),
            db.query(
                `SELECT r.*, v.title AS vehicle_title, u.first_name AS reporter_name
                 FROM reports r 
                 JOIN vehicles v ON r.vehicle_id = v.id 
                 JOIN users u ON r.reporter_id = u.id
                 WHERE r.status = 'PENDING' 
                 ORDER BY r.created_at DESC LIMIT 5`
            ),
            db.query(
                `SELECT v.*, c.name AS category_name, u.first_name AS seller_name
                 FROM vehicles v 
                 JOIN vehicle_categories c ON v.category_id = c.id
                 JOIN users u ON v.seller_id = u.id
                 WHERE v.status = 'PENDING'
                 ORDER BY v.created_at DESC LIMIT 5`
            ),
            db.query("SELECT id, first_name, last_name, email, role, is_suspended, created_at FROM users ORDER BY created_at DESC LIMIT 10")
        ]);

        res.render("admin/dashboard", {
            title: "Admin Dashboard",
            stats: {
                totalUsers: usersStats[0].total || 0,
                suspendedUsers: usersStats[0].suspended || 0,
                totalVehicles: vehicleStats[0].total || 0,
                activeVehicles: vehicleStats[0].active || 0,
                soldVehicles: vehicleStats[0].sold || 0,
                pendingVehicles: vehicleStats[0].pending || 0,
                rejectedVehicles: vehicleStats[0].rejected || 0,
                totalReports: reportStats[0].total || 0,
                pendingReports: reportStats[0].pending || 0,
                totalMessages: messageStats[0].total || 0
            },
            recentReports,
            pendingVehicles,
            recentUsers
        });
    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        req.flash("error_msg", "Failed to load admin dashboard.");
        res.redirect("/dashboard");
    }
};

/**
 * Admin - All Users List
 */
const listUsers = async (req, res) => {
    const { search, role, suspended, page = 1 } = req.query;
    const limit = 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    try {
        let whereClauses = ["1=1"];
        let params = [];

        if (search && search.trim() !== "") {
            whereClauses.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
            const kw = `%${search.trim()}%`;
            params.push(kw, kw, kw, kw);
        }
        if (role && role !== "") {
            whereClauses.push("role = ?");
            params.push(role);
        }
        if (suspended === "1") {
            whereClauses.push("is_suspended = 1");
        } else if (suspended === "0") {
            whereClauses.push("is_suspended = 0");
        }

        const whereSql = "WHERE " + whereClauses.join(" AND ");
        const [countRes] = await db.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
        const totalUsers = countRes[0].total || 0;
        const totalPages = Math.ceil(totalUsers / limit) || 1;

        const [users] = await db.query(
            `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_suspended, u.city, u.created_at,
                    (SELECT COUNT(*) FROM vehicles WHERE seller_id = u.id) AS listings_count
             FROM users u
             ${whereSql}
             ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.render("admin/users", {
            title: "Manage Users",
            users,
            totalUsers,
            currentPage: parseInt(page),
            totalPages,
            filters: req.query
        });
    } catch (error) {
        console.error("Admin List Users Error:", error);
        req.flash("error_msg", "Failed to load users.");
        res.render("admin/users", { title: "Manage Users", users: [], totalUsers: 0, currentPage: 1, totalPages: 1, filters: {} });
    }
};

/**
 * Admin - Suspend User
 */
const suspendUser = async (req, res) => {
    const adminId = req.session.user.id;
    const { user_id, reason } = req.body;

    try {
        if (parseInt(user_id) === adminId) {
            req.flash("error_msg", "You cannot suspend your own account.");
            return res.redirect("/admin/users");
        }

        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [user_id]);
        if (users.length === 0) {
            req.flash("error_msg", "User not found.");
            return res.redirect("/admin/users");
        }

        if (users[0].role === "ADMIN") {
            req.flash("error_msg", "Cannot suspend another administrator.");
            return res.redirect("/admin/users");
        }

        const suspendReason = reason ? reason.trim() : "Violation of platform terms and conditions";
        await db.query("UPDATE users SET is_suspended = 1, suspended_reason = ? WHERE id = ?", [suspendReason, user_id]);

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'SUSPEND_USER', 'USER', ?, ?)",
            [adminId, user_id, `Suspended user ID ${user_id}. Reason: ${suspendReason}`]
        );

        req.flash("success_msg", `User account has been suspended.`);
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Suspend User Error:", error);
        req.flash("error_msg", "Failed to suspend user.");
        res.redirect("/admin/users");
    }
};

/**
 * Admin - Unsuspend User
 */
const unsuspendUser = async (req, res) => {
    const adminId = req.session.user.id;
    const { user_id } = req.body;

    try {
        await db.query("UPDATE users SET is_suspended = 0, suspended_reason = NULL WHERE id = ?", [user_id]);
        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'UNSUSPEND_USER', 'USER', ?, ?)",
            [adminId, user_id, `Reinstated suspended user ID ${user_id}`]
        );

        req.flash("success_msg", "User account has been reinstated successfully.");
        res.redirect("/admin/users");
    } catch (error) {
        console.error("Unsuspend User Error:", error);
        req.flash("error_msg", "Failed to reinstate user.");
        res.redirect("/admin/users");
    }
};

/**
 * Admin - All Vehicles
 */
const listVehicles = async (req, res) => {
    const { search, status, category, page = 1 } = req.query;
    const limit = 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    try {
        let whereClauses = ["1=1"];
        let params = [];

        if (search && search.trim() !== "") {
            whereClauses.push("(v.title LIKE ? OR v.brand LIKE ? OR v.registration_number LIKE ?)");
            const kw = `%${search.trim()}%`;
            params.push(kw, kw, kw);
        }
        if (status && status !== "") {
            whereClauses.push("v.status = ?");
            params.push(status);
        }
        if (category && category !== "") {
            whereClauses.push("v.category_id = ?");
            params.push(parseInt(category));
        }

        const whereSql = "WHERE " + whereClauses.join(" AND ");
        const [countRes] = await db.query(`SELECT COUNT(*) AS total FROM vehicles v JOIN vehicle_categories c ON v.category_id = c.id ${whereSql}`, params);
        const totalVehicles = countRes[0].total || 0;
        const totalPages = Math.ceil(totalVehicles / limit) || 1;

        const [vehicles] = await db.query(
            `SELECT v.*, c.name AS category_name, u.first_name AS seller_name, u.email AS seller_email,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC LIMIT 1) AS primary_image
             FROM vehicles v
             JOIN vehicle_categories c ON v.category_id = c.id
             JOIN users u ON v.seller_id = u.id
             ${whereSql}
             ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [categories] = await db.query("SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC");

        res.render("admin/vehicles", {
            title: "Manage Vehicles",
            vehicles,
            totalVehicles,
            currentPage: parseInt(page),
            totalPages,
            categories,
            filters: req.query
        });
    } catch (error) {
        console.error("Admin List Vehicles Error:", error);
        req.flash("error_msg", "Failed to load vehicle listings.");
        res.render("admin/vehicles", { title: "Manage Vehicles", vehicles: [], totalVehicles: 0, currentPage: 1, totalPages: 1, categories: [], filters: {} });
    }
};

/**
 * Admin - Approve Vehicle
 */
const approveVehicle = async (req, res) => {
    const adminId = req.session.user.id;
    const { vehicle_id } = req.body;

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id]);
        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle not found.");
            return res.redirect("/admin/vehicles");
        }

        const vehicle = vehicles[0];
        await db.query("UPDATE vehicles SET status = 'ACTIVE' WHERE id = ?", [vehicle_id]);

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'APPROVE_VEHICLE', 'VEHICLE', ?, ?)",
            [adminId, vehicle_id, `Approved vehicle listing: "${vehicle.title}"`]
        );

        await db.query(
            "INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, 'Listing Approved!', ?, ?, 'success')",
            [vehicle.seller_id, `Your vehicle listing "${vehicle.title}" has been approved and is now live on VehicleHub.`, `/vehicles/${vehicle_id}`]
        );

        req.flash("success_msg", "Vehicle listing approved and is now active.");
        res.redirect("/admin/vehicles");
    } catch (error) {
        console.error("Approve Vehicle Error:", error);
        req.flash("error_msg", "Failed to approve vehicle listing.");
        res.redirect("/admin/vehicles");
    }
};

/**
 * Admin - Reject Vehicle
 */
const rejectVehicle = async (req, res) => {
    const adminId = req.session.user.id;
    const { vehicle_id, rejection_reason } = req.body;

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id]);
        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle not found.");
            return res.redirect("/admin/vehicles");
        }

        const vehicle = vehicles[0];
        const reason = rejection_reason ? rejection_reason.trim() : "Listing did not meet VehicleHub quality standards.";

        await db.query("UPDATE vehicles SET status = 'REJECTED', rejection_reason = ? WHERE id = ?", [reason, vehicle_id]);

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'REJECT_VEHICLE', 'VEHICLE', ?, ?)",
            [adminId, vehicle_id, `Rejected vehicle listing: "${vehicle.title}". Reason: ${reason}`]
        );

        await db.query(
            "INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, 'Listing Rejected', ?, ?, 'error')",
            [vehicle.seller_id, `Your listing "${vehicle.title}" was not approved. Reason: ${reason}`, `/my-listings`]
        );

        req.flash("success_msg", "Vehicle listing has been rejected.");
        res.redirect("/admin/vehicles");
    } catch (error) {
        console.error("Reject Vehicle Error:", error);
        req.flash("error_msg", "Failed to reject listing.");
        res.redirect("/admin/vehicles");
    }
};

/**
 * Admin - Delete Vehicle
 */
const deleteVehicleAdmin = async (req, res) => {
    const adminId = req.session.user.id;
    const { vehicle_id } = req.body;
    const path = require("path");
    const fs = require("fs");

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id]);
        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle not found.");
            return res.redirect("/admin/vehicles");
        }

        const vehicle = vehicles[0];
        const [images] = await db.query("SELECT image FROM vehicle_images WHERE vehicle_id = ?", [vehicle_id]);

        for (const img of images) {
            const filePath = path.join(__dirname, "..", "uploads", "vehicles", img.image);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
            }
        }

        await db.query("DELETE FROM vehicles WHERE id = ?", [vehicle_id]);

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'DELETE_VEHICLE', 'VEHICLE', ?, ?)",
            [adminId, vehicle_id, `Admin deleted vehicle listing: "${vehicle.title}"`]
        );

        req.flash("success_msg", "Vehicle listing permanently deleted.");
        res.redirect("/admin/vehicles");
    } catch (error) {
        console.error("Admin Delete Vehicle Error:", error);
        req.flash("error_msg", "Failed to delete listing.");
        res.redirect("/admin/vehicles");
    }
};

/**
 * Admin - Reports List
 */
const listReports = async (req, res) => {
    const { status, page = 1 } = req.query;
    const limit = 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    try {
        let whereSql = "";
        let params = [];
        if (status && status !== "") {
            whereSql = "WHERE r.status = ?";
            params.push(status);
        }

        const [countRes] = await db.query(`SELECT COUNT(*) AS total FROM reports r ${whereSql}`, params);
        const totalReports = countRes[0].total || 0;
        const totalPages = Math.ceil(totalReports / limit) || 1;

        const [reports] = await db.query(
            `SELECT r.*, v.title AS vehicle_title, v.brand, v.model,
                    COALESCE(u.first_name, r.reporter_contact, 'Guest') AS reporter_name,
                    COALESCE(u.email, r.reporter_contact, 'Anonymous') AS reporter_email
             FROM reports r
             JOIN vehicles v ON r.vehicle_id = v.id
             LEFT JOIN users u ON r.reporter_id = u.id
             ${whereSql}
             ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.render("admin/reports", {
            title: "Manage Reports",
            reports,
            totalReports,
            currentPage: parseInt(page),
            totalPages,
            filters: req.query
        });
    } catch (error) {
        console.error("Admin List Reports Error:", error);
        req.flash("error_msg", "Failed to load reports.");
        res.render("admin/reports", { title: "Manage Reports", reports: [], totalReports: 0, currentPage: 1, totalPages: 1, filters: {} });
    }
};

/**
 * Admin - Update Report Status
 */
const updateReportStatus = async (req, res) => {
    const adminId = req.session.user.id;
    const { report_id, status, admin_notes } = req.body;

    try {
        await db.query(
            "UPDATE reports SET status = ?, admin_notes = ? WHERE id = ?",
            [status, admin_notes ? admin_notes.trim() : null, report_id]
        );

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'UPDATE_REPORT', 'REPORT', ?, ?)",
            [adminId, report_id, `Report ID ${report_id} status updated to ${status}`]
        );

        req.flash("success_msg", `Report marked as ${status}.`);
        res.redirect("/admin/reports");
    } catch (error) {
        console.error("Update Report Status Error:", error);
        req.flash("error_msg", "Failed to update report status.");
        res.redirect("/admin/reports");
    }
};

/**
 * Admin - Manage Categories
 */
const listCategories = async (req, res) => {
    try {
        const [categories] = await db.query("SELECT * FROM vehicle_categories ORDER BY display_order ASC, name ASC");
        res.render("admin/categories", {
            title: "Manage Categories",
            categories
        });
    } catch (error) {
        console.error("Admin List Categories Error:", error);
        req.flash("error_msg", "Failed to load categories.");
        res.redirect("/admin");
    }
};

/**
 * Admin - Update Category
 */
const updateCategory = async (req, res) => {
    const { category_id, name, slug, icon, description, is_active } = req.body;

    try {
        await db.query(
            "UPDATE vehicle_categories SET name = ?, slug = ?, icon = ?, description = ?, is_active = ? WHERE id = ?",
            [name.trim(), slug.trim(), icon ? icon.trim() : "fa-car", description ? description.trim() : null, is_active ? 1 : 0, category_id]
        );

        req.flash("success_msg", "Category updated successfully.");
        res.redirect("/admin/categories");
    } catch (error) {
        console.error("Update Category Error:", error);
        req.flash("error_msg", "Failed to update category: " + error.message);
        res.redirect("/admin/categories");
    }
};

/**
 * Admin - Audit Logs
 */
const listAuditLogs = async (req, res) => {
    const { page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    try {
        const [countRes] = await db.query("SELECT COUNT(*) AS total FROM audit_logs");
        const totalLogs = countRes[0].total || 0;
        const totalPages = Math.ceil(totalLogs / limit) || 1;

        const [logs] = await db.query(
            `SELECT al.*, u.first_name AS admin_name, u.email AS admin_email
             FROM audit_logs al
             JOIN users u ON al.admin_id = u.id
             ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.render("admin/audit-logs", {
            title: "Audit Logs",
            logs,
            totalLogs,
            currentPage: parseInt(page),
            totalPages
        });
    } catch (error) {
        console.error("Audit Logs Error:", error);
        req.flash("error_msg", "Failed to load audit logs.");
        res.render("admin/audit-logs", { title: "Audit Logs", logs: [], totalLogs: 0, currentPage: 1, totalPages: 1 });
    }
};

/**
 * Admin - Show Market Data Importer Page
 */
const showMarketImporter = async (req, res) => {
    try {
        const [categories] = await db.query("SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC");
        const [stats] = await db.query(`
            SELECT c.name AS category_name, c.slug, COUNT(v.id) AS count
            FROM vehicle_categories c
            LEFT JOIN vehicles v ON c.id = v.category_id AND v.status = 'ACTIVE'
            GROUP BY c.id, c.name, c.slug
            ORDER BY c.display_order ASC
        `);

        res.render("admin/market-importer", {
            title: "Marketplace Data Importer",
            categories,
            stats
        });
    } catch (error) {
        console.error("Show Market Importer Error:", error);
        req.flash("error_msg", "Failed to load market importer.");
        res.redirect("/admin");
    }
};

/**
 * Admin - Trigger Market Data Import / Online Sync
 */
const importMarketData = async (req, res) => {
    const MarketDataService = require("../services/marketDataService");
    const { category_slug, limit = 50 } = req.body;

    try {
        const result = await MarketDataService.syncOnlineVehicles({
            categorySlug: category_slug,
            limit: parseInt(limit) || 50
        });

        await db.query(
            "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'SYNC_MARKET_DATA', 'VEHICLES', 0, ?)",
            [req.session.user.id, `Imported ${result.added} market vehicles (${result.skipped} skipped). Category: ${category_slug || 'all'}`]
        );

        req.flash("success_msg", `Market data synced! Added ${result.added} new vehicle listings (${result.skipped} existing listings were preserved).`);
        res.redirect("/admin/market-importer");
    } catch (error) {
        console.error("Import Market Data Error:", error);
        req.flash("error_msg", "Market sync error: " + error.message);
        res.redirect("/admin/market-importer");
    }
};

module.exports = {
    dashboard,
    listUsers,
    suspendUser,
    unsuspendUser,
    listVehicles,
    approveVehicle,
    rejectVehicle,
    deleteVehicleAdmin,
    listReports,
    updateReportStatus,
    listCategories,
    updateCategory,
    listAuditLogs,
    showMarketImporter,
    importMarketData
};
