document.addEventListener('DOMContentLoaded', async () => {
    // Check if Supabase client is available
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        document.body.innerHTML = '<p class="text-red-600 text-center p-8">Error: Supabase client not found. Please check configuration.</p>';
        return;
    }

    // --- Auth Guard ---
    let user;
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        user = session.user;
    } catch (error) {
        console.error("Error during session check:", error);
        document.body.innerHTML = '<p class="text-red-600 text-center p-8">Error checking user session. Please try refreshing.</p>';
        return;
    }


    // --- Get Page Elements (with safety checks) ---
    const timelineFeed = document.getElementById('timeline-feed');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    const logoutButton = document.getElementById('logout-button');
    const addTaleButton = document.getElementById('add-tale-button');
    const talesCountElement = document.getElementById('tales-count');
    const likesCountElement = document.getElementById('likes-count');
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');
    const submitTaleButton = document.getElementById('submit-tale-button');
    const sidebarProfileContent = document.getElementById('sidebar-profile-content');
    const sidebarSkillsContent = document.getElementById('sidebar-skills-content');

    // --- Initialize Quill Rich Text Editor (with safety check) ---
    let quill;
    try {
        const editorElement = document.getElementById('description-editor');
        if (editorElement) {
            quill = new Quill(editorElement, {
                theme: 'snow',
                modules: { toolbar: [[{ 'header': [1, 2, false] }], ['bold', 'italic', 'underline'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link']] },
                placeholder: 'Share the details of your experience...'
            });
        } else {
            console.error("Quill editor container #description-editor not found.");
        }
    } catch (e) {
        console.error("Failed to initialize Quill:", e);
    }

    // --- Core Functions ---

    /**
     * Loads the user's profile information and updates the UI, replacing skeletons.
     */
    async function loadUserProfile() {
        try {
            const { data: profile, error } = await supabaseClient.from('profiles').select('full_name, branch, bio, avatar_url').eq('id', user.id).single();
            // Allow "No row found" errors, but log others
            if (error && error.code !== 'PGRST116') throw error;

            const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
            const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;

            // Update Header
            const headerAvatar = profileMenuButton?.querySelector('img');
            const headerName = profileMenuButton?.querySelector('span');
            if (headerAvatar) headerAvatar.src = avatarUrl.replace('100x100', '40x40');
            if (headerName) headerName.textContent = displayName;

            // Update Sidebar Profile Section
            if (sidebarProfileContent) {
                sidebarProfileContent.innerHTML = `
                    <img src="${avatarUrl}" alt="User Avatar" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover">
                    <h2 class="text-2xl font-bold text-gray-900 truncate">${displayName}</h2>
                    <p class="text-gray-500 text-sm">${profile?.branch || 'Branch not set'}</p>
                    <p class="text-sm text-gray-600 mt-3 px-2 break-words">${profile?.bio || 'No bio yet.'}</p>
                `;
            }

            // Update "Create Tale" bar
            const createBarAvatar = addTaleButton?.previousElementSibling;
            if (createBarAvatar && createBarAvatar.tagName === 'IMG') createBarAvatar.src = avatarUrl.replace('100x100', '40x40');
            if (addTaleButton) addTaleButton.textContent = `What's new on your journey, ${displayName}?`;

            // Update Skills Section (Placeholders)
            if (sidebarSkillsContent) {
                 sidebarSkillsContent.innerHTML = `
                    <h3 class="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Skills</h3>
                    <div class="flex flex-wrap gap-2">
                        <span class="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">Example Skill</span>
                        {/* Fetch real skills later */}
                    </div>
                 `;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Optionally display error in UI
        }
    }

    /**
     * Loads the user's tales, calculates likes, and renders them to the feed.
     */
    async function loadTales() {
        if (!timelineFeed) return; // Exit if feed element doesn't exist

        try {
            const { data: tales, error: talesError } = await supabaseClient.from('tales').select(`*, profiles ( full_name, avatar_url )`).eq('user_id', user.id).order('created_at', { ascending: false });
            if (talesError) throw talesError;

            const taleIds = tales.map(t => t.id);
            let likes = [];
            let totalLikesReceived = 0;

            if (taleIds.length > 0) {
                const { data: likesData, error: likesError } = await supabaseClient.from('likes').select('tale_id, user_id').in('tale_id', taleIds);
                if (likesError) console.error('Error fetching likes:', likesError); // Log but continue
                else likes = likesData || [];
            }

            if(talesCountElement) talesCountElement.textContent = tales.length;
            // Clear only tale cards, preserve the "Add Tale" bar if it's inside timelineFeed
            timelineFeed.querySelectorAll('.tale-card').forEach(card => card.remove());

            if (tales.length === 0) {
                // Check if the empty message already exists to prevent duplicates
                if (!timelineFeed.querySelector('.empty-tales-message')) {
                     timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-center text-gray-500 tale-card empty-tales-message">You haven\'t posted any tales yet.</p>');
                }
            } else {
                 // Remove empty message if it exists
                 const emptyMsg = timelineFeed.querySelector('.empty-tales-message');
                 if (emptyMsg) emptyMsg.remove();

                for (const tale of tales) {
                    const taleLikes = likes.filter(l => l.tale_id === tale.id);
                    tale.like_count = taleLikes.length;
                    totalLikesReceived += tale.like_count;
                    tale.user_has_liked = taleLikes.some(l => l.user_id === user.id);
                    timelineFeed.insertAdjacentHTML('beforeend', createTaleCard(tale));
                }
            }
            if(likesCountElement) likesCountElement.textContent = totalLikesReceived;

        } catch (error) {
            console.error('Error loading tales:', error);
            timelineFeed.innerHTML = '<p class="text-red-500 text-center">Error loading tales.</p>';
        }
    }

     /**
     * Creates the HTML string for a single tale card.
     * Includes Edit/Delete icons and Like button functionality.
     */
    function createTaleCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        let postDate = 'a while ago'; // Fallback
        try {
             if (dateFns) { // Check if dateFns is loaded
                 postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true });
             } else {
                 postDate = new Date(tale.created_at).toLocaleDateString(); // Fallback date format
             }
        } catch(e){ console.warn("Could not format date:", tale.created_at, e); }

        const isOwner = tale.user_id === user.id;
        const ownerControls = isOwner ? `
            <div class="flex items-center space-x-2">
                <button data-tale-id="${tale.id}" class="edit-button text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors" title="Edit Tale">
                    <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
                <button data-tale-id="${tale.id}" class="delete-button text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors" title="Delete Tale">
                    <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        ` : '';
        const coverImageHTML = tale.cover_image_url ? `<img src="${tale.cover_image_url}" alt="Cover for ${tale.title}" class="w-full h-auto max-h-96 object-cover border-y border-gray-100 my-4">` : '';
        const likeButtonClass = tale.user_has_liked ? 'text-red-500 fill-current' : 'text-gray-600';
        const likeButtonHTML = `<button data-tale-id="${tale.id}" data-liked="${tale.user_has_liked}" class="like-button ${likeButtonClass} hover:text-red-500 flex items-center gap-1 transition-colors"><svg class="w-5 h-5 pointer-events-none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> <span class="like-count text-sm">${tale.like_count || 0}</span></button>`;
        const commentButtonHTML = `<button class="text-gray-600 hover:text-blue-500 flex items-center gap-1 transition-colors"><svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> <span class="text-sm">0</span></button>`; // Using 0 for comments

        return `<div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden tale-card" id="tale-${tale.id}"><div class="p-6"><div class="flex justify-between items-start mb-4"><div class="flex items-center flex-grow min-w-0 mr-4"><img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 flex-shrink-0"> <div class="min-w-0"><h4 class="font-bold text-gray-900 truncate">${authorName}</h4><p class="text-sm text-gray-500 truncate">Posted in <a href="#" class="font-semibold text-[#007367] hover:underline">${tale.category}</a> &middot; ${postDate}</p></div></div><div class="flex-shrink-0">${ownerControls}</div></div><h3 class="text-xl font-semibold mb-2 text-gray-800">${tale.title}</h3><div class="prose prose-sm max-w-none text-gray-700 break-words">${tale.description || ''}</div></div>${coverImageHTML}<div class="p-4 flex justify-between items-center border-t border-gray-100"><div class="flex gap-4">${likeButtonHTML}${commentButtonHTML}</div></div></div>`;
    }

    // --- Initial Load ---
    try {
        await Promise.all([loadUserProfile(), loadTales()]);
    } catch (error) {
        console.error("Error during initial page load:", error);
    }

    // --- Event Listeners ---

    profileMenuButton?.addEventListener('click', () => profileMenu?.classList.toggle('hidden'));
    document.addEventListener('click', (event) => {
        if (profileMenu && !profileMenu.classList.contains('hidden') && profileMenuButton && !profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
             profileMenu.classList.add('hidden');
        }
    });
    logoutButton?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient.auth.signOut();
        if (error) console.error("Logout error:", error);
        window.location.href = 'index.html';
    });

    addTaleButton?.addEventListener('click', () => {
        if (!addTaleModal || !taleForm || !quill || !submitTaleButton) return;
        taleForm.reset();
        quill.setText('');
        const modalTitle = addTaleModal.querySelector('h3');
        if (modalTitle) modalTitle.textContent = 'Create a New Tale';
        submitTaleButton.textContent = 'Post Tale';
        const editIdInput = document.getElementById('edit-tale-id');
        if (editIdInput) editIdInput.value = '';
        addTaleModal.classList.remove('hidden');
    });

    closeModalButton?.addEventListener('click', () => addTaleModal?.classList.add('hidden'));
    addTaleModal?.addEventListener('click', (event) => {
        if (event.target === addTaleModal) addTaleModal.classList.add('hidden');
    });

    timelineFeed?.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-button');
        const deleteButton = event.target.closest('.delete-button');
        const likeButton = event.target.closest('.like-button');

        if (editButton) {
             const taleId = editButton.dataset.taleId;
             if (!taleId) return;
             try {
                 const { data: tale, error } = await supabaseClient.from('tales').select('*').eq('id', taleId).single();
                 if (error || !tale) throw error || new Error("Tale not found");
                 
                 if(taleForm) {
                     taleForm.querySelector('#tale-category').value = tale.category || '';
                     taleForm.querySelector('#tale-title').value = tale.title || '';
                     const eventDateInput = taleForm.querySelector('#event-date');
                     if(eventDateInput && tale.event_date) try { eventDateInput.value = new Date(tale.event_date).toISOString().slice(0, 16); } catch(e){} else if(eventDateInput) eventDateInput.value = '';
                     const createdAtInput = taleForm.querySelector('#created-at-date');
                     if(createdAtInput && tale.created_at) try { createdAtInput.value = new Date(tale.created_at).toISOString().slice(0, 16); } catch(e){} else if(createdAtInput) createdAtInput.value = '';
                     quill?.root.innerHTML = tale.description || '';
                     taleForm.querySelector('#tale-tags').value = tale.tags || '';
                     taleForm.querySelector('#edit-tale-id').value = tale.id;
                 }
                 
                 addTaleModal.querySelector('h3').textContent = 'Edit Tale';
                 submitTaleButton.textContent = 'Save Changes';
                 addTaleModal.classList.remove('hidden');
             } catch (error) {
                 console.error('Error fetching tale for edit:', error);
                 alert('Could not load tale for editing.');
             }
        }

        if (deleteButton) {
            const taleId = deleteButton.dataset.taleId;
            if (!taleId) return;
            if (confirm('Are you sure you want to delete this tale? This action cannot be undone.')) {
                 try {
                     await supabaseClient.from('likes').delete().eq('tale_id', taleId);
                     const { error } = await supabaseClient.from('tales').delete().eq('id', taleId);
                     if (error) throw error;
                     await loadTales();
                 } catch (error) {
                     console.error('Error deleting tale:', error);
                     alert('Failed to delete tale.');
                 }
            }
        }

        if (likeButton) {
            const taleId = likeButton.dataset.taleId;
            const isLiked = likeButton.dataset.liked === 'true';
            const likeCountElement = likeButton.querySelector('.like-count');
            if (!taleId || !likeCountElement) return;
            let currentLikes = parseInt(likeCountElement.textContent || '0');

            if (isLiked) {
                likeButton.dataset.liked = 'false';
                likeButton.classList.remove('text-red-500', 'fill-current');
                likeCountElement.textContent = Math.max(0, currentLikes - 1);
                supabaseClient.from('likes').delete().match({ user_id: user.id, tale_id: taleId }).then(({ error }) => { if (error) console.error("Error unliking:", error); });
            } else {
                likeButton.dataset.liked = 'true';
                likeButton.classList.add('text-red-500', 'fill-current');
                likeCountElement.textContent = currentLikes + 1;
                supabaseClient.from('likes').insert({ user_id: user.id, tale_id: taleId }).then(({ error }) => { if (error) console.error("Error liking:", error); });
            }
        }
    });

    taleForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!submitTaleButton || !quill) return;

        submitTaleButton.disabled = true;
        const formData = new FormData(taleForm);
        const taleData = Object.fromEntries(formData.entries());
        const editId = taleData.edit_tale_id;
        submitTaleButton.textContent = editId ? 'Saving...' : 'Posting...';
        
        taleData.description = quill.root.innerHTML;
        // Ensure dates are valid ISO strings or null
        try { taleData.event_date = taleData.event_date ? new Date(taleData.event_date).toISOString() : null; } catch(e){ taleData.event_date = null; }
        try { taleData.created_at = taleData.created_at ? new Date(taleData.created_at).toISOString() : new Date().toISOString(); } catch(e){ taleData.created_at = new Date().toISOString(); }


        try {
            const coverImageFile = formData.get('cover_image');
            if (coverImageFile && coverImageFile.size > 0) {
                const fileExt = coverImageFile.name.split('.').pop()?.toLowerCase();
                if (!['png', 'jpg', 'jpeg', 'gif'].includes(fileExt)) throw new Error('Invalid file type.');
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('tale-images').upload(fileName, coverImageFile, { upsert: true });
                if (uploadError) throw uploadError;
                const { data: urlData } = supabaseClient.storage.from('tale-images').getPublicUrl(fileName);
                if (!urlData) throw new Error("Could not get public URL for image.");
                taleData.cover_image_url = `${urlData.publicUrl}?t=${new Date().getTime()}`;
            } else if (editId && !coverImageFile?.size) {
                 delete taleData.cover_image_url;
            }

            delete taleData.cover_image;
            delete taleData.edit_tale_id;
            taleData.user_id = user.id;

            const { error } = editId ? await supabaseClient.from('tales').update(taleData).eq('id', editId) : await supabaseClient.from('tales').insert([taleData]);
            if (error) throw error;

            addTaleModal?.classList.add('hidden');
            await loadTales();

        } catch (error) {
            console.error('Error saving tale:', error);
            alert(`Sorry, there was an error saving your tale: ${error.message || 'Unknown error'}`);
        } finally {
            submitTaleButton.disabled = false;
            taleForm?.reset();
            quill?.setText('');
            const modalTitle = addTaleModal?.querySelector('h3');
            if (modalTitle) modalTitle.textContent = 'Create a New Tale';
            if (submitTaleButton) submitTaleButton.textContent = 'Post Tale';
            const editIdInput = document.getElementById('edit-tale-id');
            if (editIdInput) editIdInput.value = '';
        }
    });
});

