document.addEventListener('DOMContentLoaded', async () => {
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Auth Guard: Protect the page ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const user = session.user;

    // --- Get All Page Elements ---
    const settingsForm = document.getElementById('settings-form');
    const fullNameInput = document.getElementById('full-name');
    const branchInput = document.getElementById('branch');
    const bioInput = document.getElementById('bio');
    const linkedinUrlInput = document.getElementById('linkedin-url');
    const githubUrlInput = document.getElementById('github-url');
    const formMessage = document.getElementById('form-message');
    const submitButton = settingsForm.querySelector('button[type="submit"]');
    // ADDED FOR AVATAR
    const avatarPreview = document.getElementById('avatar-preview');
    // ADDED FOR HEADER
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    const logoutButton = document.getElementById('logout-button');

    // --- 1. Fetch and Populate Profile Data ---
    async function loadProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            // ADDED avatar_url to select
            .select('full_name, branch, bio, linkedin_url, github_url, avatar_url')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore error if no profile found yet
            console.error('Error fetching profile:', error);
            formMessage.textContent = 'Error loading profile.';
            formMessage.className = 'text-center text-sm text-red-500 mb-4';
        }

        if (profile) {
            fullNameInput.value = profile.full_name || '';
            branchInput.value = profile.branch || '';
            bioInput.value = profile.bio || '';
            linkedinUrlInput.value = profile.linkedin_url || '';
            githubUrlInput.value = profile.github_url || '';

            // ADDED LOGIC FOR AVATAR AND HEADER
            const displayName = profile.full_name || user.email.split('@')[0];
            const displayAvatar = profile.avatar_url || `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;
            
            avatarPreview.src = displayAvatar;
            profileMenuButton.querySelector('span').textContent = displayName;
            profileMenuButton.querySelector('img').src = displayAvatar.replace('100x100', '40x40'); // Small avatar for header
        }
    }

    // Load the profile data when the page loads
    await loadProfile();
    
    // --- ADDED: HEADER DROPDOWN AND LOGOUT LOGIC ---
    profileMenuButton.addEventListener('click', () => profileMenu.classList.toggle('hidden'));
    document.addEventListener('click', (event) => {
        if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
            profileMenu.classList.add('hidden');
        }
    });
    logoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    });

    // --- 2. Handle Form Submission to Update Profile (Your excellent upsert logic) ---
    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        formMessage.textContent = '';

        const updates = {
            id: user.id, // Important for upsert
            full_name: fullNameInput.value,
            branch: branchInput.value,
            bio: bioInput.value,
            linkedin_url: linkedinUrlInput.value,
            github_url: githubUrlInput.value,
            updated_at: new Date(),
        };

        const { error } = await supabaseClient
            .from('profiles')
            .upsert(updates);

        if (error) {
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'text-center text-sm text-red-500 mb-4';
        } else {
            formMessage.textContent = 'Profile saved successfully!';
            formMessage.className = 'text-center text-sm text-green-600 mb-4';
            await loadProfile(); // Reload profile to update header name if it changed
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';

        // Make the message disappear after a few seconds
        setTimeout(() => {
            formMessage.textContent = '';
        }, 3000);
    });
});