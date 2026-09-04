const db = require("../database/db");
const bcrypt = require("bcrypt");

/**
 * Show Login Page
 */
const showLogin = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect("/dashboard");
    }
    const redirect = req.query.redirect || "/dashboard";
    const suspended = req.query.suspended === "true";
    if (suspended) {
        req.flash("error_msg", "Your account has been suspended by administration.");
    }
    res.render("auth/login", {
        title: "Login",
        redirect
    });
};

/**
 * Process Login
 */
const loginUser = async (req, res) => {
    const { login_identifier, password, redirect } = req.body;

    try {
        const identifier = (login_identifier || "").trim();
        // Allow login by email or 10-digit Indian phone
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ? OR phone = ?",
            [identifier, identifier]
        );

        if (users.length === 0) {
            req.flash("error_msg", "No account found with this email or mobile number.");
            req.flash("formData", { login_identifier });
            return res.redirect(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
        }

        const user = users[0];

        if (user.is_suspended) {
            req.flash("error_msg", `Account suspended: ${user.suspended_reason || "Violation of platform policies."}`);
            return res.redirect("/login");
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash("error_msg", "Incorrect password. Please try again.");
            req.flash("formData", { login_identifier });
            return res.redirect(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login");
        }

        // Store user in session
        req.session.user = {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            role: user.role || "USER",
            profile_photo: user.profile_photo || "default-avatar.png",
            address: user.address,
            city: user.city,
            district: user.district,
            mandal: user.mandal,
            state: user.state,
            pincode: user.pincode,
            created_at: user.created_at
        };

        req.flash("success_msg", `Welcome back, ${user.first_name}!`);
        
        const targetUrl = redirect && redirect.startsWith("/") ? redirect : "/dashboard";
        res.redirect(targetUrl);
    } catch (error) {
        console.error("Login Error:", error);
        req.flash("error_msg", "An unexpected server error occurred during login.");
        res.redirect("/login");
    }
};

/**
 * Show Registration Page
 */
const showRegister = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("auth/register", {
        title: "Register"
    });
};

/**
 * Process Registration
 */
