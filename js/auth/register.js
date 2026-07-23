// register.js
// Presentation-layer prototype only — no account is actually created.

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

    const submitBtn = document.getElementById("submitBtn");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    const togglePassword = document.getElementById("togglePassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

    if (!registerForm) return;

    // Password visibility toggle

    togglePassword.addEventListener("click", () => {
        togglePasswordVisibility(password, togglePassword);
    });

    toggleConfirmPassword.addEventListener("click", () => {
        togglePasswordVisibility(confirmPassword, toggleConfirmPassword);
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
        [fullName, email, phone, password, confirmPassword].forEach(clearHighlight);

        // Empty field validation

        if (userName === "" || userEmail === "" || userPhone === "" || userPassword === "" || userConfirmPassword === "") {
            showError("Please fill in all required fields.");
            [fullName, email, phone, password, confirmPassword].forEach(field => {
                if (field.value.trim() === "") highlightField(field);
            });
            return;
        }

        // Email validation

        if (!validateEmail(userEmail)) {
            showError("Please enter a valid email address.");
            highlightField(email);
            return;
        }

        // Password length validation

        if (userPassword.length < 8) {
            showError("Password must be at least 8 characters long.");
            highlightField(password);
            return;
        }

        // Confirm password validation

        if (userPassword !== userConfirmPassword) {
            showError("Passwords do not match.");
            highlightField(password);
            highlightField(confirmPassword);
            return;
        }

        // Terms validation

        if (!terms.checked) {
            showError("Please accept the Terms & Conditions to continue.");
            return;
        }

        // --- Loading state (UI simulation only) -----------------------------
        // The button swaps its label for a spinner, and a toast communicates
        // what's happening for a simulated 1–5s, mimicking real network
        // latency. Replace the setTimeout block below with the real fetch()
        // call.
        setLoading(true);

        const delay = mockLatency();
        showToast("Creating your account…", delay);

        setTimeout(() => {
            /*
                Future Backend Integration

                POST /api/auth/register
                Body: { fullName, email, phone, password }

                Backend should:
                - Check email/phone uniqueness
                - Hash password
                - Create the user record
                - Send a verification email (if required)

                On success -> show success state (as below)
                On failure -> setLoading(false); showError("Could not create account. Please try again.")
            */

            setLoading(false);

            registerForm.classList.add("hidden");

            successMessage.textContent =
                `Welcome to FoodLift, ${userName}! Your account has been created successfully.`;

            successState.classList.remove("hidden");
        }, delay);
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

    function highlightField(field) {
        field.classList.add("field-error");
    }

    function clearHighlight(field) {
        field.classList.remove("field-error");
    }

    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        submitBtn.classList.toggle("is-loading", isLoading);
    }

    // Toast — shows a status message for a given duration, then hides itself.
    function showToast(message, duration) {
        toastMessage.textContent = message;
        toast.classList.add("show");
        return setTimeout(() => toast.classList.remove("show"), duration);
    }

    // Random delay generator — stands in for real network latency.
    function mockLatency(minMs = 1000, maxMs = 5000) {
        return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    }

});