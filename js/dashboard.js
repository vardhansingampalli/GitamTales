document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Auth Guard: Protect the page ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const user = session.user;

    // --- Get Page Elements ---
    const timelineFeed = document.getElementById('timeline-feed');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    const logoutButton = document.getElementById('logout-button');
    const addTaleButton = document.getElementById('add-tale-button');
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');
    
    // --- Main Functions ---

    /**
     * Fetches the current user's profile and updates the UI.
     */
    async function loadUserProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name, branch, bio, avatar_url')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is okay
            console.error('Error fetching profile:', error);
            return;
        }

        const displayName = profile?.full_name || user.email.split('@')[0];
        const avatarUrl = profile?.avatar_url || `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;
        
        // Update header
        profileMenuButton.querySelector('span').textContent = displayName;
        profileMenuButton.querySelector('img').src = avatarUrl.replace('100x100', '40x40');
        
        // Update sidebar
        const sidebar = document.querySelector('aside');
        sidebar.querySelector('h2').textContent = displayName;
        sidebar.querySelector('.text-gray-500').textContent = profile?.branch || 'Branch not set';
        sidebar.querySelector('.text-sm.text-gray-600').textContent = profile?.bio || 'No bio yet.';
        sidebar.querySelector('img').src = avatarUrl;

        // Update "Create Tale" box
        addTaleButton.textContent = `What's new on your journey, ${displayName}?`;
        addTaleButton.previousElementSibling.src = avatarUrl.replace('100x100', '40x40');
    }

    /**
     * Fetches all tales from the database and renders them to the feed.
     */
    async function loadTales() {
        const { data: tales, error } = await supabaseClient
            .from('tales')
            .select(`*, profiles ( full_name, avatar_url )`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tales:', error);
            return;
        }

        // Clear existing feed before rendering new tales
        timelineFeed.querySelectorAll('.tale-card').forEach(card => card.remove());

        if (tales.length === 0) {
            timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-center text-gray-500 tale-card">No tales yet. Be the first to post!</p>');
        } else {
            for (const tale of tales) {
                const taleCard = createTaleCard(tale);
                timelineFeed.insertAdjacentHTML('beforeend', taleCard);
            }
        }
    }

    /**
     * Creates the HTML for a single tale card.
     */
    function createTaleCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url || `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        const postDate = new Date(tale.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden tale-card">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <img src="${authorAvatar}" alt="User Avatar" class="w-10 h-10 rounded-full mr-3">
                        <div>
                            <h4 class="font-bold text-gray-900">${authorName}</h4>
                            <p class="text-sm text-gray-500">Posted in <a href="#" class="font-semibold text-[#007367] hover:underline">${tale.category}</a> &middot; ${postDate}</p>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-800">${tale.title}</h3>
                    <p class="text-gray-700 mb-4">${tale.description}</p>
                </div>
                ${tale.image_url ? `<img src="${tale.image_url}" alt="Tale Image" class="w-full h-auto">` : ''}
                <div class="p-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex gap-4">
                        
                        <button class="text-gray-600 hover:text-red-500 flex items-center gap-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> ${tale.like_count || 0}</button>
                        <button class="text-gray-600 hover:text-blue-500 flex items-center gap-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> ${tale.comment_count || 0}</button>

                    </div>
                    <button class="text-gray-500 hover:text-gray-800"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342A2 2 0 0110 12h4a2 2 0 110 4h-4a2 2 0 01-1.316-.658L6 14zM18 12a6 6 0 10-12 0 6 6 0 0012 0z"></path></svg></button>
                </div>
            </div>
        `;
    }

    // --- Load initial data and set up event listeners ---
    
    // Load profile and tales at the same time for faster page load
    await Promise.all([loadUserProfile(), loadTales()]);

    // Handle profile dropdown menu
    profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
    document.addEventListener('click', (event) => {
        if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.add('hidden');
        }
    });
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // Handle "Add New Tale" modal
    addTaleButton.addEventListener('click', () => addTaleModal.classList.remove('hidden'));
    closeModalButton.addEventListener('click', () => addTaleModal.classList.add('hidden'));
    addTaleModal.addEventListener('click', (event) => {
        if (event.target === addTaleModal) {
            addTaleModal.classList.add('hidden');
        }
    });
    
    // Handle the form submission for creating a new tale
    taleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const formButton = document.getElementById('submit-tale-button');
        formButton.disabled = true;
        formButton.textContent = 'Posting...';

        const formData = new FormData(taleForm);
        const taleData = Object.fromEntries(formData.entries());
        
        // Add the user ID to the data
        taleData.user_id = user.id;

        // FIX 1: The line that converted tags to an array was removed.
        // The database expects a simple text string, which formData provides by default.
        
        // Insert the new tale into the database
        const { error } = await supabaseClient
            .from('tales')
            .insert([taleData]);

        if (error) {
            console.error('Error posting tale:', error);
            alert('Sorry, there was an error posting your tale.');
        } else {
            // SUCCESS!
            addTaleModal.classList.add('hidden'); // Close the modal
            taleForm.reset(); // Reset the form fields
            await loadTales(); // Refresh the entire feed to show the new post
        }
        
        formButton.disabled = false;
        formButton.textContent = 'Post Tale';
    });
});