const registerUser = async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone,
        password,
        address,
        city,
        district,
        mandal,
        state,
        pincode
    } = req.body;

    try {
        const cleanEmail = email.trim().toLowerCase();
        const cleanPhone = phone.trim();

        // Check if email or phone already exists
        const [existing] = await db.query(
            "SELECT email, phone FROM users WHERE email = ? OR phone = ?",
            [cleanEmail, cleanPhone]
        );

        if (existing.length > 0) {
            const hasEmail = existing.some(u => u.email.toLowerCase() === cleanEmail);
            const hasPhone = existing.some(u => u.phone === cleanPhone);

            if (hasEmail && hasPhone) {
                req.flash("error_msg", "Both this email and mobile number are already registered.");
            } else if (hasEmail) {
                req.flash("error_msg", "An account with this email address already exists.");
            } else {
                req.flash("error_msg", "An account with this mobile number already exists.");
            }
            req.flash("formData", req.body);
            return res.redirect("/register");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users 
             (first_name, last_name, email, phone, password, address, city, district, mandal, state, pincode, profile_photo, role)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'default-avatar.png', 'USER')`,
            [
                first_name.trim(),
                last_name.trim(),
                cleanEmail,
                cleanPhone,
                hashedPassword,
                address ? address.trim() : null,
                city ? city.trim() : null,
                district ? district.trim() : null,
                mandal ? mandal.trim() : null,
                state ? state.trim() : null,
                pincode ? pincode.trim() : null
            ]
        );

        const newUserId = result.insertId;

        // Auto create a welcome notification
        await db.query(
            `INSERT INTO notifications (user_id, title, message, link, type) 
             VALUES (?, 'Welcome to VehicleHub!', 'Your account has been successfully created. Explore thousands of vehicles or sell your own vehicle with zero commission.', '/vehicles', 'success')`,
            [newUserId]
        );

        // Auto-login newly registered user
        req.session.user = {
            id: newUserId,
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            role: "USER",
            profile_photo: "default-avatar.png",
            address: address ? address.trim() : null,
            city: city ? city.trim() : null,
            district: district ? district.trim() : null,
            mandal: mandal ? mandal.trim() : null,
            state: state ? state.trim() : null,
            pincode: pincode ? pincode.trim() : null,
            created_at: new Date()
        };

        req.flash("success_msg", "Account created successfully! Welcome to VehicleHub.");
        res.redirect("/dashboard");
    } catch (error) {
        console.error("Registration Error:", error);
        req.flash("error_msg", "Registration failed due to a server error. Please try again.");
        req.flash("formData", req.body);
        res.redirect("/register");
    }
};

/**
 * Logout User
 */
const logoutUser = (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error("Logout error:", err);
            }
            res.redirect("/login?logged_out=true");
        });
    } else {
        res.redirect("/login");
    }
};

/**
 * Show Forgot Password Page
 */
const showForgotPassword = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect("/dashboard");
    }
    res.render("auth/forgot-password", {
        title: "Forgot Password",
        reset_link: req.flash("reset_link")[0] || null
    });
};

/**
 * Send Password Reset Link
 */
const sendResetLink = async (req, res) => {
    const crypto = require("crypto");
    const { identifier } = req.body;

    if (!identifier || identifier.trim() === "") {
        req.flash("error_msg", "Please enter your registered email address or mobile number.");
        return res.redirect("/forgot-password");
    }

    try {
        const id = identifier.trim();
        const [users] = await db.query(
            "SELECT id, first_name, email, phone FROM users WHERE email = ? OR phone = ?",
            [id, id]
        );

        if (users.length === 0) {
            req.flash("error_msg", "No account was found with that email address or mobile number.");
            return res.redirect("/forgot-password");
        }

        const user = users[0];
        const token = crypto.randomBytes(32).toString("hex");

        // Save token with 1-hour expiration
        await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
            [token, user.id]
        );

        const protocol = req.protocol;
        const host = req.get("host");
        const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

        req.flash("success_msg", `Password reset link generated for ${user.first_name} (${user.email})!`);
        req.flash("reset_link", resetUrl);
        res.redirect("/forgot-password");
    } catch (error) {
        console.error("Forgot Password Error:", error);
        req.flash("error_msg", "An error occurred while generating reset link. Please try again.");
        res.redirect("/forgot-password");
    }
};

/**
 * Show Reset Password Form (validates token)
 */
const showResetPassword = async (req, res) => {
    const token = req.query.token;

    if (!token) {
        req.flash("error_msg", "Password reset token is missing. Please request a new link.");
        return res.redirect("/forgot-password");
    }

    try {
        const [users] = await db.query(
            "SELECT id, first_name, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [token]
        );

        if (users.length === 0) {
            req.flash("error_msg", "This password reset link is invalid or has expired. Please request a new one.");
            return res.redirect("/forgot-password");
        }

        res.render("auth/reset-password", {
            title: "Reset Password",
            token,
            user: users[0]
        });
    } catch (error) {
        console.error("Show Reset Password Error:", error);
        req.flash("error_msg", "Failed to verify reset token.");
        res.redirect("/forgot-password");
    }
};

/**
 * Process Password Reset
 */
const processResetPassword = async (req, res) => {
    const { token, password, confirm_password } = req.body;

    if (!token) {
        req.flash("error_msg", "Reset token is missing. Please request a new link.");
        return res.redirect("/forgot-password");
    }

    if (!password || password.length < 8) {
        req.flash("error_msg", "New password must be at least 8 characters long.");
        return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
    }

    if (password !== confirm_password) {
        req.flash("error_msg", "Passwords do not match. Please re-enter.");
        return res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
    }

    try {
        const [users] = await db.query(
            "SELECT id, first_name, email FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
            [token]
        );

        if (users.length === 0) {
            req.flash("error_msg", "Reset link is invalid or has expired. Please request a new one.");
            return res.redirect("/forgot-password");
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and clear reset token
        await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
            [hashedPassword, user.id]
        );

        // Add user notification
        await db.query(
            "INSERT INTO notifications (user_id, title, message, link, type) VALUES (?, 'Password Reset Successful', 'Your account password was recently changed.', '/profile', 'info')",
            [user.id]
        );

        req.flash("success_msg", "Your password has been successfully reset! You can now log in with your new password.");
        res.redirect("/login");
    } catch (error) {
        console.error("Process Reset Password Error:", error);
        req.flash("error_msg", "Failed to reset password. Please try again.");
        res.redirect(`/reset-password?token=${encodeURIComponent(token)}`);
    }
};

module.exports = {
    showLogin,
    loginUser,
    showRegister,
    registerUser,
    logoutUser,
    showForgotPassword,
    sendResetLink,
    showResetPassword,
    processResetPassword
};