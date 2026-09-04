require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function migrate() {
    console.log("🚀 Starting VEHICLEHUB Database Migration...");

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "bikehub",
        multipleStatements: true
    });

    try {
        console.log("📦 Creating / Updating Database Tables...");

        // 1. Create or update users table columns if missing
        const [userCols] = await connection.query("SHOW COLUMNS FROM users");
        const existingUserCols = userCols.map(c => c.Field);

        if (!existingUserCols.includes("district")) {
            await connection.query("ALTER TABLE users ADD COLUMN district VARCHAR(100) NULL AFTER city");
            console.log("  + Added district column to users");
        }
        if (!existingUserCols.includes("mandal")) {
            await connection.query("ALTER TABLE users ADD COLUMN mandal VARCHAR(100) NULL AFTER district");
            console.log("  + Added mandal column to users");
        }
        if (!existingUserCols.includes("role")) {
            await connection.query("ALTER TABLE users ADD COLUMN role ENUM('USER', 'ADMIN', 'MODERATOR') DEFAULT 'USER' AFTER profile_photo");
            console.log("  + Added role column to users");
        }
        if (!existingUserCols.includes("is_suspended")) {
            await connection.query("ALTER TABLE users ADD COLUMN is_suspended TINYINT(1) DEFAULT 0 AFTER role");
            console.log("  + Added is_suspended column to users");
        }
        if (!existingUserCols.includes("suspended_reason")) {
            await connection.query("ALTER TABLE users ADD COLUMN suspended_reason TEXT NULL AFTER is_suspended");
            console.log("  + Added suspended_reason column to users");
        }

        // Set first user or srini@gmail.com as ADMIN
        await connection.query("UPDATE users SET role='ADMIN' WHERE email='srini@gmail.com' OR id=1 LIMIT 1");
        console.log("  ✅ Admin role configured for primary user (srini@gmail.com)");

        // 2. Read and run schema.sql
        const schemaPath = path.join(__dirname, "schema.sql");
        const schemaSql = fs.readFileSync(schemaPath, "utf-8");
        await connection.query(schemaSql);
        console.log("  ✅ All required tables created / verified.");

        // 3. Seed default vehicle categories
        const defaultCategories = [
            { name: "Bikes", slug: "bikes", icon: "fa-motorcycle", description: "Standard, sports, cruiser and commuter bikes", display_order: 1 },
            { name: "Scooters", slug: "scooters", icon: "fa-moped", description: "Automatic scooters and gearless two-wheelers", display_order: 2 },
            { name: "Cars", slug: "cars", icon: "fa-car", description: "Sedans, hatchbacks, SUVs, and luxury passenger cars", display_order: 3 },
            { name: "Autos / Auto Rickshaws", slug: "autos", icon: "fa-taxi", description: "Passenger autos, e-rickshaws, and three-wheelers", display_order: 4 },
            { name: "Trucks", slug: "trucks", icon: "fa-truck", description: "Light and medium commercial transport trucks", display_order: 5 },
            { name: "Lorries", slug: "lorries", icon: "fa-truck-moving", description: "Heavy duty multi-axle freight lorries", display_order: 6 },
            { name: "JCB / Construction Equipment", slug: "jcb", icon: "fa-trowel-bricks", description: "Earth movers, excavators, loaders, and heavy machinery", display_order: 7 },
            { name: "Tractors", slug: "tractors", icon: "fa-tractor", description: "Agricultural tractors, tillers, and farm machinery", display_order: 8 },
            { name: "Buses", slug: "buses", icon: "fa-bus", description: "School, staff, sleeper, and public transport buses", display_order: 9 },
            { name: "Vans", slug: "vans", icon: "fa-van-shuttle", description: "Passenger vans, tempo travelers, and delivery vans", display_order: 10 },
            { name: "Electric Vehicles", slug: "electric-vehicles", icon: "fa-bolt", description: "EV cars, bikes, scooters, and eco-friendly commercial vehicles", display_order: 11 },
            { name: "Other Commercial", slug: "other-commercial", icon: "fa-truck-front", description: "Specialized utility vehicles, tankers, and trailers", display_order: 12 }
        ];

        for (const cat of defaultCategories) {
            await connection.query(
                `INSERT INTO vehicle_categories (name, slug, icon, description, display_order) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE icon=VALUES(icon), description=VALUES(description), display_order=VALUES(display_order)`,
                [cat.name, cat.slug, cat.icon, cat.description, cat.display_order]
            );
        }
        console.log("  ✅ Seeded 12 core vehicle categories.");

        // Fetch category IDs
        const [categories] = await connection.query("SELECT id, slug FROM vehicle_categories");
        const catMap = {};
        categories.forEach(c => { catMap[c.slug] = c.id; });

        // Ensure upload directories exist
        const uploadsDir = path.join(__dirname, "..", "uploads");
        const vehiclesUploadDir = path.join(uploadsDir, "vehicles");
        const avatarsUploadDir = path.join(uploadsDir, "avatars");
        const bikesUploadDir = path.join(uploadsDir, "bikes");

        if (!fs.existsSync(vehiclesUploadDir)) fs.mkdirSync(vehiclesUploadDir, { recursive: true });
        if (!fs.existsSync(avatarsUploadDir)) fs.mkdirSync(avatarsUploadDir, { recursive: true });
        if (!fs.existsSync(bikesUploadDir)) fs.mkdirSync(bikesUploadDir, { recursive: true });

        // 4. Migrate existing listings from bikes -> vehicles
        const [tables] = await connection.query("SHOW TABLES LIKE 'bikes'");
        if (tables.length > 0) {
            const [existingBikes] = await connection.query("SELECT * FROM bikes");
            console.log(`📦 Migrating ${existingBikes.length} existing bike listings to vehicles...`);

            for (const b of existingBikes) {
                // Check if already migrated
                const [alreadyInVehicles] = await connection.query("SELECT id FROM vehicles WHERE id=?", [b.id]);
                if (alreadyInVehicles.length === 0) {
                    const isCar = (b.brand && b.brand.toLowerCase().includes("bmw") && b.model && b.model.toLowerCase().includes("series"));
                    const categoryId = isCar ? (catMap["cars"] || 1) : (catMap["bikes"] || 1);

                    const title = `${b.brand || ''} ${b.model || ''} ${b.bike_name || ''}`.trim() || b.bike_name;

                    await connection.query(
                        `INSERT INTO vehicles 
                        (id, seller_id, category_id, title, brand, model, manufacturing_year, price, kilometers, fuel_type, transmission, ownership_type, registration_city, description, condition_rating, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Good', 'ACTIVE', ?)`,
                        [
                            b.id,
                            b.seller_id,
                            categoryId,
                            title,
                            b.brand || 'Other',
                            b.model || 'Standard',
                            b.year || 2020,
                            b.price || 0,
                            b.kilometers || 0,
                            b.fuel_type || 'Petrol',
                            b.transmission || 'Manual',
                            b.owner_type || '1st Owner',
                            b.city || 'Hyderabad',
                            b.description || '',
                            b.created_at || new Date()
                        ]
                    );
                    console.log(`    + Migrated bike ID ${b.id} (${title}) -> vehicles table`);
                }
            }
        }

        // 5. Migrate existing bike_images -> vehicle_images
        const [imgTables] = await connection.query("SHOW TABLES LIKE 'bike_images'");
        if (imgTables.length > 0) {
            const [existingImages] = await connection.query("SELECT * FROM bike_images");
            console.log(`📦 Migrating ${existingImages.length} image records to vehicle_images...`);

            for (const img of existingImages) {
                const [exists] = await connection.query("SELECT id FROM vehicle_images WHERE vehicle_id=? AND image=?", [img.bike_id, img.image]);
                if (exists.length === 0) {
                    await connection.query(
                        "INSERT INTO vehicle_images (vehicle_id, image, is_primary, display_order) VALUES (?, ?, 1, 0)",
                        [img.bike_id, img.image]
                    );

                    // Copy physical file to vehicles dir if not already there
                    const src = path.join(bikesUploadDir, img.image);
                    const dest = path.join(vehiclesUploadDir, img.image);
                    if (fs.existsSync(src) && !fs.existsSync(dest)) {
                        fs.copyFileSync(src, dest);
                        console.log(`    + Copied image file ${img.image} to uploads/vehicles/`);
                    }
                }
            }
        }

        console.log("🎉 Migration completed successfully! VEHICLEHUB database is ready.");
    } catch (err) {
        console.error("❌ Migration failed with error:", err);
        throw err;
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = migrate;
