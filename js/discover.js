document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }
     // Check if dateFns is available
    if (typeof dateFns === 'undefined') {
        console.error('date-fns library not found. Ensure it is loaded in the HTML.');
    }

    const discoverGrid = document.getElementById('discover-grid');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const noResultsMessage = document.getElementById('no-results-message');

    let allTales = []; // Store all fetched tales to filter client-side initially

    /**
     * Fetches ALL tales initially.
     */
    async function fetchAllTales() {
        if (!discoverGrid) return;
        discoverGrid.innerHTML = createSkeletonLoaders(3); // Show skeletons while loading

        const { data, error } = await supabaseClient
            .from('tales')
            .select(`*, profiles ( full_name, branch, avatar_url )`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tales:', error);
            discoverGrid.innerHTML = '<p class="text-center text-red-500 col-span-full">Could not load tales. Please try again.</p>';
            return;
        }

        allTales = data || [];
        displayTales(allTales); // Display all tales initially
    }

    /**
     * Filters and displays tales based on search term and category.
     */
    function filterAndDisplayTales() {
        if (!discoverGrid) return;
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filteredTales = allTales.filter(tale => {
            const matchesCategory = category ? tale.category === category : true;
            const matchesSearch = searchTerm ? (
                tale.title.toLowerCase().includes(searchTerm) ||
                tale.description.toLowerCase().includes(searchTerm) ||
                (tale.profiles?.full_name && tale.profiles.full_name.toLowerCase().includes(searchTerm)) ||
                (tale.tags && tale.tags.toLowerCase().includes(searchTerm))
            ) : true;
            return matchesCategory && matchesSearch;
        });

        displayTales(filteredTales);
    }

    /**
     * Renders an array of tales to the grid.
     * @param {Array} tales - The array of tale objects to display.
     */
    function displayTales(tales) {
         if (!discoverGrid) return;
         discoverGrid.innerHTML = ''; // Clear previous results or skeletons

         if (tales.length === 0) {
             noResultsMessage.classList.remove('hidden'); // Show no results message
         } else {
             noResultsMessage.classList.add('hidden'); // Hide no results message
             tales.forEach(tale => {
                 const taleCard = createDiscoverCard(tale);
                 discoverGrid.insertAdjacentHTML('beforeend', taleCard);
             });
         }
    }


    /**
     * Creates the HTML string for a single tale card in the grid.
     */
    function createDiscoverCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorBranch = tale.profiles?.branch || 'GITAM Student';
        const authorAvatar = tale.profiles?.avatar_url
            ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
            : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;

        const coverImage = tale.cover_image_url
            ? `${tale.cover_image_url}` // Assumes URL already includes timestamp if needed
            : `https://placehold.co/600x400/007367/ffffff?text=${encodeURIComponent(tale.category || 'Tale')}`;

        // Generate relative date using date-fns if available
        let postDate = '';
         try {
             if (typeof dateFns !== 'undefined' && dateFns.formatDistanceToNow) {
                 postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true });
             } else {
                 postDate = new Date(tale.created_at).toLocaleDateString();
             }
        } catch(e){ console.warn("Could not format date for discover card:", tale.created_at, e); }


        return `
            <div class="bg-white rounded-lg overflow-hidden border border-gray-200 transform hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                 {/* Link the whole card to open details later */}
                <img src="${coverImage}" alt="${tale.title}" class="w-full h-48 object-cover">
                <div class="p-6 flex flex-col flex-grow">
                    <p class="text-sm font-semibold text-[#007367] mb-1">${tale.category}</p>
                    <h3 class="text-lg font-bold text-gray-900 mb-3 truncate" title="${tale.title}">${tale.title}</h3>
                    {/* Optional: Add a short description snippet */}
                    {/* <p class="text-sm text-gray-600 mb-4 line-clamp-2">${tale.description.replace(/<[^>]+>/g, '')}</p> */}

                    <div class="mt-auto flex items-center pt-3 border-t border-gray-100"> {/* Pushes author info to bottom */}
                        <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm">
                        <div class="min-w-0">
                            <p class="font-semibold text-gray-800 truncate">${authorName}</p>
                            <p class="text-xs text-gray-500">${authorBranch} &middot; ${postDate}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates skeleton loader HTML.
     */
    function createSkeletonLoaders(count = 3) {
        let skeletons = '';
        for (let i = 0; i < count; i++) {
            skeletons += `
                <div class="bg-white rounded-lg overflow-hidden border border-gray-200 animate-pulse">
                    <div class="w-full h-48 bg-gray-300"></div>
                    <div class="p-6">
                        <div class="h-4 w-1/4 rounded-md bg-gray-300 mb-2"></div>
                        <div class="h-6 w-3/4 rounded-md bg-gray-300 mb-4"></div>
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full bg-gray-300 mr-3"></div>
                            <div>
                                <div class="h-4 w-24 rounded-md bg-gray-300"></div>
                                <div class="h-3 w-16 rounded-md bg-gray-300 mt-1"></div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
        return skeletons;
    }


    // --- Event Listeners for Filters ---
    searchInput?.addEventListener('input', filterAndDisplayTales);
    categoryFilter?.addEventListener('change', filterAndDisplayTales);


    // --- Initial Load ---
    fetchAllTales();

});
