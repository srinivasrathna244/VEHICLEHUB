const form = document.getElementById("registerForm");

form.addEventListener("submit", function (e) {

    const firstName = form.first_name.value.trim();
    const lastName = form.last_name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;
    const pincode = form.pincode.value.trim();

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
        alert("Please enter a valid 10-digit Indian mobile number.");
        e.preventDefault();
        return;
    }

    if (password.length < 8) {
        alert("Password must contain at least 8 characters.");
        e.preventDefault();
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        e.preventDefault();
        return;
    }

    if (pincode !== "" && !pincodePattern.test(pincode)) {
        alert("Pincode must be 6 digits.");
        e.preventDefault();
        return;
    }
});