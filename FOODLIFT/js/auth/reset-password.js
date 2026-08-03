// reset-password.js
// Presentation-layer prototype only — no password is actually changed.

document.addEventListener("DOMContentLoaded", () => {

    const resetPasswordForm = document.getElementById("resetPasswordForm");

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const formMessage = document.getElementById("formMessage");
    const messageText = document.getElementById("messageText");

    const successState = document.getElementById("successState");
    const successMessage = document.getElementById("successMessage");

    const submitBtn = document.getElementById("submitBtn");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    const toggleNewPassword = document.getElementById("toggleNewPassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

    if (!resetPasswordForm) return;

    // Toggle New Password Visibility

    toggleNewPassword.addEventListener("click", () => {
        togglePasswordVisibility(newPassword, toggleNewPassword);
    });

    // Toggle Confirm Password Visibility

    toggleConfirmPassword.addEventListener("click", () => {
        togglePasswordVisibility(confirmPassword, toggleConfirmPassword);
    });

    // Reset Password Form Submit

    resetPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const password = newPassword.value.trim();
        const confirm = confirmPassword.value.trim();

        hideMessage();
        clearHighlight(newPassword);
        clearHighlight(confirmPassword);

        if (password === "" || confirm === "") {
            showError("Please fill in all password fields.");
            if (password === "") highlightField(newPassword);
            if (confirm === "") highlightField(confirmPassword);
            return;
        }

        if (password.length < 8) {
            showError("Password must be at least 8 characters long.");
            highlightField(newPassword);
            return;
        }

        if (password !== confirm) {
            showError("Passwords do not match.");
            highlightField(newPassword);
            highlightField(confirmPassword);
            return;
        }

        // --- Loading state (UI simulation only) -----------------------------
        // The button swaps its label for a spinner, and a toast communicates
        // what's happening for a simulated 1–5s, mimicking real network
        // latency. Replace the setTimeout block below with the real fetch()
        // call.
        setLoading(true);

        const delay = mockLatency();
        showToast("Updating password…", delay);

        setTimeout(() => {
            /*
                Future Backend Integration

                POST /api/auth/reset-password
                Body: { token, newPassword }

                Backend should:
                - Validate the reset token (from the URL/query string)
                - Hash and store the new password
                - Invalidate the reset token

                On success -> show success state (as below)
                On failure -> setLoading(false); showError("This reset link is invalid or has expired.")
            */

            setLoading(false);

            resetPasswordForm.classList.add("hidden");

            successMessage.textContent =
                "Your password has been successfully updated. You can now login with your new password.";

            successState.classList.remove("hidden");
        }, delay);
    });

    // Password Visibility Toggle

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

    // Show Error Message

    function showError(message) {
        messageText.textContent = message;
        formMessage.classList.remove("hidden");
    }

    // Hide Error Message

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