/**
 * Challan Verification Service
 * 
 * Secure abstraction layer for official traffic challan integration.
 * Respects legal and ethical boundaries:
 * - Does not scrape unauthorized government systems.
 * - Does not bypass CAPTCHA.
 * - Gracefully falls back when official API credentials are not configured.
 * - Never invents fake challan information.
 */

const db = require("../database/db");

class ChallanService {
    /**
     * Clean and normalize Indian registration numbers
     * Example: 'TS 09 AB 1234' -> 'TS09AB1234'
     */
    static normalizeRegNumber(regNo) {
        if (!regNo) return "";
        return regNo.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    }

    /**
     * Fetch challan details for a given vehicle registration number
     * @param {string} registrationNumber 
     * @returns {Promise<Object>}
     */
    static async getChallans(registrationNumber) {
        const normalized = this.normalizeRegNumber(registrationNumber);
        if (!normalized) {
            return {
                success: false,
                available: false,
                registrationNumber: "",
                message: "A valid vehicle registration number is required."
            };
        }

        const apiUrl = process.env.CHALLAN_API_URL;
        const apiKey = process.env.CHALLAN_API_KEY;

        // If no official API credentials configured in .env, return clean graceful fallback
        if (!apiUrl || !apiKey) {
            return {
                success: true,
                available: false,
                registrationNumber: normalized,
                challanCount: 0,
                totalAmount: 0,
                challans: [],
                message: "Official challan verification is currently unavailable.",
                disclaimer: "Challan and vehicle registration records are subject to official RTO verification."
            };
        }

        try {
            // Authorized API integration placeholder
            // In a production setup with official vendor (e.g. Surepass, Signzy, IDfy, or state transport API):
            /*
            const response = await fetch(`${apiUrl}/challans?regNo=${normalized}`, {
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return { success: true, available: true, ...data };
            */
            return {
                success: true,
                available: false,
                registrationNumber: normalized,
                message: "Official challan verification is currently unavailable.",
                disclaimer: "Challan and vehicle registration records are subject to official RTO verification."
            };
        } catch (error) {
            console.error("ChallanService Error:", error.message);
            return {
                success: false,
                available: false,
                registrationNumber: normalized,
                message: "Failed to connect to official challan verification service."
            };
        }
    }
}

module.exports = ChallanService;
