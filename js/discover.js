document.addEventListener('DOMContentLoaded', async () => {
    // Check Supabase and dateFns
    if (typeof supabaseClient === 'undefined') { console.error('Supabase client missing.'); return; }
    if (typeof dateFns === 'undefined') { console.error('date-fns missing.'); }

    // --- Authentication Check ---
    let user = null;
    let userProfile = null;
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (session) {
            user = session.user;
            // Fetch minimal profile for header
            const { data: profileData, error: profileError } = await supabaseClient.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
            // Allow profile not found error, but throw others
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            userProfile = profileData; // Will be null if profile doesn't exist yet
        }
    } catch (error) {
         console.error("Error getting user session or profile:", error);
         // Continue loading the page even if session check fails, but logged out
    }

    updateHeaderAuthStatus(); // Update header based on session

    // --- Get Page Elements ---
    const discoverFeed = document.getElementById('discover-feed');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const noResultsMessage = document.getElementById('no-results-message');

    let allTales = []; // Cache for filtering

    // --- Core Functions ---

    /**
     * Updates the header to show Login/Signup or Profile Menu.
     */
    function updateHeaderAuthStatus() {
        const authStatusDiv = document.getElementById('auth-status');
        if (!authStatusDiv) {
            console.error("Auth status div not found");
            return;
        }


        if (user) { // User is logged in
            // Remove all children (login/signup buttons)
            authStatusDiv.innerHTML = '';
            // Insert profile menu only
            const profileMenuContainer = document.createElement('div');
            profileMenuContainer.id = 'profile-menu-container';
            profileMenuContainer.className = 'relative';
            profileMenuContainer.innerHTML = `
                <button id="profile-menu-button" class="flex items-center space-x-2">
                    <img src="${userProfile?.avatar_url ? userProfile.avatar_url + '?t=' + new Date().getTime() : `https://placehold.co/40x40/e0e7ff/3730a3?text=${(userProfile?.full_name || user.email?.charAt(0) || 'U').toUpperCase()}`}" alt="User Avatar" class="w-8 h-8 rounded-full border border-gray-200">
                    <span class="hidden sm:inline font-semibold text-gray-700 text-sm">${userProfile?.full_name || user.email?.split('@')[0] || 'User'}</span>
                </button>
                <div id="profile-menu" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                    <a href="dashboard.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Journey</a>
                    <a href="settings.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</a>
                    <hr class="my-1 border-gray-100">
                    <a href="#" id="logout-button" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Log Out</a>
                </div>
            `;
            authStatusDiv.appendChild(profileMenuContainer);

            // Add event listeners
            const profileMenuButton = document.getElementById('profile-menu-button');
            const logoutButton = document.getElementById('logout-button');
            const profileMenu = document.getElementById('profile-menu');
            profileMenuButton?.addEventListener('click', () => profileMenu?.classList.toggle('hidden'));
            document.addEventListener('click', (event) => {
                if (profileMenu && !profileMenu.classList.contains('hidden') && profileMenuButton && !profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
                    profileMenu.classList.add('hidden');
                }
            });
            logoutButton?.addEventListener('click', async (e) => { 
                e.preventDefault(); 
                await supabaseClient.auth.signOut(); 
                window.location.href = 'index.html'; 
            });
        } else {
            // Show login/signup buttons for logged out users
            authStatusDiv.innerHTML = `
                <a href="login.html" class="text-gray-600 hover:text-[#007367] text-sm font-medium">Log In</a>
                <a href="signup.html" class="bg-[#007367] hover:bg-[#005f56] text-white font-semibold py-2 px-4 rounded-lg text-sm">Sign Up</a>
            `;
        }
    }


    /**
     * Fetches public tales, excluding the logged-in user's own tales.
     */
    async function fetchPublicTales() {
        if (!discoverFeed) return;
        discoverFeed.innerHTML = createSkeletonLoaders(6); // Show skeletons

        try {
            let query = supabaseClient.from('tales').select(`*, profiles ( full_name, avatar_url )`).order('created_at', { ascending: false });
            if (user) { query = query.neq('user_id', user.id); } // Exclude self if logged in
            const { data, error } = await query;
            if (error) throw error;
            allTales = data || [];

            let likes = [];
            if (user && allTales.length > 0) { // Only fetch likes if logged in
                 const taleIds = allTales.map(t => t.id);
                 const { data: likesData, error: likesError } = await supabaseClient.from('likes').select('tale_id, user_id').in('tale_id', taleIds);
                 if (likesError) console.error('Error fetching likes:', likesError);
                 else likes = likesData || [];
            }
            allTales.forEach(tale => {
                 const taleLikes = likes.filter(l => l.tale_id === tale.id);
                 tale.like_count = taleLikes.length;
                 tale.user_has_liked = user ? taleLikes.some(l => l.user_id === user.id) : false;
            });
            displayTales(allTales);
        } catch (error) {
            console.error('Error fetching tales:', error);
            discoverFeed.innerHTML = '<p class="text-center text-red-500 col-span-full py-10">Could not load tales.</p>';
        }
    }

    /**
     * Filters currently loaded tales based on search term and category.
     */
    function filterAndDisplayTales() {
         if (!discoverFeed || !searchInput || !categoryFilter) return;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;
        const filteredTales = allTales.filter(tale => {
            const matchesCategory = !category || tale.category === category;
            const matchesSearch = !searchTerm || (
                (tale.title && tale.title.toLowerCase().includes(searchTerm)) ||
                (tale.description && tale.description.replace(/<[^>]+>/g, '').toLowerCase().includes(searchTerm)) ||
                (tale.profiles?.full_name && tale.profiles.full_name.toLowerCase().includes(searchTerm)) ||
                (tale.tags && tale.tags.toLowerCase().includes(searchTerm))
            );
            return matchesCategory && matchesSearch;
        });
        displayTales(filteredTales);
    }

    /**
     * Renders an array of tales to the feed container.
     */
    function displayTales(tales) {
         if (!discoverFeed) return;
         discoverFeed.innerHTML = '';
         if (tales.length === 0) {
            if(noResultsMessage) noResultsMessage.classList.remove('hidden');
         } else {
            if(noResultsMessage) noResultsMessage.classList.add('hidden');
             tales.forEach(tale => {
                 const taleCard = createDiscoverFeedCard(tale);
                 discoverFeed.insertAdjacentHTML('beforeend', taleCard);
             });
         }
    }


    /**
     * Creates the HTML string for a single tale card (dashboard style).
     * Includes functional like button ONLY if user is logged in.
     * Includes hover effect.
     */
    function createDiscoverFeedCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url
            ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
            : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;

        let postDate = 'a while ago';
         try {
             if (typeof dateFns !== 'undefined') { postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true }); }
             else { postDate = new Date(tale.created_at).toLocaleDateString(); }
        } catch(e){}

        const coverImageHTML = tale.cover_image_url ? `<img src="${tale.cover_image_url}" alt="Cover for ${tale.title}" class="w-full h-auto max-h-96 object-cover rounded-md my-4 border border-gray-100">` : '';

        // Conditional Like Button/Display
        let likeButtonHTML = '';
        if (user) { // Show functional BUTTON if logged in
            const likeButtonClass = tale.user_has_liked ? 'text-red-500 fill-current' : 'text-gray-600';
            likeButtonHTML = `<button data-tale-id="${tale.id}" data-liked="${tale.user_has_liked}" class="like-button ${likeButtonClass} hover:text-red-500 flex items-center gap-1 transition-colors"><svg class="w-5 h-5 pointer-events-none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> <span class="like-count text-sm">${tale.like_count || 0}</span></button>`;
        } else { // Show non-interactive SPAN if logged out
            likeButtonHTML = `<span class="text-gray-500 flex items-center gap-1 text-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> ${tale.like_count || 0}</span>`;
        }
        // Comment button is still non-interactive span
        const commentButtonHTML = `<span class="text-gray-500 flex items-center gap-1 text-sm"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> 0</span>`;

        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center flex-grow min-w-0 mr-4">
                            <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 flex-shrink-0 shadow-sm">
                            <div class="min-w-0">
                                <h4 class="font-bold text-gray-900 truncate">${authorName}</h4>
                                <p class="text-sm text-gray-500 truncate">Posted in <span class="font-semibold text-[#007367]">${tale.category}</span> &middot; ${postDate}</p>
                            </div>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold mb-3 text-gray-800">${tale.title}</h3>
                    ${coverImageHTML}
                    <div class="prose prose-sm max-w-none text-gray-700 break-words mt-4 line-clamp-3">${tale.description || ''}</div> 
                </div>
                <div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-start items-center gap-4">
                    ${likeButtonHTML}
                    ${commentButtonHTML}
                </div>
            </div>
        `;
    }

    /**
     * Generates skeleton loader HTML.
     */
    function createSkeletonLoaders(count = 3) {
        let skeletons = '';
        for (let i = 0; i < count; i++) { skeletons += `<div class="bg-white rounded-xl shadow-md border border-gray-200 p-6 animate-pulse space-y-4"><div class="flex items-center"><div class="w-10 h-10 rounded-full bg-gray-300 mr-3"></div><div><div class="h-4 w-32 bg-gray-300 rounded mb-1"></div><div class="h-3 w-48 bg-gray-300 rounded"></div></div></div><div class="h-6 w-3/4 bg-gray-300 rounded"></div><div class="space-y-2"><div class="h-4 w-full bg-gray-300 rounded"></div><div class="h-4 w-5/6 bg-gray-300 rounded"></div></div><div class="w-full h-48 bg-gray-300 mt-4 rounded-lg"></div></div>`; }
        return skeletons;
    }


    // --- Event Listeners for Filters ---
    searchInput?.addEventListener('input', filterAndDisplayTales);
    categoryFilter?.addEventListener('change', filterAndDisplayTales);

    // --- Event Listener for Like Buttons (only if user logged in) ---
    if (user && discoverFeed) {
        discoverFeed.addEventListener('click', async (event) => {
            const likeButton = event.target.closest('.like-button');
            if (likeButton) {
                const taleId = likeButton.dataset.taleId;
                const isLiked = likeButton.dataset.liked === 'true';
                const likeCountElement = likeButton.querySelector('.like-count');
                if (!taleId || !likeCountElement) return;
                let currentLikes = parseInt(likeCountElement.textContent || '0');

                if (likeButton.disabled) return;
                likeButton.disabled = true;

                if (isLiked) {
                    likeButton.dataset.liked = 'false';
                    likeButton.classList.remove('text-red-500', 'fill-current');
                    likeCountElement.textContent = Math.max(0, currentLikes - 1);
                    supabaseClient.from('likes').delete().match({ user_id: user.id, tale_id: taleId })
                        .then(({ error }) => { if (error) console.error("Error unliking:", error); })
                        .finally(() => { likeButton.disabled = false; });
                } else {
                    likeButton.dataset.liked = 'true';
                    likeButton.classList.add('text-red-500', 'fill-current');
                    likeCountElement.textContent = currentLikes + 1;
                    supabaseClient.from('likes').insert({ user_id: user.id, tale_id: taleId })
                       .then(({ error }) => { if (error) console.error("Error liking:", error); })
                       .finally(() => { likeButton.disabled = false; });
                }
            }
        });
    }

    // --- Initial Load ---
    fetchPublicTales();

}); // Eand DOMContentLoaded
