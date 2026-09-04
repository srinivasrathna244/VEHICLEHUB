require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const helmet = require("helmet");
const morgan = require("morgan");
const flash = require("connect-flash");
const methodOverride = require("method-override");

// Routes
const homeRoutes = require("./routes/home");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const profileRoutes = require("./routes/profile");
const favoriteRoutes = require("./routes/favorites");
const messageRoutes = require("./routes/messages");
const miscRoutes = require("./routes/misc");
const adminRoutes = require("./routes/admin");

// Middleware
const globalLocals = require("./middleware/globalLocals");

const app = express();

// ===============================
// Security - Helmet
// ===============================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// ===============================
// Logging
// ===============================
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// ===============================
// View Engine
// ===============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===============================
// Body Parsers
// ===============================
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json({ limit: "10mb" }));

// ===============================
// Method Override (for DELETE/PUT via forms)
// ===============================
app.use(methodOverride("_method"));

// ===============================
// Session Configuration
// ===============================
app.use(session({
    secret: process.env.SESSION_SECRET || "vehiclehub_dev_secret_change_in_production",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        secure: process.env.NODE_ENV === "production"
    }
}));

// ===============================
// Flash Messages
// ===============================
app.use(flash());

// ===============================
// Static Files
// ===============================
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===============================
// Global View Locals Middleware
// ===============================
app.use(globalLocals);

// ===============================
// Routes
// ===============================
app.use("/", homeRoutes);
app.use("/", authRoutes);
app.use("/", vehicleRoutes);
app.use("/", profileRoutes);
app.use("/", favoriteRoutes);
app.use("/", messageRoutes);
app.use("/", miscRoutes);
app.use("/admin", adminRoutes);

// ===============================
// API Routes (challan service)
// ===============================
const ChallanService = require("./services/challanService");

app.get("/api/vehicles/:id/challans", async (req, res) => {
    const vehicleId = req.params.id;
    try {
        const db = require("./database/db");
        const [vehicles] = await db.query("SELECT registration_number FROM vehicles WHERE id = ?", [vehicleId]);
        if (vehicles.length === 0) {
            return res.status(404).json({ success: false, message: "Vehicle not found." });
        }
        const challanData = await ChallanService.getChallans(vehicles[0].registration_number);
        res.json(challanData);
    } catch (error) {
        console.error("Challan API Error:", error);
        res.status(500).json({ success: false, message: "Challan service error." });
    }
});

app.get("/api/categories", async (req, res) => {
    try {
        const db = require("./database/db");
        const [categories] = await db.query("SELECT * FROM vehicle_categories WHERE is_active = 1 ORDER BY display_order ASC");
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load categories." });
    }
});

// ===============================
// 404 Handler
// ===============================
app.use((req, res) => {
    res.status(404).render("errors/404", {
        title: "Page Not Found"
    });
});

// ===============================
// 500 Global Error Handler
// ===============================
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack || err);
    if (res.headersSent) return next(err);
    res.status(500).render("errors/500", {
        title: "Server Error",
        // Never expose errors to user in production
        error: process.env.NODE_ENV !== "production" ? err.message : null
    });
});

// ===============================
// Start Server
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚗 VehicleHub Server Started`);
    console.log(`✅ Running at http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}\n`);
});