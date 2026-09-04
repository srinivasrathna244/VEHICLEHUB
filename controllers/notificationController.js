const db = require("../database/db");

/**
 * List All User Notifications
 */
const listNotifications = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [notifications] = await db.query(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            [userId]
        );

        // Mark all as read when page is visited
        await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);

        res.render("notifications/index", {
            title: "Notifications",
            notifications
        });
    } catch (error) {
        console.error("List Notifications Error:", error);
        req.flash("error_msg", "Failed to load notifications.");
        res.redirect("/dashboard");
    }
};

/**
 * Mark All Notifications as Read (AJAX or POST)
 */
const markAllAsRead = async (req, res) => {
    const userId = req.session.user.id;
    try {
        await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId]);
        if (req.xhr) return res.json({ success: true });
        res.redirect("back");
    } catch (error) {
        console.error("Mark All Read Error:", error);
        if (req.xhr) return res.status(500).json({ success: false });
        res.redirect("back");
    }
};

module.exports = {
    listNotifications,
    markAllAsRead
};
