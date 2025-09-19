// js/supabase-client.js

// Import the Supabase library. We'll load this from a CDN in our HTML files.
const { createClient } = supabase;

// --- IMPORTANT ---
// Replace these with your actual Supabase Project URL and Anon Key
const SUPABASE_URL = 'https://vydzgpzcnmkgxwvvijmm.supabase.co'; // e.g., 'https://xyz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZHpncHpjbm1rZ3h3dnZpam1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MjAyNTIsImV4cCI6MjA3MDE5NjI1Mn0.a06PBVx6seL8ChwltEWS9ScJR-IfWmZBgil_X3hPJWw'; // e.g., 'ey...'

// If the URL or Key is missing, show an error to the developer.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
        'Supabase URL or Anon Key is missing. ' +
        'Make sure to replace "YOUR_SUPABASE_URL" and "YOUR_SUPABASE_ANON_KEY" in js/supabase-client.js'
    );
}

// Create the Supabase client
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Now, any other script can use the `supabaseClient` variable to talk to the database.
