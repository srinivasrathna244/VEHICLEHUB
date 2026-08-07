const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");



// ===============================
// Home Page
// ===============================

router.get("/",(req,res)=>{


    res.render("index",{

        title:"Home",

        user:req.session.user || null

    });


});





// ===============================
// Dashboard
// ===============================

router.get(

    "/dashboard",

    authMiddleware,

    (req,res)=>{


        res.render("dashboard",{

            title:"Dashboard",

            user:req.session.user


        });


    }

);



module.exports = router;