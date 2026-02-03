// ============================================
// VIDEO API GENERATOR v3.1 - FIXED
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;
let userStats = {};
let isNewUser = false;

// ============================================
// MODEL PRICING (Updated)
// ============================================

const MODEL_PRICING = {
    // Kling
    "kling-2-5-pro": 38,
    "kling-o1-pro-i2v": 56,
    "kling-o1-std-i2v": 42,
    "kling-o1-pro-ref": 84,
    "kling-o1-std-ref": 63,
    "kling-2-6-pro": 35,
    "kling-2-6-motion-pro": 70,
    "kling-2-6-motion-std": 35,
    "kling-2-1-pro": 50,
    "kling-1-6-pro": 51,
    "kling-1-6-std": 30,
    // MiniMax
    "minimax-live": 50,
    "minimax-hailuo-1080p": 49,
    "minimax-hailuo-1080p-fast": 33,
    "minimax-hailuo-768p": 28,
    "minimax-hailuo-768p-fast": 19,
    // WAN
    "wan-i2v-720p": 50,
    "wan-i2v-1080p": 75,
    "wan-t2v-720p": 50,
    "wan-t2v-1080p": 75,
    // Seedance
    "seedance-480p": 13,
    "seedance-720p": 28,
    "seedance-1080p": 31,
    // LTX
    "ltx-t2v": 30,
    "ltx-i2v": 30,
    // Others
    "runway-gen4": 75,
    "omnihuman": 81,
    "vfx": 9,
};

// ============================================
// CREDIT PACKAGES
// ============================================

const CREDIT_PACKAGES = [
    { id: 'starter', name: 'Starter', credits: 500, price: 25000, pricePerCredit: 50 },
    { id: 'creator', name: 'Creator', credits: 1000, price: 45000, pricePerCredit: 45 },
    { id: 'pro', name: 'Pro', credits: 2500, price: 100000, pricePerCredit: 40, popular: true },
    { id: 'studio', name: 'Studio', credits: 5000, price: 180000, pricePerCredit: 36, bestValue: true },
];

// ============================================
// MODEL CONFIGURATIONS
// ============================================

const MODEL_CONFIGS = {
    // Kling Models
    'kling-2-5-pro': {
        type: 'image_to_video',
        desc: 'Model terbaru dengan kualitas tinggi',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true
    },
    'kling-2-6-pro': {
        type: 'kling_2_6',
        desc: 'Text/Image to Video dengan audio generation',
        showImage: true, showNegative: true, showCfg: true, 
        showAspectKling26: true, showGenerateAudio: true
    },
    'kling-2-1-pro': {
        type: 'image_to_video',
        desc: 'Model 2.1 Pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true
    },
    'kling-1-6-pro': {
        type: 'image_to_video',
        desc: 'Model klasik dengan kualitas pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true
    },
    'kling-1-6-std': {
        type: 'image_to_video',
        desc: 'Model hemat biaya',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true
    },
    'kling-o1-pro-i2v': {
        type: 'kling_o1',
        desc: 'Kling O1 Pro - Image to Video dengan first/last frame',
        showFrames: true, showAspectRatio: true
    },
    'kling-o1-std-i2v': {
        type: 'kling_o1',
        desc: 'Kling O1 Standard - Image to Video',
        showFrames: true, showAspectRatio: true
    },
    'kling-o1-pro-ref': {
        type: 'kling_o1_reference',
        desc: 'Video Reference dengan max 7 gambar referensi',
        showRefImages: true, showAspectRatio: true
    },
    'kling-o1-std-ref': {
        type: 'kling_o1_reference',
        desc: 'Video Reference Standard',
        showRefImages: true, showAspectRatio: true
    },
    'kling-2-6-motion-pro': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control - Character Image + Motion Video',
        showMotion: true, showCfg: true
    },
    'kling-2-6-motion-std': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control Standard',
        showMotion: true, showCfg: true
    },
    
    // MiniMax Models
    'minimax-live': {
        type: 'minimax_live',
        desc: 'MiniMax Live Mode',
        showImage: true, showPromptOptimizer: true
    },
    'minimax-hailuo-1080p': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 1080p - 6 detik',
        showFrames: true, showPromptOptimizer: true
    },
    'minimax-hailuo-1080p-fast': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 1080p Fast',
        showFrames: true, showPromptOptimizer: true
    },
    'minimax-hailuo-768p': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 768p - 6 detik',
        showFrames: true, showPromptOptimizer: true
    },
    'minimax-hailuo-768p-fast': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 768p Fast',
        showFrames: true, showPromptOptimizer: true
    },
    
    // WAN Models
    'wan-i2v-720p': {
        type: 'wan_i2v',
        desc: 'WAN Image to Video 720p',
        showImage: true, showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-i2v-1080p': {
        type: 'wan_i2v',
        desc: 'WAN Image to Video 1080p',
        showImage: true, showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-t2v-720p': {
        type: 'wan_t2v',
        desc: 'WAN Text to Video 720p',
        showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-t2v-1080p': {
        type: 'wan_t2v',
        desc: 'WAN Text to Video 1080p',
        showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    
    // Seedance Models
    'seedance-480p': {
        type: 'seedance',
        desc: 'Seedance 480p - paling hemat',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    'seedance-720p': {
        type: 'seedance',
        desc: 'Seedance 720p',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    'seedance-1080p': {
        type: 'seedance',
        desc: 'Seedance 1080p',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    
    // LTX Models
    'ltx-t2v': {
        type: 'ltx_t2v',
        desc: 'LTX Text to Video',
        showLtxResolution: true, showGenerateAudio: true, showFps: true, showSeed: true
    },
    'ltx-i2v': {
        type: 'ltx_i2v',
        desc: 'LTX Image to Video',
        showImage: true, showLtxResolution: true, 
        showGenerateAudio: true, showFps: true, showSeed: true
    },
    
    // RunWay
    'runway-gen4': {
        type: 'runway',
        desc: 'RunWay Gen4 Turbo',
        showImage: true, showRunwayRatio: true, showSeed: true
    },
    
    // OmniHuman
    'omnihuman': {
        type: 'omnihuman',
        desc: 'OmniHuman - Portrait animation dengan audio',
        showOmnihuman: true
    },
    
    // VFX
    'vfx': {
        type: 'vfx',
        desc: 'Apply visual effects ke video',
        showVfx: true, noPrompt: true
    }
};

// ============================================
// CONSTANTS
// ============================================

const MAX_JOBS_PER_USER = 5;
const POLLING_INTERVAL_MS = 5000;

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v3.1 loading...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showGeneratorUI();
        await initializeUser();
        setupEventListeners();
        startPolling();
    } else {
        showLoginUI();
    }
});

