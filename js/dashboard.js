document.addEventListener('DOMContentLoaded', async () => {
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
    // Note: This part will be improved later to fetch from a 'profiles' table
    const userDisplayName = user.email.split('@')[0];
    document.querySelector('.sm\\:inline.font-semibold.text-gray-700').textContent = userDisplayName;
    document.querySelector('h2.text-2xl.font-bold.text-gray-900').textContent = userDisplayName;
    document.getElementById('add-tale-button').textContent = `What's new on your journey, ${userDisplayName}?`;

    // --- Profile Dropdown Logic ---
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (profileMenuButton && profileMenu) {
        profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
        document.addEventListener('click', (event) => {
            if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
                profileMenu.classList.add('hidden');
            }
        });
        
        // --- THIS LOGOUT LOGIC IS UPDATED ---
        const logoutButton = document.getElementById('logout-button');
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent the link from navigating immediately
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html'; // Redirect after sign out
        });
    }

    // --- "Add New Tale" Modal Logic ---
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

        taleForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(taleForm);
            const taleData = Object.fromEntries(formData.entries());
            
            // Placeholder for now
            alert('New Tale posted! (Check the console for the data)');
            console.log("New Tale:", taleData);

            addTaleModal.classList.add('hidden');
            taleForm.reset();
        });
    }
});
