document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        // --- Element Selections ---
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        
        const emailError = document.getElementById('email-error');
        const passwordError = document.getElementById('password-error');
        const submitButton = signupForm.querySelector('button[type="submit"]');

        const togglePasswordBtn = document.getElementById('toggle-password');
        const eyeIcon = document.getElementById('eye-icon');
        const eyeSlashIcon = document.getElementById('eye-slash-icon');

        const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
        const confirmEyeIcon = document.getElementById('confirm-eye-icon');
        const confirmEyeSlashIcon = document.getElementById('confirm-eye-slash-icon');

        // --- Password Toggle Logic ---
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                eyeIcon.classList.toggle('hidden');
                eyeSlashIcon.classList.toggle('hidden');
            });
        }

        if (toggleConfirmPasswordBtn) {
            toggleConfirmPasswordBtn.addEventListener('click', function() {
                const isPassword = confirmPasswordInput.getAttribute('type') === 'password';
                confirmPasswordInput.setAttribute('type', isPassword ? 'text' : 'password');
                confirmEyeIcon.classList.toggle('hidden');
                confirmEyeSlashIcon.classList.toggle('hidden');
            });
        }

        // --- Form Submission Logic ---
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            // Frontend Validation
            let isValid = true;
            emailError.classList.add('hidden');
            passwordError.classList.add('hidden');

            const emailValue = emailInput.value;
            if (!emailValue.endsWith('@gitam.edu') && !emailValue.endsWith('@gitam.in')) {
                emailError.textContent = 'Please use a valid @gitam.edu or @gitam.in email.';
                emailError.classList.remove('hidden');
                isValid = false;
            }

            if (passwordInput.value !== confirmPasswordInput.value) {
                passwordError.classList.remove('hidden');
                isValid = false;
            }

            if (!isValid) return;

            // Supabase Sign Up
            try {
                submitButton.disabled = true;
                submitButton.textContent = 'Creating Account...';

                const { data, error } = await supabaseClient.auth.signUp({
                    email: emailValue,
                    password: passwordInput.value,
                });

                if (error) {
                    alert('Error: ' + error.message);
                    console.error('Supabase sign up error:', error);
                } else {
                    alert('Account created! Please check your GITAM email to confirm your account.');
                    signupForm.reset();
                }

            } catch (e) {
                alert('A critical error occurred. Please try again.');
                console.error('Catch block error:', e);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Create Account';
            }
        });
    }
});
