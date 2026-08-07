const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function (e) {

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    // Email Validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        e.preventDefault();
        return;
    }

    // Password Validation
    if (password.length < 8) {
        alert("Password must be at least 8 characters.");
        e.preventDefault();
        return;
    }

});