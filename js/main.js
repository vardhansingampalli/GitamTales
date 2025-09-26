document.addEventListener('DOMContentLoaded', async () => {
    // Note: supabaseClient must be defined in your supabase-client.js
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- SESSION CHECK & REDIRECT ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // If a user is logged in, immediately redirect them to the dashboard.
        window.location.href = 'dashboard.html';
        return; // Stop the rest of the script from running
    }

    // --- If no session, the user is logged out. Set up the page normally. ---

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuNav = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenuNav) {
        mobileMenuButton.addEventListener('click', () => mobileMenuNav.classList.toggle('hidden'));
    }

    // Dynamic Copyright Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
});
