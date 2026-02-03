// ============================================
// VIDEO API GENERATOR v4.0 - COMPLETE
// With Supabase Storage, Duration, Dynamic Pricing
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;
let userStats = {};
let isNewUser = false;

// ============================================
// PRICING BY DURATION
// ============================================

const MODEL_PRICING = {
    "kling-2-5-pro": { 5: 38, 10: 75 },
    "kling-2-6-pro": { 5: 35, 10: 70 },
    "kling-2-1-pro": { 5: 50, 10: 100 },
    "kling-1-6-pro": { 5: 51, 10: 100 },
    "kling-1-6-std": { 5: 30, 10: 60 },
    "kling-o1-pro-i2v": { 5: 56, 10: 112 },
    "kling-o1-std-i2v": { 5: 42, 10: 84 },
    "kling-o1-pro-ref": { 5: 84, 10: 168 },
    "kling-o1-std-ref": { 5: 63, 10: 126 },
    "kling-2-6-motion-pro": { 5: 70, 10: 140 },
    "kling-2-6-motion-std": { 5: 35, 10: 70 },
    "minimax-live": { 5: 50 },
    "minimax-hailuo-1080p": { 6: 49, 10: 98 },
    "minimax-hailuo-1080p-fast": { 6: 33, 10: 66 },
    "minimax-hailuo-768p": { 6: 28, 10: 56 },
    "minimax-hailuo-768p-fast": { 6: 19, 10: 32 },
    "wan-i2v-720p": { 5: 50, 10: 100 },
    "wan-i2v-1080p": { 5: 75, 10: 150 },
    "wan-t2v-720p": { 5: 50, 10: 100 },
    "wan-t2v-1080p": { 5: 75, 10: 150 },
    "seedance-480p": { 5: 13, 10: 26 },
    "seedance-720p": { 5: 28, 10: 56 },
    "seedance-1080p": { 5: 31, 10: 62 },
    "ltx-t2v": { 5: 30, 10: 60 },
    "ltx-i2v": { 5: 30, 10: 60 },
    "runway-gen4": { 5: 75, 10: 150 },
    "omnihuman": { 5: 81 },
    "vfx": { 5: 9 },
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
// MODEL CONFIGURATIONS WITH DURATION OPTIONS
// ============================================

const MODEL_CONFIGS = {
    'kling-2-5-pro': {
        type: 'image_to_video',
        desc: 'Model terbaru dengan kualitas tinggi',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-2-6-pro': {
        type: 'kling_2_6',
        desc: 'Text/Image to Video dengan audio generation',
        showImage: true, showNegative: true, showCfg: true, 
        showAspectKling26: true, showGenerateAudio: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-2-1-pro': {
        type: 'image_to_video',
        desc: 'Model 2.1 Pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-1-6-pro': {
        type: 'image_to_video',
        desc: 'Model klasik dengan kualitas pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-1-6-std': {
        type: 'image_to_video',
        desc: 'Model hemat biaya',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-o1-pro-i2v': {
        type: 'kling_o1',
        desc: 'Kling O1 Pro - Image to Video dengan first/last frame',
        showFrames: true, showAspectRatio: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-o1-std-i2v': {
        type: 'kling_o1',
        desc: 'Kling O1 Standard - Image to Video',
        showFrames: true, showAspectRatio: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-o1-pro-ref': {
        type: 'kling_o1_reference',
        desc: 'Video Reference dengan max 7 gambar referensi',
        showRefImages: true, showAspectRatio: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-o1-std-ref': {
        type: 'kling_o1_reference',
        desc: 'Video Reference Standard',
        showRefImages: true, showAspectRatio: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-2-6-motion-pro': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control - Character Image + Motion Video',
        showMotion: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'kling-2-6-motion-std': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control Standard',
        showMotion: true, showCfg: true,
        durations: [5, 10], defaultDuration: 5
    },
    'minimax-live': {
        type: 'minimax_live',
        desc: 'MiniMax Live Mode (Image to Video)',
        showImage: true, showPromptOptimizer: true,
        durations: [5], defaultDuration: 5
    },
    'minimax-hailuo-1080p': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 1080p',
        showFrames: true, showPromptOptimizer: true,
        durations: [6, 10], defaultDuration: 6
    },
    'minimax-hailuo-1080p-fast': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 1080p Fast Mode',
        showFrames: true, showPromptOptimizer: true,
        durations: [6, 10], defaultDuration: 6
    },
    'minimax-hailuo-768p': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 768p',
        showFrames: true, showPromptOptimizer: true,
        durations: [6, 10], defaultDuration: 6
    },
    'minimax-hailuo-768p-fast': {
        type: 'minimax_hailuo',
        desc: 'Hailuo 768p Fast Mode - Paling Hemat!',
        showFrames: true, showPromptOptimizer: true,
        durations: [6, 10], defaultDuration: 6
    },
    'wan-i2v-720p': {
        type: 'wan_i2v',
        desc: 'WAN Image to Video 720p',
        showImage: true, showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'wan-i2v-1080p': {
        type: 'wan_i2v',
        desc: 'WAN Image to Video 1080p',
        showImage: true, showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'wan-t2v-720p': {
        type: 'wan_t2v',
        desc: 'WAN Text to Video 720p',
        showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'wan-t2v-1080p': {
        type: 'wan_t2v',
        desc: 'WAN Text to Video 1080p',
        showNegative: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'seedance-480p': {
        type: 'seedance',
        desc: 'Seedance 480p - Termurah!',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'seedance-720p': {
        type: 'seedance',
        desc: 'Seedance 720p',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'seedance-1080p': {
        type: 'seedance',
        desc: 'Seedance 1080p',
        showImage: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'ltx-t2v': {
        type: 'ltx_t2v',
        desc: 'LTX Text to Video',
        showLtxResolution: true, showGenerateAudio: true, showFps: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'ltx-i2v': {
        type: 'ltx_i2v',
        desc: 'LTX Image to Video',
        showImage: true, showLtxResolution: true, 
        showGenerateAudio: true, showFps: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'runway-gen4': {
        type: 'runway',
        desc: 'RunWay Gen4 Turbo',
        showImage: true, showRunwayRatio: true, showSeed: true,
        durations: [5, 10], defaultDuration: 5
    },
    'omnihuman': {
        type: 'omnihuman',
        desc: 'OmniHuman - Portrait animation dengan audio',
        showOmnihuman: true,
        durations: [5], defaultDuration: 5
    },
    'vfx': {
        type: 'vfx',
        desc: 'Apply visual effects ke video',
        showVfx: true, noPrompt: true,
        durations: [5], defaultDuration: 5
    }
};

// ============================================
// CONSTANTS
// ============================================

const MAX_JOBS_PER_USER = 5;
const POLLING_INTERVAL_MS = 5000;
const STORAGE_BUCKET = 'video-uploads';

// ============================================
// SUPABASE STORAGE UPLOAD
// ============================================

async function uploadToSupabaseStorage(file, userId) {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop().toLowerCase();
    const fileName = `${userId}/${timestamp}_${Math.random().toString(36).substr(2, 8)}.${ext}`;
    
    console.log(`📤 Uploading to Supabase: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    try {
        const { data, error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '86400', // 24 hours
                upsert: false
            });
        
        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
        
        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);
        
        if (urlData?.publicUrl) {
            console.log('✅ Uploaded:', urlData.publicUrl);
            return urlData.publicUrl;
        }
        
        throw new Error('Failed to get public URL');
        
    } catch (error) {
        console.error('Upload failed:', error);
        throw new Error('Gagal upload file: ' + error.message);
    }
}

async function uploadFile(file, userId, progressCallback = null) {
    const sizeMB = file.size / 1024 / 1024;
    
    if (sizeMB > 50) {
        throw new Error(`File terlalu besar (${sizeMB.toFixed(1)} MB). Maksimal 50 MB.`);
    }
    
    if (progressCallback) progressCallback(10, `Uploading ${file.name}...`);
    
    try {
        const url = await uploadToSupabaseStorage(file, userId);
        if (progressCallback) progressCallback(100, 'Upload complete!');
        return url;
    } catch (error) {
        throw error;
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v4.0 loading...');
    
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
// INITIALIZE USER
// ============================================

async function initializeUser() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) {
            document.getElementById('user-avatar').src = avatarUrl;
        }
        
        const { data: credits, error } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            const { data: newCredits } = await supabaseClient
                .from('user_credits')
                .insert({
                    user_id: user.id,
                    balance: 50,
                    total_purchased: 0,
                    total_used: 0,
                    total_refunded: 0
                })
                .select()
                .single();
            
            if (newCredits) {
                userCredits = 50;
                userStats = { balance: 50, total_used: 0, total_refunded: 0 };
                isNewUser = true;
                
                setTimeout(() => {
                    alert(`🎉 Selamat datang!\n\nAnda mendapat 50 kredit GRATIS!\n\nCobalah Seedance 480p (13 kredit) atau VFX (9 kredit).`);
                }, 1000);
            }
        } else if (credits) {
            userCredits = credits.balance || 0;
            userStats = {
                balance: credits.balance,
                total_used: credits.total_used || 0,
                total_refunded: credits.total_refunded || 0
            };
        }
        
        updateCreditsUI();
        await loadJobs();
        
    } catch (error) {
        console.error('Initialize user error:', error);
    }
}

// ============================================
// CREDITS UI
// ============================================

function updateCreditsUI() {
    const fmt = userCredits.toLocaleString('id-ID');
    
    document.getElementById('user-credits').textContent = fmt;
    document.getElementById('stat-credits').textContent = fmt;
    document.getElementById('stat-used').textContent = (userStats.total_used || 0).toLocaleString('id-ID');
    document.getElementById('stat-refunded').textContent = (userStats.total_refunded || 0).toLocaleString('id-ID');
    
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) modalCredits.textContent = fmt + ' kredit';
}

async function loadUserCredits() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (data) {
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
// GET PRICE FOR DURATION
// ============================================

function getPriceForDuration(modelId, duration) {
    const pricing = MODEL_PRICING[modelId];
    if (!pricing) return 30;
    
    // Find exact match or closest
    if (pricing[duration] !== undefined) {
        return pricing[duration];
    }
    
    // Get first available price
    const durations = Object.keys(pricing).map(Number).sort((a, b) => a - b);
    return pricing[durations[0]] || 30;
}

function getCurrentDuration() {
    const durationSelect = document.getElementById('input-duration');
    if (durationSelect) {
        return parseInt(durationSelect.value) || 5;
    }
    return 5;
}

// ============================================
// MODEL UI UPDATE
// ============================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    
    if (!config) return;
    
    // Update duration options
    const durationSelect = document.getElementById('input-duration');
    if (durationSelect && config.durations) {
        durationSelect.innerHTML = config.durations.map(d => 
            `<option value="${d}" ${d === config.defaultDuration ? 'selected' : ''}>${d} detik</option>`
        ).join('');
        
        // Show duration group
        document.getElementById('group-duration').style.display = 'block';
    }
    
    // Calculate price based on duration
    const duration = getCurrentDuration();
    const credits = getPriceForDuration(modelId, duration);
    
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
    
    // Show relevant sections
    if (config.showImage) {
        document.getElementById('section-image').style.display = 'block';
        document.getElementById('group-image').style.display = 'block';
    }
    if (config.showImageTail) {
        document.getElementById('group-image-tail').style.display = 'block';
    }
    if (config.showNegative) {
        document.getElementById('group-negative-prompt').style.display = 'block';
    }
    if (config.showCfg) {
        document.getElementById('group-cfg-scale').style.display = 'block';
    }
    if (config.showFrames) {
        document.getElementById('section-frames').style.display = 'block';
    }
    if (config.showRefImages) {
        document.getElementById('section-ref-images').style.display = 'block';
    }
    if (config.showMotion) {
        document.getElementById('section-motion').style.display = 'block';
    }
    if (config.showOmnihuman) {
        document.getElementById('section-omnihuman').style.display = 'block';
    }
    if (config.showVfx) {
        document.getElementById('section-vfx').style.display = 'block';
    }
    if (config.showAspectRatio) {
        document.getElementById('group-aspect-ratio').style.display = 'block';
    }
    if (config.showAspectKling26) {
        document.getElementById('group-aspect-ratio-kling26').style.display = 'block';
    }
    if (config.showAspectSeedance) {
        document.getElementById('group-aspect-ratio-seedance').style.display = 'block';
    }
    if (config.showRunwayRatio) {
        document.getElementById('group-runway-ratio').style.display = 'block';
    }
    if (config.showWanSize) {
        document.getElementById('group-wan-size').style.display = 'block';
    }
    if (config.showLtxResolution) {
        document.getElementById('group-ltx-resolution').style.display = 'block';
    }
    if (config.showSeed) {
        document.getElementById('group-seed').style.display = 'block';
    }
    if (config.showFps) {
        document.getElementById('group-fps').style.display = 'block';
    }
    if (config.showGenerateAudio) {
        document.getElementById('check-generate-audio').style.display = 'flex';
    }
    if (config.showPromptOptimizer) {
        document.getElementById('check-prompt-optimizer').style.display = 'flex';
    }
    if (config.showPromptExpansion) {
        document.getElementById('check-prompt-expansion').style.display = 'flex';
    }
    if (config.showCameraFixed) {
        document.getElementById('check-camera-fixed').style.display = 'flex';
    }
    if (config.showShotType) {
        document.getElementById('group-shot-type').style.display = 'block';
    }
}

function updatePriceDisplay() {
    const modelId = document.getElementById('input-model').value;
    const duration = getCurrentDuration();
    const credits = getPriceForDuration(modelId, duration);
    
    document.getElementById('estimated-credits').textContent = credits;
    document.getElementById('total-credits').textContent = credits;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateModelUI);
    }
    
    const durationSelect = document.getElementById('input-duration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updatePriceDisplay);
    }
    
    updateModelUI();
    
    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', () => {
            document.getElementById('cfg-value').textContent = cfgSlider.value;
        });
    }
    
    // File uploads
    setupFileUpload('input-image', 'preview-image', 'btn-remove-image');
    setupFileUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileUpload('input-first-frame', 'preview-first-frame');
    setupFileUpload('input-last-frame', 'preview-last-frame');
    setupFileUpload('input-motion-image', 'preview-motion-image');
    setupFileUpload('input-motion-video', 'preview-motion-video', null, true);
    setupFileUpload('input-omni-image', 'preview-omni-image');
    setupFileUpload('input-omni-audio', 'preview-omni-audio', null, false, true);
    setupFileUpload('input-vfx-video', 'preview-vfx-video', null, true);
    
    for (let i = 1; i <= 7; i++) {
        setupFileUpload(`input-ref-${i}`, `preview-ref-${i}`);
    }
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Form
    document.getElementById('generator-form')?.addEventListener('submit', submitJob);
    
    // Credits
    document.getElementById('btn-buy-credits')?.addEventListener('click', openCreditsModal);
    
    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
    
    // Modal
    document.getElementById('btn-close-modal')?.addEventListener('click', closeJobModal);
    document.getElementById('job-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'job-modal') closeJobModal();
    });
    
    // VFX filter
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const filterType = parseInt(filterSelect.value);
            document.getElementById('group-bloom-contrast').style.display = filterType === 7 ? 'block' : 'none';
            document.getElementById('group-motion-blur').style.display = filterType === 2 ? 'block' : 'none';
        });
    }
    
    // Sliders
    document.getElementById('input-bloom-contrast')?.addEventListener('input', (e) => {
        document.getElementById('bloom-value').textContent = e.target.value;
    });
    document.getElementById('input-motion-decay')?.addEventListener('input', (e) => {
        document.getElementById('decay-value').textContent = e.target.value;
    });
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
            document.getElementById(removeId).style.display = 'block';
        }
    });
    
    if (removeId) {
        document.getElementById(removeId)?.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            preview.src = '';
            preview.style.display = 'none';
            
            const placeholder = preview.parentElement.querySelector('.upload-placeholder');
            if (placeholder) placeholder.style.display = 'flex';
            
            preview.parentElement.classList.remove('has-preview');
            document.getElementById(removeId).style.display = 'none';
        });
    }
}

// ============================================
// SUBMIT JOB
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
    const duration = getCurrentDuration();
    const requiredCredits = getPriceForDuration(modelId, duration);
    
    if (!config) {
        alert('Model tidak valid');
        return;
    }
    
    const activeJobsCount = userJobs.filter(j => ['pending', 'processing'].includes(j.status)).length;
    if (activeJobsCount >= MAX_JOBS_PER_USER) {
        alert(`Anda sudah memiliki ${activeJobsCount} job aktif.\nMaksimal ${MAX_JOBS_PER_USER} job bersamaan.`);
        return;
    }
    
    const prompt = document.getElementById('input-prompt')?.value?.trim() || '';
    if (!prompt && !config.noPrompt) {
        alert('Prompt wajib diisi!');
        return;
    }
    
    if (userCredits < requiredCredits) {
        alert(`Kredit tidak mencukupi!\n\nDibutuhkan: ${requiredCredits} kredit\nSaldo: ${userCredits} kredit`);
        openCreditsModal();
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Memproses...';
    
    try {
        const inputData = await collectInputData(modelId, config, prompt, duration, requiredCredits, user.id);
        
        // Deduct credits
        const { data: currentCredits } = await supabaseClient
            .from('user_credits')
            .select('balance, total_used')
            .eq('user_id', user.id)
            .single();
        
        if (!currentCredits || currentCredits.balance < requiredCredits) {
            throw new Error('Kredit tidak mencukupi');
        }
        
        const newBalance = currentCredits.balance - requiredCredits;
        
        await supabaseClient
            .from('user_credits')
            .update({ 
                balance: newBalance,
                total_used: (currentCredits.total_used || 0) + requiredCredits,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        
        userCredits = newBalance;
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
            // Refund
            await supabaseClient
                .from('user_credits')
                .update({ balance: currentCredits.balance })
                .eq('user_id', user.id);
            
            userCredits = currentCredits.balance;
            updateCreditsUI();
            throw new Error('Gagal membuat job');
        }
        
        alert(`✅ Job dibuat!\n\nModel: ${modelId}\nDurasi: ${duration}s\nKredit: ${requiredCredits}\n\n⏱️ Proses 5-45 menit`);
        
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

async function collectInputData(modelId, config, prompt, duration, credits, userId) {
    const data = {
        model_id: modelId,
        prompt: prompt,
        negative_prompt: document.getElementById('input-negative')?.value || '',
        duration: duration,
        credits_used: credits,
        user_id: userId,
        settings: {}
    };
    
    const settings = data.settings;
    const submitBtn = document.getElementById('btn-submit');
    const updateStatus = (text) => { if (submitBtn) submitBtn.innerHTML = text; };
    
    // Settings
    if (config.showCfg) settings.cfg_scale = parseFloat(document.getElementById('input-cfg')?.value || 0.5);
    if (config.showSeed) settings.seed = parseInt(document.getElementById('input-seed')?.value || -1);
    if (config.showFps) settings.fps = parseInt(document.getElementById('input-fps')?.value || 25);
    if (config.showAspectRatio) settings.aspect_ratio = document.getElementById('input-aspect-ratio')?.value;
    if (config.showAspectKling26) settings.aspect_ratio = document.getElementById('input-aspect-ratio-kling26')?.value;
    if (config.showAspectSeedance) settings.aspect_ratio = document.getElementById('input-aspect-ratio-seedance')?.value;
    if (config.showRunwayRatio) settings.runway_ratio = document.getElementById('input-runway-ratio')?.value;
    if (config.showWanSize) settings.wan_size = document.getElementById('input-wan-size')?.value;
    if (config.showLtxResolution) settings.resolution = document.getElementById('input-ltx-resolution')?.value;
    if (config.showGenerateAudio) settings.generate_audio = document.getElementById('input-generate-audio')?.checked || false;
    if (config.showPromptOptimizer) settings.prompt_optimizer = document.getElementById('input-prompt-optimizer')?.checked ?? true;
    if (config.showPromptExpansion) settings.enable_prompt_expansion = document.getElementById('input-prompt-expansion')?.checked || false;
    if (config.showCameraFixed) settings.camera_fixed = document.getElementById('input-camera-fixed')?.checked || false;
    if (config.showShotType) settings.shot_type = document.getElementById('input-shot-type')?.value || 'single';
    
    // Image uploads (base64)
    if (config.showImage) {
        const imgFile = document.getElementById('input-image')?.files[0];
        if (imgFile) {
            updateStatus('⏳ Processing image...');
            settings.image = await fileToBase64(imgFile);
        }
    }
    if (config.showImageTail) {
        const tailFile = document.getElementById('input-image-tail')?.files[0];
        if (tailFile) settings.image_tail = await fileToBase64(tailFile);
    }
    if (config.showFrames) {
        const firstFile = document.getElementById('input-first-frame')?.files[0];
        if (firstFile) settings.first_frame = await fileToBase64(firstFile);
        const lastFile = document.getElementById('input-last-frame')?.files[0];
        if (lastFile) settings.last_frame = await fileToBase64(lastFile);
    }
    if (config.showRefImages) {
        const refImages = [];
        for (let i = 1; i <= 7; i++) {
            const refFile = document.getElementById(`input-ref-${i}`)?.files[0];
            if (refFile) refImages.push(await fileToBase64(refFile));
        }
        if (refImages.length > 0) settings.reference_images = refImages;
    }
    
    // Motion Control - upload to Supabase
    if (config.showMotion) {
        const motionImg = document.getElementById('input-motion-image')?.files[0];
        const motionVid = document.getElementById('input-motion-video')?.files[0];
        
        if (!motionImg || !motionVid) throw new Error('Motion Control membutuhkan gambar + video!');
        
        updateStatus('⏳ Uploading character image...');
        settings.image_url = await uploadFile(motionImg, userId);
        
        updateStatus('⏳ Uploading motion video...');
        settings.video_url = await uploadFile(motionVid, userId);
        
        settings.character_orientation = document.getElementById('input-character-orientation')?.value || 'video';
    }
    
    // OmniHuman - upload to Supabase
    if (config.showOmnihuman) {
        const omniImg = document.getElementById('input-omni-image')?.files[0];
        const omniAudio = document.getElementById('input-omni-audio')?.files[0];
        
        if (!omniImg || !omniAudio) throw new Error('OmniHuman membutuhkan gambar + audio!');
        
        updateStatus('⏳ Uploading portrait...');
        settings.image_url = await uploadFile(omniImg, userId);
        
        updateStatus('⏳ Uploading audio...');
        settings.audio_url = await uploadFile(omniAudio, userId);
        
        settings.resolution = document.getElementById('input-omni-resolution')?.value || '1080p';
        settings.turbo_mode = document.getElementById('input-turbo-mode')?.checked || false;
    }
    
    // VFX - upload to Supabase
    if (config.showVfx) {
        const vfxVid = document.getElementById('input-vfx-video')?.files[0];
        if (!vfxVid) throw new Error('VFX membutuhkan video!');
        
        updateStatus('⏳ Uploading video...');
        settings.video_url = await uploadFile(vfxVid, userId);
        
        settings.filter_type = parseInt(document.getElementById('input-filter-type')?.value || 1);
        settings.fps = parseInt(document.getElementById('input-vfx-fps')?.value || 24);
        
        if (settings.filter_type === 7) settings.bloom_contrast = parseFloat(document.getElementById('input-bloom-contrast')?.value || 1.2);
        if (settings.filter_type === 2) {
            settings.motion_kernel = parseInt(document.getElementById('input-motion-kernel')?.value || 5);
            settings.motion_decay = parseFloat(document.getElementById('input-motion-decay')?.value || 0.8);
        }
    }
    
    updateStatus('⏳ Submitting...');
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
    document.getElementById('generator-form')?.reset();
    
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
// JOBS
// ============================================

async function loadJobs() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data: jobs } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'videoapi')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        userJobs = jobs || [];
        renderJobs();
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => !['pending', 'processing'].includes(j.status));
    
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    const activeContainer = document.getElementById('active-jobs');
    activeContainer.innerHTML = activeJobs.length === 0 
        ? `<div class="empty-state"><span class="empty-icon">🚀</span><p>Tidak ada proses berjalan</p></div>`
        : activeJobs.map(job => renderJobCard(job, true)).join('');
    
    const historyContainer = document.getElementById('history-jobs');
    historyContainer.innerHTML = historyJobs.length === 0
        ? `<div class="empty-state"><span class="empty-icon">📁</span><p>Belum ada riwayat</p></div>`
        : historyJobs.map(job => renderJobCard(job, false)).join('');
}

function renderJobCard(job, isActive) {
    const input = job.input_data || {};
    const modelId = input.model_id || 'Unknown';
    const credits = input.credits_used || 0;
    const duration = input.duration || 5;
    const progress = job.progress_percent || 0;
    const createdAt = new Date(job.created_at).toLocaleString('id-ID');
    
    const statusLabels = {
        'pending': '⏳ Menunggu',
        'processing': '⚙️ Memproses',
        'completed': '✅ Selesai',
        'failed': '❌ Gagal',
        'cancelled': '🚫 Dibatalkan'
    };
    
    let preview = '';
    if (job.status === 'completed' && job.results?.video_url) {
        const results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (results.video_url) {
            preview = `<video src="${results.video_url}" class="job-preview-video" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
        }
    }
    
    let timeInfo = '';
    if (isActive) {
        const elapsed = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 60000);
        const remaining = Math.max(0, 45 - elapsed);
        timeInfo = `<span class="job-time ${remaining < 5 ? 'warning' : ''}">⏱️ ${remaining}m tersisa</span>`;
    }
    
    return `
        <div class="job-card status-${job.status}" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <span class="job-model">${modelId}</span>
                <span class="job-status status-${job.status}">${statusLabels[job.status]}</span>
            </div>
            ${preview}
            <div class="job-info">
                <span class="job-credits">🪙 ${credits} kredit</span>
                <span class="job-duration">⏱️ ${duration}s</span>
                <span class="job-date">${createdAt}</span>
            </div>
            ${isActive ? `
                <div class="job-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
                    <span class="progress-text">${progress}% - ${job.step_name || 'Waiting...'}</span>
                </div>
                <div class="job-footer">
                    ${timeInfo}
                    <span class="job-note">💰 Auto-refund jika gagal</span>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// MODAL
// ============================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const input = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});
    
    document.getElementById('modal-title').textContent = input.model_id || 'Job Details';
    document.getElementById('modal-status').textContent = job.status;
    document.getElementById('modal-status').className = 'status-badge status-' + job.status;
    
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (job.status === 'completed') {
        progressSection.style.display = 'none';
        errorSection.style.display = 'none';
        resultsSection.style.display = 'block';
        
        if (results.video_url) {
            document.getElementById('modal-video').src = results.video_url;
            document.getElementById('modal-download').href = results.video_url;
        }
        document.getElementById('modal-model').textContent = input.model_id;
        document.getElementById('modal-credits-final').textContent = input.credits_used + ' kredit';
        
    } else if (['failed', 'cancelled'].includes(job.status)) {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Proses tidak selesai';
        
    } else {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        document.getElementById('modal-progress-fill').style.width = job.progress_percent + '%';
        document.getElementById('modal-progress-percent').textContent = job.progress_percent + '%';
        document.getElementById('modal-credits-used').textContent = input.credits_used + ' kredit';
        document.getElementById('modal-step').textContent = job.step_name || 'Waiting...';
    }
    
    document.getElementById('job-modal').style.display = 'flex';
}

function closeJobModal() {
    document.getElementById('job-modal').style.display = 'none';
    document.getElementById('modal-video')?.pause();
}

// ============================================
// CREDITS PURCHASE
// ============================================

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
        <div class="package-card ${pkg.popular ? 'popular' : ''} ${pkg.bestValue ? 'best-value' : ''}">
            ${pkg.popular ? '<span class="package-badge">⭐ Popular</span>' : ''}
            ${pkg.bestValue ? '<span class="package-badge best">💎 Best Value</span>' : ''}
            <h3 class="package-name">${pkg.name}</h3>
            <div class="package-credits">${pkg.credits.toLocaleString('id-ID')} Kredit</div>
            <div class="package-price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
            <div class="package-per-credit">Rp ${pkg.pricePerCredit}/kredit</div>
            <button class="btn-buy-package" data-package-id="${pkg.id}">Beli</button>
        </div>
    `).join('');
    
    grid.querySelectorAll('.btn-buy-package').forEach(btn => {
        btn.addEventListener('click', (e) => {
            purchaseCredits(btn.dataset.packageId, btn);
        });
    });
    
    document.getElementById('modal-current-credits').textContent = userCredits.toLocaleString('id-ID') + ' kredit';
    document.getElementById('credits-modal').style.display = 'flex';
}

function closeCreditsModal() {
    document.getElementById('credits-modal').style.display = 'none';
}

async function purchaseCredits(packageId, btn) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { alert('Login dulu'); return; }
        
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) throw new Error('Paket tidak ditemukan');
        
        btn.disabled = true;
        btn.textContent = 'Processing...';
        
        const orderId = `VC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        await supabaseClient.from('credit_purchases').insert({
            user_id: session.user.id,
            order_id: orderId,
            package_id: packageId,
            amount_idr: pkg.price,
            credits: pkg.credits,
            status: 'pending'
        });
        
        if (typeof window.snap === 'undefined') {
            alert('Midtrans belum dimuat. Refresh halaman.');
            btn.disabled = false;
            btn.textContent = 'Beli';
            return;
        }
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ 
                plan_id: packageId,
                order_id: orderId,
                amount: pkg.price,
                plan_name: `${pkg.credits} Credits`
            })
        });
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        window.snap.pay(result.snap_token, {
            onSuccess: async () => {
                const { data } = await supabaseClient.from('user_credits')
                    .select('balance, total_purchased')
                    .eq('user_id', session.user.id).single();
                
                await supabaseClient.from('user_credits').update({
                    balance: (data?.balance || 0) + pkg.credits,
                    total_purchased: (data?.total_purchased || 0) + pkg.credits
                }).eq('user_id', session.user.id);
                
                await supabaseClient.from('credit_purchases')
                    .update({ status: 'paid', paid_at: new Date().toISOString() })
                    .eq('order_id', orderId);
                
                alert(`🎉 +${pkg.credits} kredit ditambahkan!`);
                closeCreditsModal();
                loadUserCredits();
            },
            onPending: () => { alert('⏳ Selesaikan pembayaran'); closeCreditsModal(); },
            onError: () => { alert('❌ Gagal'); },
            onClose: () => { btn.disabled = false; btn.textContent = 'Beli'; }
        });
        
    } catch (error) {
        alert('Gagal: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Beli';
    }
}

// ============================================
// TABS & PRICING
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
    if (tabName === 'pricing') loadPricingTable();
}

function loadPricingTable() {
    const grid = document.getElementById('pricing-grid');
    
    let html = '';
    for (const [modelId, pricing] of Object.entries(MODEL_PRICING)) {
        const config = MODEL_CONFIGS[modelId];
        if (!config) continue;
        
        const durations = Object.entries(pricing).map(([d, c]) => `${d}s: ${c}kr`).join(' | ');
        
        html += `
            <div class="pricing-item">
                <div class="pricing-model">${modelId}</div>
                <div class="pricing-desc">${config.desc}</div>
                <div class="pricing-credits">${durations}</div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
}

// ============================================
// POLLING
// ============================================

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        if (userJobs.some(j => ['pending', 'processing'].includes(j.status))) {
            await loadJobs();
            await loadUserCredits();
        }
    }, POLLING_INTERVAL_MS);
}

// ============================================
// GLOBAL
// ============================================

window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.openCreditsModal = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;

console.log('✅ Video API Generator v4.0 loaded');
