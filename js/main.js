document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- SESSION CHECK & REDIRECT ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    } else {
        document.body.style.opacity = 1;

        // --- Setup for Logged-Out Users ---
        setupHomepage();
        loadDiscoverTales(); // <-- Call our new function
    }
});

/**
 * Sets up basic event listeners for the homepage.
 */
function setupHomepage() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuNav = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenuNav) {
        mobileMenuButton.addEventListener('click', () => mobileMenuNav.classList.toggle('hidden'));
    }
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

/**
 * Fetches and displays the latest tales in the Discover section.
 */
async function loadDiscoverTales() {
    const discoverGrid = document.getElementById('discover-grid');
    if (!discoverGrid) return;

    // Fetch the 6 most recent tales and their authors' profiles
    const { data: tales, error } = await supabaseClient
        .from('tales')
        .select(`*, profiles ( full_name, branch, avatar_url )`)
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error("Error fetching discover tales:", error);
        discoverGrid.innerHTML = `<p class="text-center text-red-500 col-span-3">Could not load journeys. Please try again later.</p>`;
        return;
    }

    // Clear the skeleton loaders
    discoverGrid.innerHTML = '';

    if (tales.length === 0) {
        discoverGrid.innerHTML = `<p class="text-center text-gray-500 col-span-3">No journeys have been shared yet. Be the first!</p>`;
        return;
    }

    // Create and append a card for each tale
    for (const tale of tales) {
        const cardHTML = createDiscoverCard(tale);
        discoverGrid.insertAdjacentHTML('beforeend', cardHTML);
    }
}

/**
 * Creates the HTML string for a single tale card on the homepage.
 * @param {object} tale - The tale object from Supabase.
 * @returns {string} The HTML for the card.
 */
function createDiscoverCard(tale) {
    const authorName = tale.profiles?.full_name || 'A Gitamite';
    const authorBranch = tale.profiles?.branch || 'GITAM Student';
    const authorAvatar = tale.profiles?.avatar_url 
        ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
        : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;

    // A default image if one isn't provided for the tale
    const coverImage = tale.cover_image_url || `https://placehold.co/600x400/007367/ffffff?text=${encodeURIComponent(tale.category)}`;

    return `
        <div class="bg-white rounded-lg overflow-hidden border border-gray-200 transform hover:-translate-y-1 transition-transform duration-300">
            <img src="${coverImage}" alt="${tale.title}" class="w-full h-48 object-cover">
            <div class="p-6">
                <p class="text-sm font-semibold text-[#007367] mb-1">${tale.category}</p>
                <h3 class="text-lg font-bold text-gray-900 mb-2 truncate" title="${tale.title}">${tale.title}</h3>
                <div class="flex items-center">
                    <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 border-2 border-white">
                    <div>
                        <p class="font-semibold text-gray-800">${authorName}</p>
                        <p class="text-sm text-gray-500">${authorBranch}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}