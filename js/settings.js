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
    const avatarPreview = document.getElementById('avatar-preview');
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');
    const logoutButton = document.getElementById('logout-button');
    const avatarUploadInput = document.getElementById('avatar-upload-input'); // The hidden file input


    // --- 1. Fetch and Populate Profile Data ---
    async function loadProfile() {
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('full_name, branch, bio, linkedin_url, github_url, avatar_url')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            formMessage.textContent = 'Error loading profile data.';
            formMessage.className = 'text-center text-sm mb-4 text-red-600';
        }

        if (profile) {
            fullNameInput.value = profile.full_name || '';
            branchInput.value = profile.branch || '';
            bioInput.value = profile.bio || '';
            linkedinUrlInput.value = profile.linkedin_url || '';
            githubUrlInput.value = profile.github_url || '';

            const displayName = profile.full_name || user.email.split('@')[0];
            const displayAvatar = profile.avatar_url ? `${profile.avatar_url}?t=${new Date().getTime()}` : `https://placehold.co/100x100/e0e7ff/3730a3?text=${displayName.charAt(0).toUpperCase()}`;
            
            avatarPreview.src = displayAvatar;
            profileMenuButton.querySelector('span').textContent = displayName;
            profileMenuButton.querySelector('img').src = displayAvatar.replace('100x100', '40x40');
        }
    }
    
    // --- HEADER DROPDOWN AND LOGOUT LOGIC ---
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

    // --- AVATAR UPLOAD LOGIC ---
    // The 'change' event on the hidden input is now the only trigger we need.
    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const changePictureLabel = document.querySelector('label[for="avatar-upload-input"]');
        const originalButtonText = changePictureLabel.textContent;
        changePictureLabel.textContent = 'Uploading...';


        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            alert('Error uploading avatar. Please try again.');
        } else {
            const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
            if (data.publicUrl) {
                const { error: updateError } = await supabaseClient.from('profiles').update({ avatar_url: data.publicUrl, updated_at: new Date() }).eq('id', user.id);
                if (updateError) {
                    console.error('Error updating profile with new avatar URL:', updateError);
                    alert('Error updating profile URL. Please try again.');
                } else {
                    await loadProfile(); // Success! Reloads the page with the new image.
                }
            }
        }
        changePictureLabel.textContent = originalButtonText;
    });

    // --- FORM SUBMISSION FOR TEXT FIELDS ---
    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        formMessage.textContent = '';
        const updates = { id: user.id, full_name: fullNameInput.value, branch: branchInput.value, bio: bioInput.value, linkedin_url: linkedinUrlInput.value, github_url: githubUrlInput.value, updated_at: new Date(), };
        const { error } = await supabaseClient.from('profiles').upsert(updates);
        if (error) {
            formMessage.textContent = `Error: ${error.message}`;
            formMessage.className = 'text-center text-sm text-red-500 mb-4';
        } else {
            formMessage.textContent = 'Profile saved successfully!';
            formMessage.className = 'text-center text-sm text-green-600 mb-4';
            await loadProfile(); 
        }
        submitButton.disabled = false;
        submitButton.textContent = 'Save Changes';
        setTimeout(() => { formMessage.textContent = ''; }, 3000);
    });

    // --- Initial Load ---
    await loadProfile();
});
