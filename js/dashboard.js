document.addEventListener('DOMContentLoaded', async () => {
    // Note: supabaseClient must be defined in your supabase-client.js
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Auth Guard (Page Protection) ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; // Redirect if not logged in
        return;
    }
    const user = session.user;
    
    // --- Populate User Data ---
    const userDisplayName = user.email.split('@')[0];
    document.querySelectorAll('.sm\\:inline.font-semibold.text-gray-700').forEach(el => el.textContent = userDisplayName);
    document.querySelectorAll('h2.text-2xl.font-bold.text-gray-900').forEach(el => el.textContent = userDisplayName);
    document.getElementById('add-tale-button').textContent = `What's new on your journey, ${userDisplayName}?`;

    // --- Your Original Code for UI Interactivity ---

    // Profile Dropdown Logic
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (profileMenuButton && profileMenu) {
        profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
        document.addEventListener('click', (event) => {
            if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
                profileMenu.classList.add('hidden');
            }
        });
        
        // Add Logout functionality to the link
        const logoutLink = profileMenu.querySelector('a[href="/index.html"]');
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // "Add New Tale" Modal Logic
    const addTaleButton = document.getElementById('add-tale-button');
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');

    if (addTaleButton && addTaleModal && closeModalButton && taleForm) {
        addTaleButton.addEventListener('click', () => addTaleModal.classList.remove('hidden'));
        closeModalButton.addEventListener('click', () => addTaleModal.classList.add('hidden'));
        addTaleModal.addEventListener('click', (event) => {
            if (event.target === addTaleModal) {
                addTaleModal.classList.add('hidden');
            }
        });

        // Handle form submission
        taleForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(taleForm);
            const taleData = Object.fromEntries(formData.entries());
            
            alert('New Tale posted! (Check the console for the data)');
            console.log("New Tale:", taleData);

            addTaleModal.classList.add('hidden');
            taleForm.reset();
        });
    }
});
