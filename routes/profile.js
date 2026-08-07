
const express = require("express");

const router = express.Router();

const path = require("path");



// ===============================
// Profile Page
// ===============================

router.get("/profile",(req,res)=>{


    if(!req.session.user){

        return res.redirect("/login");

    }



    res.render("profile",{

        title:"Profile",

        user:req.session.user

    });



});



module.exports = router;