// forgot-password.js

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");

    const formMessage = document.getElementById("formMessage");
    const messageText = document.getElementById("messageText");

    const successState = document.getElementById("successState");
    const successMessage = document.getElementById("successMessage");

    if (!forgotPasswordForm) return;

    forgotPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        hideError();

        // Validate email
        if (email === "") {
            showError("Please enter your email address.");
            return;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.");
            return;
        }

        /*
            Future Backend Integration

            POST /api/auth/forgot-password

            Body:
            {
                email: email
            }

            Backend should:
            - Check if email exists
            - Generate reset token
            - Send reset email

        */

        // Show success state
        forgotPasswordForm.classList.add("hidden");

        successMessage.textContent =
            `We've sent a password reset link to ${email}. Please check your inbox (and spam folder if necessary).`;

        successState.classList.remove("hidden");
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        messageText.textContent = message;

        formMessage.classList.remove("hidden");
        formMessage.classList.remove("alert-success");
        formMessage.classList.add("alert-error");
    }

    function hideError() {
        formMessage.classList.add("hidden");
        messageText.textContent = "";
    }
});