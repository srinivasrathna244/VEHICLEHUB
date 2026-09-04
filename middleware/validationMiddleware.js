const { body, validationResult } = require("express-validator");

const handleValidationErrors = (redirectUrl) => {
    return (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg).join(". ");
            req.flash("error_msg", errorMessages);
            req.flash("formData", req.body); // Preserve form inputs
            const target = typeof redirectUrl === "function" ? redirectUrl(req) : redirectUrl;
            return res.redirect(target || "back");
        }
        next();
    };
};

const registerValidationRules = [
    body("first_name").trim().notEmpty().withMessage("First name is required")
        .isLength({ min: 2, max: 100 }).withMessage("First name must be between 2 and 100 characters"),
    body("last_name").trim().notEmpty().withMessage("Last name is required")
        .isLength({ min: 2, max: 100 }).withMessage("Last name must be between 2 and 100 characters"),
    body("email").trim().isEmail().withMessage("Please enter a valid email address").normalizeEmail(),
    body("phone").trim().matches(/^[6-9]\d{9}$/).withMessage("Please enter a valid 10-digit Indian mobile number"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    body("confirm_password").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Passwords do not match");
        }
        return true;
    }),
    body("pincode").optional({ checkFalsy: true }).matches(/^\d{6}$/).withMessage("Pincode must be 6 digits")
];

const loginValidationRules = [
    body("login_identifier").trim().notEmpty().withMessage("Email or mobile number is required"),
    body("password").notEmpty().withMessage("Password is required")
];

const profileValidationRules = [
    body("first_name").trim().notEmpty().withMessage("First name is required"),
    body("last_name").trim().notEmpty().withMessage("Last name is required"),
    body("phone").trim().matches(/^[6-9]\d{9}$/).withMessage("Please enter a valid 10-digit Indian mobile number"),
    body("pincode").optional({ checkFalsy: true }).matches(/^\d{6}$/).withMessage("Pincode must be 6 digits")
];

const vehicleValidationRules = [
    body("category_id").isInt({ min: 1 }).withMessage("Please select a valid vehicle category"),
    body("brand").trim().notEmpty().withMessage("Brand / Manufacturer is required"),
    body("model").trim().notEmpty().withMessage("Model is required"),
    body("manufacturing_year").isInt({ min: 1970, max: new Date().getFullYear() + 1 }).withMessage("Please enter a valid manufacturing year"),
    body("price").isFloat({ min: 1000 }).withMessage("Please enter a valid price (minimum ₹1,000)"),
    body("kilometers").isInt({ min: 0 }).withMessage("Kilometers driven must be a positive number"),
    body("fuel_type").trim().notEmpty().withMessage("Fuel type is required"),
    body("transmission").trim().notEmpty().withMessage("Transmission type is required"),
    body("ownership_type").trim().notEmpty().withMessage("Ownership type is required"),
    body("registration_city").trim().notEmpty().withMessage("City is required")
];

const reviewValidationRules = [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5 stars"),
    body("comment").trim().isLength({ min: 5, max: 1000 }).withMessage("Review comment must be between 5 and 1000 characters")
];

const reportValidationRules = [
    body("reason").trim().notEmpty().withMessage("Please select a reason for reporting"),
    body("description").trim().isLength({ min: 10, max: 1000 }).withMessage("Please describe the issue in at least 10 characters")
];

module.exports = {
    handleValidationErrors,
    registerValidationRules,
    loginValidationRules,
    profileValidationRules,
    vehicleValidationRules,
    reviewValidationRules,
    reportValidationRules
};
