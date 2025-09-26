document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-password-form');
    const messageEl = document.getElementById('message');
    const newPasswordInput = document.getElementById('new-password');

    // Supabase sends a 'PASSWORD_RECOVERY' event when the user
    // arrives from the password reset email link.
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newPassword = newPasswordInput.value;

                if (newPassword.length < 8) {
                    messageEl.textContent = 'Password must be at least 8 characters long.';
                    messageEl.className = 'text-center text-red-500 mb-6';
                    return;
                }

                // Update the user's password
                const { data, error } = await supabaseClient.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    messageEl.textContent = `Error: ${error.message}`;
                    messageEl.className = 'text-center text-red-500 mb-6';
                } else {
                    messageEl.textContent = 'Your password has been updated successfully! You can now log in.';
                    messageEl.className = 'text-center text-green-600 mb-6';
                    resetForm.style.display = 'none'; // Hide form on success
                }
            });

        }
    });
});

