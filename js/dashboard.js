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
        // ... (This function remains the same)
        const { data: profile, error } = await supabaseClient.from('profiles').select('full_name, branch, bio, avatar_url').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') { console.error('Error fetching profile:', error); return; }
        const displayName = profile?.full_name || user.email.split('@')[0];
        const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;
        if(headerAvatarSkeleton) headerAvatarSkeleton.outerHTML = `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full border-2 border-gray-200">`;
        if(headerNameSkeleton) headerNameSkeleton.outerHTML = `<span class="hidden sm:inline font-semibold text-gray-700">${displayName}</span>`;
        if(sidebarAvatarSkeleton) sidebarAvatarSkeleton.outerHTML = `<img src="${avatarUrl}" alt="User Avatar" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg">`;
        if(sidebarNameSkeleton) sidebarNameSkeleton.outerHTML = `<h2 class="text-2xl font-bold text-gray-900">${displayName}</h2>`;
        if(sidebarBranchSkeleton) sidebarBranchSkeleton.outerHTML = `<p class="text-gray-500 text-sm">${profile?.branch || 'Branch not set'}</p>`;
        if(sidebarBioSkeleton) sidebarBioSkeleton.outerHTML = `<p class="text-sm text-gray-600 mt-3 px-2">${profile?.bio || 'No bio yet.'}</p>`;
        if(createBarAvatarSkeleton) createBarAvatarSkeleton.outerHTML = `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full">`;
        addTaleButton.textContent = `What's new on your journey, ${displayName}?`;
    }

    async function loadTales() {
        // ... (This function remains the same)
        const { data: tales, error } = await supabaseClient.from('tales').select(`*, profiles ( full_name, avatar_url )`).eq('user_id', user.id).order('created_at', { ascending: false });
        if (error) { console.error('Error fetching tales:', error); return; }
        talesCountElement.textContent = tales.length;
        timelineFeed.querySelectorAll('.tale-card').forEach(card => card.remove());
        if (tales.length === 0) {
            timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-center text-gray-500 tale-card">You haven\'t posted any tales yet. Click the bar above to share your first journey!</p>');
        } else {
            for (const tale of tales) {
                const taleCard = createTaleCard(tale);
                timelineFeed.insertAdjacentHTML('beforeend', taleCard);
            }
        }
    }

    function createTaleCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`: `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        const postDate = new Date(tale.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const isOwner = tale.user_id === user.id;

        // === OWNER CONTROLS UPDATED TO SHOW ICONS ===
        const ownerControls = `
            <div class="flex items-center space-x-2">
                <button data-tale-id="${tale.id}" class="edit-button text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button data-tale-id="${tale.id}" class="delete-button text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        `;
        // === END OF UPDATED CONTROLS ===

        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden tale-card" id="tale-${tale.id}">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center">
                            <img src="${authorAvatar}" alt="User Avatar" class="w-10 h-10 rounded-full mr-3">
                            <div>
                                <h4 class="font-bold text-gray-900">${authorName}</h4>
                                <p class="text-sm text-gray-500">Posted in <a href="#" class="font-semibold text-[#007367] hover:underline">${tale.category}</a> &middot; ${postDate}</p>
                            </div>
                        </div>
                        ${isOwner ? ownerControls : ''}
                    </div>
                    <h3 class="text-xl font-semibold mb-2 text-gray-800">${tale.title}</h3>
                    <p class="text-gray-700 mb-4">${tale.description}</p>
                </div>
                <div class="p-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex gap-4">
                        <button class="text-gray-600 hover:text-red-500 flex items-center gap-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> ${tale.like_count || 0}</button>
                        <button class="text-gray-600 hover:text-blue-500 flex items-center gap-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> ${tale.comment_count || 0}</button>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Initial Load & Event Listeners ---
    await Promise.all([loadUserProfile(), loadTales()]);
    
    // Event listener setup
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');
    const submitTaleButton = document.getElementById('submit-tale-button');

    profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
    document.addEventListener('click', (event) => { if (profileMenu && !profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) { profileMenu.classList.add('hidden'); } });
    logoutButton.addEventListener('click', async (e) => { e.preventDefault(); await supabaseClient.auth.signOut(); window.location.href = 'index.html'; });
    addTaleButton.addEventListener('click', () => addTaleModal.classList.remove('hidden'));
    closeModalButton.addEventListener('click', () => addTaleModal.classList.add('hidden'));
    addTaleModal.addEventListener('click', (event) => { if (event.target === addTaleModal) { addTaleModal.classList.add('hidden'); } });
    
    // === EVENT LISTENER UPDATED FOR EDIT & DELETE ICONS ===
    timelineFeed.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-button');
        const deleteButton = event.target.closest('.delete-button');

        // Handle edit button click
        if (editButton) {
            const taleId = editButton.dataset.taleId;
            console.log('Edit button clicked for tale ID:', taleId);
            alert('Edit functionality will be built next!');
            // We will add the logic to open a modal and edit the tale here.
        }

        // Handle delete button click
        if (deleteButton) {
            const taleId = deleteButton.dataset.taleId;
            const isConfirmed = confirm('Are you sure you want to delete this tale? This action cannot be undone.');

            if (isConfirmed) {
                const { error } = await supabaseClient.from('tales').delete().eq('id', taleId);
                if (error) {
                    console.error('Error deleting tale:', error);
                    alert('There was an error deleting your tale.');
                } else {
                    const taleCard = document.getElementById(`tale-${taleId}`);
                    if (taleCard) taleCard.remove();
                    await loadTales(); // Refresh the feed and count
                }
            }
        }
    });
    
    taleForm.addEventListener('submit', async (event) => {
        // ... (This function remains the same)
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