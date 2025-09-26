document.addEventListener('DOMContentLoaded', async () => {
    // Note: supabaseClient must be defined in your supabase-client.js
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- SESSION CHECK & REDIRECT ---
    // This is the key part for handling Google login redirects.
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        // If a user is logged in, immediately redirect them to the dashboard.
        // This handles users returning from Google and any logged-in user visiting the homepage.
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
    
    // Dark/Light Mode Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    if(themeToggleBtn){
        const htmlElement = document.documentElement;
        const themeIconLight = document.getElementById('theme-icon-light');
        const themeIconDark = document.getElementById('theme-icon-dark');

        function setTheme(theme) {
            if (theme === 'dark') {
                htmlElement.classList.add('dark');
                themeIconLight.classList.remove('hidden');
                themeIconDark.classList.add('hidden');
            } else {
                htmlElement.classList.remove('dark');
                themeIconLight.classList.add('hidden');
                themeIconDark.classList.remove('hidden');
            }
        }

        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(savedTheme || (systemPrefersDark ? 'dark' : 'light'));

        themeToggleBtn.addEventListener('click', () => {
            const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }
});
