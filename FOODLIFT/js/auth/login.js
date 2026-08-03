// ================================
// FoodLift Login Page
// Presentation-layer prototype only — no real authentication happens here.
// ================================

document.addEventListener("DOMContentLoaded", () => {

  // Select Elements

  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const togglePasswordIcon = togglePasswordBtn.querySelector("i");
  const formMessage = document.getElementById("formMessage");
  const messageText = document.getElementById("messageText");
  const submitBtn = document.getElementById("submitBtn");
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  // Password Visibility

  togglePasswordBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordIcon.classList.toggle("fa-eye");
    togglePasswordIcon.classList.toggle("fa-eye-slash");
  });

  // Helper Functions

  function showMessage(message) {
    messageText.textContent = message;
    formMessage.classList.remove("hidden");
  }

  function hideMessage() {
    messageText.textContent = "";
    formMessage.classList.add("hidden");
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
  // Keeps every mock request feeling slightly different instead of a
  // suspiciously identical fixed delay every time.
  function mockLatency(minMs = 1000, maxMs = 5000) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  // Remove Errors While Typing

  [emailInput, passwordInput].forEach(input => {
    input.addEventListener("input", () => {
      clearHighlight(input);
      if (emailInput.value.trim() !== "" && passwordInput.value.trim() !== "") {
        hideMessage();
      }
    });
  });

  // Submit Form

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    hideMessage();
    clearHighlight(emailInput);
    clearHighlight(passwordInput);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (email === "" && password === "") {
      showMessage("Please enter your email address and password.");
      highlightField(emailInput);
      highlightField(passwordInput);
      return;
    }

    if (email === "") {
      showMessage("Email address is required.");
      highlightField(emailInput);
      return;
    }

    if (password === "") {
      showMessage("Password is required.");
      highlightField(passwordInput);
      return;
    }

    // --- Loading state (UI simulation only) -----------------------------
    // The button swaps its label for a spinner, and a toast communicates
    // what's happening ("Signing in…") for a simulated 1–5s, mimicking
    // real network latency. Replace the setTimeout block below with the
    // actual fetch() call — nothing here checks credentials against real
    // data.
    setLoading(true);

    const delay = mockLatency();
    showToast("Signing in…", delay);

    setTimeout(() => {
      /*
        Future Backend Integration

        POST /api/auth/login
        Body: { email, password }

        Backend should:
        - Verify credentials
        - Return an auth token / session cookie
        - Return the user's role for RBAC-based redirect

        On success  -> redirect to the appropriate dashboard
        On failure  -> setLoading(false); showMessage("Invalid email or password.")
      */

      window.location.href = "../customer/customer.html";
    }, delay);
  });

});