async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

function showLoginUI() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('generator-section').style.display = 'none';
    
    document.getElementById('btn-login-google').addEventListener('click', async () => {
        try {
            await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.href }
            });
        } catch (error) {
            alert('Login gagal: ' + error.message);
        }
    });
}

function showGeneratorUI() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('generator-section').style.display = 'block';
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    } catch (error) {
        return null;
    }
}

// ============================================
// INITIALIZE USER (with free trial check)
// ============================================

async function initializeUser() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        // Update UI with user info
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) {
            document.getElementById('user-avatar').src = avatarUrl;
        }
        
        // Try to get or create user credits
        let creditData = null;
        
        // First, try the new function
        try {
            const { data, error } = await supabaseClient
                .rpc('get_or_create_user_credits', { p_user_id: user.id });
            
            if (!error && data) {
                creditData = data;
            }
        } catch (e) {
            console.log('get_or_create_user_credits not available, falling back...');
        }
        
        // Fallback: directly query user_credits
        if (!creditData) {
            const { data: credits, error } = await supabaseClient
                .from('user_credits')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code === 'PGRST116') {
                // No credits found, create new with free trial
                const { data: newCredits, error: insertError } = await supabaseClient
                    .from('user_credits')
                    .insert({
                        user_id: user.id,
                        balance: 50, // Free trial
                        total_purchased: 0,
                        total_used: 0,
                        total_refunded: 0
                    })
                    .select()
                    .single();
                
                if (!insertError && newCredits) {
                    creditData = {
                        balance: newCredits.balance,
                        total_used: 0,
                        total_refunded: 0,
                        is_new_user: true
                    };
                }
            } else if (credits) {
                creditData = {
                    balance: credits.balance,
                    total_used: credits.total_used || 0,
                    total_refunded: credits.total_refunded || 0,
                    is_new_user: false
                };
            }
        }
        
        if (creditData) {
            userCredits = creditData.balance || 0;
            userStats = creditData;
            isNewUser = creditData.is_new_user || false;
            
            updateCreditsUI();
            
            // Show welcome message for new users
            if (isNewUser) {
                setTimeout(() => {
                    alert(`🎉 Selamat datang!\n\nAnda mendapat 50 kredit GRATIS untuk mencoba layanan kami.\n\nCobalah model Seedance 480p (13 kredit) atau VFX (9 kredit) untuk memulai!`);
                }, 1000);
            }
        }
        
        // Load jobs
        await loadJobs();
        
    } catch (error) {
        console.error('Initialize user error:', error);
    }
}

// ============================================
// CREDITS UI
// ============================================

function updateCreditsUI() {
    const creditsFormatted = userCredits.toLocaleString('id-ID');
    
    document.getElementById('user-credits').textContent = creditsFormatted;
    document.getElementById('stat-credits').textContent = creditsFormatted;
    document.getElementById('stat-used').textContent = (userStats.total_used || 0).toLocaleString('id-ID');
    document.getElementById('stat-refunded').textContent = (userStats.total_refunded || 0).toLocaleString('id-ID');
    
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) {
        modalCredits.textContent = creditsFormatted + ' kredit';
    }
}

