document.addEventListener('DOMContentLoaded', function() {
    // --- Profile Dropdown Logic ---
    const profileMenuButton = document.getElementById('profile-menu-button');
    const profileMenu = document.getElementById('profile-menu');

    if (profileMenuButton && profileMenu) {
        profileMenuButton.addEventListener('click', function() {
            profileMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', function(event) {
            if (!profileMenuButton.contains(event.target) && !profileMenu.contains(event.target)) {
                profileMenu.classList.add('hidden');
            }
        });
    }

    // --- "Add New Tale" Modal Logic ---
    const addTaleButton = document.getElementById('add-tale-button');
    const addTaleModal = document.getElementById('add-tale-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const taleForm = document.getElementById('tale-form');

    if (addTaleButton && addTaleModal && closeModalButton && taleForm) {
        // Show the modal
        addTaleButton.addEventListener('click', function() {
            addTaleModal.classList.remove('hidden');
        });

        // Hide the modal with the close button
        closeModalButton.addEventListener('click', function() {
            addTaleModal.classList.add('hidden');
        });

        // Hide the modal when clicking outside of it
        addTaleModal.addEventListener('click', function(event) {
            if (event.target === addTaleModal) {
                addTaleModal.classList.add('hidden');
            }
        });

        // Handle form submission
        taleForm.addEventListener('submit', function(event) {
            event.preventDefault();
            alert('New Tale posted! (Frontend only for now)');
            addTaleModal.classList.add('hidden');
            taleForm.reset(); // Clear the form for the next use
        });
    }
});
