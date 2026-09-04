const db = require("../database/db");

/**
 * Add / Update Seller Review
 */
const addReview = async (req, res) => {
    const reviewerId = req.session && req.session.user ? req.session.user.id : null;
    const { seller_id, vehicle_id, rating, comment } = req.body;
    const targetVehicleId = vehicle_id ? parseInt(vehicle_id) : null;
    const fallbackUrl = targetVehicleId ? `/vehicles/${targetVehicleId}` : "/vehicles";
    const returnUrl = req.get("Referrer") || fallbackUrl;

    if (!reviewerId) {
        req.flash("error_msg", "Please log in to leave a review.");
        return res.redirect(`/login?redirect=${encodeURIComponent(fallbackUrl)}`);
    }

    try {
        const targetSellerId = parseInt(seller_id);
        const starRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

        if (reviewerId === targetSellerId) {
            req.flash("error_msg", "You cannot submit a review for yourself.");
            return res.redirect(returnUrl);
        }

        // Check if user already reviewed this seller for this vehicle
        const [existing] = await db.query(
            "SELECT id FROM reviews WHERE seller_id = ? AND reviewer_id = ? AND (vehicle_id = ? OR vehicle_id IS NULL)",
            [targetSellerId, reviewerId, targetVehicleId]
        );

        if (existing.length > 0) {
            await db.query(
                "UPDATE reviews SET rating = ?, comment = ?, status = 'APPROVED', created_at = NOW() WHERE id = ?",
                [starRating, comment ? comment.trim() : null, existing[0].id]
            );
            req.flash("success_msg", "Your review has been updated!");
        } else {
            await db.query(
                "INSERT INTO reviews (seller_id, reviewer_id, vehicle_id, rating, comment, status) VALUES (?, ?, ?, ?, ?, 'APPROVED')",
                [targetSellerId, reviewerId, targetVehicleId, starRating, comment ? comment.trim() : null]
            );

            // Notify seller
            await db.query(
                `INSERT INTO notifications (user_id, title, message, link, type) 
                 VALUES (?, 'New Seller Review!', ?, '/profile', 'success')`,
                [
                    targetSellerId,
                    `${req.session.user.first_name} left you a ${starRating}-star rating!`
                ]
            );

            req.flash("success_msg", "Thank you for reviewing the seller!");
        }

        res.redirect(returnUrl);
    } catch (error) {
        console.error("Add Review Error:", error);
        req.flash("error_msg", "Failed to submit review.");
        res.redirect(returnUrl);
    }
};

module.exports = {
    addReview
};
