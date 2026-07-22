// reset-password.js

document.addEventListener("DOMContentLoaded", () => {

    const resetPasswordForm = document.getElementById("resetPasswordForm");

    const newPassword = document.getElementById("newPassword");
    const confirmPassword = document.getElementById("confirmPassword");

    const formMessage = document.getElementById("formMessage");
    const messageText = document.getElementById("messageText");

    const successState = document.getElementById("successState");
    const successMessage = document.getElementById("successMessage");

    const toggleNewPassword = document.getElementById("toggleNewPassword");
    const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");


    if (!resetPasswordForm) return;



    // Toggle New Password Visibility

    toggleNewPassword.addEventListener("click", () => {

        togglePasswordVisibility(
            newPassword,
            toggleNewPassword
        );

    });



    // Toggle Confirm Password Visibility

    toggleConfirmPassword.addEventListener("click", () => {

        togglePasswordVisibility(
            confirmPassword,
            toggleConfirmPassword
        );

    });



    // Reset Password Form Submit

    resetPasswordForm.addEventListener("submit", (e) => {

        e.preventDefault();


        const password = newPassword.value.trim();
        const confirm = confirmPassword.value.trim();


        hideMessage();



        if (password === "" || confirm === "") {

            showError("Please fill in all password fields.");
            return;

        }



        if (password.length < 8) {

            showError(
                "Password must be at least 8 characters long."
            );

            return;

        }



        if (password !== confirm) {

            showError(
                "Passwords do not match."
            );

            return;

        }



        // Successful password reset simulation

        resetPasswordForm.classList.add("hidden");


        successMessage.textContent =
            "Your password has been successfully updated. You can now login with your new password.";


        successState.classList.remove("hidden");


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


});