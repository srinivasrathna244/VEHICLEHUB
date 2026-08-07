require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");


// Database connection

require("./database/db");


// Routes

const authRoutes = require("./routes/auth");
const homeRoutes = require("./routes/home");
const bikeRoutes = require("./routes/bikes");
const profileRoutes = require("./routes/profile");



const app = express();



// ===============================
// EJS Configuration
// ===============================

app.set("view engine", "ejs");

app.set(
    "views",
    path.join(__dirname, "views")
);



// ===============================
// Middleware
// ===============================

app.use(
    express.urlencoded({
        extended: true
    })
);


app.use(express.json());



// ===============================
// Session
// ===============================

app.use(
    session({

        secret: process.env.SESSION_SECRET || "bikehub_secret_key",

        resave: false,

        saveUninitialized: false

    })
);



// ===============================
// Static Files
// ===============================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);



// Uploaded images access

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);



// ===============================
// Routes
// ===============================

app.use("/", homeRoutes);
app.use("/", authRoutes);
app.use("/", bikeRoutes);
app.use("/", profileRoutes);



// ===============================
// Home Route
// ===============================

app.get("/", (req, res) => {

    res.render("index", {

        title: "Home",

        user: req.session.user || null

    });

});




// ===============================
// 404 Route
// ===============================

app.use((req,res)=>{

    res.status(404).send("Page Not Found");

});




// ===============================
// Server Start
// ===============================

const PORT = process.env.PORT || 3000;


app.listen(PORT,()=>{

    console.log(
        `✅ Server running at http://localhost:${PORT}`
    );

});