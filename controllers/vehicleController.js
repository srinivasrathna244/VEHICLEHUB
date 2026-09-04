const db = require("../database/db");
const path = require("path");
const fs = require("fs");
const { PAGINATION_LIMIT, FUEL_TYPES, TRANSMISSIONS, OWNERSHIP_TYPES, CONDITIONS, INSURANCE_STATUSES } = require("../config/constants");
const RecommendationService = require("../services/recommendationService");
const ChallanService = require("../services/challanService");

/**
 * Browse Vehicles with Search, Filters, Sorting & Pagination
 */
const browseVehicles = async (req, res) => {
    try {
        const {
            search,
            category,
            brand,
            city,
            district,
            state,
            min_price,
            max_price,
            min_km,
            max_km,
            fuel_type,
            transmission,
            ownership_type,
            condition_rating,
            year_min,
            sort = "newest",
            page = 1
        } = req.query;

        const currentPage = Math.max(1, parseInt(page) || 1);
        const limit = PAGINATION_LIMIT;
        const offset = (currentPage - 1) * limit;

        let whereClauses = ["v.status = 'ACTIVE'"];
        let params = [];

        // Keyword search (title, brand, model, variant, description, registration_number)
        if (search && search.trim() !== "") {
            whereClauses.push("(v.title LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR v.variant LIKE ? OR v.registration_number LIKE ? OR v.registration_city LIKE ?)");
            const kw = `%${search.trim()}%`;
            params.push(kw, kw, kw, kw, kw, kw);
        }

        // Category filter (accepts ID or slug)
        if (category && category !== "" && category !== "all") {
            if (isNaN(category)) {
                whereClauses.push("c.slug = ?");
                params.push(category);
            } else {
                whereClauses.push("v.category_id = ?");
                params.push(parseInt(category));
            }
        }

        if (brand && brand.trim() !== "") {
            whereClauses.push("v.brand = ?");
            params.push(brand.trim());
        }

        if (city && city.trim() !== "") {
            whereClauses.push("v.registration_city LIKE ?");
            params.push(`%${city.trim()}%`);
        }

        if (district && district.trim() !== "") {
            whereClauses.push("v.registration_district LIKE ?");
            params.push(`%${district.trim()}%`);
        }

        if (state && state.trim() !== "") {
            whereClauses.push("v.registration_state = ?");
            params.push(state.trim());
        }

        if (min_price && !isNaN(min_price)) {
            whereClauses.push("v.price >= ?");
            params.push(parseFloat(min_price));
        }

        if (max_price && !isNaN(max_price)) {
            whereClauses.push("v.price <= ?");
            params.push(parseFloat(max_price));
        }

        if (min_km && !isNaN(min_km)) {
            whereClauses.push("v.kilometers >= ?");
            params.push(parseInt(min_km));
        }

        if (max_km && !isNaN(max_km)) {
            whereClauses.push("v.kilometers <= ?");
            params.push(parseInt(max_km));
        }

        if (fuel_type && fuel_type !== "") {
            whereClauses.push("v.fuel_type = ?");
            params.push(fuel_type);
        }

        if (transmission && transmission !== "") {
            whereClauses.push("v.transmission = ?");
            params.push(transmission);
        }

        if (ownership_type && ownership_type !== "") {
            whereClauses.push("v.ownership_type = ?");
            params.push(ownership_type);
        }

        if (condition_rating && condition_rating !== "") {
            whereClauses.push("v.condition_rating = ?");
            params.push(condition_rating);
        }

        if (year_min && !isNaN(year_min)) {
            whereClauses.push("v.manufacturing_year >= ?");
            params.push(parseInt(year_min));
        }

        const whereSql = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

        // Sorting
        let orderBySql = "ORDER BY v.created_at DESC";
        switch (sort) {
            case "oldest":
                orderBySql = "ORDER BY v.created_at ASC";
                break;
            case "price_asc":
                orderBySql = "ORDER BY v.price ASC";
                break;
            case "price_desc":
                orderBySql = "ORDER BY v.price DESC";
                break;
            case "km_asc":
                orderBySql = "ORDER BY v.kilometers ASC";
                break;
            case "km_desc":
                orderBySql = "ORDER BY v.kilometers DESC";
                break;
            case "year_desc":
                orderBySql = "ORDER BY v.manufacturing_year DESC";
                break;
            default:
                orderBySql = "ORDER BY v.created_at DESC";
        }

        // Count query
        const countSql = `
            SELECT COUNT(*) AS total 
            FROM vehicles v 
            JOIN vehicle_categories c ON v.category_id = c.id 
            ${whereSql}
        `;
        const [countResult] = await db.query(countSql, params);
        const totalVehicles = countResult[0].total || 0;
        const totalPages = Math.ceil(totalVehicles / limit) || 1;

        // Fetch paginated vehicles
        const selectSql = `
            SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                   u.first_name AS seller_first_name, u.phone AS seller_phone,
                   (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
                   (SELECT COUNT(*) FROM favorites WHERE vehicle_id = v.id) AS favorites_count
            FROM vehicles v
            JOIN vehicle_categories c ON v.category_id = c.id
            JOIN users u ON v.seller_id = u.id
            ${whereSql}
            ${orderBySql}
            LIMIT ? OFFSET ?
        `;
        const queryParams = [...params, limit, offset];
        const [vehicles] = await db.query(selectSql, queryParams);

        // Fetch distinct available brands for filter dropdown
        const [brandsList] = await db.query(
            "SELECT DISTINCT brand FROM vehicles WHERE status = 'ACTIVE' AND brand IS NOT NULL AND brand != '' ORDER BY brand ASC LIMIT 50"
        );

        res.render("vehicles/index", {
            title: "Explore Vehicles",
            vehicles,
            totalVehicles,
            currentPage,
            totalPages,
            brands: brandsList.map(b => b.brand),
            filters: req.query,
            sort,
            fuelTypes: FUEL_TYPES,
            transmissions: TRANSMISSIONS,
            ownershipTypes: OWNERSHIP_TYPES,
            conditions: CONDITIONS
        });
    } catch (error) {
        console.error("Browse Vehicles Error:", error);
        req.flash("error_msg", "Error fetching vehicle listings.");
        res.render("vehicles/index", {
            title: "Explore Vehicles",
            vehicles: [],
            totalVehicles: 0,
            currentPage: 1,
            totalPages: 1,
            brands: [],
            filters: req.query,
            sort: "newest",
            fuelTypes: FUEL_TYPES,
            transmissions: TRANSMISSIONS,
            ownershipTypes: OWNERSHIP_TYPES,
            conditions: CONDITIONS
        });
    }
};

