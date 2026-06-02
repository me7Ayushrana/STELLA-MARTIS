// Stella Martis — Supabase Configuration
// Replace these placeholders with your actual Supabase URL and Anon Key from:
// Settings -> API -> Project API Keys (https://supabase.com/dashboard/project/_/settings/api)

const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key";

let supabase;

if (window.supabase) {
  // If actual keys aren't set, try reading from localStorage for dynamic/testing override
  const activeUrl = SUPABASE_URL.includes("your-project-id") ? (localStorage.getItem("SM_SUPABASE_URL") || SUPABASE_URL) : SUPABASE_URL;
  const activeKey = SUPABASE_ANON_KEY.includes("your-anon-key") ? (localStorage.getItem("SM_SUPABASE_ANON_KEY") || SUPABASE_ANON_KEY) : SUPABASE_ANON_KEY;

  try {
    supabase = window.supabase.createClient(activeUrl, activeKey);
  } catch (err) {
    console.error("Supabase Initialization Error:", err);
  }
} else {
  console.error("Supabase CDN failed to load. Please check your network connection.");
}
