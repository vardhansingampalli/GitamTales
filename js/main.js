document.addEventListener('DOMContentLoaded', async () => {
    // Note: supabaseClient must be defined in your supabase-client.js
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Dynamic Navigation based on Auth State ---
    const navLinksContainer = document.querySelector('.hidden.md\\:flex.items-center.space-x-6');
    const mobileMenuNav = document.getElementById('mobile-menu');

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        // User is LOGGED IN, update navigation
        const navContent = `
            <a href="#features" class="text-gray-600 hover:text-[#007367] transition-colors dark:text-gray-400 dark:hover:text-[#00c2aa]">How It Works</a>
            <a href="#discover" class="text-gray-600 hover:text-[#007367] transition-colors dark:text-gray-400 dark:hover:text-[#00c2aa]">Discover</a>
            <a href="dashboard.html" class="bg-[#007367] hover:bg-[#005f56] text-white font-semibold py-2 px-4 rounded-lg">My Journey</a>
            <button id="logout-btn" class="text-gray-600 hover:text-[#007367] dark:text-gray-400 font-semibold">Log Out</button>
        `;
        const mobileNavContent = `
            <a href="#features" class="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300">How It Works</a>
            <a href="#discover" class="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300">Discover</a>
            <a href="dashboard.html" class="block py-2 px-4 text-sm text-white bg-[#007367]">My Journey</a>
            <button id="mobile-logout-btn" class="w-full text-left block py-2 px-4 text-sm text-red-600 hover:bg-gray-100">Log Out</button>
        `;
        if (navLinksContainer) navLinksContainer.innerHTML = navContent;
        if (mobileMenuNav) mobileMenuNav.innerHTML = mobileNavContent;

        document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
        document.getElementById('mobile-logout-btn')?.addEventListener('click', handleLogout);
    }

    async function handleLogout() {
        await supabaseClient.auth.signOut();
        window.location.reload();
    }

    // --- Your Original Code for UI Interactivity ---

    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button'); // Ensure your HTML has this ID
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
