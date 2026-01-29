// ============================================
// PRICING PAGE - v3.0 FINAL (No Conflicts)
// ============================================
// Dibungkus dalam IIFE untuk menghindari konflik variabel global
// ============================================

(function() {
    'use strict';
    
    // Local variables (tidak konflik dengan global)
    const EDGE_URL = `${SUPABASE_URL}/functions/v1`;
    let pricingUser = null;
    let pricingSubscription = null;

    // ========================================
    // INITIALIZATION
    // ========================================

    async function initPricing() {
        console.log('💳 Initializing pricing page...');
        console.log('📡 Edge Function URL:', EDGE_URL);
        
        try {
            const isLoggedIn = await checkAuth();
            
            if (isLoggedIn) {
                pricingUser = getCurrentUser();
                console.log('✅ User logged in:', pricingUser?.email);
                showUserUI();
                await loadSubscriptionInfo();
            } else {
                console.log('⚠️ User not logged in');
                showLoginUI();
            }
        } catch (error) {
            console.error('Init error:', error);
            showLoginUI();
        }
        
        setupEventListeners();
    }

    function showUserUI() {
        const loginBtn = document.getElementById('btn-login');
        const userSection = document.getElementById('user-section');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (userSection) userSection.style.display = 'flex';
        
        if (pricingUser) {
            const avatar = document.getElementById('user-avatar');
            const name = document.getElementById('user-name');
            
            if (avatar) {
                avatar.src = pricingUser.user_metadata?.avatar_url || 
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(pricingUser.email || 'U')}&background=6366f1&color=fff`;
            }
            if (name) {
                name.textContent = pricingUser.user_metadata?.full_name || pricingUser.email?.split('@')[0] || 'User';
            }
        }
    }

    function showLoginUI() {
        const loginBtn = document.getElementById('btn-login');
        const userSection = document.getElementById('user-section');
        const subInfo = document.getElementById('subscription-info');
        
        if (loginBtn) loginBtn.style.display = 'block';
        if (userSection) userSection.style.display = 'none';
        if (subInfo) subInfo.style.display = 'none';
    }

    // ========================================
    // LOAD SUBSCRIPTION INFO
    // ========================================

    async function loadSubscriptionInfo() {
        try {
            console.log('📊 Loading subscription info...');
            
            const { data, error } = await supabaseClient.rpc('get_my_subscription');
            
            if (error) {
                console.error('Error loading subscription:', error);
                return;
            }
            
            console.log('Subscription data:', data);
            
            if (data && data.length > 0) {
                pricingSubscription = data[0];
                updateSubscriptionUI();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function updateSubscriptionUI() {
        const sub = pricingSubscription;
        if (!sub) return;
        
        console.log('📦 Current plan:', sub.plan_id);
        
        const infoBox = document.getElementById('subscription-info');
        const planDisplay = document.getElementById('current-plan-display');
        const planExpiry = document.getElementById('current-plan-expiry');
        
        if (sub.plan_id && sub.plan_id !== 'free') {
            if (infoBox) infoBox.style.display = 'block';
            if (planDisplay) planDisplay.textContent = sub.plan_name || sub.plan_id;
            
            if (planExpiry && sub.expires_at) {
                const expiryDate = new Date(sub.expires_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
                const daysLeft = sub.days_remaining || 0;
                planExpiry.textContent = `Berlaku hingga ${expiryDate} (${daysLeft} hari lagi)`;
            }
        } else {
            if (infoBox) infoBox.style.display = 'none';
        }
        
        // Update buttons
        document.querySelectorAll('.pricing-card').forEach(card => {
            const planId = card.dataset.plan;
            const btn = card.querySelector('.btn-select-plan');
            if (!btn) return;
            
            // Remove existing badge
            const existingBadge = card.querySelector('.current-plan-badge');
            if (existingBadge) existingBadge.remove();
            
            if (planId === sub.plan_id) {
                btn.disabled = true;
                btn.textContent = '✓ Plan Aktif';
                btn.classList.remove('primary');
                btn.classList.add('secondary');
                
                const title = card.querySelector('h3');
                if (title && !title.querySelector('.current-plan-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'current-plan-badge';
                    badge.textContent = 'AKTIF';
                    title.appendChild(badge);
                }
            } else if (planId === 'free') {
                btn.disabled = true;
                btn.textContent = 'Plan Gratis';
            } else {
                btn.disabled = false;
                btn.classList.add('primary');
                btn.classList.remove('secondary');
                
                const prices = { basic: '25.000', pro: '75.000', unlimited: '150.000' };
                btn.textContent = `Pilih ${planId.charAt(0).toUpperCase() + planId.slice(1)} - Rp ${prices[planId]}`;
            }
        });
    }

    // ========================================
    // PAYMENT PROCESS
    // ========================================

    async function selectPlan(planId) {
        console.log('💳 Selected plan:', planId);
        
        if (!pricingUser) {
            alert('Silakan login terlebih dahulu untuk berlangganan');
            await loginWithGoogle();
            return;
        }
        
        if (planId === 'free') {
            return;
        }
        
        const planDetails = {
            basic: { name: 'Basic', price: 'Rp 25.000', limit: '5x generate/hari' },
            pro: { name: 'Pro', price: 'Rp 75.000', limit: '20x generate/hari' },
            unlimited: { name: 'Unlimited', price: 'Rp 150.000', limit: 'Unlimited generate' }
        };
        
        const plan = planDetails[planId];
        if (!plan) return;
        
        const confirmed = confirm(
            `🛒 Konfirmasi Pembelian\n\n` +
            `Plan: ${plan.name}\n` +
            `Harga: ${plan.price}\n` +
            `Benefit: ${plan.limit}\n` +
            `Durasi: 30 hari\n\n` +
            `Lanjutkan ke pembayaran?`
        );
        
        if (!confirmed) return;
        
        showLoading(true);
        
        try {
            // Step 1: Create order in database
            console.log('📝 Creating payment order...');
            
            const { data: orderData, error: orderError } = await supabaseClient
                .rpc('create_payment_order', { p_plan_id: planId });
            
            if (orderError) {
                throw new Error(orderError.message);
            }
            
            if (!orderData || orderData.length === 0 || !orderData[0].success) {
                throw new Error(orderData?.[0]?.message || 'Failed to create order');
            }
            
            const order = orderData[0];
            console.log('✅ Order created:', order);
            
            // Step 2: Get Midtrans token via Edge Function
            console.log('🔑 Getting Midtrans token...');
            
            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session) {
                throw new Error('Session expired. Please login again.');
            }
            
            const response = await fetch(`${EDGE_URL}/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    plan_id: planId,
                    order_id: order.order_id,
                    amount: order.amount,
                    plan_name: order.plan_name
                })
            });
            
            const result = await response.json();
            console.log('Midtrans response:', result);
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to create payment');
            }
            
            showLoading(false);
            
            // Step 3: Open Midtrans Snap
            console.log('🔓 Opening Midtrans Snap...');
            
            if (typeof window.snap === 'undefined') {
                throw new Error('Midtrans Snap not loaded. Please refresh the page.');
            }
            
            window.snap.pay(result.snap_token, {
                onSuccess: function(snapResult) {
                    console.log('✅ Payment success:', snapResult);
                    alert('🎉 Pembayaran berhasil!\n\nPlan Anda akan segera diaktifkan.');
                    setTimeout(() => window.location.reload(), 1500);
                },
                onPending: function(snapResult) {
                    console.log('⏳ Payment pending:', snapResult);
                    alert(
                        '⏳ Pembayaran Pending\n\n' +
                        'Silakan selesaikan pembayaran Anda.\n' +
                        'Plan akan aktif setelah pembayaran dikonfirmasi.'
                    );
                },
                onError: function(snapResult) {
                    console.error('❌ Payment error:', snapResult);
                    alert('❌ Pembayaran gagal.\n\nSilakan coba lagi.');
                },
                onClose: function() {
                    console.log('Payment popup closed without completing payment');
                }
            });
            
        } catch (error) {
            console.error('❌ Payment error:', error);
            alert('❌ Error: ' + error.message);
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
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const planId = btn.dataset.plan;
                console.log('🖱️ Button clicked:', planId);
                if (planId && !btn.disabled) {
                    selectPlan(planId);
                }
            });
        });
        
        // Login button
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await loginWithGoogle();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await logout();
                window.location.reload();
            });
        }
        
        console.log('✅ Event listeners ready');
    }

    // ========================================
    // START
    // ========================================

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPricing);
    } else {
        initPricing();
    }

    console.log('✅ Pricing.js v3.0 loaded');

})(); // End IIFE
