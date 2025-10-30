document.addEventListener('DOMContentLoaded', async () => {
    // Check if Supabase client is available
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        document.body.innerHTML = '<p class="text-red-500 text-center p-8">Error: Supabase client not found.</p>';
        return;
    }
     // Check if dateFns is available (optional for homepage)
    if (typeof dateFns === 'undefined') {
        console.warn('date-fns library not found. Dates might not be formatted relatively.');
    }

    // --- SESSION CHECK & REDIRECT ---
    let user = null;
    try {
        const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError) throw sessionError;
        if (session) {
            // If a user is logged in, redirect them immediately.
            window.location.href = 'dashboard.html';
            return; // Stop script execution
        }
    } catch (error) {
         console.error("Error during session check:", error);
         // Allow homepage to load even if session check fails
    }

    // --- If no session, proceed with loading homepage ---
    document.body.style.opacity = 1; // Make body visible
    await setupHomepage();
    loadDiscoverTalesPreview(); // Load the preview carousel
    setupModalControls();

}); // End DOMContentLoaded


/**
 * Basic homepage setup (menu, year).
 */

async function setupHomepage() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenuNav = document.getElementById('mobile-menu');
    mobileMenuButton?.addEventListener('click', () => mobileMenuNav?.classList.toggle('hidden'));

    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Ensure visible counters start at 0 so the animation runs when triggered
    document.querySelectorAll('.counter-number').forEach(el => el.textContent = '0');

    // Fetch the current number of active users from Supabase and set the counter's data-target
    // We'll wait for both counts to resolve before creating the IntersectionObserver so the
    // animation has the correct targets when it runs.
    const fetchActive = (async function fetchAndSetActiveUsersCount(){
        try {
            const activeCounter = document.getElementById('active-users-counter');
            if (!activeCounter) return;

            // Attempt to get a count of rows in the `profiles` table.
            // This assumes you store one profile row per user. If your schema uses a different table,
            // change 'profiles' to the correct table name.
            const { count, error } = await supabaseClient
                .from('profiles')
                .select('id', { head: true, count: 'exact' });

            if (error) {
                console.warn('Could not fetch active users count from Supabase:', error.message || error);
                return;
            }

            const total = Number(count) || 0;
            // Update only the data-target so the existing animation will animate from 0 -> total
            activeCounter.setAttribute('data-target', String(total));
            console.log('[homepage] active users count:', total);
        } catch (err) {
            console.error('Error fetching active users count:', err);
        }
    })();

    // Fetch and set the total number of tales so the Total Tales counter animates correctly
    const fetchTales = (async function fetchAndSetTotalTalesCount(){
        try {
            const totalTalesCounter = document.getElementById('total-tales-counter');
            if (!totalTalesCounter) return;

            const { count, error } = await supabaseClient
                .from('tales')
                .select('id', { head: true, count: 'exact' });

            if (error) {
                console.warn('Could not fetch total tales count from Supabase:', error.message || error);
                return;
            }

            const total = Number(count) || 0;
            totalTalesCounter.setAttribute('data-target', String(total));
            console.log('[homepage] total tales count:', total);
        } catch (err) {
            console.error('Error fetching total tales count:', err);
        }
    })();

    // ADD THIS COUNTER ANIMATION CODE:
    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 16);
    }
    
    // Wait for counts to be fetched (or fail) so data-targets are set before animation.
    try {
        await Promise.all([fetchActive, fetchTales]);
    } catch (e) {
        console.warn('[homepage] one or more count fetches failed:', e);
    }

    // Trigger counter animation when visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.counter-number').forEach(animateCounter);
                observer.disconnect();
            }
        });
    });
    
    const heroSection = document.querySelector('section');
    if (heroSection) observer.observe(heroSection);
}

/**
 * Sets up listeners to close the tale detail modal.
 */
function setupModalControls() {
    const taleModal = document.getElementById('tale-detail-modal');
    const closeModalButton = document.getElementById('close-tale-modal');

    closeModalButton?.addEventListener('click', () => taleModal?.classList.add('hidden'));
    taleModal?.addEventListener('click', (event) => {
        // Close if clicking on the background overlay
        if (event.target === taleModal) {
            taleModal.classList.add('hidden');
        }
    });
}

/**
 * Populates and shows the modal with tale details.
 */
