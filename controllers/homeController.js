const db = require("../database/db");
const RecommendationService = require("../services/recommendationService");

/**
 * Landing Page - Public access
 * Shows hero search, 12 category cards, popular & recent vehicles.
 */
const landingPage = async (req, res) => {
    try {
        const [popularVehicles, recentVehicles, totalVehiclesCount, totalUsersCount] = await Promise.all([
            RecommendationService.getPopularVehicles(8),
            RecommendationService.getRecentVehicles(8),
            db.query("SELECT COUNT(*) AS count FROM vehicles WHERE status = 'ACTIVE'"),
            db.query("SELECT COUNT(*) AS count FROM users")
        ]);

        res.render("home/index", {
            title: "India's Premier Multi-Vehicle Marketplace",
            popularVehicles,
            recentVehicles,
            stats: {
                vehiclesCount: totalVehiclesCount[0][0].count || 0,
                usersCount: totalUsersCount[0][0].count || 0
            }
        });
    } catch (error) {
        console.error("Landing Page Error:", error);
        res.render("home/index", {
            title: "Home",
            popularVehicles: [],
            recentVehicles: [],
            stats: { vehiclesCount: 0, usersCount: 0 }
        });
    }
};

/**
 * User Dashboard - Authenticated access
 */
const dashboard = async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [
            myListingsCount,
            mySoldListingsCount,
            favoritesCount,
            recentMyListings,
            recommendedVehicles
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS count FROM vehicles WHERE seller_id = ? AND status = 'ACTIVE'", [userId]),
            db.query("SELECT COUNT(*) AS count FROM vehicles WHERE seller_id = ? AND status = 'SOLD'", [userId]),
            db.query("SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?", [userId]),
            db.query(
                `SELECT v.*, c.name AS category_name,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
                 FROM vehicles v
                 JOIN vehicle_categories c ON v.category_id = c.id
                 WHERE v.seller_id = ?
                 ORDER BY v.created_at DESC
                 LIMIT 4`,
                [userId]
            ),
            RecommendationService.getPopularVehicles(6)
        ]);

        res.render("home/dashboard", {
            title: "My Dashboard",
            stats: {
                activeListings: myListingsCount[0][0].count || 0,
                soldListings: mySoldListingsCount[0][0].count || 0,
                favorites: favoritesCount[0][0].count || 0
            },
            recentMyListings: recentMyListings[0],
            recommendedVehicles
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        req.flash("error_msg", "Failed to load dashboard data.");
        res.render("home/dashboard", {
            title: "Dashboard",
            stats: { activeListings: 0, soldListings: 0, favorites: 0 },
            recentMyListings: [],
            recommendedVehicles: []
        });
    }
};

module.exports = {
    landingPage,
    dashboard
};