async function loadUserCredits() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data, error } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (!error && data) {
            userCredits = data.balance || 0;
            userStats = {
                balance: data.balance,
                total_used: data.total_used || 0,
                total_refunded: data.total_refunded || 0
            };
            updateCreditsUI();
        }
    } catch (error) {
        console.error('Load credits error:', error);
    }
}

// ============================================
// MODEL UI UPDATE
// ============================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const credits = MODEL_PRICING[modelId] || 30;
    
    if (!config) return;
    
    // Update credits display
    document.getElementById('estimated-credits').textContent = credits;
    document.getElementById('total-credits').textContent = credits;
    document.getElementById('model-desc').textContent = config.desc || '';
    
    // Hide all optional sections
    const sections = [
        'section-image', 'section-frames', 'section-ref-images', 
        'section-motion', 'section-omnihuman', 'section-vfx',
        'group-image-tail', 'group-negative-prompt', 'group-cfg-scale',
        'group-aspect-ratio', 'group-aspect-ratio-kling26', 'group-aspect-ratio-seedance',
        'group-runway-ratio', 'group-wan-size', 'group-ltx-resolution',
        'group-seed', 'group-fps',
        'check-generate-audio', 'check-prompt-optimizer', 'check-prompt-expansion',
        'check-camera-fixed', 'group-shot-type'
    ];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Show prompt section unless noPrompt
    const promptSection = document.getElementById('section-prompt');
    if (promptSection) {
        promptSection.style.display = config.noPrompt ? 'none' : 'block';
    }
    
    // Show relevant sections based on config
    if (config.showImage) {
        const sectionImage = document.getElementById('section-image');
        const groupImage = document.getElementById('group-image');
        if (sectionImage) sectionImage.style.display = 'block';
        if (groupImage) groupImage.style.display = 'block';
    }
    if (config.showImageTail) {
        const el = document.getElementById('group-image-tail');
        if (el) el.style.display = 'block';
    }
    if (config.showNegative) {
        const el = document.getElementById('group-negative-prompt');
        if (el) el.style.display = 'block';
    }
    if (config.showCfg) {
        const el = document.getElementById('group-cfg-scale');
        if (el) el.style.display = 'block';
    }
    if (config.showFrames) {
        const el = document.getElementById('section-frames');
        if (el) el.style.display = 'block';
    }
    if (config.showRefImages) {
        const el = document.getElementById('section-ref-images');
        if (el) el.style.display = 'block';
    }
    if (config.showMotion) {
        const el = document.getElementById('section-motion');
        if (el) el.style.display = 'block';
    }
    if (config.showOmnihuman) {
        const el = document.getElementById('section-omnihuman');
        if (el) el.style.display = 'block';
    }
    if (config.showVfx) {
        const el = document.getElementById('section-vfx');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectRatio) {
        const el = document.getElementById('group-aspect-ratio');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectKling26) {
        const el = document.getElementById('group-aspect-ratio-kling26');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectSeedance) {
        const el = document.getElementById('group-aspect-ratio-seedance');
        if (el) el.style.display = 'block';
    }
    if (config.showRunwayRatio) {
        const el = document.getElementById('group-runway-ratio');
        if (el) el.style.display = 'block';
    }
    if (config.showWanSize) {
        const el = document.getElementById('group-wan-size');
        if (el) el.style.display = 'block';
    }
    if (config.showLtxResolution) {
        const el = document.getElementById('group-ltx-resolution');
        if (el) el.style.display = 'block';
    }
    if (config.showSeed) {
        const el = document.getElementById('group-seed');
        if (el) el.style.display = 'block';
    }
    if (config.showFps) {
        const el = document.getElementById('group-fps');
        if (el) el.style.display = 'block';
    }
    if (config.showGenerateAudio) {
        const el = document.getElementById('check-generate-audio');
        if (el) el.style.display = 'flex';
    }
    if (config.showPromptOptimizer) {
        const el = document.getElementById('check-prompt-optimizer');
        if (el) el.style.display = 'flex';
    }
    if (config.showPromptExpansion) {
        const el = document.getElementById('check-prompt-expansion');
        if (el) el.style.display = 'flex';
    }
    if (config.showCameraFixed) {
        const el = document.getElementById('check-camera-fixed');
        if (el) el.style.display = 'flex';
    }
    if (config.showShotType) {
        const el = document.getElementById('group-shot-type');
        if (el) el.style.display = 'block';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Model change
    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateModelUI);
    }
    
    // Initialize model UI
    updateModelUI();
    
    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', () => {
            const cfgValue = document.getElementById('cfg-value');
            if (cfgValue) cfgValue.textContent = cfgSlider.value;
        });
    }
    
    // File uploads with preview
    setupFileUpload('input-image', 'preview-image', 'btn-remove-image');
    setupFileUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileUpload('input-first-frame', 'preview-first-frame');
    setupFileUpload('input-last-frame', 'preview-last-frame');
    setupFileUpload('input-motion-image', 'preview-motion-image');
    setupFileUpload('input-motion-video', 'preview-motion-video', null, true);
    setupFileUpload('input-omni-image', 'preview-omni-image');
    setupFileUpload('input-omni-audio', 'preview-omni-audio', null, false, true);
    setupFileUpload('input-vfx-video', 'preview-vfx-video', null, true);
    
    // Reference images
    for (let i = 1; i <= 7; i++) {
        setupFileUpload(`input-ref-${i}`, `preview-ref-${i}`);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Form submit
    const form = document.getElementById('generator-form');
    if (form) {
        form.addEventListener('submit', submitJob);
    }
    
    // Buy credits button
    const buyBtn = document.getElementById('btn-buy-credits');
    if (buyBtn) {
        buyBtn.addEventListener('click', openCreditsModal);
    }
    
    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    }
    
    // Modal close
    const closeModalBtn = document.getElementById('btn-close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeJobModal);
    }
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) {
        jobModal.addEventListener('click', (e) => {
            if (e.target.id === 'job-modal') closeJobModal();
        });
    }
    
    // VFX filter change
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const filterType = parseInt(filterSelect.value);
            const bloomGroup = document.getElementById('group-bloom-contrast');
            const motionGroup = document.getElementById('group-motion-blur');
            if (bloomGroup) bloomGroup.style.display = filterType === 7 ? 'block' : 'none';
            if (motionGroup) motionGroup.style.display = filterType === 2 ? 'block' : 'none';
        });
    }
    
    // Bloom slider
    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) {
        bloomSlider.addEventListener('input', () => {
            const bloomValue = document.getElementById('bloom-value');
            if (bloomValue) bloomValue.textContent = bloomSlider.value;
        });
    }
    
    // Motion decay slider
    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) {
        decaySlider.addEventListener('input', () => {
            const decayValue = document.getElementById('decay-value');
            if (decayValue) decayValue.textContent = decaySlider.value;
        });
    }
}