function showTaleInModal(tale) {
    const modalBody = document.getElementById('modal-body-content');
    const taleModal = document.getElementById('tale-detail-modal');
    const modalTitle = document.getElementById('modal-title'); // Get title element

    if (!modalBody || !taleModal || !tale) return; // Safety check

    const authorName = tale.profiles?.full_name || 'A Gitamite';
    const authorAvatar = tale.profiles?.avatar_url
        ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
        : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;

    let postDate = 'a while ago';
    try {
        if(typeof dateFns !== 'undefined' && dateFns.formatDistanceToNow) { // Use relative date if available
            postDate = dateFns.formatDistanceToNow(new Date(tale.created_at), { addSuffix: true });
        } else {
            postDate = new Date(tale.created_at).toLocaleDateString(); // Fallback
        }
    } catch(e){ console.warn("Could not format date in modal:", tale.created_at, e); }

    const coverImageHTML = tale.cover_image_url ? `<img src="${tale.cover_image_url}" alt="${tale.title}" class="w-full h-auto max-h-72 object-cover rounded-lg my-4 border border-gray-100">` : '';

    // Update modal title
    if(modalTitle) modalTitle.textContent = tale.title || 'Tale Details';

    // Update modal body content
    modalBody.innerHTML = `
        <p class="text-sm font-semibold text-[#007367]">${tale.category || 'Uncategorized'}</p>

        <div class="flex items-center my-4">
            <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 shadow-sm border border-gray-100">
            <div>
                <p class="font-semibold text-gray-800">${authorName}</p>
                <p class="text-sm text-gray-500">Posted ${postDate}</p>
            </div>
        </div>

        ${coverImageHTML}

        <div class="prose prose-sm max-w-none text-gray-700 mt-4 break-words">${tale.description || 'No description provided.'}</div>
    `;

    taleModal.classList.remove('hidden'); // Show the modal
}


// --- Discover Preview Carousel Logic ---
let allPreviewTales = []; // Cache fetched tales
let currentPreviewPage = 0;
const TALES_PER_PAGE = 4; // Number of tales to show per page

/**
 * Loads tales for the homepage carousel preview.
 */
async function loadDiscoverTalesPreview() {
    const discoverGrid = document.getElementById('discover-grid');
    const prevButton = document.getElementById('prev-tale');
    const nextButton = document.getElementById('next-tale');
    if (!discoverGrid || !prevButton || !nextButton) {
        console.error("Carousel elements not found (discover-grid, prev-tale, or next-tale).");
        return;
    }

    try {
        // Fetch more tales (e.g., 12) for the carousel
        const { data: tales, error } = await supabaseClient
            .from('tales')
            .select(`*, profiles ( full_name, branch, avatar_url )`) // Fetch necessary profile info
            .order('created_at', { ascending: false })
            .limit(12); // Fetch enough for a few pages

        if (error) throw error;

        allPreviewTales = tales || [];
        displayPreviewPage(0); // Display the first page

        // Setup button listeners only if pagination is needed
        if (allPreviewTales.length > TALES_PER_PAGE) {
            prevButton.classList.remove('hidden');
            nextButton.classList.remove('hidden');

            // --- Clear potential duplicate listeners before adding ---
            // Clone and replace to remove old listeners safely
            const newPrevButton = prevButton.cloneNode(true);
            prevButton.parentNode?.replaceChild(newPrevButton, prevButton); // Use parentNode for safety
            const newNextButton = nextButton.cloneNode(true);
            nextButton.parentNode?.replaceChild(newNextButton, nextButton);

            // Add new listeners
            newPrevButton.addEventListener('click', () => {
                currentPreviewPage = Math.max(0, currentPreviewPage - 1);
                displayPreviewPage(currentPreviewPage);
            });
            newNextButton.addEventListener('click', () => {
                const maxPage = Math.ceil(allPreviewTales.length / TALES_PER_PAGE) - 1;
                currentPreviewPage = Math.min(maxPage, currentPreviewPage + 1);
                displayPreviewPage(currentPreviewPage);
            });
        } else {
             // Hide buttons if not enough items for pagination
             prevButton.classList.add('hidden');
             nextButton.classList.add('hidden');
        }

         // Add event listener for clicks on the cards (for modal popup)
        discoverGrid.addEventListener('click', (event) => {
            const card = event.target.closest('.discover-card');
            if (card && card.dataset.tale) { // Check if data is present
                try {
                     // Sanitize the string before parsing
                     const sanitizedJsonString = card.dataset.tale.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
                     const taleData = JSON.parse(sanitizedJsonString);
                     showTaleInModal(taleData);
                } catch (e) { console.error("Error parsing tale data for modal:", e, card.dataset.tale); }
            }
        });

    } catch (error) {
        console.error("Error fetching discover tales for preview:", error);
        discoverGrid.innerHTML = `<p class="text-center text-red-500 col-span-full">Could not load journeys.</p>`;
    }
}