/**
 * Show Sell Vehicle Page
 */
const showSellPage = async (req, res) => {
    try {
        const [categories] = await db.query("SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC");
        res.render("vehicles/sell", {
            title: "Sell Your Vehicle",
            categories,
            fuelTypes: FUEL_TYPES,
            transmissions: TRANSMISSIONS,
            ownershipTypes: OWNERSHIP_TYPES,
            conditions: CONDITIONS,
            insuranceStatuses: INSURANCE_STATUSES
        });
    } catch (error) {
        console.error("Show Sell Page Error:", error);
        req.flash("error_msg", "Failed to load vehicle categories.");
        res.redirect("/dashboard");
    }
};

/**
 * Add / Post New Vehicle
 */
const addVehicle = async (req, res) => {
    const seller_id = req.session.user.id;
    const {
        category_id,
        title,
        brand,
        model,
        variant,
        manufacturing_year,
        registration_year,
        registration_number,
        fuel_type,
        transmission,
        price,
        kilometers,
        mileage,
        engine_capacity,
        vehicle_color,
        ownership_type,
        insurance_status,
        insurance_expiry,
        fitness_status,
        registration_state,
        registration_district,
        registration_city,
        registration_mandal,
        location,
        description,
        condition_rating,
        scratches,
        dents,
        repairs,
        accident_history,
        mechanical_issues,
        number_of_tyres,
        seats,
        body_type,
        air_conditioning,
        airbags,
        operating_hours,
        horsepower,
        drive_type,
        payload_capacity
    } = req.body;

    try {
        // Build auto-title if not provided
        const vehicleTitle = title && title.trim() !== "" 
            ? title.trim() 
            : `${brand} ${model} ${variant || ''}`.trim();

        const insertSql = `
            INSERT INTO vehicles (
                seller_id, category_id, title, brand, model, variant,
                manufacturing_year, registration_year, registration_number,
                fuel_type, transmission, price, kilometers, mileage, engine_capacity,
                vehicle_color, ownership_type, insurance_status, insurance_expiry, fitness_status,
                registration_state, registration_district, registration_city, registration_mandal, location,
                description, condition_rating, scratches, dents, repairs, accident_history, mechanical_issues,
                number_of_tyres, seats, body_type, air_conditioning, airbags,
                operating_hours, horsepower, drive_type, payload_capacity,
                verification_status, status
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                'UNVERIFIED', 'ACTIVE'
            )
        `;

        const [result] = await db.query(insertSql, [
            seller_id,
            parseInt(category_id),
            vehicleTitle,
            brand.trim(),
            model.trim(),
            variant ? variant.trim() : null,
            parseInt(manufacturing_year),
            registration_year ? parseInt(registration_year) : null,
            registration_number ? registration_number.trim().toUpperCase() : null,
            fuel_type,
            transmission,
            parseFloat(price),
            parseInt(kilometers),
            mileage ? mileage.trim() : null,
            engine_capacity ? engine_capacity.trim() : null,
            vehicle_color ? vehicle_color.trim() : null,
            ownership_type,
            insurance_status || "None",
            insurance_expiry || null,
            fitness_status || "Not Applicable",
            registration_state ? registration_state.trim() : null,
            registration_district ? registration_district.trim() : null,
            registration_city ? registration_city.trim() : req.session.user.city || "Hyderabad",
            registration_mandal ? registration_mandal.trim() : null,
            location ? location.trim() : null,
            description ? description.trim() : null,
            condition_rating || "Good",
            scratches ? scratches.trim() : null,
            dents ? dents.trim() : null,
            repairs ? repairs.trim() : null,
            accident_history ? accident_history.trim() : null,
            mechanical_issues ? mechanical_issues.trim() : null,
            number_of_tyres ? parseInt(number_of_tyres) : null,
            seats ? parseInt(seats) : null,
            body_type ? body_type.trim() : null,
            air_conditioning ? 1 : 0,
            airbags ? 1 : 0,
            operating_hours ? parseInt(operating_hours) : null,
            horsepower ? parseInt(horsepower) : null,
            drive_type ? drive_type.trim() : null,
            payload_capacity ? payload_capacity.trim() : null
        ]);

        const vehicleId = result.insertId;

        // Handle uploaded images (up to 10)
        if (req.files && req.files.length > 0) {
            const imageInserts = req.files.map((file, index) => [
                vehicleId,
                file.filename,
                index === 0 ? 1 : 0, // First image is primary
                index
            ]);

            await db.query(
                "INSERT INTO vehicle_images (vehicle_id, image, is_primary, display_order) VALUES ?",
                [imageInserts]
            );
        }

        // Notification for listing creation
        await db.query(
            "INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, 'Listing Published!', ?, ?, 'success')",
            [
                seller_id,
                `Your listing for ${vehicleTitle} is now live and visible to thousands of buyers on VehicleHub.`,
                `/vehicles/${vehicleId}`
            ]
        );

        req.flash("success_msg", "Vehicle listed successfully! Your ad is now active.");
        res.redirect(`/vehicles/${vehicleId}`);
    } catch (error) {
        console.error("Add Vehicle Error:", error);
        req.flash("error_msg", "Failed to publish vehicle listing: " + error.message);
        req.flash("formData", req.body);
        res.redirect("/vehicles/sell");
    }
};

