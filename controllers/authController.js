const db = require("../database/db");
const bcrypt = require("bcrypt");



// ===============================
// Register User
// ===============================

const registerUser = async (req,res)=>{


    try{


        const {

            first_name,
            last_name,
            email,
            phone,
            password,
            confirm_password,
            address,
            city,
            state,
            pincode


        } = req.body;




        if(

            !first_name ||
            !last_name ||
            !email ||
            !phone ||
            !password ||
            !confirm_password

        ){

            return res.send(
                "Please fill all required fields"
            );

        }




        if(password !== confirm_password){


            return res.send(
                "Passwords do not match"
            );


        }





        db.query(

             "SELECT * FROM users WHERE email=? OR phone=?",
    [email, phone],
    async (err, result) => {

        if (err) {
            return res.status(500).send(err.message);
        }

        if (result.length > 0) {

            if (result[0].email === email) {
                return res.send("Email already registered.");
            }

            if (result[0].phone === phone) {
                return res.send("Phone number already registered.");
            }

        }



                const hashedPassword =
                await bcrypt.hash(password,10);





                const sql = `

                INSERT INTO users

                (

                first_name,
                last_name,
                email,
                phone,
                password,
                address,
                city,
                state,
                pincode

                )

                VALUES(?,?,?,?,?,?,?,?,?)

                `;



                db.query(

                    sql,

                    [

                    first_name,
                    last_name,
                    email,
                    phone,
                    hashedPassword,
                    address,
                    city,
                    state,
                    pincode

                    ],


                    (err)=>{


                        if(err){

                            return res.send(err);

                        }



                        res.redirect("/login");


                    }


                );



            }


        );



    }

    catch(error){


        res.send(error.message);


    }



};






// ===============================
// Login User
// ===============================

const loginUser = (req,res)=>{


    const {

        email,

        password


    } = req.body;





    if(!email || !password){


        return res.send(
            "Enter email and password"
        );


    }






    db.query(

        "SELECT * FROM users WHERE email=?",

        [email],


        async(err,result)=>{


            if(err){

                return res.send(err);

            }



            if(result.length === 0){


                return res.send(
                    "User not found"
                );


            }





            const user = result[0];




            const match = await bcrypt.compare(

                password,

                user.password

            );





            if(!match){


                return res.send(
                    "Invalid Password"
                );


            }





            req.session.user = {


                id:user.id,

                first_name:user.first_name,

                last_name:user.last_name,

                email:user.email,

                phone:user.phone,

                address:user.address,

                city:user.city,

                state:user.state,

                pincode:user.pincode


            };






            res.redirect("/dashboard");




        }


    );




};

// ===============================
// Profile Page
// ===============================

const profilePage = (req, res) => {

    if (!req.session.user) {

        return res.redirect("/login");

    }

    db.query(

        "SELECT * FROM users WHERE id=?",

        [req.session.user.id],

        (err, result) => {

            if (err) {

                return res.status(500).send(err.message);

            }

            if (result.length === 0) {

                return res.redirect("/login");

            }

            res.render("profile", {

                title: "My Profile",

                user: result[0]

            });

        }

    );

};

// ===============================
// Edit Profile Page
// ===============================

const editProfilePage = (req, res) => {

    if (!req.session.user) {

        return res.redirect("/login");

    }

    db.query(

        "SELECT * FROM users WHERE id=?",

        [req.session.user.id],

        (err, result) => {

            if (err) {

                return res.status(500).send(err.message);

            }

            res.render("edit-profile", {

                title: "Edit Profile",

                user: result[0]

            });

        }

    );

};



// ===============================
// Update Profile
// ===============================

const updateProfile = (req, res) => {

    if (!req.session.user) {

        return res.redirect("/login");

    }

    const {

        first_name,
        last_name,
        phone,
        address,
        city,
        state,
        pincode

    } = req.body;

    db.query(

        `

        UPDATE users

        SET

        first_name=?,
        last_name=?,
        phone=?,
        address=?,
        city=?,
        state=?,
        pincode=?

        WHERE id=?

        `,

        [

            first_name,
            last_name,
            phone,
            address,
            city,
            state,
            pincode,
            req.session.user.id

        ],

        (err) => {

            if (err) {

                return res.status(500).send(err.message);

            }

            // Update session values
            req.session.user.first_name = first_name;
            req.session.user.last_name = last_name;
            req.session.user.phone = phone;

            res.redirect("/profile");

        }

    );

};

// ===============================
// Logout User
// ===============================

const logoutUser = (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            return res.status(500).send("Logout failed.");
        }

        res.redirect("/login");

    });

};

module.exports = {

    registerUser,

    loginUser,

    logoutUser,

    profilePage,

    editProfilePage,

    updateProfile

};