/**
 * Displays a specific "page" of tales in the preview grid.
 * @param {number} pageIndex - The 0-based index of the page to display.
 */
function displayPreviewPage(pageIndex) {
    const discoverGrid = document.getElementById('discover-grid');
    const prevButton = document.getElementById('prev-tale'); // Re-select potentially replaced button
    const nextButton = document.getElementById('next-tale'); // Re-select potentially replaced button
    if (!discoverGrid || !prevButton || !nextButton) return;

    const startIndex = pageIndex * TALES_PER_PAGE;
    const endIndex = startIndex + TALES_PER_PAGE;
    const talesToShow = allPreviewTales.slice(startIndex, endIndex);

    discoverGrid.innerHTML = ''; // Clear previous cards/skeletons

    if (talesToShow.length === 0 && pageIndex === 0) {
         discoverGrid.innerHTML = `<p class="text-center text-gray-500 col-span-full">No journeys posted yet.</p>`;
    } else {
        talesToShow.forEach(tale => {
            const cardHTML = createDiscoverCard(tale);
            discoverGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
        // Add invisible placeholders if less than 4 tales to maintain grid layout on large screens
         if (talesToShow.length < TALES_PER_PAGE) {
             for (let i = talesToShow.length; i < TALES_PER_PAGE; i++) {
                 // Adjust visibility based on breakpoints if needed, e.g., hidden lg:block
                 discoverGrid.insertAdjacentHTML('beforeend', '<div class="hidden lg:block"></div>');
             }
         }
    }

    // Update button disabled states
    const maxPage = Math.ceil(allPreviewTales.length / TALES_PER_PAGE) - 1;
    prevButton.disabled = pageIndex === 0;
    nextButton.disabled = pageIndex >= maxPage || allPreviewTales.length <= TALES_PER_PAGE;
}

/**
 * Creates the HTML string for a single tale card on the homepage preview.
 * Includes hover effects and data attribute for the modal.
 */
function createDiscoverCard(tale) {
     const authorName = tale.profiles?.full_name || 'A Gitamite';
    const authorBranch = tale.profiles?.branch || 'GITAM Student';
    const authorAvatar = tale.profiles?.avatar_url
        ? `${tale.profiles.avatar_url}?t=${new Date().getTime()}`
        : `https://placehold.co/40x40/e0e7ff/3730a3?text=${authorName.charAt(0).toUpperCase()}`;
    const coverImage = tale.cover_image_url || `https://placehold.co/600x400/007367/ffffff?text=${encodeURIComponent(tale.category || 'Tale')}`;

    // Escape potentially problematic characters in tale data for the data attribute
     let safeTaleData = '{}'; // Default to empty object string
     try {
        // Only include necessary fields for the modal
        const modalData = {
            title: tale.title,
            category: tale.category,
            description: tale.description,
            cover_image_url: tale.cover_image_url,
            created_at: tale.created_at,
            profiles: { // Nest profile info
                full_name: tale.profiles?.full_name,
                avatar_url: tale.profiles?.avatar_url
            }
        };
        safeTaleData = JSON.stringify(modalData).replace(/'/g, '&apos;').replace(/"/g, '&quot;');
     } catch (e) { console.error("Error stringifying tale data:", e); }


    return `
        <div class="bg-white rounded-lg overflow-hidden border border-gray-200 transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 cursor-pointer discover-card flex flex-col"
             data-tale='${safeTaleData}'>
            <img src="${coverImage}" alt="${tale.title || 'Tale image'}" class="w-full h-48 object-cover pointer-events-none">
            <div class="p-6 pointer-events-none flex flex-col flex-grow">
                <p class="text-sm font-semibold text-[#007367] mb-1">${tale.category || 'Uncategorized'}</p>
                <h3 class="text-lg font-bold text-gray-900 mb-2 truncate" title="${tale.title}">${tale.title || 'Untitled Tale'}</h3>
                <div class="mt-auto flex items-center pt-3 border-t border-gray-100"> <img src="${authorAvatar}" alt="${authorName}'s Avatar" class="w-10 h-10 rounded-full mr-3 border-2 border-white shadow-sm flex-shrink-0">
                    <div class="min-w-0">
                        <p class="font-semibold text-gray-800 truncate">${authorName}</p>
                        <p class="text-sm text-gray-500">${authorBranch}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}