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

    // --- Get Form Elements ---
    const settingsForm = document.getElementById('settings-form');
    const fullNameInput = document.getElementById('full-name');
    const branchInput = document.getElementById('branch');
    const bioInput = document.getElementById('bio');
    const linkedinUrlInput = document.getElementById('linkedin-url');
    const githubUrlInput = document.getElementById('github-url');
    const formMessage = document.getElementById('form-message');
    const submitButton = settingsForm.querySelector('button[type="submit"]');

    // --- 1. Fetch and Populate Profile Data ---
    async function loadProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name, branch, bio, linkedin_url, github_url')
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
        }
    }

    // Load the profile data when the page loads
    await loadProfile();

    // --- 2. Handle Form Submission to Update Profile ---
    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        formMessage.textContent = '';

        const updates = {
            id: user.id,
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
        }

        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    });
});
