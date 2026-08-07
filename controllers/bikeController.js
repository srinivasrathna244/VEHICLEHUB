const db = require("../database/db");


// ===============================
// Show Sell Bike Page
// ===============================

const sellBikePage = (req,res)=>{

    res.render("sell-bike",{

        title:"Sell Bike",

        user:req.session.user

    });

};




// ===============================
// Add Bike
// ===============================

const addBike = (req,res)=>{


    const seller_id = req.session.user.id;


    const {

        bike_name,
        brand,
        model,
        year,
        price,
        kilometers,
        fuel_type,
        transmission,
        owner_type,
        city,
        description


    } = req.body;



    const sql = `

    INSERT INTO bikes

    (
        seller_id,
        bike_name,
        brand,
        model,
        year,
        price,
        kilometers,
        fuel_type,
        transmission,
        owner_type,
        city,
        description

    )

    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)

    `;



    db.query(

        sql,

        [

            seller_id,
            bike_name,
            brand,
            model,
            year,
            price,
            kilometers,
            fuel_type,
            transmission,
            owner_type,
            city,
            description

        ],


        (err,result)=>{


           if (err) {

    console.log(err);

    return res.status(500).send(err.message);

}




            const bike_id = result.insertId;




            if(req.files && req.files.length > 0){



                let images = req.files.map(file=>{


                    return [

                        bike_id,
                        file.filename

                    ];


                });



                const imageSQL = `

                INSERT INTO bike_images

                (
                    bike_id,
                    image

                )

                VALUES ?

                `;



                db.query(

                    imageSQL,

                    [images],

                    (err)=>{


                        if(err){

                            console.log(err);

                        }


                        res.redirect("/bikes");


                    }


                );



            }

            else{


                res.redirect("/bikes");


            }



        }


    );


};





// ===============================
// Get All Bikes
// ===============================


const getBikes = (req,res)=>{


    const sql = `

SELECT 

bikes.*,

users.first_name,

users.phone,

(
    SELECT image 
    FROM bike_images 
    WHERE bike_images.bike_id = bikes.id 
    LIMIT 1
) AS image

FROM bikes

JOIN users

ON bikes.seller_id = users.id

ORDER BY bikes.created_at DESC

`;



    db.query(sql,(err,result)=>{


        if (err) {

    console.log(err);

    return res.status(500).send(err.message);

}



        res.render("bikes",{

            title:"Bikes",

            bikes:result,

            user:req.session.user


        });



    });



};





// ===============================
// Bike Details
// ===============================


const bikeDetails = (req,res)=>{


    const id = req.params.id;



    const sql = `

    SELECT

    bikes.*,
    users.first_name,
    users.phone

    FROM bikes

    JOIN users

    ON bikes.seller_id = users.id

    WHERE bikes.id=?


    `;



    db.query(

        sql,

        [id],

        (err,result)=>{


           if (err) {

    console.log(err);

    return res.status(500).send(err.message);

}



            const imageSQL =

            "SELECT * FROM bike_images WHERE bike_id=?";



            db.query(

                imageSQL,

                [id],

                (err,images)=>{


                    res.render("bike-details",{

                        title:"Bike Details",

                        bike:result[0],

                        images:images,

                        user:req.session.user


                    });


                }

            );



        }

    );



};


// ===============================
// Search Bikes
// ===============================

const searchBikes = (req,res)=>{


    const {

        search,
        brand,
        city,
        min_price,
        max_price


    } = req.query;



    let sql = `

    SELECT 

    bikes.*,

    users.first_name,

    users.phone,

    (
        SELECT image 
        FROM bike_images
        WHERE bike_images.bike_id = bikes.id
        LIMIT 1
    ) AS image

    FROM bikes

    JOIN users

    ON bikes.seller_id = users.id

    WHERE 1=1

    `;



    let values=[];



    if(search){


        sql += ` AND bike_name LIKE ? `;

        values.push(`%${search}%`);


    }



    if(brand){


        sql += ` AND brand=? `;

        values.push(brand);


    }



    if(city){


        sql += ` AND city=? `;

        values.push(city);


    }



    if(min_price){


        sql += ` AND price>=? `;

        values.push(min_price);


    }



    if(max_price){


        sql += ` AND price<=? `;

        values.push(max_price);


    }




    db.query(

        sql,

        values,

        (err,result)=>{


            if(err){

                return res.send(err);

            }



            res.render("bikes",{

                title:"Search Bikes",

                bikes:result,

                user:req.session.user || null

            });



        }

    );


};
// ===============================
// My Listings
// ===============================

