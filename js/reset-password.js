document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase client is available
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        const messageEl = document.getElementById('message');
        if(messageEl) {
            messageEl.textContent = 'Error: Client configuration is missing. Cannot reset password.';
            messageEl.className = 'text-center text-red-500 mb-6';
        }
        return;
    }

    const resetForm = document.getElementById('reset-password-form');
    const messageEl = document.getElementById('message');
    const newPasswordInput = document.getElementById('new-password');

    // This event fires *only* if the user lands on this page
    // from a valid password reset link.
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        // We are looking for the PASSWORD_RECOVERY event, which means the user
        // has a valid token from their email.
        if (event === 'PASSWORD_RECOVERY') {
            
            // Show the form only if the event is detected
            if (messageEl) messageEl.textContent = 'Enter your new password below.';
            if (resetForm) resetForm.classList.remove('hidden');

            resetForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = newPasswordInput.value;
                const submitButton = resetForm.querySelector('button[type="submit"]');

                if (newPassword.length < 8) {
                    if (messageEl) {
                        messageEl.textContent = 'Password must be at least 8 characters long.';
                        messageEl.className = 'text-center text-red-500 mb-6';
                    }
                    return;
                }

                if(submitButton) submitButton.disabled = true;
                if(submitButton) submitButton.textContent = 'Updating...';

                // Update the user's password
                const { data, error } = await supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    if (messageEl) {
                        messageEl.textContent = `Error: ${error.message}`;
                        messageEl.className = 'text-center text-red-500 mb-6';
                    }
                    if(submitButton) submitButton.disabled = false;
                    if(submitButton) submitButton.textContent = 'Update Password';
                } else {
                    // --- ALL BUGS FIXED ---
                    // 1. Confirmation Message
                    if (messageEl) {
                        messageEl.textContent = 'Password updated successfully! Redirecting to login...';
                        messageEl.className = 'text-center text-green-600 mb-6';
                    }
                    if(resetForm) resetForm.style.display = 'none'; // Hide form

                    // 2. Redirect to login
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 3000); // 3-second delay
                }
            });
        } else if (event === 'SIGNED_IN') {
             // This can happen if the user is already logged in
             // Or after the password update, but we already handle redirect
        } else {
             // User landed here without a valid token
             if (messageEl) {
                messageEl.textContent = 'Invalid or expired link. Please request a new password reset from the login page.';
                messageEl.className = 'text-center text-red-500 mb-6';
             }
        }
    });
});

