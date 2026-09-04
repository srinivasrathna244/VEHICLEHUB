/**
 * VehicleHub Registration Form Validation
 */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        const firstName = document.getElementById("first_name").value.trim();
        const lastName = document.getElementById("last_name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm_password").value;
        const pincode = document.getElementById("pincode").value.trim();

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[6-9]\d{9}$/;
        const pincodePattern = /^\d{6}$/;

        if (firstName.length < 2) {
            alert("First name must contain at least 2 characters.");
            e.preventDefault();
            return;
        }

        if (lastName.length < 2) {
            alert("Last name must contain at least 2 characters.");
            e.preventDefault();
            return;
        }

        if (!emailPattern.test(email)) {
            alert("Please enter a valid email address.");
            e.preventDefault();
            return;
        }

        if (!phonePattern.test(phone)) {
            alert("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
            e.preventDefault();
            return;
        }

        if (password.length < 8) {
            alert("Password must be at least 8 characters long.");
            e.preventDefault();
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match. Please re-enter.");
            e.preventDefault();
            return;
        }

        if (pincode !== "" && !pincodePattern.test(pincode)) {
            alert("Pincode must be exactly 6 digits.");
            e.preventDefault();
            return;
        }
    });
});