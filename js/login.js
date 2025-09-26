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

    // --- Password Visibility Toggle ---
    const togglePasswordButtons = document.querySelectorAll('[data-toggle-password]');

    const eyeIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.432 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    `;

    const eyeSlashIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
        </svg>
    `;

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

    // --- Forgot Password Logic ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (event) => {
            event.preventDefault();
            const email = prompt("Please enter your email to reset your password:");

            if (email) {
                const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                });
                if (error) {
                    formMessage.textContent = "Error: " + error.message;
                    formMessage.className = 'text-center text-sm text-red-500';
                } else {
                    formMessage.textContent = "Password reset email sent! Check your inbox.";
                    formMessage.className = 'text-center text-sm text-green-600';
                }
            }
        });
    }

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
                window.location.href = 'index.html';
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
