const db = require("../database/db");
const { APP_NAME, APP_TAGLINE } = require("../config/constants");

// In-memory categories cache with 5-minute TTL to reduce DB queries
let cachedCategories = null;
let lastCategoryFetch = 0;

async function getActiveCategories() {
    const now = Date.now();
    if (cachedCategories && (now - lastCategoryFetch < 300000)) {
        return cachedCategories;
    }
    try {
        const [categories] = await db.query(
            "SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC"
        );
        cachedCategories = categories;
        lastCategoryFetch = now;
        return categories;
    } catch (err) {
        console.error("Failed to load categories in globalLocals:", err.message);
        return cachedCategories || [];
    }
}

const globalLocals = async (req, res, next) => {
    try {
        res.locals.appName = APP_NAME;
        res.locals.appTagline = APP_TAGLINE;
        res.locals.currentUrl = req.originalUrl;
        res.locals.currentPath = req.path;
        res.locals.query = req.query || {};
        res.locals.user = req.session && req.session.user ? req.session.user : null;
        res.locals.categories = await getActiveCategories();

        // Flash message handling
        res.locals.success_msg = req.flash("success_msg");
        res.locals.error_msg = req.flash("error_msg");
        res.locals.warning_msg = req.flash("warning_msg");
        res.locals.info_msg = req.flash("info_msg");
        
        const formFlash = req.flash("formData");
        res.locals.formData = formFlash.length > 0 ? formFlash[0] : {};

        // If user is authenticated, fetch unread counts and user's favorite IDs
        if (req.session && req.session.user) {
            const userId = req.session.user.id;

            const [unreadMsg] = await db.query(
                `SELECT COUNT(*) AS count FROM messages m
                 JOIN conversations c ON m.conversation_id = c.id
                 WHERE (c.buyer_id = ? OR c.seller_id = ?) 
                   AND m.sender_id != ? 
                   AND m.is_read = 0`,
                [userId, userId, userId]
            );
            res.locals.unreadMessagesCount = unreadMsg[0].count || 0;

            const [unreadNotif] = await db.query(
                "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
                [userId]
            );
            res.locals.unreadNotificationsCount = unreadNotif[0].count || 0;

            const [userFavorites] = await db.query(
                "SELECT vehicle_id FROM favorites WHERE user_id = ?",
                [userId]
            );
            res.locals.userFavoriteIds = userFavorites.map(f => f.vehicle_id);
        } else {
            res.locals.unreadMessagesCount = 0;
            res.locals.unreadNotificationsCount = 0;
            res.locals.userFavoriteIds = [];
        }

        next();
    } catch (error) {
        console.error("GlobalLocals Middleware Error:", error.message);
        res.locals.unreadMessagesCount = 0;
        res.locals.unreadNotificationsCount = 0;
        res.locals.userFavoriteIds = [];
        next();
    }
};

module.exports = globalLocals;
