document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- SESSION CHECK & REDIRECT ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // If a user is logged in, immediately redirect them to the dashboard.
        window.location.href = 'dashboard.html';
    } else {
        // If no user is logged in, make the homepage visible with a fade-in effect.
        document.body.style.opacity = 1;
        
        // --- Set up the page normally for logged-out users. ---

        // Mobile Menu Toggle
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenuNav = document.getElementById('mobile-menu');
        if (mobileMenuButton && mobileMenuNav) {
            mobileMenuButton.addEventListener('click', () => mobileMenuNav.classList.toggle('hidden'));
        }

        // Dynamic Copyright Year
        const yearSpan = document.getElementById('year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    }
});
