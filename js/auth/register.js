// register.js

document.addEventListener("DOMContentLoaded", () => {

    const registerForm = document.getElementById("registerForm");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");

    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const terms = document.getElementById("terms");


    const formMessage = document.getElementById("formMessage");
    const messageText = document.getElementById("messageText");

    const successState = document.getElementById("successState");
    const successMessage = document.getElementById("successMessage");


    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");



    if (!registerForm) return;



    // Password visibility toggle

    togglePassword.addEventListener("click", () => {

        togglePasswordVisibility(
            password,
            togglePassword
        );

    });



    toggleConfirmPassword.addEventListener("click", () => {

        togglePasswordVisibility(
            confirmPassword,
            toggleConfirmPassword
        );

    });





    // Register form submission

    registerForm.addEventListener("submit", (e) => {

        e.preventDefault();


        const userName = fullName.value.trim();
        const userEmail = email.value.trim();
        const userPhone = phone.value.trim();
        const userPassword = password.value.trim();
        const userConfirmPassword = confirmPassword.value.trim();



        hideMessage();



        // Empty field validation

        if (
            userName === "" ||
            userEmail === "" ||
            userPhone === "" ||
            userPassword === "" ||
            userConfirmPassword === ""
        ) {

            showError(
                "Please fill in all required fields."
            );

            return;

        }





        // Email validation

        if (!validateEmail(userEmail)) {

            showError(
                "Please enter a valid email address."
            );

            return;

        }





        // Password length validation

        if (userPassword.length < 8) {

            showError(
                "Password must be at least 8 characters long."
            );

            return;

        }





        // Confirm password validation

        if (userPassword !== userConfirmPassword) {

            showError(
                "Passwords do not match."
            );

            return;

        }





        // Terms validation

        if (!terms.checked) {

            showError(
                "Please accept the Terms & Conditions to continue."
            );

            return;

        }





        // Successful registration simulation

        registerForm.classList.add("hidden");


        successMessage.textContent =
            `Welcome to FoodLift, ${userName}! Your account has been created successfully.`;



        successState.classList.remove("hidden");



    });





    // Validate email format

    function validateEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    }





    // Toggle password visibility

    function togglePasswordVisibility(input, button) {

        const icon = button.querySelector("i");


        if (input.type === "password") {

            input.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");


        } else {

            input.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

        }

    }





    // Show error message

    function showError(message) {

        messageText.textContent = message;

        formMessage.classList.remove("hidden");

    }





    // Hide error message

    function hideMessage() {

        formMessage.classList.add("hidden");

        messageText.textContent = "";

    }


});