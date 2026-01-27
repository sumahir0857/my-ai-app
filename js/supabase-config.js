// Supabase Configuration
const SUPABASE_URL = 'https://xhjwmhoxrszzrwsmqhxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoandtaG94cnN6enJ3c21xaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDg1MjUsImV4cCI6MjA4MzAyNDUyNX0.JfMp7BY0PMhTc3xV2CoM6fTLsHSIrLyJyj9WMgeVFDM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth state
let currentUser = null;

// Check auth on page load
async function checkAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

// Login with Google
async function loginWithGoogle() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/generator.html'
            }
        });
        if (error) {
            console.error('Login error:', error);
            alert('Gagal login: ' + error.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Gagal login. Silakan coba lagi.');
    }
}

// Logout
async function logout() {
    try {
        await supabase.auth.signOut();
        currentUser = null;
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
    } else {
        currentUser = null;
    }
});

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}
