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
         // ... (This function remains unchanged from the previous correct version) ...
         try {
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
            if (sidebarProfileContent) sidebarProfileContent.innerHTML = '<p class="text-red-500 text-center">Error loading profile.</p>';
        }
    }

    /**
     * Loads the user's tales, likes, and comments, then renders them.
     */
    async function loadTales() {
        if (!timelineFeed || !user) return;

        try {
            // Fetch Tales
            const { data: tales, error: talesError } = await supabaseClient.from('tales').select(`*, profiles ( full_name, avatar_url )`).eq('user_id', user.id).order('created_at', { ascending: false });
            if (talesError) throw talesError;

            const taleIds = tales.map(t => t.id);
            let likes = [];
            let comments = [];
            let totalLikesReceived = 0;

            // Fetch Likes and Comments in parallel if tales exist
            if (taleIds.length > 0) {
                const [likesResult, commentsResult] = await Promise.all([
                    supabaseClient.from('likes').select('tale_id, user_id').in('tale_id', taleIds),
                    // Fetch comments WITH the commenter's profile info
                    supabaseClient.from('comments').select(`*, profiles ( full_name, avatar_url )`).in('tale_id', taleIds).order('created_at', { ascending: true }) // Show oldest comments first
                ]);

                if (likesResult.error) console.error('Error fetching likes:', likesResult.error);
                else likes = likesResult.data || [];

                if (commentsResult.error) console.error('Error fetching comments:', commentsResult.error);
                else comments = commentsResult.data || [];
            }

            // Update Sidebar Counts
            if(talesCountElement) talesCountElement.textContent = tales.length;

            // Clear Feed
            timelineFeed.querySelectorAll('.tale-card').forEach(card => card.remove());

            // Render Feed
            if (tales.length === 0) {
                if (!timelineFeed.querySelector('.empty-tales-message')) {
                     timelineFeed.insertAdjacentHTML('beforeend', '<p class="text-center text-gray-500 tale-card empty-tales-message">You haven\'t posted any tales yet.</p>');
                }
            } else {
                 const emptyMsg = timelineFeed.querySelector('.empty-tales-message');
                 if (emptyMsg) emptyMsg.remove();

                for (const tale of tales) {
                    // Attach relevant likes and comments to each tale object
                    const taleLikes = likes.filter(l => l.tale_id === tale.id);
                    const taleComments = comments.filter(c => c.tale_id === tale.id);

                    tale.like_count = taleLikes.length;
                    totalLikesReceived += tale.like_count;
                    tale.user_has_liked = taleLikes.some(l => l.user_id === user.id);
                    tale.comments = taleComments; // Add comments array to the tale object
                    tale.comment_count = taleComments.length; // Add comment count

                    timelineFeed.insertAdjacentHTML('beforeend', createTaleCard(tale));
                }
            }
            if(likesCountElement) likesCountElement.textContent = totalLikesReceived;

        } catch (error) {
            console.error('Error loading tales:', error);
            timelineFeed.innerHTML = '<p class="text-red-500 text-center tale-card">Error loading tales.</p>';
        }
    }

     /**
     * Creates the HTML string for a single tale card, including comments.
     */
    function createTaleCard(tale) {
        if (!user) return '';

        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        let postDate = 'a while ago';
        try {
             if (typeof dateFns !== 'undefined') { postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true }); }
             else { postDate = new Date(tale.created_at).toLocaleDateString(); }
        } catch(e){}

        const isOwner = tale.user_id === user.id;
        const ownerControls = isOwner ? `...` : ''; // Same as before
        const coverImageHTML = tale.cover_image_url ? `...` : ''; // Same as before
        const likeButtonClass = tale.user_has_liked ? 'text-red-500 fill-current' : 'text-gray-600';
        const likeButtonHTML = `<button ...> <span class="like-count text-sm">${tale.like_count || 0}</span></button>`; // Same as before

        // --- NEW: Comment Button with Count ---
        const commentButtonHTML = `<button class="text-gray-600 hover:text-blue-500 flex items-center gap-1 transition-colors"><svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> <span class="comment-count text-sm">${tale.comment_count || 0}</span></button>`;

        // --- NEW: Generate HTML for each comment ---
        let commentsHTML = '';
        if (tale.comments && tale.comments.length > 0) {
            commentsHTML = tale.comments.map(comment => {
                 const commenterName = comment.profiles?.full_name || 'User';
                 const commenterAvatar = comment.profiles?.avatar_url ? `${comment.profiles.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/32x32/e0e7ff/3730a3?text=${commenterName.charAt(0).toUpperCase()}`;
                 let commentDate = 'earlier';
                 try { if (typeof dateFns !== 'undefined') { commentDate = dateFns.formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }); } } catch(e){}
                 const canDelete = comment.user_id === user.id; // Check if current user owns the comment

                 return `
                    <div class="comment-item flex items-start space-x-3 py-3" id="comment-${comment.id}">
                        <img src="${commenterAvatar}" alt="${commenterName}'s avatar" class="w-8 h-8 rounded-full flex-shrink-0 mt-1">
                        <div class="flex-grow">
                            <div class="bg-gray-100 rounded-lg px-3 py-2">
                                <span class="font-semibold text-sm text-gray-800">${commenterName}</span>
                                <p class="text-sm text-gray-700">${comment.content}</p>
                            </div>
                            <div class="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                                <span>${commentDate}</span>
                                ${canDelete ? `<button data-comment-id="${comment.id}" class="delete-comment-button text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>` : ''}
                            </div>
                        </div>
                    </div>
                 `;
            }).join('');
        }

        // --- NEW: Comment Input Form ---
        const commentFormHTML = `
            <div class="mt-4 flex items-center space-x-3 pt-4 border-t border-gray-100">
                <img src="${authorAvatar}" alt="Your avatar" class="w-8 h-8 rounded-full flex-shrink-0"> 
                <form class="comment-form flex-grow" data-tale-id="${tale.id}">
                    <input type="text" name="comment_content" class="w-full bg-gray-100 border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-[#007367] focus:border-[#007367]" placeholder="Write a comment..." required>
                    
                     <button type="submit" class="hidden">Post</button>
                </form>
            </div>
        `;

        // Assemble the full card
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden tale-card" id="tale-${tale.id}">
                
                 <div class="p-6">
                     <div class="flex justify-between items-start mb-4">
                         <div class="flex items-center flex-grow min-w-0 mr-4">
                             <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 flex-shrink-0">
                             <div class="min-w-0">
                                 <h4 class="font-bold text-gray-900 truncate">${authorName}</h4>
                                 <p class="text-sm text-gray-500 truncate">Posted in <a href="#" class="font-semibold text-[#007367] hover:underline">${tale.category}</a> &middot; ${postDate}</p>
                             </div>
                         </div>
                         <div class="flex-shrink-0">${ownerControls}</div>
                     </div>
                     <h3 class="text-xl font-semibold mb-2 text-gray-800">${tale.title}</h3>
                     <div class="prose prose-sm max-w-none text-gray-700 break-words">${tale.description || ''}</div>
                 </div>
                 ${coverImageHTML}
                
                <div class="p-4 flex justify-between items-center border-t border-gray-100">
                    <div class="flex gap-4">
                        ${likeButtonHTML}
                        ${commentButtonHTML}
                    </div>
                </div>
               
                <div class="px-6 pb-4">
                    <div class="comments-list border-t border-gray-100 pt-3 max-h-60 overflow-y-auto">
                        ${commentsHTML || '<p class="text-xs text-gray-500 text-center py-2">No comments yet.</p>'}
                    </div>
                    ${commentFormHTML}
                </div>
            </div>
        `;
    }

    // --- Initial Load ---
    try { await Promise.all([loadUserProfile(), loadTales()]); }
    catch (error) { console.error("Error during initial page load:", error); }

    // --- Event Listeners ---

    profileMenuButton?.addEventListener('click', () => profileMenu?.classList.toggle('hidden'));
    document.addEventListener('click', (event) => { /* ... (Close menu logic) ... */ });
    logoutButton?.addEventListener('click', async (e) => { /* ... (Logout logic) ... */ });
    addTaleButton?.addEventListener('click', () => { /* ... (Open Create Modal logic) ... */ });
    closeModalButton?.addEventListener('click', () => addTaleModal?.classList.add('hidden'));
    addTaleModal?.addEventListener('click', (event) => { /* ... (Close modal on overlay click) ... */ });

    // --- UPDATED Event Delegation for Timeline ---
    timelineFeed?.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-button');
        const deleteButton = event.target.closest('.delete-button');
        const likeButton = event.target.closest('.like-button');
        const deleteCommentButton = event.target.closest('.delete-comment-button'); // NEW

        // Handle Edit Click
        if (editButton) { /* ... (Existing Edit Logic) ... */ }

        // Handle Delete Tale Click
        if (deleteButton) { /* ... (Existing Delete Tale Logic) ... */ }

        // Handle Like Click
        if (likeButton) { /* ... (Existing Like/Unlike Logic) ... */ }

        // --- NEW: Handle Delete Comment Click ---
        if (deleteCommentButton) {
            const commentId = deleteCommentButton.dataset.commentId;
            if (!commentId) return;

            if (confirm('Are you sure you want to delete this comment?')) {
                try {
                    const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
                    if (error) throw error;

                    // Remove comment from UI immediately
                    document.getElementById(`comment-${commentId}`)?.remove();
                    // Optionally, find the parent tale card and update the comment count display
                    const taleCard = deleteCommentButton.closest('.tale-card');
                    if (taleCard) {
                        const countSpan = taleCard.querySelector('.comment-count');
                        if (countSpan) {
                            countSpan.textContent = Math.max(0, parseInt(countSpan.textContent || '1') - 1);
                        }
                    }

                } catch (error) {
                    console.error('Error deleting comment:', error);
                    alert('Failed to delete comment.');
                }
            }
        }
    });

     // --- NEW: Event Listener for Comment Form Submissions ---
    timelineFeed?.addEventListener('submit', async (event) => {
         // Check if the submission came from a comment form
         if (event.target.classList.contains('comment-form')) {
             event.preventDefault(); // Prevent default form submission
             const form = event.target;
             const taleId = form.dataset.taleId;
             const input = form.querySelector('input[name="comment_content"]');
             const content = input?.value.trim();

             if (!content || !taleId || !user) {
                 console.warn("Comment content, tale ID, or user missing.");
                 return; // Don't submit empty comments
             }

             // Disable input while submitting
             if(input) input.disabled = true;

             try {
                 // Insert the comment into the database
                 const { data: newComment, error } = await supabaseClient
                     .from('comments')
                     .insert({
                         user_id: user.id,
                         tale_id: taleId,
                         content: content
                     })
                     .select(`*, profiles ( full_name, avatar_url )`) // Fetch profile info for the new comment
                     .single();

                 if (error) throw error;

                 // Successfully inserted! Now add it to the UI.
                 if (newComment) {
                     const commentList = form.closest('.tale-card')?.querySelector('.comments-list');
                     const noCommentsMsg = commentList?.querySelector('p.text-xs');

                     // Create HTML for the new comment
                     const commenterName = newComment.profiles?.full_name || 'User';
                     const commenterAvatar = newComment.profiles?.avatar_url ? `${newComment.profiles.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/32x32/e0e7ff/3730a3?text=${commenterName.charAt(0).toUpperCase()}`;
                     let commentDate = 'just now';
                      try { if (typeof dateFns !== 'undefined') { commentDate = dateFns.formatDistanceToNow(new Date(newComment.created_at), { addSuffix: true }); } } catch(e){}

                     const newCommentHTML = `
                         <div class="comment-item flex items-start space-x-3 py-3" id="comment-${newComment.id}">
                             <img src="${commenterAvatar}" alt="${commenterName}'s avatar" class="w-8 h-8 rounded-full flex-shrink-0 mt-1">
                             <div class="flex-grow">
                                 <div class="bg-gray-100 rounded-lg px-3 py-2">
                                     <span class="font-semibold text-sm text-gray-800">${commenterName}</span>
                                     <p class="text-sm text-gray-700">${newComment.content}</p>
                                 </div>
                                 <div class="text-xs text-gray-500 mt-1 flex items-center space-x-2">
                                     <span>${commentDate}</span>
                                     <button data-comment-id="${newComment.id}" class="delete-comment-button text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                                 </div>
                             </div>
                         </div>
                     `;

                     // Remove "No comments yet" message if it exists
                     if (noCommentsMsg) noCommentsMsg.remove();
                     // Append the new comment
                     commentList?.insertAdjacentHTML('beforeend', newCommentHTML);
                     // Clear the input field
                     if(input) input.value = '';

                      // Update the comment count display
                      const countSpan = form.closest('.tale-card')?.querySelector('.comment-count');
                      if (countSpan) {
                           countSpan.textContent = parseInt(countSpan.textContent || '0') + 1;
                      }

                 }

             } catch (error) {
                 console.error('Error posting comment:', error);
                 alert('Failed to post comment.');
             } finally {
                 // Re-enable input
                 if(input) input.disabled = false;
             }
         }
     });

    // --- Tale Form Submission (Create/Update) ---
    taleForm?.addEventListener('submit', async (event) => {
        // ... (This function remains unchanged from the previous correct version) ...
    });
});