/**
 * Vehicle Details Page
 */
const vehicleDetails = async (req, res) => {
    const vehicleId = req.params.id;

    try {
        // Fetch vehicle with category & seller details
        const [vehicles] = await db.query(
            `SELECT v.*, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
                    u.id AS seller_id, u.first_name AS seller_first_name, u.last_name AS seller_last_name,
                    u.email AS seller_email, u.phone AS seller_phone, u.profile_photo AS seller_avatar,
                    u.created_at AS seller_joined_at, u.city AS seller_city, u.state AS seller_state
             FROM vehicles v
             JOIN vehicle_categories c ON v.category_id = c.id
             JOIN users u ON v.seller_id = u.id
             WHERE v.id = ?`,
            [vehicleId]
        );

        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle listing not found or has been removed.");
            return res.status(404).render("errors/404", { title: "Listing Not Found" });
        }

        const vehicle = vehicles[0];

        // Track view count safely
        const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
        const userId = req.session && req.session.user ? req.session.user.id : null;

        await db.query(
            "INSERT INTO vehicle_views (vehicle_id, user_id, ip_hash) VALUES (?, ?, SHA2(?, 256))",
            [vehicleId, userId, clientIp]
        ).catch(e => console.warn("View tracking notice:", e.message));

        await db.query(
            "UPDATE vehicles SET views_count = views_count + 1 WHERE id = ?",
            [vehicleId]
        ).catch(e => console.warn("Views increment notice:", e.message));

        // Fetch vehicle images
        const [images] = await db.query(
            "SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC, display_order ASC, id ASC",
            [vehicleId]
        );

        // Fetch seller statistics (total active listings and seller ratings)
        const [sellerStats] = await db.query(
            "SELECT COUNT(*) AS total_listings FROM vehicles WHERE seller_id = ? AND status = 'ACTIVE'",
            [vehicle.seller_id]
        );

        const [ratingStats] = await db.query(
            "SELECT COUNT(*) AS total_reviews, COALESCE(AVG(rating), 0) AS avg_rating FROM reviews WHERE seller_id = ? AND status = 'APPROVED'",
            [vehicle.seller_id]
        );

        const [sellerReviews] = await db.query(
            `SELECT r.*, u.first_name, u.last_name, u.profile_photo
             FROM reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.seller_id = ? AND r.status = 'APPROVED'
             ORDER BY r.created_at DESC
             LIMIT 5`,
            [vehicle.seller_id]
        );

        // Fetch challan info abstraction (graceful fallback if API unconfigured)
        const challanData = await ChallanService.getChallans(vehicle.registration_number);

        // Fetch similar vehicles
        const similarVehicles = await RecommendationService.getSimilarVehicles(vehicle, 4);

        // Check if favorited by current user
        let isFavorited = false;
        if (req.session && req.session.user) {
            const [favs] = await db.query(
                "SELECT id FROM favorites WHERE user_id = ? AND vehicle_id = ?",
                [req.session.user.id, vehicleId]
            );
            isFavorited = favs.length > 0;
        }

        // WhatsApp Click to Chat URL preparation (safe Indian number format)
        const cleanPhone = (vehicle.seller_phone || "").replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const encodedMessage = encodeURIComponent(`Hi ${vehicle.seller_first_name}, I saw your listing for "${vehicle.title}" (₹${vehicle.price}) on VehicleHub. Is it still available?`);
        const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodedMessage}` : null;

        res.render("vehicles/details", {
            title: `${vehicle.title} | ${vehicle.brand} ${vehicle.model}`,
            vehicle,
            images,
            sellerStats: {
                totalListings: sellerStats[0].total_listings || 1,
                avgRating: parseFloat(ratingStats[0].avg_rating || 0).toFixed(1),
                totalReviews: ratingStats[0].total_reviews || 0
            },
            sellerReviews,
            challanData,
            similarVehicles,
            isFavorited,
            whatsappUrl
        });
    } catch (error) {
        console.error("Vehicle Details Error:", error);
        req.flash("error_msg", "Error loading vehicle details.");
        res.redirect("/vehicles");
    }
};

/**
 * Show Edit Vehicle Page
 */
const showEditPage = async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === "ADMIN";

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);

        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle not found.");
            return res.redirect("/my-listings");
        }

        const vehicle = vehicles[0];

        if (vehicle.seller_id !== userId && !isAdmin) {
            req.flash("error_msg", "You are not authorized to edit this vehicle listing.");
            return res.redirect("/my-listings");
        }

        const [categories] = await db.query("SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC");
        const [images] = await db.query("SELECT * FROM vehicle_images WHERE vehicle_id = ? ORDER BY is_primary DESC, id ASC", [vehicleId]);

        res.render("vehicles/edit", {
            title: `Edit ${vehicle.title}`,
            vehicle,
            categories,
            images,
            fuelTypes: FUEL_TYPES,
            transmissions: TRANSMISSIONS,
            ownershipTypes: OWNERSHIP_TYPES,
            conditions: CONDITIONS,
            insuranceStatuses: INSURANCE_STATUSES
        });
    } catch (error) {
        console.error("Show Edit Page Error:", error);
        req.flash("error_msg", "Failed to load listing for editing.");
        res.redirect("/my-listings");
    }
};

/**
 * Update Vehicle
 */
const updateVehicle = async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === "ADMIN";

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);

        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle listing not found.");
            return res.redirect("/my-listings");
        }

        const vehicle = vehicles[0];

        if (vehicle.seller_id !== userId && !isAdmin) {
            req.flash("error_msg", "Unauthorized edit attempt.");
            return res.redirect("/my-listings");
        }

        const {
            category_id,
            title,
            brand,
            model,
            variant,
            manufacturing_year,
            registration_year,
            registration_number,
            fuel_type,
            transmission,
            price,
            kilometers,
            mileage,
            engine_capacity,
            vehicle_color,
            ownership_type,
            insurance_status,
            insurance_expiry,
            fitness_status,
            registration_state,
            registration_district,
            registration_city,
            registration_mandal,
            location,
            description,
            condition_rating,
            scratches,
            dents,
            repairs,
            accident_history,
            mechanical_issues,
            number_of_tyres,
            seats,
            body_type,
            air_conditioning,
            airbags,
            operating_hours,
            horsepower,
            drive_type,
            payload_capacity,
            delete_images
        } = req.body;

        const vehicleTitle = title && title.trim() !== "" ? title.trim() : `${brand} ${model}`.trim();

        const updateSql = `
            UPDATE vehicles SET
                category_id = ?, title = ?, brand = ?, model = ?, variant = ?,
                manufacturing_year = ?, registration_year = ?, registration_number = ?,
                fuel_type = ?, transmission = ?, price = ?, kilometers = ?, mileage = ?, engine_capacity = ?,
                vehicle_color = ?, ownership_type = ?, insurance_status = ?, insurance_expiry = ?, fitness_status = ?,
                registration_state = ?, registration_district = ?, registration_city = ?, registration_mandal = ?, location = ?,
                description = ?, condition_rating = ?, scratches = ?, dents = ?, repairs = ?, accident_history = ?, mechanical_issues = ?,
                number_of_tyres = ?, seats = ?, body_type = ?, air_conditioning = ?, airbags = ?,
                operating_hours = ?, horsepower = ?, drive_type = ?, payload_capacity = ?
            WHERE id = ?
        `;

        await db.query(updateSql, [
            parseInt(category_id) || vehicle.category_id,
            vehicleTitle,
            brand.trim(),
            model.trim(),
            variant ? variant.trim() : null,
            parseInt(manufacturing_year),
            registration_year ? parseInt(registration_year) : null,
            registration_number ? registration_number.trim().toUpperCase() : null,
            fuel_type,
            transmission,
            parseFloat(price),
            parseInt(kilometers),
            mileage ? mileage.trim() : null,
            engine_capacity ? engine_capacity.trim() : null,
            vehicle_color ? vehicle_color.trim() : null,
            ownership_type,
            insurance_status || "None",
            insurance_expiry || null,
            fitness_status || "Not Applicable",
            registration_state ? registration_state.trim() : null,
            registration_district ? registration_district.trim() : null,
            registration_city ? registration_city.trim() : "Hyderabad",
            registration_mandal ? registration_mandal.trim() : null,
            location ? location.trim() : null,
            description ? description.trim() : null,
            condition_rating || "Good",
            scratches ? scratches.trim() : null,
            dents ? dents.trim() : null,
            repairs ? repairs.trim() : null,
            accident_history ? accident_history.trim() : null,
            mechanical_issues ? mechanical_issues.trim() : null,
            number_of_tyres ? parseInt(number_of_tyres) : null,
            seats ? parseInt(seats) : null,
            body_type ? body_type.trim() : null,
            air_conditioning ? 1 : 0,
            airbags ? 1 : 0,
            operating_hours ? parseInt(operating_hours) : null,
            horsepower ? parseInt(horsepower) : null,
            drive_type ? drive_type.trim() : null,
            payload_capacity ? payload_capacity.trim() : null,
            vehicleId
        ]);

        // Delete selected old images if requested
        if (delete_images) {
            const imageIdsToDelete = Array.isArray(delete_images) ? delete_images : [delete_images];
            for (const imgId of imageIdsToDelete) {
                const [imgRows] = await db.query("SELECT image FROM vehicle_images WHERE id = ? AND vehicle_id = ?", [imgId, vehicleId]);
                if (imgRows.length > 0) {
                    const filePath = path.join(__dirname, "..", "uploads", "vehicles", imgRows[0].image);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    await db.query("DELETE FROM vehicle_images WHERE id = ?", [imgId]);
                }
            }
        }

        // Add newly uploaded images
        if (req.files && req.files.length > 0) {
            const [existingCount] = await db.query("SELECT COUNT(*) AS count FROM vehicle_images WHERE vehicle_id = ?", [vehicleId]);
            const currentTotal = existingCount[0].count || 0;

            const imageInserts = req.files.map((file, idx) => [
                vehicleId,
                file.filename,
                currentTotal === 0 && idx === 0 ? 1 : 0,
                currentTotal + idx
            ]);

            await db.query(
                "INSERT INTO vehicle_images (vehicle_id, image, is_primary, display_order) VALUES ?",
                [imageInserts]
            );
        }

        req.flash("success_msg", "Vehicle listing updated successfully!");
        res.redirect(`/vehicles/${vehicleId}`);
    } catch (error) {
        console.error("Update Vehicle Error:", error);
        req.flash("error_msg", "Failed to update listing: " + error.message);
        res.redirect(`/vehicles/edit/${vehicleId}`);
    }
};

/**
 * Delete Vehicle Listing (POST / DELETE)
 */
const deleteVehicle = async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === "ADMIN";

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);

        if (vehicles.length === 0) {
            req.flash("error_msg", "Vehicle listing not found.");
            return res.redirect("/my-listings");
        }

        const vehicle = vehicles[0];

        if (vehicle.seller_id !== userId && !isAdmin) {
            req.flash("error_msg", "Unauthorized delete attempt.");
            return res.redirect("/my-listings");
        }

        // Remove images from disk
        const [images] = await db.query("SELECT image FROM vehicle_images WHERE vehicle_id = ?", [vehicleId]);
        for (const img of images) {
            const filePath = path.join(__dirname, "..", "uploads", "vehicles", img.image);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
            }
        }

        // Cascade delete removes vehicle_images, favorites, conversations, messages, reviews
        await db.query("DELETE FROM vehicles WHERE id = ?", [vehicleId]);

        if (isAdmin && vehicle.seller_id !== userId) {
            await db.query(
                "INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, description) VALUES (?, 'DELETE_VEHICLE', 'VEHICLE', ?, ?)",
                [userId, vehicleId, `Admin deleted listing "${vehicle.title}" (ID: ${vehicleId})`]
            );
        }

        req.flash("success_msg", "Vehicle listing removed successfully.");
        res.redirect("/my-listings");
    } catch (error) {
        console.error("Delete Vehicle Error:", error);
        req.flash("error_msg", "Failed to delete listing.");
        res.redirect("/my-listings");
    }
};

/**
 * Mark Vehicle as Sold
 */
const markAsSold = async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === "ADMIN";

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);
        if (vehicles.length === 0 || (vehicles[0].seller_id !== userId && !isAdmin)) {
            req.flash("error_msg", "Listing not found or permission denied.");
            return res.redirect("/my-listings");
        }

        await db.query("UPDATE vehicles SET status = 'SOLD' WHERE id = ?", [vehicleId]);
        req.flash("success_msg", "Vehicle marked as SOLD! Congratulations on your sale.");
        res.redirect("/my-listings");
    } catch (error) {
        console.error("Mark Sold Error:", error);
        req.flash("error_msg", "Failed to update listing status.");
        res.redirect("/my-listings");
    }
};

/**
 * Repost / Reactivate Sold or Deleted Listing
 */
const repostVehicle = async (req, res) => {
    const vehicleId = req.params.id;
    const userId = req.session.user.id;
    const isAdmin = req.session.user.role === "ADMIN";

    try {
        const [vehicles] = await db.query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);
        if (vehicles.length === 0 || (vehicles[0].seller_id !== userId && !isAdmin)) {
            req.flash("error_msg", "Listing not found or permission denied.");
            return res.redirect("/my-listings");
        }

        await db.query("UPDATE vehicles SET status = 'ACTIVE', created_at = NOW() WHERE id = ?", [vehicleId]);
        req.flash("success_msg", "Listing reposted and reactivated successfully!");
        res.redirect("/my-listings");
    } catch (error) {
        console.error("Repost Error:", error);
        req.flash("error_msg", "Failed to repost listing.");
        res.redirect("/my-listings");
    }
};

/**
 * Seller Dashboard - My Listings
 */
const myListings = async (req, res) => {
    const userId = req.session.user.id;
    const statusTab = req.query.status || "ALL";

    try {
        let whereSql = "WHERE v.seller_id = ?";
        let params = [userId];

        if (statusTab !== "ALL") {
            whereSql += " AND v.status = ?";
            params.push(statusTab);
        }

        const [listings] = await db.query(
            `SELECT v.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT image FROM vehicle_images WHERE vehicle_id = v.id ORDER BY is_primary DESC, id ASC LIMIT 1) AS primary_image,
                    (SELECT COUNT(*) FROM favorites WHERE vehicle_id = v.id) AS favorites_count,
                    (SELECT COUNT(*) FROM conversations WHERE vehicle_id = v.id) AS inquiries_count
             FROM vehicles v
             JOIN vehicle_categories c ON v.category_id = c.id
             ${whereSql}
             ORDER BY v.created_at DESC`,
            params
        );

        // Stats
        const [statsRows] = await db.query(
            `SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active_count,
                SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END) AS sold_count,
                SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
                SUM(views_count) AS total_views
             FROM vehicles WHERE seller_id = ?`,
            [userId]
        );

        const stats = statsRows[0] || { total: 0, active_count: 0, sold_count: 0, pending_count: 0, total_views: 0 };

        res.render("vehicles/my-listings", {
            title: "My Listings",
            listings,
            statusTab,
            stats
        });
    } catch (error) {
        console.error("My Listings Error:", error);
        req.flash("error_msg", "Error loading your listings.");
        res.render("vehicles/my-listings", {
            title: "My Listings",
            listings: [],
            statusTab: "ALL",
            stats: { total: 0, active_count: 0, sold_count: 0, pending_count: 0, total_views: 0 }
        });
    }
};

module.exports = {
    browseVehicles,
    showSellPage,
    addVehicle,
    vehicleDetails,
    showEditPage,
    updateVehicle,
    deleteVehicle,
    markAsSold,
    repostVehicle,
    myListings
};
