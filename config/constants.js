module.exports = {
    APP_NAME: "VehicleHub",
    APP_TAGLINE: "India's Premier Multi-Vehicle Marketplace",
    PAGINATION_LIMIT: 12,
    MAX_VEHICLE_IMAGES: 10,
    MAX_IMAGE_SIZE_MB: 5,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    
    VEHICLE_STATUS: {
        ACTIVE: "ACTIVE",
        PENDING: "PENDING",
        SOLD: "SOLD",
        REJECTED: "REJECTED",
        DELETED: "DELETED"
    },

    VERIFICATION_STATUS: {
        UNVERIFIED: "UNVERIFIED",
        PENDING_VERIFICATION: "PENDING_VERIFICATION",
        VERIFIED: "VERIFIED",
        REJECTED: "REJECTED"
    },

    USER_ROLES: {
        USER: "USER",
        ADMIN: "ADMIN",
        MODERATOR: "MODERATOR"
    },

    REPORT_STATUS: {
        PENDING: "PENDING",
        UNDER_REVIEW: "UNDER_REVIEW",
        RESOLVED: "RESOLVED",
        REJECTED: "REJECTED"
    },

    REPORT_REASONS: [
        "Fraud or Scam Listing",
        "Fake Vehicle / Misleading Information",
        "Incorrect Price Advertised",
        "Suspected Stolen Vehicle",
        "Vehicle Already Sold",
        "Duplicate Listing",
        "Inappropriate Content or Photos",
        "Other"
    ],

    FUEL_TYPES: [
        "Petrol",
        "Diesel",
        "Electric",
        "Hybrid",
        "CNG",
        "LPG",
        "Other"
    ],

    TRANSMISSIONS: [
        "Manual",
        "Automatic",
        "Semi-Automatic"
    ],

    OWNERSHIP_TYPES: [
        "1st Owner",
        "2nd Owner",
        "3rd Owner",
        "4th Owner",
        "4+ Owner"
    ],

    CONDITIONS: [
        "Excellent",
        "Good",
        "Average",
        "Needs Repair"
    ],

    INSURANCE_STATUSES: [
        "Comprehensive",
        "Third Party",
        "Zero Depreciation",
        "Expired",
        "None"
    ]
};
