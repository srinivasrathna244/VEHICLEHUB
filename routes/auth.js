const express = require("express");

const router = express.Router();

const authController = require("../controllers/authController");


// ===============================
// Register Page
// ===============================

router.get("/register", (req, res) => {

    res.render("register", {

        title: "Register",

        user: req.session.user || null

    });

});


// ===============================
// Register User
// ===============================

router.post("/register", authController.registerUser);


// ===============================
// Login Page
// ===============================

router.get("/login", (req, res) => {

    res.render("login", {

        title: "Login",

        user: req.session.user || null

    });

});


// ===============================
// Login User
// ===============================

router.post("/login", authController.loginUser);


// ===============================
// Logout
// ===============================

router.get("/logout", authController.logoutUser);


// ===============================
// Profile
// ===============================

router.get("/profile", authController.profilePage);


// ===============================
// Edit Profile
// ===============================

router.get("/edit-profile", authController.editProfilePage);

router.post("/edit-profile", authController.updateProfile);


module.exports = router;