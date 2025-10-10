document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Auth Guard ---
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
    const talesCountElement = document.getElementById('tales-count');
    
    // --- Skeleton Elements ---
    const headerAvatarSkeleton = document.getElementById('header-avatar-skeleton');
    const headerNameSkeleton = document.getElementById('header-name-skeleton');
    const sidebarAvatarSkeleton = document.getElementById('sidebar-avatar-skeleton');
    const sidebarNameSkeleton = document.getElementById('sidebar-name-skeleton');
    const sidebarBranchSkeleton = document.getElementById('sidebar-branch-skeleton');
    const sidebarBioSkeleton = document.getElementById('sidebar-bio-skeleton');
    const createBarAvatarSkeleton = document.getElementById('create-bar-avatar-skeleton');


    async function loadUserProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name, branch, bio, avatar_url')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return;
        }

        const displayName = profile?.full_name || user.email.split('@')[0];
        const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;
        
        // Replace Header Skeletons
        headerAvatarSkeleton.outerHTML = `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full border-2 border-gray-200">`;
        headerNameSkeleton.outerHTML = `<span class="hidden sm:inline font-semibold text-gray-700">${displayName}</span>`;

        // Replace Sidebar Skeletons
        sidebarAvatarSkeleton.outerHTML = `<img src="${avatarUrl}" alt="User Avatar" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg">`;
        sidebarNameSkeleton.outerHTML = `<h2 class="text-2xl font-bold text-gray-900">${displayName}</h2>`;
        sidebarBranchSkeleton.outerHTML = `<p class="text-gray-500 text-sm">${profile?.branch || 'Branch not set'}</p>`;
        sidebarBioSkeleton.outerHTML = `<p class="text-sm text-gray-600 mt-3 px-2">${profile?.bio || 'No bio yet.'}</p>`;
        
        // Update "Create Tale" bar
        createBarAvatarSkeleton.outerHTML = `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full">`;
        addTaleButton.textContent = `What's new on your journey, ${displayName}?`;
    }

    async function loadTales() {
        const { data: tales, error } = await supabaseClient
            .from('tales')
            .select(`*, profiles ( full_name, avatar_url )`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tales:', error);
            return;
        }

        talesCountElement.textContent = tales.length;

        const existingCards = timelineFeed.querySelectorAll('.tale-card');
        existingCards.forEach(card => card.remove());

        if (tales.length === 0) {
            timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-center text-gray-500 tale-card">No tales yet. Be the first to post!</p>');
        } else {
            for (const tale of tales) {
                const taleCard = createTaleCard(tale);
                timelineFeed.insertAdjacentHTML('beforeend', taleCard);
            }
        }
    }

    function createTaleCard(tale) {
        // This function remains the same as before
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`: `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        const postDate = new Date(tale.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden tale-card">
                ... // The rest of your tale card HTML is the same
            </div>
        `;
    }

    // --- The rest of your dashboard.js file (event listeners for logout, modal, form submission) remains exactly the same. ---
    // Make sure to copy it over from your last working version.
    
    // For completeness, here is the rest of the file:
    await Promise.all([loadUserProfile(), loadTales()]);
    
    // Event listeners... (copied from previous full version)
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');
    const submitTaleButton = document.getElementById('submit-tale-button');

    profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
    document.addEventListener('click', (event) => { if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) { profileMenu.classList.add('hidden'); } });
    logoutButton.addEventListener('click', async (e) => { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = 'index.html'; });
    addTaleButton.addEventListener('click', () => addTaleModal.classList.remove('hidden'));
    closeModalButton.addEventListener('click', () => addTaleModal.classList.add('hidden'));
    addTaleModal.addEventListener('click', (event) => { if (event.target === addTaleModal) { addTaleModal.classList.add('hidden'); } });
    taleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitTaleButton.disabled = true;
        submitTaleButton.textContent = 'Posting...';
        const formData = new FormData(taleForm);
        const taleData = Object.fromEntries(formData.entries());
        taleData.user_id = user.id;
        const { error } = await supabaseClient.from('tales').insert([taleData]);
        if (error) {
            console.error('Error posting tale:', error);
            alert('Sorry, there was an error posting your tale.');
        } else {
            addTaleModal.classList.add('hidden');
            taleForm.reset();
            await loadTales();
        }
        submitTaleButton.disabled = false;
        submitTaleButton.textContent = 'Post Tale';
    });
});
