// ============================================
// PRICING PAGE - v1.0
// ============================================

// Supabase Edge Function URL
const EDGE_FUNCTION_URL = 'https://xhjwmhoxrszzrwsmqhxi.supabase.co/functions/v1';

let currentUser = null;
let currentSubscription = null;

// ========================================
// INITIALIZATION
// ========================================

async function initPricing() {
    console.log('💳 Initializing pricing page...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        currentUser = getCurrentUser();
        showUserUI();
        await loadSubscriptionInfo();
    } else {
        showLoginUI();
    }
    
    setupEventListeners();
}

function showUserUI() {
    document.getElementById('btn-login').style.display = 'none';
    document.getElementById('user-info').style.display = 'flex';
    
    if (currentUser) {
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        
        if (avatar) {
            avatar.src = currentUser.user_metadata?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.email)}&background=6366f1&color=fff`;
        }
        if (name) {
            name.textContent = currentUser.user_metadata?.full_name || currentUser.email;
        }
    }
}

function showLoginUI() {
    document.getElementById('btn-login').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('subscription-info').style.display = 'none';
}

// ========================================
// LOAD SUBSCRIPTION INFO
// ========================================

async function loadSubscriptionInfo() {
    try {
        const { data, error } = await supabaseClient.rpc('get_my_subscription');
        
        if (error) {
            console.error('Error loading subscription:', error);
            return;
        }
        
        if (data && data.length > 0) {
            currentSubscription = data[0];
            updateSubscriptionUI();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateSubscriptionUI() {
    const sub = currentSubscription;
    if (!sub) return;
    
    // Update subscription info box
    const infoBox = document.getElementById('subscription-info');
    const planName = document.getElementById('current-plan-name');
    const planExpiry = document.getElementById('current-plan-expiry');
    
    if (sub.plan_id !== 'free') {
        infoBox.style.display = 'block';
        planName.textContent = sub.plan_name;
        
        if (sub.expires_at) {
            const expiryDate = new Date(sub.expires_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            planExpiry.textContent = `Berlaku hingga ${expiryDate} (${sub.days_remaining} hari lagi)`;
        }
    } else {
        infoBox.style.display = 'none';
    }
    
    // Update pricing cards
    document.querySelectorAll('.pricing-card').forEach(card => {
        const planId = card.dataset.plan;
        const btn = card.querySelector('.btn-select-plan');
        
        // Remove existing badge
        const existingBadge = card.querySelector('.current-plan-badge');
        if (existingBadge) existingBadge.remove();
        
        if (planId === sub.plan_id) {
            // Current plan
            btn.disabled = true;
            btn.textContent = 'Plan Aktif';
            btn.classList.remove('primary');
            btn.classList.add('secondary');
            
            // Add badge
            const badge = document.createElement('span');
            badge.className = 'current-plan-badge';
            badge.textContent = 'PLAN ANDA';
            card.querySelector('h3').after(badge);
        } else if (planId === 'free') {
            btn.disabled = true;
            btn.textContent = 'Plan Gratis';
        } else {
            btn.disabled = false;
            btn.classList.add('primary');
            btn.classList.remove('secondary');
        }
    });
}

// ========================================
// PAYMENT PROCESS
// ========================================

async function selectPlan(planId) {
    if (!currentUser) {
        // Redirect to login
        alert('Silakan login terlebih dahulu');
        await loginWithGoogle();
        return;
    }
    
    if (planId === 'free') {
        alert('Anda sudah menggunakan plan gratis');
        return;
    }
    
    // Confirm purchase
    const planNames = {
        basic: 'Basic (Rp 25.000)',
        pro: 'Pro (Rp 75.000)',
        unlimited: 'Unlimited (Rp 150.000)'
    };
    
    const confirmed = confirm(
        `Anda akan berlangganan ${planNames[planId]} untuk 30 hari.\n\nLanjutkan ke pembayaran?`
    );
    
    if (!confirmed) return;
    
    showLoading(true);
    
    try {
        // Get session token
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (!session) {
            throw new Error('Session expired. Please login again.');
        }
        
        // Call edge function to create payment
        const response = await fetch(`${EDGE_FUNCTION_URL}/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ plan_id: planId })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Failed to create payment');
        }
        
        console.log('Payment created:', result);
        
        // Open Midtrans Snap
        showLoading(false);
        
        window.snap.pay(result.snap_token, {
            onSuccess: function(result) {
                console.log('Payment success:', result);
                alert('Pembayaran berhasil! Plan Anda akan segera diaktifkan.');
                window.location.reload();
            },
            onPending: function(result) {
                console.log('Payment pending:', result);
                alert('Pembayaran pending. Silakan selesaikan pembayaran Anda.');
                window.location.href = '/payment-pending.html?order_id=' + result.order_id;
            },
            onError: function(result) {
                console.error('Payment error:', result);
                alert('Pembayaran gagal. Silakan coba lagi.');
            },
            onClose: function() {
                console.log('Payment popup closed');
            }
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        alert('Error: ' + error.message);
        showLoading(false);
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('active', show);
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Plan selection buttons
    document.querySelectorAll('.btn-select-plan').forEach(btn => {
        btn.addEventListener('click', () => {
            const planId = btn.dataset.plan;
            selectPlan(planId);
        });
    });
    
    // Login button
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            await loginWithGoogle();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await logout();
            window.location.reload();
        });
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener('DOMContentLoaded', initPricing);

console.log('✅ Pricing.js loaded');
