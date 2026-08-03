// forgot-password.js
// Presentation-layer prototype only — no email is actually sent.

document.addEventListener("DOMContentLoaded", () => {
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    const emailInput = document.getElementById("email");

    const formMessage = document.getElementById("formMessage");
    const messageText = document.getElementById("messageText");

    const successState = document.getElementById("successState");
    const successMessage = document.getElementById("successMessage");

    const submitBtn = document.getElementById("submitBtn");
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");

    if (!forgotPasswordForm) return;

    forgotPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        hideError();
        clearHighlight(emailInput);

        // Validate email
        if (email === "") {
            showError("Please enter your email address.");
            highlightField(emailInput);
            return;
        }

        if (!isValidEmail(email)) {
            showError("Please enter a valid email address.");
            highlightField(emailInput);
            return;
        }

        // --- Loading state (UI simulation only) -----------------------------
        // The button swaps its label for a spinner, and a toast communicates
        // what's happening for a simulated 1–5s, mimicking real network
        // latency. Replace the setTimeout block below with the real fetch()
        // call.
        setLoading(true);

        const delay = mockLatency();
        showToast("Sending reset link…", delay);

        setTimeout(() => {
            /*
                Future Backend Integration

                POST /api/auth/forgot-password
                Body: { email }

                Backend should:
                - Check if email exists
                - Generate reset token
                - Send reset email

                On success -> show success state (as below)
                On failure -> setLoading(false); showError("Something went wrong. Please try again.")
            */

            setLoading(false);

            forgotPasswordForm.classList.add("hidden");

            successMessage.textContent =
                `We've sent a password reset link to ${email}. Please check your inbox (and spam folder if necessary).`;

            successState.classList.remove("hidden");
        }, delay);
    });

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        messageText.textContent = message;
        formMessage.classList.remove("hidden");
    }

    function hideError() {
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