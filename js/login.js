document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // --- Element Selections ---
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const googleBtn = document.getElementById('google-login-btn');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const formMessage = document.getElementById('form-message');

    // --- NEW: Forgot Password Modal Elements ---
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
            await supabaseClient.auth.signInWithOAuth({ provider: 'google' });
        });
    }

    // --- Forgot Password Logic (UPDATED) ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (event) => {
            event.preventDefault();
            forgotPasswordModal.classList.remove('hidden'); // Show the new modal
        });
    }
    // Close modal listeners
    closeForgotPasswordModal.addEventListener('click', () => forgotPasswordModal.classList.add('hidden'));
    forgotPasswordModal.addEventListener('click', (e) => {
        if (e.target === forgotPasswordModal) forgotPasswordModal.classList.add('hidden');
    });

    // Handle the submission of the forgot password modal
    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = forgotEmailInput.value;
        const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        forgotFormMessage.textContent = '';

        // --- THIS IS THE CRITICAL FIX ---
        // We must provide the full URL to our reset-password.html page
        const resetURL = window.location.origin + '/reset-password.html';
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: resetURL,
        });

        if (error) {
            forgotFormMessage.textContent = "Error: " + error.message;
        } else {
            // Show the "Email Sent" message
            forgotPasswordForm.classList.add('hidden');
    
            forgotSuccessMessage.classList.remove('hidden');
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
    });


    // --- Manual Login Form Submission ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        formMessage.textContent = ''; 

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Logging In...';

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                formMessage.textContent = `Error: ${error.message}`;
                formMessage.className = 'text-center text-sm text-red-500';
            } else if (data.user) {
                window.location.href = 'dashboard.html';
            }
        } catch (e) {
            formMessage.textContent = 'A critical error occurred. Please try again.';
            formMessage.className = 'text-center text-sm text-red-500';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Log In';
        }
    });
});
