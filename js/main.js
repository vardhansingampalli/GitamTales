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
        loadDiscoverTales();
        setupModalControls(); // <-- Call to set up modal close events
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
 * Sets up the event listeners to close the tale detail modal.
 */
function setupModalControls() {
    const taleModal = document.getElementById('tale-detail-modal');
    const closeModalButton = document.getElementById('close-tale-modal');

    if (taleModal && closeModalButton) {
        closeModalButton.addEventListener('click', () => taleModal.classList.add('hidden'));
        // Also close if the user clicks on the dark background
        taleModal.addEventListener('click', (event) => {
            if (event.target === taleModal) {
                taleModal.classList.add('hidden');
            }
        });
    }
}

/**
 * Fetches and displays the latest tales in the Discover section.
 */
async function loadDiscoverTales() {
    const discoverGrid = document.getElementById('discover-grid');
    if (!discoverGrid) return;

    const { data: tales, error } = await supabaseClient
        .from('tales')
        .select(`*, profiles ( full_name, branch, avatar_url )`)
        .order('created_at', { ascending: false })
        .limit(6);

    if (error) {
        console.error("Error fetching discover tales:", error);
        discoverGrid.innerHTML = `<p class="text-center text-red-500 col-span-3">Could not load journeys.</p>`;
        return;
    }

    discoverGrid.innerHTML = '';

    if (tales.length === 0) {
        discoverGrid.innerHTML = `<p class="text-center text-gray-500 col-span-3">No journeys have been shared yet.</p>`;
    } else {
        for (const tale of tales) {
            const cardHTML = createDiscoverCard(tale);
            discoverGrid.insertAdjacentHTML('beforeend', cardHTML);
        }
    }
    
    // --- ADDED: Event listener for clicks on the cards ---
    discoverGrid.addEventListener('click', (event) => {
        const card = event.target.closest('.discover-card');
        if (card) {
            const taleData = JSON.parse(card.dataset.tale);
            showTaleInModal(taleData);
        }
    });
}

/**
 * Populates and shows the modal with the details of a specific tale.
 * @param {object} tale - The full tale object.
 */
function showTaleInModal(tale) {
    const modalBody = document.getElementById('modal-body-content');
    const taleModal = document.getElementById('tale-detail-modal');
    
    const authorName = tale.profiles?.full_name || 'A Gitamite';
    const authorAvatar = tale.profiles?.avatar_url 
        ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
        : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
    const postDate = new Date(tale.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const coverImageHTML = tale.cover_image_url ? `<img src="${tale.cover_image_url}" alt="${tale.title}" class="w-full h-56 object-cover rounded-lg my-4">` : '';

    modalBody.innerHTML = `
        <p class="text-sm font-semibold text-[#007367]">${tale.category}</p>
        <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mt-1">${tale.title}</h2>
        
        <div class="flex items-center my-4">
            <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3">
            <div>
                <p class="font-semibold text-gray-800">${authorName}</p>
                <p class="text-sm text-gray-500">Posted on ${postDate}</p>
            </div>
        </div>
        
        ${coverImageHTML}
        
        <div class="prose max-w-none text-gray-700 mt-4">${tale.description}</div>
    `;

    taleModal.classList.remove('hidden');
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

    const coverImage = tale.cover_image_url || `https://placehold.co/600x400/007367/ffffff?text=${encodeURIComponent(tale.category)}`;

    // --- UPDATED: Added 'discover-card' class and data-tale attribute ---
    return `
        <div class="bg-white rounded-lg overflow-hidden border border-gray-200 transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer discover-card" 
             data-tale='${JSON.stringify(tale)}'>
            <img src="${coverImage}" alt="${tale.title}" class="w-full h-48 object-cover pointer-events-none">
            <div class="p-6 pointer-events-none">
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