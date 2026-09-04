const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MAX_VEHICLE_IMAGES, MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } = require("../config/constants");

// Ensure upload directories exist
const vehiclesDir = path.join(__dirname, "..", "uploads", "vehicles");
const avatarsDir = path.join(__dirname, "..", "uploads", "avatars");

if (!fs.existsSync(vehiclesDir)) fs.mkdirSync(vehiclesDir, { recursive: true });
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

// Storage configuration for vehicles
const vehicleStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, vehiclesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `veh-${uniqueSuffix}${ext}`);
    }
});

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, avatarsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and AVIF images are allowed."), false);
    }
};

const uploadVehicleImages = multer({
    storage: vehicleStorage,
    limits: {
        fileSize: MAX_IMAGE_SIZE_MB * 1024 * 1024,
        files: MAX_VEHICLE_IMAGES
    },
    fileFilter
}).array("images", MAX_VEHICLE_IMAGES);

const uploadAvatar = multer({
    storage: avatarStorage,
    limits: {
        fileSize: 3 * 1024 * 1024,
        files: 1
    },
    fileFilter
}).single("profile_photo");

// Wrapper to catch multer errors cleanly and redirect with flash
const handleVehicleUpload = (req, res, next) => {
    uploadVehicleImages(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                req.flash("error_msg", `Image exceeds maximum size of ${MAX_IMAGE_SIZE_MB}MB.`);
            } else if (err.code === "LIMIT_FILE_COUNT") {
                req.flash("error_msg", `You can upload up to ${MAX_VEHICLE_IMAGES} images.`);
            } else {
                req.flash("error_msg", `Upload error: ${err.message}`);
            }
            return res.redirect("back");
        } else if (err) {
            req.flash("error_msg", err.message);
            return res.redirect("back");
        }
        next();
    });
};

const handleAvatarUpload = (req, res, next) => {
    uploadAvatar(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            req.flash("error_msg", `Avatar upload error: ${err.message}`);
            return res.redirect("back");
        } else if (err) {
            req.flash("error_msg", err.message);
            return res.redirect("back");
        }
        next();
    });
};

module.exports = {
    handleVehicleUpload,
    handleAvatarUpload
};
