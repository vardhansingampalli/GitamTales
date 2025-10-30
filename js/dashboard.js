document.addEventListener('DOMContentLoaded', async () => {
    // Check if Supabase client is available
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        document.body.innerHTML = '<p class="text-red-600 text-center p-8">Error: Supabase client not found. Please check configuration.</p>';
        return;
    }
    // Check if dateFns is available
    if (typeof dateFns === 'undefined') {
        console.error('date-fns library not found. Ensure it is loaded in the HTML.');
        // Provide a fallback or stop execution if date formatting is critical
    }


    // --- Auth Guard ---
    let user;
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
            window.location.href = 'login.html';
            return; // Stop script execution if redirecting
        }
        user = session.user; // Assign user only if session exists
    } catch (error) {
        console.error("Error during session check:", error);
        document.body.innerHTML = '<p class="text-red-600 text-center p-8">Error checking user session. Please try refreshing.</p>';
        return; // Stop script execution on error
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
    const sidebarProfileContent = document.getElementById('sidebar-profile-content'); // Container ID
    const sidebarSkillsContent = document.getElementById('sidebar-skills-content'); // Container ID

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
        const editorContainer = document.getElementById('description-editor');
        if(editorContainer) editorContainer.innerHTML = '<p class="text-red-500">Error loading text editor.</p>';
    }

    // --- Core Functions ---

    /**
     * Loads the user's profile information and updates the UI, replacing skeletons.
     */
    async function loadUserProfile() {
        if (!user) return; // Don't run if user isn't defined
        try {
            // temp vars to hold upload metadata so we can insert into the tale_images table after saving the tale
            let uploadedFileName = null;
            let uploadedPublicUrl = null;
            let uploadedFileSize = null;
            let uploadedMime = null;
            const { data: profile, error } = await supabaseClient.from('profiles').select('full_name, branch, bio, avatar_url').eq('id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error; // Allow "No row found"

            const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
            const avatarUrl = profile?.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;

            // Update Header (Target img/span directly, more robust)
            const headerAvatarImg = profileMenuButton?.querySelector('img');
            const headerNameSpan = profileMenuButton?.querySelector('span');
            // Remove skeleton placeholders before adding real elements
             document.getElementById('header-avatar-skeleton')?.remove();
             document.getElementById('header-name-skeleton')?.remove();
            if(headerAvatarImg) { // Update if img already exists (e.g., from previous load)
                 headerAvatarImg.src = avatarUrl.replace('100x100', '40x40');
            } else if (profileMenuButton) { // Insert img if it doesn't exist yet
                 profileMenuButton.insertAdjacentHTML('afterbegin', `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full border-2 border-gray-200">`);
            }
            if(headerNameSpan) { // Update if span exists
                headerNameSpan.textContent = displayName;
            } else if (profileMenuButton) { // Insert span if it doesn't exist
                 profileMenuButton.insertAdjacentHTML('beforeend', `<span class="hidden sm:inline font-semibold text-gray-700">${displayName}</span>`);
            }


            // Update Sidebar Profile Section using container ID
            if (sidebarProfileContent) {
                sidebarProfileContent.innerHTML = `
                    <img src="${avatarUrl}" alt="User Avatar" class="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-lg object-cover">
                    <h2 class="text-2xl font-bold text-gray-900 truncate">${displayName}</h2>
                    <p class="text-gray-500 text-sm">${profile?.branch || 'Branch not set'}</p>
                    <p class="text-sm text-gray-600 mt-3 px-2 break-words">${profile?.bio || 'No bio yet.'}</p>
                `;
            } else { console.error("Sidebar profile content container not found!"); }

            // Update "Create Tale" bar avatar
            const createBarAvatarContainer = addTaleButton?.previousElementSibling; // The div container/img
             if (createBarAvatarContainer && createBarAvatarContainer.id === 'create-bar-avatar-skeleton') {
                 // Replace skeleton div with the actual image
                 createBarAvatarContainer.outerHTML = `<img src="${avatarUrl.replace('100x100', '40x40')}" alt="User Avatar" class="w-10 h-10 rounded-full flex-shrink-0">`;
             } else { console.warn("Create bar avatar skeleton not found or already replaced."); }


             // Update "Create Tale" bar text
            if (addTaleButton) addTaleButton.textContent = `What's new on your journey, ${displayName}?`;

            // Update Skills Section (Placeholders) using container ID
            if (sidebarSkillsContent) {
                 sidebarSkillsContent.innerHTML = `
                    <h3 class="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Skills</h3>
                    <div class="flex flex-wrap gap-2">
                        <span class="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">Example Skill</span>
                        
                    </div>
                 `;
            } else { console.error("Sidebar skills content container not found!"); }

        } catch (error) {
            console.error('Error loading user profile:', error);
            // Provide fallback UI in case of error
            if (sidebarProfileContent) sidebarProfileContent.innerHTML = '<p class="text-red-500 text-center">Error loading profile.</p>';
        }
    }

    /**
     * Loads the user's tales, calculates likes, and renders them to the feed.
     */
    async function loadTales() {
        if (!timelineFeed || !user) return; // Exit if feed element or user doesn't exist

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
            // Clear feed and show error
            timelineFeed.querySelectorAll('.tale-card').forEach(card => card.remove()); // Clear potentially partial list
            timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-red-500 text-center tale-card">Error loading tales.</p>');
        }
    }

     /**
     * Creates the HTML string for a single tale card.
     * Includes Edit/Delete icons and Like button functionality.
     */
    function createTaleCard(tale) {
        if (!user) return ''; // Need user to determine ownership

        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        let postDate = 'a while ago'; // Fallback
        try {
             // Check if dateFns is loaded globally
             if (typeof dateFns !== 'undefined' && dateFns.formatDistanceToNow) {
                 postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true });
             } else {
                 postDate = new Date(tale.created_at).toLocaleDateString(); // Fallback date format
                 if (typeof dateFns === 'undefined') console.warn("date-fns library not found, using basic date format.");
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
    // Use try...catch for initial load in case of errors
    try {
        await Promise.all([loadUserProfile(), loadTales()]);
    } catch (error) {
        console.error("Error during initial page load:", error);
         // Show a generic error message if initial load fails
         if(timelineFeed) timelineFeed.innerHTML = '<p class="text-red-500 text-center">Failed to load dashboard content.</p>';
         else document.body.insertAdjacentHTML('beforeend', '<p class="text-red-500 text-center p-8">Failed to load dashboard content.</p>');
    }

    // --- Event Listeners ---

    profileMenuButton?.addEventListener('click', () => profileMenu?.classList.toggle('hidden'));
    document.addEventListener('click', (event) => {
        // Close profile menu if clicking outside of it or its button
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
        if (!addTaleModal || !taleForm || !quill || !submitTaleButton) {
             console.error("Modal elements not found for Add Tale button");
             return;
        }
        taleForm.reset();
        quill.setText(''); // Clear Quill editor
        const modalTitle = addTaleModal.querySelector('h3');
        if (modalTitle) modalTitle.textContent = 'Create a New Tale';
        submitTaleButton.textContent = 'Post Tale';
        submitTaleButton.disabled = false; // Ensure button is enabled
        const editIdInput = document.getElementById('edit-tale-id');
        if (editIdInput) editIdInput.value = ''; // Clear edit ID
        addTaleModal.classList.remove('hidden');
    });

    closeModalButton?.addEventListener('click', () => addTaleModal?.classList.add('hidden'));
    addTaleModal?.addEventListener('click', (event) => {
        // Close if clicking on the background overlay
        if (event.target === addTaleModal) addTaleModal.classList.add('hidden');
    });

    // Event Delegation for Edit, Delete, Like buttons
    timelineFeed?.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-button');
        const deleteButton = event.target.closest('.delete-button');
        const likeButton = event.target.closest('.like-button');

        // Handle Edit Click
        if (editButton) {
             const taleId = editButton.dataset.taleId;
             if (!taleId || !taleForm || !addTaleModal || !quill || !submitTaleButton) return;
             try {
                 const { data: tale, error } = await supabaseClient.from('tales').select('*').eq('id', taleId).single();
                 if (error || !tale) throw error || new Error("Tale not found");

                 taleForm.querySelector('#tale-category').value = tale.category || '';
                 taleForm.querySelector('#tale-title').value = tale.title || '';
                 const eventDateInput = taleForm.querySelector('#event-date');
                 const createdAtInput = taleForm.querySelector('#created-at-date');
                 // Format dates carefully, adjusting for timezone for datetime-local
                 if(eventDateInput && tale.event_date) try { const d = new Date(tale.event_date); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); eventDateInput.value = d.toISOString().slice(0,16); } catch(e){ eventDateInput.value = ''; console.warn("Could not parse event_date for edit:", tale.event_date); } else if(eventDateInput) eventDateInput.value = '';
                 if(createdAtInput && tale.created_at) try { const d = new Date(tale.created_at); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); createdAtInput.value = d.toISOString().slice(0,16); } catch(e){ createdAtInput.value = ''; console.warn("Could not parse created_at for edit:", tale.created_at);} else if(createdAtInput) createdAtInput.value = '';

                 quill.root.innerHTML = tale.description || '';
                 taleForm.querySelector('#tale-tags').value = tale.tags || '';
                 taleForm.querySelector('#edit-tale-id').value = tale.id;

                 addTaleModal.querySelector('h3').textContent = 'Edit Tale';
                 submitTaleButton.textContent = 'Save Changes';
                 submitTaleButton.disabled = false; // Ensure button is enabled
                 addTaleModal.classList.remove('hidden');
             } catch (error) {
                 console.error('Error fetching tale for edit:', error);
                 alert('Could not load tale for editing.');
             }
        }

        // Handle Delete Click
        if (deleteButton) {
            const taleId = deleteButton.dataset.taleId;
            if (!taleId) return;
            if (confirm('Are you sure you want to delete this tale? This action cannot be undone.')) {
                 try {
                     // Delete likes first
                     await supabaseClient.from('likes').delete().eq('tale_id', taleId);
                     // Then delete the tale
                     const { error } = await supabaseClient.from('tales').delete().eq('id', taleId);
                     if (error) throw error;
                     await loadTales(); // Reload tales on success
                 } catch (error) {
                     console.error('Error deleting tale:', error);
                     alert('Failed to delete tale.');
                 }
            }
        }

        // Handle Like Click
        if (likeButton) {
            const taleId = likeButton.dataset.taleId;
            const isLiked = likeButton.dataset.liked === 'true';
            const likeCountElement = likeButton.querySelector('.like-count');
            if (!taleId || !likeCountElement) return;
            let currentLikes = parseInt(likeCountElement.textContent || '0');

            // Prevent multiple clicks while processing
            if (likeButton.disabled) return;
            likeButton.disabled = true;

            // Optimistic UI update
            if (isLiked) {
                likeButton.dataset.liked = 'false';
                likeButton.classList.remove('text-red-500', 'fill-current');
                likeCountElement.textContent = Math.max(0, currentLikes - 1); // Prevent negative likes
                // Send unlike request to DB
                supabaseClient.from('likes').delete().match({ user_id: user.id, tale_id: taleId })
                    .then(({ error }) => { if (error) console.error("Error unliking:", error); })
                    .finally(() => { likeButton.disabled = false; }); // Re-enable button
            } else {
                likeButton.dataset.liked = 'true';
                likeButton.classList.add('text-red-500', 'fill-current');
                likeCountElement.textContent = currentLikes + 1;
                // Send like request to DB
                supabaseClient.from('likes').insert({ user_id: user.id, tale_id: taleId })
                   .then(({ error }) => { if (error) console.error("Error liking:", error); })
                   .finally(() => { likeButton.disabled = false; }); // Re-enable button
            }
        }
    });

    // --- Form Submission (Handles both Create and Update) ---
    taleForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!submitTaleButton || !quill) return;

        submitTaleButton.disabled = true;
        const formData = new FormData(taleForm);
        const taleData = Object.fromEntries(formData.entries());
        const editId = taleData.edit_tale_id;
        submitTaleButton.textContent = editId ? 'Saving...' : 'Posting...';

        taleData.description = quill.root.innerHTML;
        // Ensure dates are valid ISO strings or null, default created_at to now if blank
        try { taleData.event_date = taleData.event_date ? new Date(taleData.event_date).toISOString() : null; } catch(e){ taleData.event_date = null; console.warn("Invalid event date format");}
        try { taleData.created_at = taleData.created_at ? new Date(taleData.created_at).toISOString() : new Date().toISOString(); } catch(e){ taleData.created_at = new Date().toISOString(); console.warn("Invalid created_at date format, defaulting to now.");}


        try {
            const coverImageFile = formData.get('cover_image');
            // Only upload if a file is selected
            if (coverImageFile && coverImageFile.size > 0) {
                // --- Debug check: verify the storage bucket exists before attempting upload ---
                try {
                    const { data: _listData, error: _listError } = await supabaseClient.storage.from(STORAGE_BUCKET).list({ limit: 1 });
                    if (_listError) {
                        console.error('Storage bucket list check error:', _listError);
                        throw new Error('Bucket not found');
                    }
                } catch (bucketCheckErr) {
                    console.error('Bucket existence check failed:', bucketCheckErr);
                    // Re-enable button and surface a clearer message to the user
                    submitTaleButton.disabled = false;
                    submitTaleButton.textContent = editId ? 'Save Changes' : 'Post Tale';
                    alert(`Sorry, there was an error saving your tale: Bucket not found. Please create a storage bucket named "${STORAGE_BUCKET}" in your Supabase project or update the bucket name in the code.`);
                    return;
                }
                const fileExt = coverImageFile.name.split('.').pop()?.toLowerCase();
                if (!['png', 'jpg', 'jpeg', 'gif'].includes(fileExt)) throw new Error('Invalid file type. Only PNG, JPG, GIF allowed.');
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                // Use upsert:true for editing to overwrite existing image if needed
                const { error: uploadError } = await supabaseClient.storage.from(STORAGE_BUCKET).upload(fileName, coverImageFile, { upsert: true });
                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }
                const { data: urlData } = supabaseClient.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
                if (!urlData?.publicUrl) throw new Error("Could not get public URL for image.");
                // Append timestamp to URL to force browser refresh
                taleData.cover_image_url = `${urlData.publicUrl}?t=${new Date().getTime()}`;
                // store upload metadata for later insertion into the metadata table
                uploadedFileName = fileName;
                uploadedPublicUrl = urlData.publicUrl;
                uploadedFileSize = coverImageFile.size;
                uploadedMime = coverImageFile.type;
            } else if (editId && !coverImageFile?.size) {
                 // In edit mode, if no new file is chosen, *don't* modify the cover_image_url field
                 // Check if we need to explicitly set it to null or leave it out
                 const { data: currentTale } = await supabaseClient.from('tales').select('cover_image_url').eq('id', editId).single();
                 if (!currentTale?.cover_image_url) {
                    taleData.cover_image_url = null; // Ensure it's null if it was null before
                 } else {
                    delete taleData.cover_image_url; // Don't send the field if unchanged
                 }
            } else if (!editId && (!coverImageFile || coverImageFile.size === 0)) {
                 // Explicitly set to null if no image provided during creation
                 taleData.cover_image_url = null;
            }


            // Clean up temporary fields before saving
            delete taleData.cover_image; // Remove file object from data to be saved
            delete taleData.edit_tale_id; // Remove temporary edit ID field
            taleData.user_id = user.id; // Ensure user_id is always set

            // Perform Insert or Update. Capture returned row so we can link image metadata to the tale.
            let savedTale = null;
            if (editId) {
                const { data: updated, error } = await supabaseClient.from('tales').update(taleData).eq('id', editId).select().single();
                if (error) throw error;
                savedTale = updated;
            } else {
                const { data: inserted, error } = await supabaseClient.from('tales').insert([taleData]).select().single();
                if (error) throw error;
                savedTale = inserted;
            }

            // If we uploaded a file, insert a metadata row into the `tale_images` table
            if (uploadedFileName && savedTale?.id) {
                try {
                    const meta = {
                        user_id: user.id,
                        tale_id: savedTale.id,
                        file_name: uploadedFileName,
                        file_path: uploadedFileName,
                        public_url: uploadedPublicUrl,
                        size_bytes: uploadedFileSize,
                        mime_type: uploadedMime,
                        is_public: true
                    };
                    const { error: metaError } = await supabaseClient.from('tale_images').insert([meta]);
                    if (metaError) console.warn('Could not insert tale_images metadata:', metaError);
                } catch (metaErr) {
                    console.error('Error inserting tale_images metadata:', metaErr);
                }
            }

            addTaleModal?.classList.add('hidden');
            await loadTales(); // Refresh feed on success

        } catch (error) {
            console.error('Error saving tale:', error);
            alert(`Sorry, there was an error saving your tale: ${error.message || 'Unknown error'}`);
        } finally {
            // Reset form and modal state regardless of success/error
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