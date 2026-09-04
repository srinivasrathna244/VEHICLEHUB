const db = require("../database/db");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");

/**
 * View Profile Page
 */
const viewProfile = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            req.flash("error_msg", "User not found.");
            return res.redirect("/login");
        }

        const user = users[0];

        // Fetch counts for user's listings, favorites, and reviews
        const [
            [listingsCount],
            [favoritesCount],
            [ratingStats]
        ] = await Promise.all([
            db.query("SELECT COUNT(*) AS count FROM vehicles WHERE seller_id = ?", [userId]),
            db.query("SELECT COUNT(*) AS count FROM favorites WHERE user_id = ?", [userId]),
            db.query("SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS avg_rating FROM reviews WHERE seller_id = ? AND status = 'APPROVED'", [userId])
        ]);

        res.render("profile/index", {
            title: "My Profile",
            profileUser: user,
            stats: {
                totalListings: listingsCount[0].count || 0,
                totalFavorites: favoritesCount[0].count || 0,
                avgRating: parseFloat(ratingStats[0].avg_rating || 0).toFixed(1),
                totalReviews: ratingStats[0].count || 0
            }
        });
    } catch (error) {
        console.error("View Profile Error:", error);
        req.flash("error_msg", "Failed to load profile.");
        res.redirect("/dashboard");
    }
};

/**
 * Show Edit Profile Page
 */
const showEditProfile = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        res.render("profile/edit", {
            title: "Edit Profile",
            profileUser: users[0]
        });
    } catch (error) {
        console.error("Show Edit Profile Error:", error);
        req.flash("error_msg", "Failed to load edit profile page.");
        res.redirect("/profile");
    }
};

/**
 * Update Profile Details & Avatar
 */
const updateProfile = async (req, res) => {
    const userId = req.session.user.id;
    const {
        first_name,
        last_name,
        phone,
        address,
        city,
        district,
        mandal,
        state,
        pincode
    } = req.body;

    try {
        const cleanPhone = phone.trim();

        // Check if phone is taken by another user
        const [existingPhone] = await db.query(
            "SELECT id FROM users WHERE phone = ? AND id != ?",
            [cleanPhone, userId]
        );

        if (existingPhone.length > 0) {
            req.flash("error_msg", "This phone number is already in use by another account.");
            return res.redirect("/profile/edit");
        }

        let avatarFilename = null;
        if (req.file) {
            avatarFilename = req.file.filename;

            // Remove previous non-default avatar from disk
            const [userRow] = await db.query("SELECT profile_photo FROM users WHERE id = ?", [userId]);
            if (userRow.length > 0 && userRow[0].profile_photo && userRow[0].profile_photo !== "default-avatar.png") {
                const oldPath = path.join(__dirname, "..", "uploads", "avatars", userRow[0].profile_photo);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
                }
            }
        }

        const updateSql = `
            UPDATE users SET
                first_name = ?,
                last_name = ?,
                phone = ?,
                address = ?,
                city = ?,
                district = ?,
                mandal = ?,
                state = ?,
                pincode = ?
                ${avatarFilename ? ", profile_photo = ?" : ""}
            WHERE id = ?
        `;

        const params = [
            first_name.trim(),
            last_name.trim(),
            cleanPhone,
            address ? address.trim() : null,
            city ? city.trim() : null,
            district ? district.trim() : null,
            mandal ? mandal.trim() : null,
            state ? state.trim() : null,
            pincode ? pincode.trim() : null
        ];

        if (avatarFilename) {
            params.push(avatarFilename);
        }
        params.push(userId);

        await db.query(updateSql, params);

        // Update session
        req.session.user.first_name = first_name.trim();
        req.session.user.last_name = last_name.trim();
        req.session.user.phone = cleanPhone;
        req.session.user.city = city ? city.trim() : null;
        req.session.user.district = district ? district.trim() : null;
        req.session.user.mandal = mandal ? mandal.trim() : null;
        req.session.user.state = state ? state.trim() : null;
        req.session.user.pincode = pincode ? pincode.trim() : null;
        if (avatarFilename) {
            req.session.user.profile_photo = avatarFilename;
        }

        req.flash("success_msg", "Profile updated successfully!");
        res.redirect("/profile");
    } catch (error) {
        console.error("Update Profile Error:", error);
        req.flash("error_msg", "Failed to update profile: " + error.message);
        res.redirect("/profile/edit");
    }
};

/**
 * Show Change Password Page
 */
const showChangePassword = (req, res) => {
    res.render("profile/change-password", {
        title: "Change Password"
    });
};

/**
 * Update Password
 */
const updatePassword = async (req, res) => {
    const userId = req.session.user.id;
    const { current_password, new_password, confirm_new_password } = req.body;

    try {
        if (!current_password || !new_password || !confirm_new_password) {
            req.flash("error_msg", "All password fields are required.");
            return res.redirect("/profile/change-password");
        }

        if (new_password.length < 8) {
            req.flash("error_msg", "New password must be at least 8 characters long.");
            return res.redirect("/profile/change-password");
        }

        if (new_password !== confirm_new_password) {
            req.flash("error_msg", "New passwords do not match.");
            return res.redirect("/profile/change-password");
        }

        const [users] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
        const match = await bcrypt.compare(current_password, users[0].password);

        if (!match) {
            req.flash("error_msg", "Current password entered is incorrect.");
            return res.redirect("/profile/change-password");
        }

        const hashed = await bcrypt.hash(new_password, 10);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId]);

        req.flash("success_msg", "Password updated successfully!");
        res.redirect("/profile");
    } catch (error) {
        console.error("Change Password Error:", error);
        req.flash("error_msg", "Failed to update password.");
        res.redirect("/profile/change-password");
    }
};

module.exports = {
    viewProfile,
    showEditProfile,
    updateProfile,
    showChangePassword,
    updatePassword
};
