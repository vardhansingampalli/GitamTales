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
    // --- ADDED FOR AVATAR UPLOAD ---
    const changePictureButton = document.getElementById('change-picture-button');
    const avatarUploadInput = document.getElementById('avatar-upload-input');


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
            // Add a timestamp to the avatar URL to bypass browser cache
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

    // --- ADDED: AVATAR UPLOAD LOGIC ---
    changePictureButton.addEventListener('click', () => {
        avatarUploadInput.click(); // Trigger the hidden file input
    });

    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) {
            return; // No file selected
        }

        changePictureButton.disabled = true;
        changePictureButton.textContent = 'Uploading...';

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload the file to the 'avatars' bucket
        const { error: uploadError } = await supabaseClient.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true }); // 'upsert: true' will overwrite the existing file

        if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
            alert('Error uploading avatar. Please try again.');
        } else {
            // Get the public URL of the uploaded file
            const { data } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            if (data.publicUrl) {
                // Update the user's profile with the new avatar URL
                const { error: updateError } = await supabaseClient
                    .from('profiles')
                    .update({ avatar_url: data.publicUrl })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error updating profile with new avatar URL:', updateError);
                    alert('Error updating profile. Please try again.');
                } else {
                    // Success! Reload the profile to show the new image.
                    await loadProfile();
                }
            }
        }

        changePictureButton.disabled = false;
        changePictureButton.textContent = 'Change Picture';
    });

    // --- 2. Handle Form Submission to Update Profile ---
    settingsForm.addEventListener('submit', async (event) => {
        // ... (This part remains the same as before) ...
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