function setupFileUpload(inputId, previewId, removeId = null, isVideo = false, isAudio = false) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        
        const placeholder = preview.parentElement.querySelector('.upload-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        preview.parentElement.classList.add('has-preview');
        
        if (removeId) {
            const removeBtn = document.getElementById(removeId);
            if (removeBtn) removeBtn.style.display = 'block';
        }
    });
    
    if (removeId) {
        const removeBtn = document.getElementById(removeId);
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                input.value = '';
                preview.src = '';
                preview.style.display = 'none';
                
                const placeholder = preview.parentElement.querySelector('.upload-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                
                preview.parentElement.classList.remove('has-preview');
                removeBtn.style.display = 'none';
            });
        }
    }
}

// ============================================
// SUBMIT JOB - FIXED v2
// ============================================

async function submitJob(event) {
    event.preventDefault();
    
    const user = await getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const requiredCredits = MODEL_PRICING[modelId] || 30;
    
    if (!config) {
        alert('Model tidak valid');
        return;
    }
    
    // Check active jobs limit
    const activeJobsCount = userJobs.filter(j => ['pending', 'processing'].includes(j.status)).length;
    if (activeJobsCount >= MAX_JOBS_PER_USER) {
        alert(`Anda sudah memiliki ${activeJobsCount} job yang sedang berjalan.\n\nMaksimal ${MAX_JOBS_PER_USER} job bersamaan.\nTunggu job selesai atau batalkan yang tidak perlu.`);
        return;
    }
    
    // Get prompt
    const promptEl = document.getElementById('input-prompt');
    const prompt = promptEl?.value?.trim() || '';
    if (!prompt && !config.noPrompt) {
        alert('Prompt wajib diisi!');
        return;
    }
    
    // Check credits
    if (userCredits < requiredCredits) {
        alert(`Kredit tidak mencukupi!\n\nDibutuhkan: ${requiredCredits} kredit\nSaldo: ${userCredits} kredit`);
        openCreditsModal();
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Memproses...';
    
    try {
        // Collect input data first
        const inputData = await collectInputData(modelId, config, prompt, requiredCredits, user.id);
        
        // Get current credits
        const { data: currentCredits, error: fetchError } = await supabaseClient
            .from('user_credits')
            .select('balance, total_used')
            .eq('user_id', user.id)
            .single();
        
        if (fetchError || !currentCredits) {
            throw new Error('Gagal mengambil data kredit');
        }
        
        if (currentCredits.balance < requiredCredits) {
            throw new Error('Kredit tidak mencukupi');
        }
        
        const newBalance = currentCredits.balance - requiredCredits;
        const newTotalUsed = (currentCredits.total_used || 0) + requiredCredits;
        
        // Update credits
        const { error: updateError } = await supabaseClient
            .from('user_credits')
            .update({ 
                balance: newBalance,
                total_used: newTotalUsed,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        
        if (updateError) {
            throw new Error('Gagal memotong kredit: ' + updateError.message);
        }
        
        userCredits = newBalance;
        userStats.total_used = newTotalUsed;
        updateCreditsUI();
        
        // Create job
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .insert({
                user_id: user.id,
                service: 'videoapi',
                status: 'pending',
                input_data: inputData,
                total_steps: 4,
                current_step: 0,
                step_name: 'Queued',
                progress_percent: 0
            })
            .select()
            .single();
        
        if (jobError) {
            // Refund on failure
            await supabaseClient
                .from('user_credits')
                .update({ 
                    balance: currentCredits.balance,
                    total_used: currentCredits.total_used || 0
                })
                .eq('user_id', user.id);
            
            userCredits = currentCredits.balance;
            userStats.total_used = currentCredits.total_used || 0;
            updateCreditsUI();
            
            throw new Error('Gagal membuat job: ' + jobError.message);
        }
        
        alert(`✅ Job berhasil dibuat!\n\nModel: ${modelId}\nKredit: ${requiredCredits}\nSisa: ${userCredits}\n\nProses akan memakan waktu 5-15 menit.`);
        
        resetForm();
        switchTab('active');
        await loadJobs();
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('Gagal: ' + error.message);
        await loadUserCredits();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 Generate Video';
    }
}

async function collectInputData(modelId, config, prompt, credits, userId) {
    const data = {
        model_id: modelId,
        prompt: prompt,
        negative_prompt: document.getElementById('input-negative')?.value || '',
        credits_used: credits,
        user_id: userId,
        settings: {}
    };
    
    const settings = data.settings;
    
    // CFG Scale
    if (config.showCfg) {
        settings.cfg_scale = parseFloat(document.getElementById('input-cfg')?.value || 0.5);
    }
    
    // Seed
    if (config.showSeed) {
        settings.seed = parseInt(document.getElementById('input-seed')?.value || -1);
    }
    
    // FPS
    if (config.showFps) {
        settings.fps = parseInt(document.getElementById('input-fps')?.value || 25);
    }
    
    // Aspect ratios
    if (config.showAspectRatio) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio')?.value;
    }
    if (config.showAspectKling26) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio-kling26')?.value;
    }
    if (config.showAspectSeedance) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio-seedance')?.value;
    }
    if (config.showRunwayRatio) {
        settings.runway_ratio = document.getElementById('input-runway-ratio')?.value;
    }
    if (config.showWanSize) {
        settings.wan_size = document.getElementById('input-wan-size')?.value;
    }
    if (config.showLtxResolution) {
        settings.resolution = document.getElementById('input-ltx-resolution')?.value;
    }
    
    // Checkboxes
    if (config.showGenerateAudio) {
        settings.generate_audio = document.getElementById('input-generate-audio')?.checked || false;
    }
    if (config.showPromptOptimizer) {
        settings.prompt_optimizer = document.getElementById('input-prompt-optimizer')?.checked ?? true;
    }
    if (config.showPromptExpansion) {
        settings.enable_prompt_expansion = document.getElementById('input-prompt-expansion')?.checked || false;
    }
    if (config.showCameraFixed) {
        settings.camera_fixed = document.getElementById('input-camera-fixed')?.checked || false;
    }
    if (config.showShotType) {
        settings.shot_type = document.getElementById('input-shot-type')?.value || 'single';
    }
    
    // Image uploads
    if (config.showImage) {
        const imgFile = document.getElementById('input-image')?.files[0];
        if (imgFile) settings.image = await fileToBase64(imgFile);
    }
    if (config.showImageTail) {
        const tailFile = document.getElementById('input-image-tail')?.files[0];
        if (tailFile) settings.image_tail = await fileToBase64(tailFile);
    }
    
    // First/Last frames
    if (config.showFrames) {
        const firstFile = document.getElementById('input-first-frame')?.files[0];
        if (firstFile) settings.first_frame = await fileToBase64(firstFile);
        
        const lastFile = document.getElementById('input-last-frame')?.files[0];
        if (lastFile) settings.last_frame = await fileToBase64(lastFile);
    }
    
    // Reference images
    if (config.showRefImages) {
        const refImages = [];
        for (let i = 1; i <= 7; i++) {
            const refFile = document.getElementById(`input-ref-${i}`)?.files[0];
            if (refFile) refImages.push(await fileToBase64(refFile));
        }
        if (refImages.length > 0) settings.reference_images = refImages;
    }
    
    // Motion control
    if (config.showMotion) {
        const motionImg = document.getElementById('input-motion-image')?.files[0];
        const motionVid = document.getElementById('input-motion-video')?.files[0];
        
        if (!motionImg || !motionVid) {
            throw new Error('Motion Control membutuhkan gambar karakter DAN video gerakan!');
        }
        
        settings.motion_image = await fileToBase64(motionImg);
        settings.motion_video = await fileToBase64(motionVid);
        settings.character_orientation = document.getElementById('input-character-orientation')?.value || 'video';
    }
    
    // OmniHuman
    if (config.showOmnihuman) {
        const omniImg = document.getElementById('input-omni-image')?.files[0];
        const omniAudio = document.getElementById('input-omni-audio')?.files[0];
        
        if (!omniImg || !omniAudio) {
            throw new Error('OmniHuman membutuhkan gambar manusia DAN audio!');
        }
        
        settings.omni_image = await fileToBase64(omniImg);
        settings.omni_audio = await fileToBase64(omniAudio);
        settings.resolution = document.getElementById('input-omni-resolution')?.value || '1080p';
        settings.turbo_mode = document.getElementById('input-turbo-mode')?.checked || false;
    }
    
    // VFX
    if (config.showVfx) {
        const vfxVid = document.getElementById('input-vfx-video')?.files[0];
        if (!vfxVid) {
            throw new Error('VFX membutuhkan video input!');
        }
        
        settings.vfx_video = await fileToBase64(vfxVid);
        settings.filter_type = parseInt(document.getElementById('input-filter-type')?.value || 1);
        settings.fps = parseInt(document.getElementById('input-vfx-fps')?.value || 24);
        
        if (settings.filter_type === 7) {
            settings.bloom_contrast = parseFloat(document.getElementById('input-bloom-contrast')?.value || 1.2);
        }
        if (settings.filter_type === 2) {
            settings.motion_kernel = parseInt(document.getElementById('input-motion-kernel')?.value || 5);
            settings.motion_decay = parseFloat(document.getElementById('input-motion-decay')?.value || 0.8);
        }
    }
    
    return data;
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
    });
}

