const db = require("../database/db");

/**
 * Toggle Favorite (Add/Remove)
 * Supports both POST and GET (safe fallback), and AJAX JSON responses.
 */
const toggleFavorite = async (req, res) => {
    const userId = req.session && req.session.user ? req.session.user.id : null;
    const vehicleId = req.params.vehicleId;

    if (!userId) {
        const isJson = req.xhr || (req.headers.accept && req.headers.accept.includes("json"));
        if (isJson) {
            return res.status(401).json({ success: false, message: "Please log in to save vehicles to favorites." });
        }
        req.flash("error_msg", "Please log in to save vehicles to your favorites.");
        return res.redirect(`/login?redirect=${encodeURIComponent(`/vehicles/${vehicleId}`)}`);
    }

    try {
        const [existing] = await db.query(
            "SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?",
            [userId, vehicleId]
        );

        let favorited = false;
        if (existing.length > 0) {
            await db.query("DELETE FROM favorites WHERE id = ?", [existing[0].id]);
            favorited = false;
        } else {
            await db.query(
                "INSERT INTO favorites (user_id, vehicle_id) VALUES (?, ?)",
                [userId, vehicleId]
            );
            favorited = true;
        }

        // Return JSON if AJAX request
        const isJson = req.xhr || (req.headers.accept && req.headers.accept.includes("json"));
        if (isJson) {
            const [countRes] = await db.query("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?", [userId]);
            return res.json({
                success: true,
                favorited,
                totalFavorites: countRes[0].total
            });
        }

        req.flash("success_msg", favorited ? "Vehicle added to your favorites!" : "Vehicle removed from favorites.");
        const returnUrl = req.get("Referrer") || `/vehicles/${vehicleId}`;
        res.redirect(returnUrl);
    } catch (error) {
        console.error("Toggle Favorite Error:", error);
        const isJson = req.xhr || (req.headers.accept && req.headers.accept.includes("json"));
        if (isJson) {
            return res.status(500).json({ success: false, message: "Failed to update favorite status" });
        }
        req.flash("error_msg", "Error updating favorite.");
        const returnUrl = req.get("Referrer") || `/vehicles/${vehicleId}`;
        res.redirect(returnUrl);
    }
};

/**
 * List User's Favorites
 */
const listFavorites = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [vehicles] = await db.query(
            `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
                    f.created_at AS favorited_at
             FROM favorites f
             JOIN vehicles v ON f.vehicle_id = v.id
             JOIN vehicle_categories c ON v.category_id = c.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [userId]
        );

        res.render("favorites/index", {
            title: "My Favorites & Wishlist",
            vehicles
        });
    } catch (error) {
        console.error("List Favorites Error:", error);
        req.flash("error_msg", "Failed to load saved vehicles.");
        res.render("favorites/index", {
            title: "My Favorites",
            vehicles: []
        });
    }
};

module.exports = {
    toggleFavorite,
    listFavorites
};
