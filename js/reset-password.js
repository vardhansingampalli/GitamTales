document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-password-form');
    const messageEl = document.getElementById('message');
    const newPasswordInput = document.getElementById('new-password');
    const submitButton = resetForm.querySelector('button[type="submit"]');

    // Hide the form by default. It will be shown only if the recovery event is detected.
    resetForm.style.display = 'none';
    
    // **IMPORTANT**: For this to look right, please add class="hidden" to your <form> tag
    // in the 'reset-password.html' file, like this:
    // <form id="reset-password-form" class="space-y-6 hidden">

    // 1. Listen for the form submission immediately.
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = newPasswordInput.value;

        if (newPassword.length < 8) {
            messageEl.textContent = 'Password must be at least 8 characters long.';
            messageEl.className = 'text-center text-red-500 mb-6';
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Updating...';

        // 2. Call updateUser. The client will use the session from the URL hash
        // that it automatically detected on page load.
        const { data, error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            messageEl.textContent = `Error: ${error.message}`;
            messageEl.className = 'text-center text-red-500 mb-6';
            submitButton.disabled = false;
            submitButton.textContent = 'Update Password';
        } else {
            // === Success message and redirect ===
            messageEl.textContent = 'Password updated successfully! Redirecting to login...';
            messageEl.className = 'text-center text-green-600 mb-6';
            resetForm.style.display = 'none'; // Hide form on success

            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
            // ===============================================
        }
    });

    // 2. Use onAuthStateChange *only* to confirm the event and show the form.
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            // This event confirms the user has a valid token from the email link.
            // Now we show the form.
            resetForm.style.display = 'block';
            messageEl.textContent = 'Enter your new password below.';
        }
    });
});