function resetForm() {
    const form = document.getElementById('generator-form');
    if (form) form.reset();
    
    document.querySelectorAll('.upload-preview').forEach(el => {
        el.style.display = 'none';
        el.src = '';
    });
    document.querySelectorAll('.upload-box').forEach(el => el.classList.remove('has-preview'));
    document.querySelectorAll('.btn-remove-upload').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.upload-placeholder').forEach(el => el.style.display = 'flex');
    
    updateModelUI();
}

// ============================================
// LOAD & RENDER JOBS
// ============================================

async function loadJobs() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'videoapi')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        userJobs = jobs || [];
        renderJobs();
        
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status));
    
    // Update counts
    const activeCount = document.getElementById('active-count');
    const historyCount = document.getElementById('history-count');
    if (activeCount) activeCount.textContent = activeJobs.length;
    if (historyCount) historyCount.textContent = historyJobs.length;
    
    // Render active jobs
    const activeContainer = document.getElementById('active-jobs');
    if (activeContainer) {
        if (activeJobs.length === 0) {
            activeContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🚀</span>
                    <p>Tidak ada proses berjalan</p>
                    <p class="empty-sub">Submit job baru untuk memulai</p>
                </div>
            `;
        } else {
            activeContainer.innerHTML = activeJobs.map(job => renderJobCard(job, true)).join('');
        }
    }
    
    // Render history
    const historyContainer = document.getElementById('history-jobs');
    if (historyContainer) {
        if (historyJobs.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📁</span>
                    <p>Belum ada riwayat</p>
                </div>
            `;
        } else {
            historyContainer.innerHTML = historyJobs.map(job => renderJobCard(job, false)).join('');
        }
    }
}

