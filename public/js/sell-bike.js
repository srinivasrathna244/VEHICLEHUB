document.addEventListener("DOMContentLoaded", function(){


    const imageInput = document.getElementById("images");

    const preview = document.getElementById("preview");



    if(imageInput){


        imageInput.addEventListener("change", function(){


            preview.innerHTML = "";


            const files = this.files;



            if(files.length > 5){

                alert("You can upload maximum 5 images");

                this.value = "";

                return;

            }



            Array.from(files).forEach(file=>{


                if(file.type.startsWith("image/")){


                    const reader = new FileReader();



                    reader.onload = function(e){


                        const img = document.createElement("img");


                        img.src = e.target.result;


                        img.classList.add("preview-image");


                        preview.appendChild(img);



                    }



                    reader.readAsDataURL(file);


                }



            });



        });


    }



});