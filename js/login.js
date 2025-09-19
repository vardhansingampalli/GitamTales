document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        // --- Element Selections ---
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        const togglePasswordBtn = document.getElementById('toggle-password');
        const eyeIcon = document.getElementById('eye-icon');
        const eyeSlashIcon = document.getElementById('eye-slash-icon');

        // --- Password Toggle Logic ---
        // This is the code that makes the eye icon work.
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function() {
                const isPassword = passwordInput.getAttribute('type') === 'password';
                passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
                eyeIcon.classList.toggle('hidden');
                eyeSlashIcon.classList.toggle('hidden');
            });
        }

        // --- Form Submission Logic ---
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            try {
                // Disable the button to prevent multiple submissions
                submitButton.disabled = true;
                submitButton.textContent = 'Logging In...';

                // Use the supabaseClient to sign in
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: emailInput.value,
                    password: passwordInput.value,
                });

                if (error) {
                    // If Supabase returns an error (e.g., wrong password, user not found)
                    alert('Login failed: ' + error.message);
                    console.error('Supabase login error:', error);
                } else {
                    // If login is successful, redirect to the dashboard
                    console.log('Login successful!', data);
                    window.location.href = 'dashboard.html';
                }

            } catch (e) {
                alert('A critical error occurred. Please try again.');
                console.error('Catch block error:', e);
            } finally {
                // Re-enable the button
                submitButton.disabled = false;
                submitButton.textContent = 'Log In';
            }
        });
    }
});
