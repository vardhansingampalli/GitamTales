// js/reset-password.js

document.addEventListener("DOMContentLoaded", async () => {
  const messageEl = document.getElementById("message");
  const resetForm = document.getElementById("reset-form");
  const newPasswordEl = document.getElementById("new-password");

  // --- Step 1: Listen for Supabase password recovery event ---
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      messageEl.textContent = "Enter your new password below.";
      messageEl.classList.remove("error");
      resetForm.classList.remove("hidden");

      resetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPassword = newPasswordEl.value.trim();

        if (!newPassword) {
          messageEl.textContent = "Password cannot be empty.";
          messageEl.classList.add("error");
          return;
        }

        const { data, error } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          messageEl.textContent = error.message;
          messageEl.classList.add("error");
        } else {
          messageEl.textContent = "✅ Password updated successfully! You can now log in.";
          messageEl.classList.remove("error");
          messageEl.classList.add("success");
          resetForm.classList.add("hidden");
        }
      });
    }
  });

  // --- Step 2: Fallback – direct access token handling ---
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (session) {
        messageEl.textContent = "Enter your new password below.";
        messageEl.classList.remove("error");
        resetForm.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error checking session:", err);
      messageEl.textContent = "Something went wrong. Please try again.";
      messageEl.classList.add("error");
    }
  } else {
    messageEl.textContent =
      "Invalid or expired link. Please request a new password reset from the login page.";
    messageEl.classList.add("error");
  }
});
