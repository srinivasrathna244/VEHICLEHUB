const requireLogin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        const isJson = req.xhr || (req.headers.accept && req.headers.accept.includes("json"));
        if (isJson) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        req.flash("error_msg", "Please log in to continue.");
        const returnUrl = req.method === "GET" ? req.originalUrl : (req.get("Referrer") || "/dashboard");
        return res.redirect(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }

    if (req.session.user.is_suspended) {
        req.session.destroy(() => {
            res.redirect("/login?suspended=true");
        });
        return;
    }

    next();
};

const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect("/dashboard");
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash("error_msg", "Please log in with admin credentials.");
        return res.redirect("/login");
    }

    if (req.session.user.role !== "ADMIN") {
        req.flash("error_msg", "Access denied. Administrator privileges required.");
        return res.redirect("/dashboard");
    }

    next();
};

const requireModerator = (req, res, next) => {
    if (!req.session || !req.session.user) {
        req.flash("error_msg", "Please log in to continue.");
        return res.redirect("/login");
    }

    if (req.session.user.role !== "ADMIN" && req.session.user.role !== "MODERATOR") {
        req.flash("error_msg", "Access denied. Moderator privileges required.");
        return res.redirect("/dashboard");
    }

    next();
};

module.exports = {
    requireLogin,
    redirectIfAuthenticated,
    requireAdmin,
    requireModerator
};