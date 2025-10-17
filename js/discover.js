document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    const discoverFeed = document.getElementById('discover-feed');

    /**
     * Fetches ALL tales and renders them.
     */
    async function loadAllTales() {
        const { data: tales, error } = await supabaseClient
            .from('tales')
            .select(`*, profiles ( full_name, avatar_url )`)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tales:', error);
            discoverFeed.innerHTML = '<p class="text-center text-red-500">Could not load tales. Please try again.</p>';
            return;
        }

        // Clear skeleton loaders
        discoverFeed.innerHTML = '';

        if (tales.length === 0) {
            discoverFeed.innerHTML = '<p class="text-center text-gray-500">No tales have been shared yet.</p>';
        } else {
            for (const tale of tales) {
                const taleCard = createTaleCard(tale);
                discoverFeed.insertAdjacentHTML('beforeend', taleCard);
            }
        }
    }

    /**
     * Creates the HTML for a single tale card (same as dashboard).
     */
    function createTaleCard(tale) {
        const authorName = tale.profiles?.full_name || 'A Gitamite';
        const authorAvatar = tale.profiles?.avatar_url ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`: `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
        const postDate = new Date(tale.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 mb-6 overflow-hidden">
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
                <div class="p-4 border-t border-gray-100 flex justify-between items-center">
                    <div class="flex gap-4">
                        <span class="text-gray-600 flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg> ${tale.like_count || 0}</span>
                        <span class="text-gray-600 flex items-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg> ${tale.comment_count || 0}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Initial load
    loadAllTales();
});