function renderJobCard(job, isActive) {
    const input = job.input_data || {};
    const modelId = input.model_id || 'Unknown';
    const credits = input.credits_used || 0;
    const progress = job.progress_percent || 0;
    const stepName = job.step_name || 'Waiting...';
    const createdAt = new Date(job.created_at).toLocaleString('id-ID');
    
    const statusClasses = {
        'pending': 'status-pending',
        'processing': 'status-processing',
        'completed': 'status-completed',
        'failed': 'status-failed',
        'cancelled': 'status-cancelled'
    };
    
    const statusLabels = {
        'pending': '⏳ Menunggu',
        'processing': '⚙️ Memproses',
        'completed': '✅ Selesai',
        'failed': '❌ Gagal',
        'cancelled': '🚫 Dibatalkan'
    };
    
    let resultPreview = '';
    if (job.status === 'completed' && job.results) {
        const results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (results.video_url) {
            resultPreview = `
                <video src="${results.video_url}" class="job-preview-video" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>
            `;
        }
    }
    
    let cancelButton = '';
    if (isActive) {
        cancelButton = `<button class="btn-cancel-job" onclick="event.stopPropagation(); cancelJob('${job.id}')">🛑 Batalkan</button>`;
    }
    
    return `
        <div class="job-card ${statusClasses[job.status]}" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <span class="job-model">${modelId}</span>
                <span class="job-status ${statusClasses[job.status]}">${statusLabels[job.status]}</span>
            </div>
            ${resultPreview}
            <div class="job-info">
                <span class="job-credits">🪙 ${credits} kredit</span>
                <span class="job-date">${createdAt}</span>
            </div>
            ${isActive ? `
                <div class="job-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}% - ${stepName}</span>
                </div>
                <div class="job-actions">
                    ${cancelButton}
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// CANCEL JOB
// ============================================

async function cancelJob(jobId) {
    if (!confirm('Apakah Anda yakin ingin membatalkan job ini?\n\nKredit akan dikembalikan.')) {
        return;
    }
    
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        // Get job details
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single();
        
        if (jobError || !job) {
            alert('Job tidak ditemukan');
            return;
        }
        
        if (!['pending', 'processing'].includes(job.status)) {
            alert('Job ini tidak dapat dibatalkan');
            return;
        }
        
        const creditsToRefund = job.input_data?.credits_used || 0;
        
        // Update job status
        const { error: updateError } = await supabaseClient
            .from('jobs')
            .update({
                status: 'cancelled',
                error_message: 'Dibatalkan oleh user',
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId);
        
        if (updateError) {
            throw new Error('Gagal membatalkan job');
        }
        
        // Refund credits
        if (creditsToRefund > 0) {
            const { data: currentCredits } = await supabaseClient
                .from('user_credits')
                .select('balance, total_refunded')
                .eq('user_id', user.id)
                .single();
            
            if (currentCredits) {
                await supabaseClient
                    .from('user_credits')
                    .update({
                        balance: currentCredits.balance + creditsToRefund,
                        total_refunded: (currentCredits.total_refunded || 0) + creditsToRefund,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);
            }
        }
        
        alert(`✅ Job dibatalkan.\n\n${creditsToRefund} kredit dikembalikan.`);
        
        await loadJobs();
        await loadUserCredits();
        
    } catch (error) {
        console.error('Cancel job error:', error);
        alert('Gagal membatalkan job: ' + error.message);
    }
}

// ============================================
// JOB MODAL
// ============================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const input = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = input.model_id || 'Job Details';
    
    const statusEl = document.getElementById('modal-status');
    if (statusEl) {
        statusEl.textContent = job.status;
        statusEl.className = 'status-badge status-' + job.status;
    }
    
    // Progress section
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (job.status === 'completed') {
        if (progressSection) progressSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        
        if (results.video_url) {
            const modalVideo = document.getElementById('modal-video');
            const modalDownload = document.getElementById('modal-download');
            if (modalVideo) modalVideo.src = results.video_url;
            if (modalDownload) modalDownload.href = results.video_url;
        }
        
        const modalModel = document.getElementById('modal-model');
        const modalCreditsFinal = document.getElementById('modal-credits-final');
        if (modalModel) modalModel.textContent = input.model_id || '-';
        if (modalCreditsFinal) modalCreditsFinal.textContent = (input.credits_used || 0) + ' kredit';
        
    } else if (job.status === 'failed' || job.status === 'cancelled') {
        if (progressSection) progressSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'block';
        
        const modalErrorMsg = document.getElementById('modal-error-msg');
        if (modalErrorMsg) modalErrorMsg.textContent = job.error_message || 'Unknown error';
        
    } else {
        if (progressSection) progressSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'none';
        
        const progress = job.progress_percent || 0;
        const modalProgressFill = document.getElementById('modal-progress-fill');
        const modalProgressPercent = document.getElementById('modal-progress-percent');
        const modalCreditsUsed = document.getElementById('modal-credits-used');
        const modalStep = document.getElementById('modal-step');
        
        if (modalProgressFill) modalProgressFill.style.width = progress + '%';
        if (modalProgressPercent) modalProgressPercent.textContent = progress + '%';
        if (modalCreditsUsed) modalCreditsUsed.textContent = (input.credits_used || 0) + ' kredit';
        if (modalStep) modalStep.textContent = job.step_name || 'Waiting...';
    }
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.style.display = 'flex';
}

function closeJobModal() {
    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.style.display = 'none';
    
    const modalVideo = document.getElementById('modal-video');
    if (modalVideo) modalVideo.pause();
}

// ============================================
// CREDITS MODAL & PURCHASE - FIXED
// ============================================

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    if (grid) {
        grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
            <div class="package-card ${pkg.popular ? 'popular' : ''} ${pkg.bestValue ? 'best-value' : ''}">
                ${pkg.popular ? '<span class="package-badge">⭐ Recommended</span>' : ''}
                ${pkg.bestValue ? '<span class="package-badge best">💎 Best Value</span>' : ''}
                <h3 class="package-name">${pkg.name}</h3>
                <div class="package-credits">${pkg.credits.toLocaleString('id-ID')} Kredit</div>
                <div class="package-price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
                <div class="package-per-credit">Rp ${pkg.pricePerCredit}/kredit</div>
                <button class="btn-buy-package" data-package-id="${pkg.id}">Beli Sekarang</button>
            </div>
        `).join('');
        
        // Add click handlers to buttons
        grid.querySelectorAll('.btn-buy-package').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const packageId = btn.dataset.packageId;
                purchaseCredits(packageId, btn);
            });
        });
    }
    
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) {
        modalCredits.textContent = userCredits.toLocaleString('id-ID') + ' kredit';
    }
    
    const creditsModal = document.getElementById('credits-modal');
    if (creditsModal) creditsModal.style.display = 'flex';
}

function closeCreditsModal() {
    const creditsModal = document.getElementById('credits-modal');
    if (creditsModal) creditsModal.style.display = 'none';
}

// FIXED: purchaseCredits now receives button element directly
async function purchaseCredits(packageId, buttonElement) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert('Silakan login terlebih dahulu');
            return;
        }
        
        const btn = buttonElement;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Memproses...';
        
        // Get package info
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            throw new Error('Paket tidak ditemukan');
        }
        
        // Check if Midtrans Snap is available
        if (typeof window.snap === 'undefined') {
            // Fallback: Manual payment info
            alert(`💳 Pembayaran Manual\n\nPaket: ${pkg.name}\nKredit: ${pkg.credits}\nHarga: Rp ${pkg.price.toLocaleString('id-ID')}\n\nSilakan hubungi admin untuk menyelesaikan pembayaran.`);
            btn.disabled = false;
            btn.textContent = originalText;
            return;
        }
        
        // Try to call edge function
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/create-video-credit-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ package_id: packageId })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Gagal membuat pembayaran');
            }
            
            // Open Midtrans Snap
            window.snap.pay(result.snap_token, {
                onSuccess: async function(result) {
                    alert('🎉 Pembayaran berhasil! Kredit akan ditambahkan.');
                    closeCreditsModal();
                    await loadUserCredits();
                },
                onPending: function(result) {
                    alert('⏳ Menunggu pembayaran...\nSilakan selesaikan pembayaran Anda.');
                    closeCreditsModal();
                },
                onError: function(result) {
                    alert('❌ Pembayaran gagal. Silakan coba lagi.');
                },
                onClose: function() {
                    console.log('Payment popup closed');
                    btn.disabled = false;
                    btn.textContent = originalText;
                }
            });
            
        } catch (fetchError) {
            console.error('Edge function error:', fetchError);
            // Fallback: Show manual payment info
            alert(`⚠️ Sistem pembayaran sedang dalam maintenance.\n\nPaket: ${pkg.name}\nKredit: ${pkg.credits}\nHarga: Rp ${pkg.price.toLocaleString('id-ID')}\n\nSilakan hubungi admin untuk menyelesaikan pembayaran.`);
        }
        
        btn.disabled = false;
        btn.textContent = originalText;
        
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Gagal: ' + error.message);
        
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Beli Sekarang';
        }
    }
}

// ============================================
// TABS & PRICING
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
    
    if (tabName === 'pricing') {
        loadPricingTable();
    }
}

function loadPricingTable() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;
    
    const categories = {
        'Kling Premium': ['kling-2-5-pro', 'kling-o1-pro-i2v', 'kling-o1-pro-ref', 'kling-2-6-pro', 'kling-2-6-motion-pro', 'kling-2-1-pro'],
        'Kling Standard': ['kling-o1-std-i2v', 'kling-o1-std-ref', 'kling-2-6-motion-std', 'kling-1-6-pro', 'kling-1-6-std'],
        'MiniMax / Hailuo': ['minimax-live', 'minimax-hailuo-1080p', 'minimax-hailuo-1080p-fast', 'minimax-hailuo-768p', 'minimax-hailuo-768p-fast'],
        'WAN': ['wan-i2v-720p', 'wan-i2v-1080p', 'wan-t2v-720p', 'wan-t2v-1080p'],
        'Seedance (Hemat)': ['seedance-480p', 'seedance-720p', 'seedance-1080p'],
        'LTX': ['ltx-t2v', 'ltx-i2v'],
        'Lainnya': ['runway-gen4', 'omnihuman', 'vfx']
    };
    
    let html = '';
    
    for (const [category, models] of Object.entries(categories)) {
        html += `<div class="pricing-category"><h3>${category}</h3>`;
        
        for (const modelId of models) {
            const config = MODEL_CONFIGS[modelId];
            const credits = MODEL_PRICING[modelId];
            
            if (!config) continue;
            
            html += `
                <div class="pricing-item">
                    <div class="pricing-model">${modelId}</div>
                    <div class="pricing-desc">${config.desc || ''}</div>
                    <div class="pricing-credits">🪙 ${credits} kredit</div>
                </div>
            `;
        }
        
        html += '</div>';
    }
    
    grid.innerHTML = html;
}

// ============================================
// POLLING
// ============================================

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        const hasActiveJobs = userJobs.some(j => ['pending', 'processing'].includes(j.status));
        
        if (hasActiveJobs) {
            await loadJobs();
            await loadUserCredits();
        }
    }, POLLING_INTERVAL_MS);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.cancelJob = cancelJob;
window.openCreditsModal = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;

console.log('✅ Video API Generator v3.1 loaded');
