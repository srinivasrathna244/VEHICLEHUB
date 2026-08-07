const express = require("express");
const router = express.Router();

const bikeController = require("../controllers/bikeController");

const multer = require("multer");
const path = require("path");



// ===============================
// Multer Configuration
// ===============================


const storage = multer.diskStorage({

    destination:(req,file,cb)=>{

        cb(null,"uploads/bikes");

    },


    filename:(req,file,cb)=>{


        cb(

            null,

            Date.now() + path.extname(file.originalname)

        );


    }


});



const upload = multer({

    storage:storage,

    limits:{

        fileSize:5 * 1024 * 1024

    },


    fileFilter:(req,file,cb)=>{


    if(file.mimetype.startsWith("image/")){


        cb(null,true);


    }

    else{


        cb(new Error("Only images allowed"));


    }


}


});




// ===============================
// Sell Bike Page
// ===============================


router.get(

    "/sell-bike",

    bikeController.sellBikePage

);





// ===============================
// Add Bike
// ===============================


router.post(

    "/sell",

    upload.array("images",5),

    bikeController.addBike

);





// ===============================
// All Bikes
// ===============================


router.get(
    "/bikes",
    bikeController.getBikes
);


router.get(
    "/search",
    bikeController.searchBikes
);





// ===============================
// Bike Details
// ===============================


router.get(

    "/bikes/:id",

    bikeController.bikeDetails

);

// ===============================
// My Listings
// ===============================

router.get(
    "/my-listings",
    bikeController.myListings
);


// ===============================
// Delete Bike
// ===============================

router.get(
    "/delete-bike/:id",
    bikeController.deleteBike
);
// ===============================
// Edit Bike Page
// ===============================

router.get(
    "/edit-bike/:id",
    bikeController.editBikePage
);


// ===============================
// Update Bike
// ===============================

router.post(
    "/edit-bike/:id",
    upload.array("images",5),
    bikeController.updateBike
);

module.exports = router;