const myListings = (req,res)=>{

    if(!req.session.user){

        return res.redirect("/login");

    }

    const sql = `

    SELECT

    bikes.*,

    (
        SELECT image
        FROM bike_images
        WHERE bike_images.bike_id=bikes.id
        LIMIT 1
    ) AS image

    FROM bikes

    WHERE seller_id=?

    ORDER BY created_at DESC

    `;

    db.query(

        sql,

        [req.session.user.id],

        (err,result)=>{

            if(err){

                return res.send(err);

            }

            res.render("my-listings",{

                title:"My Listings",

                bikes:result,

                user:req.session.user

            });

        }

    );

};

// ===============================
// Delete Bike
// ===============================


const deleteBike = (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    const bikeId = req.params.id;
    const userId = req.session.user.id;

    db.query(
        "SELECT * FROM bikes WHERE id=? AND seller_id=?",
        [bikeId, userId],
        (err, result) => {

            if (err) {
                return res.status(500).send(err.message);
            }

            if (result.length === 0) {
                return res.status(403).send("You are not authorized to delete this bike.");
            }

            db.query(
                "DELETE FROM bike_images WHERE bike_id=?",
                [bikeId],
                (err) => {

                    if (err) {
                        return res.status(500).send(err.message);
                    }

                    db.query(
                        "DELETE FROM bikes WHERE id=? AND seller_id=?",
                        [bikeId, userId],
                        (err) => {

                            if (err) {
                                return res.status(500).send(err.message);
                            }

                            res.redirect("/my-listings");

                        }
                    );

                }
            );

        }
    );

};

// ===============================
// Edit Bike Page
// ===============================

const editBikePage = (req,res)=>{

    if(!req.session.user){

        return res.redirect("/login");

    }

    const bikeId=req.params.id;

    db.query(

        "SELECT * FROM bikes WHERE id=? AND seller_id=?",

        [

            bikeId,

            req.session.user.id

        ],

        (err,result)=>{

            if(err){

                return res.send(err);

            }

            if(result.length===0){

                return res.send("Bike not found.");

            }

            res.render("edit-bike",{

                title:"Edit Bike",

                bike:result[0],

                user:req.session.user

            });

        }

    );

};



// ===============================
// Update Bike
// ===============================

const updateBike = (req, res) => {

    if (!req.session.user) {

        return res.redirect("/login");

    }

    const bikeId = req.params.id;

    const {

        bike_name,
        brand,
        model,
        year,
        price,
        kilometers,
        fuel_type,
        transmission,
        owner_type,
        city,
        description

    } = req.body;



    const sql = `

    UPDATE bikes

    SET

    bike_name=?,
    brand=?,
    model=?,
    year=?,
    price=?,
    kilometers=?,
    fuel_type=?,
    transmission=?,
    owner_type=?,
    city=?,
    description=?

    WHERE id=?
    AND seller_id=?

    `;



    db.query(

        sql,

        [

            bike_name,
            brand,
            model,
            year,
            price,
            kilometers,
            fuel_type,
            transmission,
            owner_type,
            city,
            description,
            bikeId,
            req.session.user.id

        ],

        (err) => {

           if (err) {

    console.log(err);

    return res.status(500).send(err.message);

}



            // No new images uploaded
            if (!req.files || req.files.length === 0) {

                return res.redirect("/my-listings");

            }



            // Delete old image records
            db.query(

                "DELETE FROM bike_images WHERE bike_id=?",

                [bikeId],

                (err) => {

                    if (err) {

                        console.log(err);

                        return res.redirect("/my-listings");

                    }



                    const images = req.files.map(file => [

                        bikeId,

                        file.filename

                    ]);



                    db.query(

                        `

                        INSERT INTO bike_images

                        (bike_id,image)

                        VALUES ?

                        `,

                        [images],

                        (err) => {

                            if (err) {

                                console.log(err);

                            }

                            res.redirect("/my-listings");

                        }

                    );

                }

            );

        }

    );

};
module.exports={

    sellBikePage,

    addBike,

    getBikes,

    bikeDetails,

    searchBikes,

    myListings,

    deleteBike,

    editBikePage,

    updateBike

};