const db = require("../database/db");

class RecommendationService {
    /**
     * Get similar vehicle recommendations based on category, brand, price range, or location
     * @param {Object} vehicle Current vehicle object
     * @param {number} limit Number of recommendations (default 4)
     * @returns {Promise<Array>}
     */
    static async getSimilarVehicles(vehicle, limit = 4) {
        if (!vehicle || !vehicle.id) return [];

        try {
            const minPrice = vehicle.price ? Math.max(0, vehicle.price * 0.6) : 0;
            const maxPrice = vehicle.price ? vehicle.price * 1.4 : 99999999;

            const [rows] = await db.query(
                `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
                 FROM vehicles v
                 JOIN vehicle_categories c ON v.category_id = c.id
                 WHERE v.id != ? 
                   AND v.status = 'ACTIVE'
                   AND (
                       v.category_id = ? 
                       OR v.brand = ? 
                       OR (v.price BETWEEN ? AND ?)
                       OR v.registration_city = ?
                   )
                 ORDER BY 
                    (CASE WHEN v.category_id = ? THEN 4 ELSE 0 END +
                     CASE WHEN v.brand = ? THEN 3 ELSE 0 END +
                     CASE WHEN v.registration_city = ? THEN 2 ELSE 0 END) DESC,
                    v.created_at DESC
                 LIMIT ?`,
                [
                    vehicle.id,
                    vehicle.category_id,
                    vehicle.brand,
                    minPrice,
                    maxPrice,
                    vehicle.registration_city || "",
                    vehicle.category_id,
                    vehicle.brand,
                    vehicle.registration_city || "",
                    limit
                ]
            );

            return rows;
        } catch (error) {
            console.error("RecommendationService Error:", error.message);
            return [];
        }
    }

    /**
     * Get popular / trending vehicles across all categories
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getPopularVehicles(limit = 8) {
        try {
            const [rows] = await db.query(
                `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
                    (SELECT COUNT(*) FROM favorites WHERE vehicle_id = v.id) AS favorites_count
                 FROM vehicles v
                 JOIN vehicle_categories c ON v.category_id = c.id
                 WHERE v.status = 'ACTIVE'
                 ORDER BY v.views_count DESC, favorites_count DESC, v.created_at DESC
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error("getPopularVehicles Error:", error.message);
            return [];
        }
    }

    /**
     * Get recently added active listings
     * @param {number} limit 
     * @returns {Promise<Array>}
     */
    static async getRecentVehicles(limit = 8) {
        try {
            const [rows] = await db.query(
                `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image
                 FROM vehicles v
                 JOIN vehicle_categories c ON v.category_id = c.id
                 WHERE v.status = 'ACTIVE'
                 ORDER BY v.created_at DESC
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error("getRecentVehicles Error:", error.message);
            return [];
        }
    }
}

module.exports = RecommendationService;
