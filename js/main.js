document.addEventListener('DOMContentLoaded', function() {
    
    // --- Mobile Menu Toggle ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- Dynamic Copyright Year ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // --- Dark/Light Mode Toggle ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // A function to set the theme and update icons
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

    // Set initial theme
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (systemPrefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    // Add click event listener to toggle button
    themeToggleBtn.addEventListener('click', function() {
        if (htmlElement.classList.contains('dark')) {
            setTheme('light');
            localStorage.setItem('theme', 'light');
        } else {
            setTheme('dark');
            localStorage.setItem('theme', 'dark');
        }
    });
});