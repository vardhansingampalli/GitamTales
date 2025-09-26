document.addEventListener('DOMContentLoaded', async () => {
    // Ensure the Supabase client is available
    if (typeof supabaseClient === 'undefined') {
        console.error('Supabase client is not initialized.');
        return;
    }

    // --- Auth Guard: Protect the page ---
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html'; // Redirect to login if not authenticated
        return;
    }
    const user = session.user;

    // --- Get Form Elements ---
    const settingsForm = document.getElementById('settings-form');
    const fullNameInput = document.getElementById('full-name');
    const branchInput = document.getElementById('branch');
    const bioInput = document.getElementById('bio');
    const formMessage = document.getElementById('form-message');
    const submitButton = settingsForm.querySelector('button[type="submit"]');

    // --- 1. Fetch and Populate Profile Data ---
    async function loadProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name, branch, bio')
            .eq('id', user.id)
            .single(); // Use .single() to get one object, not an array

        if (error) {
            console.error('Error fetching profile:', error);
            formMessage.textContent = 'Error loading profile.';
            formMessage.className = 'text-center text-sm text-red-500';
        }

        if (profile) {
            fullNameInput.value = profile.full_name || '';
            branchInput.value = profile.branch || '';
            bioInput.value = profile.bio || '';
        }
    }

    // Load the profile data when the page loads
    await loadProfile();

    // --- 2. Handle Form Submission to Update Profile ---
    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        // Show a loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        formMessage.textContent = '';

        const updates = {
            id: user.id, // The user's ID
            full_name: fullNameInput.value,
            branch: branchInput.value,
            bio: bioInput.value,
            updated_at: new Date(), // Set the last updated time
        };

        const { error } = await supabaseClient
            .from('profiles')
            .upsert(updates); // .upsert() will create or update the profile

        if (error) {
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'text-center text-sm text-red-500';
        } else {
            formMessage.textContent = 'Profile saved successfully!';
            formMessage.className = 'text-center text-sm text-green-600';
        }

        // Re-enable the button
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
    });
});
