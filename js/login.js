document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    // Safety check in case the script is loaded on a different page
    if (!loginForm) {
        return;
    }

    // --- Element Selections ---
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const googleBtn = document.getElementById('google-login-btn');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const formMessage = document.getElementById('form-message');

    // --- Forgot Password Modal Elements ---
    const forgotPasswordModal = document.getElementById('forgot-password-modal');
    const closeForgotPasswordModal = document.getElementById('close-forgot-modal');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const forgotEmailInput = document.getElementById('forgot-email');
    const forgotFormMessage = document.getElementById('forgot-form-message');
    const forgotSuccessMessage = document.getElementById('forgot-success-message');

    // --- Password Visibility Toggle ---
    const togglePasswordButtons = document.querySelectorAll('[data-toggle-password]');
    const eyeIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`;
    const eyeSlashIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" /></svg>`;

    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', () => {
            const passwordFieldId = button.getAttribute('data-toggle-password');
            const passwordField = document.getElementById(passwordFieldId);
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                button.innerHTML = eyeSlashIconSVG;
            } else {
                passwordField.type = 'password';
                button.innerHTML = eyeIconSVG;
            }
        });
    });

    // --- Google Login ---
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            // Check if supabaseClient is available
            if (typeof supabaseClient === 'undefined') {
                console.error('Supabase client is not initialized.');
                formMessage.textContent = 'Error: Client configuration is missing.';
                formMessage.className = 'text-center text-sm text-red-500';
                return;
            }
            await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
        });
    }

    // --- Forgot Password Logic (FIXED) ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (!forgotPasswordModal) return;
            // Reset form to its original state every time it's opened
            forgotPasswordForm?.classList.remove('hidden');
            forgotSuccessMessage?.classList.add('hidden');
            if(forgotFormMessage) forgotFormMessage.textContent = '';
            if(forgotEmailInput) forgotEmailInput.value = '';
            // Show the modal
            forgotPasswordModal.classList.remove('hidden');
        });
    }
    // Close modal listeners
    closeForgotPasswordModal?.addEventListener('click', () => forgotPasswordModal.classList.add('hidden'));
    forgotPasswordModal?.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) forgotPasswordModal.classList.add('hidden');
    });

    // Handle the submission of the forgot password modal
    forgotPasswordForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = forgotEmailInput.value;
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');

        if (!email) {
             if(forgotFormMessage) forgotFormMessage.textContent = "Please enter your email address.";
             return;
        }

        if(submitBtn) submitBtn.disabled = true;
        if(submitBtn) submitBtn.textContent = 'Sending...';
        if(forgotFormMessage) forgotFormMessage.textContent = '';

        // Check if supabaseClient is available
        if (typeof supabaseClient === 'undefined') {
            console.error('Supabase client is not initialized.');
            if(forgotFormMessage) forgotFormMessage.textContent = 'Error: Client configuration is missing.';
            if(submitBtn) submitBtn.disabled = false;
            if(submitBtn) submitBtn.textContent = 'Send Reset Link';
            return;
        }

        // --- THIS IS THE CRITICAL FIX ---
        // It now redirects to the correct reset-password.html page
        const resetURL = window.location.origin + '/reset-password.html';
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetURL, // This now points to the correct page
        });

        if (error) {
            if(forgotFormMessage) forgotFormMessage.textContent = "Error: ".concat(error.message);
        } else {
            // Show the "Email Sent" success message
            forgotPasswordForm.classList.add('hidden');
            forgotSuccessMessage?.classList.remove('hidden');
        }

        if(submitBtn) submitBtn.disabled = false;
        if(submitBtn) submitBtn.textContent = 'Send Reset Link';
    });


    // --- Manual Login Form Submission ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        if(formMessage) formMessage.textContent = ''; 

        // Check if supabaseClient is available
        if (typeof supabaseClient === 'undefined') {
            console.error('Supabase client is not initialized.');
            if(formMessage) {
                 formMessage.textContent = 'Error: Client configuration is missing.';
                 formMessage.className = 'text-center text-sm text-red-500';
            }
            return;
        }

        try {
            if(submitButton) submitButton.disabled = true;
            if(submitButton) submitButton.textContent = 'Logging In...';

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                if(formMessage) {
                    formMessage.textContent = `Error: ${error.message}`;
                    formMessage.className = 'text-center text-sm text-red-500';
                }
            } else if (data.user) {
                // On success, redirect to the dashboard
                window.location.href = 'dashboard.html';
            }
        } catch (e) {
            if(formMessage) {
                formMessage.textContent = 'A critical error occurred. Please try again.';
                formMessage.className = 'text-center text-sm text-red-500';
            }
        } finally {
            if(submitButton) submitButton.disabled = false;
            if(submitButton) submitButton.textContent = 'Log In';
        }
    });
});

