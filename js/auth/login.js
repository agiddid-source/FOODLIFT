// ================================
// FoodLift Login Page
// ================================

document.addEventListener("DOMContentLoaded", () => {

  
    // Select Elements

    const loginForm = document.querySelector("form");

    const emailInput = document.querySelector('input[type="email"]');

    const passwordInput = document.getElementById("password");

    const togglePasswordBtn = document.getElementById("togglePassword");

    const togglePasswordIcon = togglePasswordBtn.querySelector("i");

    const formMessage = document.getElementById("formMessage");

    const messageText = document.getElementById("messageText");


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

        field.classList.add(
            "border-red-400",
            "ring-2",
            "ring-red-200"
        );

    }

    function clearHighlight(field) {

        field.classList.remove(
            "border-red-400",
            "ring-2",
            "ring-red-200"
        );

    }

  
    // Remove Errors While Typing

    [emailInput, passwordInput].forEach(input => {

        input.addEventListener("input", () => {

            clearHighlight(input);

            if (
                emailInput.value.trim() !== "" &&
                passwordInput.value.trim() !== ""
            ) {

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

        // Prototype Redirect Only

        window.location.href = "../customer/customer.html";

    });

});