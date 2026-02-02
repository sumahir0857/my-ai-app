// Supabase Configuration
const SUPABASE_URL = 'https://xhjwmhoxrszzrwsmqhxi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoandtaG94cnN6enJ3c21xaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDg1MjUsImV4cCI6MjA4MzAyNDUyNX0.JfMp7BY0PMhTc3xV2CoM6fTLsHSIrLyJyj9WMgeVFDM';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
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

// Login with Google - redirect ke halaman yang sama
async function loginWithGoogle() {
    try {
        // Ambil nama halaman saat ini untuk redirect balik
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/' + currentPage
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

async function logout() {
    try {
        await supabaseClient.auth.signOut();
        currentUser = null;
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
    } else {
        currentUser = null;
    }
});

function getCurrentUser() {
    return currentUser;
}

function isLoggedIn() {
    return currentUser !== null;
}

window.supabaseClient = supabaseClient;

console.log('✅ Supabase config loaded successfully');
