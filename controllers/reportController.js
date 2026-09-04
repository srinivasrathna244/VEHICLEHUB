const db = require("../database/db");

/**
 * Submit Vehicle / Fraud Report
 * Supports authenticated users, guest users, and both AJAX and standard form submissions.
 */
const submitReport = async (req, res) => {
    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.includes("json")) || req.headers["x-requested-with"] === "XMLHttpRequest";
    const user = req.session && req.session.user ? req.session.user : null;
    const reporterId = user ? user.id : null;
    const { vehicle_id, reason, description, contact } = req.body;

    const returnUrl = req.get("Referrer") || (vehicle_id ? `/vehicles/${vehicle_id}` : "/vehicles");

    // Input validation
    if (!vehicle_id) {
        if (isAjax) return res.status(400).json({ success: false, message: "Vehicle ID is required." });
        req.flash("error_msg", "Vehicle ID is required.");
        return res.redirect(returnUrl);
    }

    if (!reason || reason.trim() === "") {
        if (isAjax) return res.status(400).json({ success: false, message: "Please select a reason for the report." });
        req.flash("error_msg", "Please select a reason for the report.");
        return res.redirect(returnUrl);
    }

    if (!description || description.trim().length < 5) {
        if (isAjax) return res.status(400).json({ success: false, message: "Please provide details explaining the issue (minimum 5 characters)." });
        req.flash("error_msg", "Please provide details explaining the issue (minimum 5 characters).");
        return res.redirect(returnUrl);
    }

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicle_id]);
        if (vehicles.length === 0) {
            if (isAjax) return res.status(404).json({ success: false, message: "Vehicle listing not found." });
            req.flash("error_msg", "Listing not found.");
            return res.redirect("/vehicles");
        }

        const vehicle = vehicles[0];
        const reporterContact = user 
            ? `${user.first_name} ${user.last_name || ''} (${user.email || user.phone})`
            : (contact && contact.trim() ? contact.trim() : "Anonymous Guest");

        // Format reason (note if seller self-reported during testing)
        let finalReason = reason.trim();
        if (user && vehicle.seller_id === user.id) {
            finalReason = `[Seller Self-Report]: ${finalReason}`;
        }

        // Check if a pending report already exists from this user or contact on this vehicle
        let existing = [];
        if (reporterId) {
            [existing] = await db.query(
                "SELECT id FROM reports WHERE reporter_id = ? AND vehicle_id = ? AND status = 'PENDING'",
                [reporterId, vehicle_id]
            );
        } else if (contact && contact.trim()) {
            [existing] = await db.query(
                "SELECT id FROM reports WHERE reporter_contact = ? AND vehicle_id = ? AND status = 'PENDING'",
                [contact.trim(), vehicle_id]
            );
        }

        if (existing.length > 0) {
            // Update existing pending report with the new information
            await db.query(
                "UPDATE reports SET reason = ?, description = CONCAT(description, '\n\n[Additional Details]: ', ?), updated_at = NOW() WHERE id = ?",
                [finalReason, description.trim(), existing[0].id]
            );
        } else {
            // Insert fresh report
            await db.query(
                "INSERT INTO reports (reporter_id, reporter_contact, vehicle_id, reason, description, status) VALUES (?, ?, ?, ?, ?, 'PENDING')",
                [reporterId, reporterContact, vehicle_id, finalReason, description.trim()]
            );
        }

        const successMessage = "Thank you. Your report has been submitted to our moderation team for immediate review.";

        if (isAjax) {
            return res.json({
                success: true,
                message: successMessage
            });
        }

        req.flash("success_msg", successMessage);
        res.redirect(returnUrl);
    } catch (error) {
        console.error("Submit Report Error:", error);
        if (isAjax) {
            return res.status(500).json({ success: false, message: "Failed to submit report. Please try again." });
        }
        req.flash("error_msg", "Failed to submit report. Please try again.");
        res.redirect(returnUrl);
    }
};

module.exports = {
    submitReport
};
