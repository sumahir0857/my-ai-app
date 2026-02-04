// ============================================
// VIDEO API GENERATOR v3.4 - SUPABASE STORAGE
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;
let userStats = {};
let isNewUser = false;

// Track uploaded video URLs
let uploadedVideoUrls = {};

// ============================================
// MODEL PRICING
// ============================================

const MODEL_PRICING = {
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
    "minimax-live": 50,
    "minimax-hailuo-1080p": 49,
    "minimax-hailuo-1080p-fast": 33,
    "minimax-hailuo-768p": 28,
    "minimax-hailuo-768p-fast": 19,
    "wan-i2v-720p": 50,
    "wan-i2v-1080p": 75,
    "wan-t2v-720p": 50,
    "wan-t2v-1080p": 75,
    "seedance-480p": 13,
    "seedance-720p": 28,
    "seedance-1080p": 31,
    "ltx-t2v": 30,
    "ltx-i2v": 30,
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
// MODEL CONFIGURATIONS - FIXED v3.6
// ============================================

const MODEL_CONFIGS = {
    // ... (Konfigurasi Model Sama Persis dengan Code Asli Anda) ...
    'kling-2-5-pro': { type: 'image_to_video', desc: 'Image to Video - Gambar wajib diupload', showImage: true, showImageTail: false, showNegative: true, showCfg: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'kling-2-6-pro': { type: 'kling_2_6', desc: 'Text/Image to Video - Gambar opsional', showImage: true, showNegative: true, showCfg: true, showAspectKling26: true, showGenerateAudio: true, showDuration: true, durationOptions: [5, 10], requiresImage: false },
    'kling-2-1-pro': { type: 'image_to_video', desc: 'Image to Video - Gambar wajib', showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'kling-1-6-pro': { type: 'image_to_video', desc: '⚠️ IMAGE WAJIB - Tidak bisa text-to-video!', showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'kling-1-6-std': { type: 'image_to_video', desc: '⚠️ IMAGE WAJIB - Tidak bisa text-to-video!', showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'kling-o1-pro-i2v': { type: 'kling_o1', desc: '⚠️ First Frame WAJIB diupload!', showFrames: true, showAspectRatio: true, showDuration: true, durationOptions: [5, 10], requiresFirstFrame: true },
    'kling-o1-std-i2v': { type: 'kling_o1', desc: '⚠️ First Frame WAJIB diupload!', showFrames: true, showAspectRatio: true, showDuration: true, durationOptions: [5, 10], requiresFirstFrame: true },
    'kling-o1-pro-ref': { type: 'kling_o1_reference', desc: '⚠️ Minimal 1 Reference Image wajib!', showRefImages: true, showAspectRatio: true, showDuration: true, durationOptions: [5, 10], requiresRefImages: true },
    'kling-o1-std-ref': { type: 'kling_o1_reference', desc: '⚠️ Minimal 1 Reference Image wajib!', showRefImages: true, showAspectRatio: true, showDuration: true, durationOptions: [5, 10], requiresRefImages: true },
    'kling-2-6-motion-pro': { type: 'kling_2_6_motion', desc: 'Motion Control - Gambar + Video wajib', showMotion: true, showCfg: true, hideDuration: true },
    'kling-2-6-motion-std': { type: 'kling_2_6_motion', desc: 'Motion Control - Gambar + Video wajib', showMotion: true, showCfg: true, hideDuration: true },
    'minimax-live': { type: 'minimax_live', desc: 'Live Mode - Tanpa opsi durasi', showImage: true, showPromptOptimizer: true, hideDuration: true, requiresImage: false },
    'minimax-hailuo-1080p': { type: 'minimax_hailuo', desc: 'Fixed 6 detik', showFrames: true, showPromptOptimizer: true, showDuration: true, durationOptions: [6], fixedDuration: 6 },
    'minimax-hailuo-1080p-fast': { type: 'minimax_hailuo', desc: 'Fixed 6 detik - Fast', showFrames: true, showPromptOptimizer: true, showDuration: true, durationOptions: [6], fixedDuration: 6 },
    'minimax-hailuo-768p': { type: 'minimax_hailuo', desc: '6 atau 10 detik', showFrames: true, showPromptOptimizer: true, showDuration: true, durationOptions: [6, 10] },
    'minimax-hailuo-768p-fast': { type: 'minimax_hailuo', desc: '6 atau 10 detik - Fast', showFrames: true, showPromptOptimizer: true, showDuration: true, durationOptions: [6, 10] },
    'wan-i2v-720p': { type: 'wan_i2v', desc: 'Image to Video 720p - Gambar wajib', showImage: true, showNegative: true, showWanSize: true, showPromptExpansion: true, showShotType: true, showSeed: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'wan-i2v-1080p': { type: 'wan_i2v', desc: 'Image to Video 1080p - Gambar wajib', showImage: true, showNegative: true, showWanSize: true, showPromptExpansion: true, showShotType: true, showSeed: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'wan-t2v-720p': { type: 'wan_t2v', desc: 'Text to Video 720p', showNegative: true, showWanSize: true, showPromptExpansion: true, showShotType: true, showSeed: true, showDuration: true, durationOptions: [5, 10] },
    'wan-t2v-1080p': { type: 'wan_t2v', desc: 'Text to Video 1080p', showNegative: true, showWanSize: true, showPromptExpansion: true, showShotType: true, showSeed: true, showDuration: true, durationOptions: [5, 10] },
    'seedance-480p': { type: 'seedance', desc: 'Paling hemat - Gambar opsional', showImage: true, showAspectSeedance: true, showGenerateAudio: true, showCameraFixed: true, showSeed: true, showDuration: true, durationOptions: [5, 10] },
    'seedance-720p': { type: 'seedance', desc: 'Gambar opsional', showImage: true, showAspectSeedance: true, showGenerateAudio: true, showCameraFixed: true, showSeed: true, showDuration: true, durationOptions: [5, 10] },
    'seedance-1080p': { type: 'seedance', desc: 'Gambar opsional', showImage: true, showAspectSeedance: true, showGenerateAudio: true, showCameraFixed: true, showSeed: true, showDuration: true, durationOptions: [5, 10] },
    'ltx-t2v': { type: 'ltx_t2v', desc: 'Text to Video - Durasi: 6, 8, atau 10 detik', showLtxResolution: true, showGenerateAudio: true, showFps: true, showSeed: true, showDuration: true, durationOptions: [6, 8, 10] },
    'ltx-i2v': { type: 'ltx_i2v', desc: 'Image to Video - Durasi: 6, 8, atau 10 detik', showImage: true, showLtxResolution: true, showGenerateAudio: true, showFps: true, showSeed: true, showDuration: true, durationOptions: [6, 8, 10], requiresImage: true },
    'runway-gen4': { type: 'runway', desc: '⚠️ Gambar WAJIB diupload!', showImage: true, showRunwayRatio: true, showSeed: true, showDuration: true, durationOptions: [5, 10], requiresImage: true },
    'omnihuman': { type: 'omnihuman', desc: 'Portrait + Audio wajib', showOmnihuman: true },
    'vfx': { type: 'vfx', desc: 'Video input wajib', showVfx: true, noPrompt: true, requiresVideoUrl: true }
};

// ============================================
// CONSTANTS
// ============================================

const MAX_JOBS_PER_USER = 5;
const POLLING_INTERVAL_MS = 5000;
const SUPABASE_STORAGE_BUCKET = 'video-uploads';

// ============================================
// SUPABASE STORAGE UPLOAD
// ============================================

async function uploadToSupabaseStorage(file, progressCallback = null) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Harus login untuk upload file');
        
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${user.id}/${timestamp}_${randomStr}.${ext}`;
        
        if (progressCallback) progressCallback(10, 'Connecting to Supabase...');
        
        const { error } = await supabaseClient.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(fileName, file, { cacheControl: '3600', upsert: false, contentType: file.type });
        
        if (error) throw new Error(error.message);
        
        if (progressCallback) progressCallback(80, 'Getting public URL...');
        
        const { data: urlData } = supabaseClient.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(fileName);
        
        if (!urlData?.publicUrl) throw new Error('Gagal mendapatkan public URL');
        
        console.log('✅ Uploaded to Supabase:', urlData.publicUrl);
        if (progressCallback) progressCallback(100, 'Upload complete!');
        return urlData.publicUrl;
        
    } catch (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
    }
}

async function uploadToLitterbox(file, expiry = '1h') {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', expiry);
    formData.append('fileToUpload', file);
    try {
        const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method: 'POST', body: formData });
        if (response.ok) {
            const url = await response.text();
            if (url.startsWith('http')) return url.trim();
        }
    } catch (error) { console.error('Litterbox error:', error); }
    return null;
}

async function uploadToCatbox(file) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);
    try {
        const response = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
        if (response.ok) {
            const url = await response.text();
            if (url.startsWith('http')) return url.trim();
        }
    } catch (error) { console.error('Catbox error:', error); }
    return null;
}

async function uploadFile(file, progressCallback = null) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📤 Uploading ${file.name} (${sizeMB} MB)...`);
    
    if (file.size > 100 * 1024 * 1024) throw new Error(`File terlalu besar (${sizeMB} MB). Maksimal 100 MB.`);
    
    let url = null;
    try {
        if (progressCallback) progressCallback(5, 'Uploading to Supabase...');
        url = await uploadToSupabaseStorage(file, progressCallback);
        if (url) return url;
    } catch (e) { console.warn('Supabase upload failed, trying fallback...', e); }
    
    if (!url) {
        try {
            if (progressCallback) progressCallback(30, 'Trying Litterbox...');
            url = await uploadToLitterbox(file, '1h');
            if (url) return url;
        } catch (e) { console.warn('Litterbox failed:', e); }
    }
    
    if (!url) {
        try {
            if (progressCallback) progressCallback(60, 'Trying Catbox...');
            url = await uploadToCatbox(file);
            if (url) return url;
        } catch (e) { console.warn('Catbox failed:', e); }
    }
    
    throw new Error('Gagal mengupload file. Pastikan koneksi internet stabil dan coba lagi.');
}

function isValidUrl(string) {
    try { return (new URL(string)).protocol.startsWith('http'); } catch (_) { return false; }
}

function isValidVideoUrl(url) {
    if (!isValidUrl(url)) return false;
    const videoPatterns = [/\.(mp4|mov|avi|webm|mkv)$/i, /supabase\.co\/storage/i, /catbox\.moe/i, /litterbox\.catbox\.moe/i];
    return videoPatterns.some(pattern => pattern.test(url));
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v3.4 loading...');
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
    } catch (error) { return false; }
}

function showLoginUI() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('generator-section').style.display = 'none';
    document.getElementById('btn-login-google').addEventListener('click', async () => {
        try {
            await supabaseClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
        } catch (error) { alert('Login gagal: ' + error.message); }
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
    } catch (error) { return null; }
}

async function initializeUser() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) document.getElementById('user-avatar').src = avatarUrl;
        
        let creditData = null;
        const { data: credits, error } = await supabaseClient.from('user_credits').select('*').eq('user_id', user.id).single();
        
        if (error && error.code === 'PGRST116') {
            const { data: newCredits } = await supabaseClient.from('user_credits').insert({
                user_id: user.id, balance: 50, total_purchased: 0, total_used: 0, total_refunded: 0
            }).select().single();
            if (newCredits) creditData = { balance: newCredits.balance, total_used: 0, total_refunded: 0, is_new_user: true };
        } else if (credits) {
            creditData = { balance: credits.balance, total_used: credits.total_used || 0, total_refunded: credits.total_refunded || 0, is_new_user: false };
        }
        
        if (creditData) {
            userCredits = creditData.balance || 0;
            userStats = creditData;
            isNewUser = creditData.is_new_user || false;
            updateCreditsUI();
            if (isNewUser) setTimeout(() => alert(`🎉 Selamat datang!\n\nAnda mendapat 50 kredit GRATIS.`), 1000);
        }
        await loadJobs();
    } catch (error) { console.error('Initialize user error:', error); }
}

function updateCreditsUI() {
    const creditsFormatted = userCredits.toLocaleString('id-ID');
    document.getElementById('user-credits').textContent = creditsFormatted;
    document.getElementById('stat-credits').textContent = creditsFormatted;
    document.getElementById('stat-used').textContent = (userStats.total_used || 0).toLocaleString('id-ID');
    document.getElementById('stat-refunded').textContent = (userStats.total_refunded || 0).toLocaleString('id-ID');
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) modalCredits.textContent = creditsFormatted + ' kredit';
}

async function loadUserCredits() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        const { data } = await supabaseClient.from('user_credits').select('*').eq('user_id', user.id).single();
        if (data) {
            userCredits = data.balance || 0;
            userStats = { balance: data.balance, total_used: data.total_used || 0, total_refunded: data.total_refunded || 0 };
            updateCreditsUI();
        }
    } catch (error) { console.error('Load credits error:', error); }
}

// ============================================
// UI UPDATE LOGIC
// ============================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const credits = MODEL_PRICING[modelId] || 30;
    
    if (!config) return;
    
    document.getElementById('estimated-credits').textContent = credits;
    document.getElementById('total-credits').textContent = credits;
    document.getElementById('model-desc').textContent = config.desc || '';
    
    // Hide all
    const sections = [
        'section-image', 'section-frames', 'section-ref-images', 'section-motion', 'section-omnihuman', 'section-vfx',
        'group-image-tail', 'group-negative-prompt', 'group-cfg-scale', 'group-aspect-ratio', 'group-aspect-ratio-kling26',
        'group-aspect-ratio-seedance', 'group-runway-ratio', 'group-wan-size', 'group-ltx-resolution', 'group-duration',
        'group-seed', 'group-fps', 'check-generate-audio', 'check-prompt-optimizer', 'check-prompt-expansion',
        'check-camera-fixed', 'group-shot-type'
    ];
    sections.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
    
    // Show relevant
    const promptSection = document.getElementById('section-prompt');
    if (promptSection) promptSection.style.display = config.noPrompt ? 'none' : 'block';
    
    const show = (id) => { const el = document.getElementById(id); if(el) el.style.display = 'block'; };
    const showFlex = (id) => { const el = document.getElementById(id); if(el) el.style.display = 'flex'; };

    if (config.showImage) { show('section-image'); show('group-image'); }
    if (config.showImageTail) show('group-image-tail');
    if (config.showNegative) show('group-negative-prompt');
    if (config.showCfg) show('group-cfg-scale');
    if (config.showFrames) show('section-frames');
    if (config.showRefImages) show('section-ref-images');
    if (config.showMotion) show('section-motion');
    if (config.showOmnihuman) show('section-omnihuman');
    if (config.showVfx) show('section-vfx');
    if (config.showAspectRatio) show('group-aspect-ratio');
    if (config.showAspectKling26) show('group-aspect-ratio-kling26');
    if (config.showAspectSeedance) show('group-aspect-ratio-seedance');
    if (config.showRunwayRatio) show('group-runway-ratio');
    if (config.showWanSize) show('group-wan-size');
    if (config.showLtxResolution) show('group-ltx-resolution');
    if (config.showSeed) show('group-seed');
    if (config.showFps) show('group-fps');
    if (config.showGenerateAudio) showFlex('check-generate-audio');
    if (config.showPromptOptimizer) showFlex('check-prompt-optimizer');
    if (config.showPromptExpansion) showFlex('check-prompt-expansion');
    if (config.showCameraFixed) showFlex('check-camera-fixed');
    if (config.showShotType) show('group-shot-type');
    
    // Duration
    const durationGroup = document.getElementById('group-duration');
    const durationSelect = document.getElementById('input-duration');
    if (config.hideDuration) {
        if (durationGroup) durationGroup.style.display = 'none';
    } else if (config.showDuration && config.durationOptions) {
        if (durationGroup) durationGroup.style.display = 'block';
        if (durationSelect) {
            durationSelect.innerHTML = '';
            config.durationOptions.forEach((duration, index) => {
                const option = document.createElement('option');
                option.value = duration;
                option.textContent = `${duration} detik`;
                if (index === 0) option.selected = true;
                durationSelect.appendChild(option);
            });
            durationSelect.disabled = config.durationOptions.length === 1;
        }
    } else {
        if (durationGroup) durationGroup.style.display = 'none';
    }
    
    // Reset video status
    uploadedVideoUrls = {};
    updateVideoUploadStatus();
}

function updateVideoUploadStatus() {
    const update = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = uploadedVideoUrls[key] ? `<span class="upload-success">✅ Video ready</span>` : '';
    };
    update('motion-video-status', 'motion_video');
    update('vfx-video-status', 'vfx_video');
}


// ============================================
// CUSTOM MOBILE SELECTOR LOGIC (DYNAMIC)
// ============================================

function initCustomModelSelector() {
    const trigger = document.getElementById('model-select-trigger');
    const nativeSelect = document.getElementById('input-model');
    const overlay = document.getElementById('model-sheet-overlay');
    const sheet = document.getElementById('model-sheet');
    const closeBtn = document.getElementById('model-sheet-close');
    const searchInput = document.getElementById('model-search');

    // 1. Render List dari HTML Select Asli
    renderModelListFromDOM('');

    // 2. Event Listeners untuk Buka/Tutup
    if (trigger) {
        trigger.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation(); // Mencegah klik tembus
            openSheet();
        };
    }

    if (overlay) overlay.onclick = closeSheet;
    if (closeBtn) closeBtn.onclick = closeSheet;

    // 3. Search Listener
    if (searchInput) {
        searchInput.oninput = (e) => {
            renderModelListFromDOM(e.target.value.toLowerCase());
        };
    }

    // 4. Sync Listener
    if (nativeSelect) {
        // Update tampilan trigger saat pertama load
        updateTriggerDisplay(nativeSelect);
        // Update tampilan trigger saat value berubah
        nativeSelect.addEventListener('change', function() {
            updateTriggerDisplay(this);
        });
    }
}

function renderModelListFromDOM(filterText) {
    const nativeSelect = document.getElementById('input-model');
    const content = document.getElementById('model-sheet-content');
    if (!nativeSelect || !content) return;

    const currentVal = nativeSelect.value;
    let html = '';
    let foundAny = false;

    const groups = nativeSelect.querySelectorAll('optgroup');
    
    groups.forEach(group => {
        const groupLabel = group.label;
        const options = group.querySelectorAll('option');
        let groupHtml = '';
        let hasVisibleOption = false;

        options.forEach(opt => {
            const text = opt.text;
            const value = opt.value;
            
            if (text.toLowerCase().includes(filterText) || groupLabel.toLowerCase().includes(filterText)) {
                const isSelected = value === currentVal ? 'selected' : '';
                let credits = 'Info';
                const match = text.match(/\((\d+)\s*kredit\)/i);
                if (match) credits = '🪙 ' + match[1];
                const modelName = text.replace(/\(.*\)/, '').trim();

                groupHtml += `
                <div class="model-item ${isSelected}" onclick="selectModel('${value}')">
                    <div class="model-item-info">
                        <div class="model-item-name">${modelName}</div>
                        <div class="model-item-desc">${groupLabel}</div>
                    </div>
                    <div class="model-item-credits">${credits}</div>
                </div>`;
                hasVisibleOption = true;
                foundAny = true;
            }
        });

        if (hasVisibleOption) {
            html += `<div class="model-group-title">${groupLabel}</div>${groupHtml}`;
        }
    });

    if (!foundAny) html = `<div style="padding:30px; text-align:center; color:#888;">Model tidak ditemukan</div>`;
    content.innerHTML = html;
}

function selectModel(value) {
    const nativeSelect = document.getElementById('input-model');
    if (nativeSelect) {
        nativeSelect.value = value;
        nativeSelect.dispatchEvent(new Event('change')); // Trigger updateModelUI
    }
    closeSheet();
}

function updateTriggerDisplay(selectElement) {
    const display = document.getElementById('model-select-value');
    if (display && selectElement.selectedIndex >= 0) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        display.textContent = selectedOption.text;
    }
}

function openSheet() {
    const sheet = document.getElementById('model-sheet');
    const overlay = document.getElementById('model-sheet-overlay');
    const search = document.getElementById('model-search');
    if (sheet && overlay) {
        sheet.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderModelListFromDOM('');
        if (search) search.value = '';
    }
}

function closeSheet() {
    const sheet = document.getElementById('model-sheet');
    const overlay = document.getElementById('model-sheet-overlay');
    if (sheet && overlay) {
        sheet.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}


// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // 1. Initialize Custom Mobile Selector FIRST
    initCustomModelSelector();

    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateModelUI);
    }
    
    updateModelUI();
    
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) cfgSlider.addEventListener('input', () => { document.getElementById('cfg-value').textContent = cfgSlider.value; });
    
    // File Uploads
    setupFileUpload('input-image', 'preview-image', 'btn-remove-image');
    setupFileUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileUpload('input-first-frame', 'preview-first-frame');
    setupFileUpload('input-last-frame', 'preview-last-frame');
    setupFileUpload('input-motion-image', 'preview-motion-image');
    setupFileUpload('input-omni-image', 'preview-omni-image');
    setupFileUpload('input-omni-audio', 'preview-omni-audio', null, false, true);
    
    setupVideoUploadWithPreupload('input-motion-video', 'preview-motion-video', 'btn-upload-motion-video', 'motion-video-status', 'motion_video');
    setupVideoUploadWithPreupload('input-vfx-video', 'preview-vfx-video', 'btn-upload-vfx-video', 'vfx-video-status', 'vfx_video');
    
    setupVideoUrlInput('input-motion-video-url', 'motion_video');
    setupVideoUrlInput('input-vfx-video-url', 'vfx_video');
    
    for (let i = 1; i <= 7; i++) setupFileUpload(`input-ref-${i}`, `preview-ref-${i}`);
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    
    const form = document.getElementById('generator-form');
    if (form) form.addEventListener('submit', submitJob);
    
    const buyBtn = document.getElementById('btn-buy-credits');
    if (buyBtn) buyBtn.addEventListener('click', openCreditsModal);
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => { await supabaseClient.auth.signOut(); window.location.reload(); });
    
    const closeModalBtn = document.getElementById('btn-close-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeJobModal);
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.addEventListener('click', (e) => { if (e.target.id === 'job-modal') closeJobModal(); });
    
    // VFX filters
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const type = parseInt(filterSelect.value);
            const bloom = document.getElementById('group-bloom-contrast');
            const motion = document.getElementById('group-motion-blur');
            if (bloom) bloom.style.display = type === 7 ? 'block' : 'none';
            if (motion) motion.style.display = type === 2 ? 'block' : 'none';
        });
    }
    
    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) bloomSlider.addEventListener('input', () => { document.getElementById('bloom-value').textContent = bloomSlider.value; });
    
    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) decaySlider.addEventListener('input', () => { document.getElementById('decay-value').textContent = decaySlider.value; });
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
        if (removeId) { const btn = document.getElementById(removeId); if(btn) btn.style.display = 'block'; }
    });
    
    if (removeId) {
        const removeBtn = document.getElementById(removeId);
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                input.value = ''; preview.src = ''; preview.style.display = 'none';
                const placeholder = preview.parentElement.querySelector('.upload-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                preview.parentElement.classList.remove('has-preview');
                removeBtn.style.display = 'none';
            });
        }
    }
}

function setupVideoUploadWithPreupload(inputId, previewId, uploadBtnId, statusId, urlKey) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const uploadBtn = document.getElementById(uploadBtnId);
    const statusEl = document.getElementById(statusId);
    
    if (!input) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (preview) {
            preview.src = URL.createObjectURL(file); preview.style.display = 'block';
            const ph = preview.parentElement?.querySelector('.upload-placeholder'); if(ph) ph.style.display = 'none';
            preview.parentElement?.classList.add('has-preview');
        }
        delete uploadedVideoUrls[urlKey];
        if (statusEl) statusEl.innerHTML = `<span class="upload-pending">⚠️ Klik "Upload Video" untuk mengupload</span>`;
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.style.display = 'block'; uploadBtn.innerHTML = '📤 Upload Video ke Server'; }
    });
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            const file = input.files[0];
            if (!file) return alert('Pilih video terlebih dahulu!');
            const sizeMB = file.size / 1024 / 1024;
            if (sizeMB > 100) return alert(`File terlalu besar. Max 100 MB.`);
            
            uploadBtn.disabled = true; uploadBtn.innerHTML = '⏳ Mengupload...';
            if (statusEl) statusEl.innerHTML = '<span class="upload-progress">📤 Mengupload video...</span>';
            
            try {
                const uploadedUrl = await uploadFile(file, (p, m) => { if(statusEl) statusEl.innerHTML = `<span class="upload-progress">📤 ${m} (${p}%)</span>`; uploadBtn.innerHTML = `⏳ ${p}%`; });
                uploadedVideoUrls[urlKey] = uploadedUrl;
                if (statusEl) statusEl.innerHTML = `<span class="upload-success">✅ Video berhasil diupload!</span>`;
                uploadBtn.innerHTML = '✅ Terupload'; uploadBtn.disabled = true;
            } catch (error) {
                if (statusEl) statusEl.innerHTML = `<span class="upload-error">❌ ${error.message}</span>`;
                uploadBtn.disabled = false; uploadBtn.innerHTML = '🔄 Coba Upload Lagi';
            }
        });
    }
}

function setupVideoUrlInput(inputId, urlKey) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const statusEl = input.parentElement?.querySelector('.url-status');
        if (!url) { delete uploadedVideoUrls[urlKey]; if(statusEl) statusEl.innerHTML = ''; return; }
        if (isValidVideoUrl(url)) { uploadedVideoUrls[urlKey] = url; if(statusEl) statusEl.innerHTML = '<span class="url-valid">✅ URL valid</span>'; }
        else { delete uploadedVideoUrls[urlKey]; if(statusEl) statusEl.innerHTML = '<span class="url-invalid">⚠️ URL invalid</span>'; }
    });
}

// ============================================
// JOB SUBMISSION
// ============================================

async function submitJob(event) {
    event.preventDefault();
    const user = await getCurrentUser();
    if (!user) return alert('Silakan login terlebih dahulu');
    
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const requiredCredits = MODEL_PRICING[modelId] || 30;
    
    if (!config) return alert('Model tidak valid');
    
    const prompt = document.getElementById('input-prompt')?.value?.trim() || '';
    if (!prompt && !config.noPrompt) return alert('Prompt wajib diisi!');
    
    if (config.requiresImage && !document.getElementById('input-image')?.files[0]) return alert('Model ini WAJIB menggunakan gambar!');
    if (config.requiresFirstFrame && !document.getElementById('input-first-frame')?.files[0]) return alert('Model ini membutuhkan First Frame!');
    if (config.requiresRefImages) {
        let has = false; for(let i=1;i<=7;i++) if(document.getElementById(`input-ref-${i}`)?.files[0]) has=true;
        if (!has) return alert('Upload minimal 1 gambar referensi!');
    }
    
    if (config.showMotion) {
        if (!uploadedVideoUrls.motion_video) return alert('Video Motion belum diupload!');
        if (!document.getElementById('input-motion-image')?.files[0]) return alert('Gambar karakter wajib diupload!');
    }
    if (config.showVfx && !uploadedVideoUrls.vfx_video) return alert('Video VFX belum diupload!');
    
    const activeJobsCount = userJobs.filter(j => ['pending', 'processing'].includes(j.status)).length;
    if (activeJobsCount >= MAX_JOBS_PER_USER) return alert(`Maksimal ${MAX_JOBS_PER_USER} job bersamaan.`);
    if (userCredits < requiredCredits) return openCreditsModal();
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true; submitBtn.innerHTML = '⏳ Memproses...';
    
    try {
        const inputData = await collectInputData(modelId, config, prompt, requiredCredits, user.id);
        
        // Check credit
        const { data: currentCredits, error: fetchError } = await supabaseClient.from('user_credits').select('balance, total_used').eq('user_id', user.id).single();
        if (fetchError || currentCredits.balance < requiredCredits) throw new Error('Kredit tidak mencukupi');
        
        // Deduct credit
        const newBalance = currentCredits.balance - requiredCredits;
        const newTotalUsed = (currentCredits.total_used || 0) + requiredCredits;
        await supabaseClient.from('user_credits').update({ balance: newBalance, total_used: newTotalUsed }).eq('user_id', user.id);
        
        userCredits = newBalance; userStats.total_used = newTotalUsed; updateCreditsUI();
        
        // Create job
        const { error: jobError } = await supabaseClient.from('jobs').insert({
            user_id: user.id, service: 'videoapi', status: 'pending', input_data: inputData, total_steps: 4, current_step: 0, step_name: 'Queued', progress_percent: 0
        });
        
        if (jobError) throw new Error(jobError.message);
        
        alert(`✅ Job berhasil dibuat!\nSisa kredit: ${userCredits}`);
        resetForm(); switchTab('active'); await loadJobs();
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('Gagal: ' + error.message);
        await loadUserCredits();
    } finally {
        submitBtn.disabled = false; submitBtn.innerHTML = '🚀 Generate Video';
    }
}

async function collectInputData(modelId, config, prompt, credits, userId) {
    const data = { model_id: modelId, prompt: prompt, negative_prompt: document.getElementById('input-negative')?.value || '', credits_used: credits, user_id: userId, settings: {} };
    const settings = data.settings;
    const btn = document.getElementById('btn-submit');
    const update = (t) => { if(btn) btn.innerHTML = t; };
    
    // Simple fields
    if (config.showDuration && !config.hideDuration) settings.duration = parseInt(document.getElementById('input-duration')?.value || 5);
    else if (config.fixedDuration) settings.duration = config.fixedDuration;
    
    if (config.showCfg) settings.cfg_scale = parseFloat(document.getElementById('input-cfg')?.value || 0.5);
    if (config.showSeed) settings.seed = parseInt(document.getElementById('input-seed')?.value || -1);
    if (config.showFps) settings.fps = parseInt(document.getElementById('input-fps')?.value || 25);
    if (config.showAspectRatio) settings.aspect_ratio = document.getElementById('input-aspect-ratio')?.value;
    if (config.showAspectKling26) settings.aspect_ratio = document.getElementById('input-aspect-ratio-kling26')?.value;
    if (config.showAspectSeedance) settings.aspect_ratio = document.getElementById('input-aspect-ratio-seedance')?.value;
    if (config.showRunwayRatio) settings.ratio = document.getElementById('input-runway-ratio')?.value;
    if (config.showWanSize) settings.size = document.getElementById('input-wan-size')?.value;
    if (config.showLtxResolution) settings.resolution = document.getElementById('input-ltx-resolution')?.value;
    if (config.showGenerateAudio) settings.generate_audio = document.getElementById('input-generate-audio')?.checked;
    if (config.showPromptOptimizer) settings.prompt_optimizer = document.getElementById('input-prompt-optimizer')?.checked;
    if (config.showCameraFixed) settings.camera_fixed = document.getElementById('input-camera-fixed')?.checked;
    if (config.showShotType) settings.shot_type = document.getElementById('input-shot-type')?.value;
    
    // Files
    if (config.showImage) { const f = document.getElementById('input-image')?.files[0]; if(f) { update('⏳ Img...'); settings.image = await fileToBase64(f); } }
    if (config.showImageTail) { const f = document.getElementById('input-image-tail')?.files[0]; if(f) settings.image_tail = await fileToBase64(f); }
    if (config.showFrames) {
        const f1 = document.getElementById('input-first-frame')?.files[0]; if(f1) { update('⏳ Frame1...'); settings.first_frame = await fileToBase64(f1); }
        const f2 = document.getElementById('input-last-frame')?.files[0]; if(f2) settings.last_frame = await fileToBase64(f2);
    }
    if (config.showRefImages) {
        settings.reference_images = [];
        for(let i=1;i<=7;i++){ const f = document.getElementById(`input-ref-${i}`)?.files[0]; if(f) { update(`⏳ Ref ${i}...`); settings.reference_images.push(await fileToBase64(f)); }}
    }
    
    // Motion
    if (config.showMotion) {
        update('⏳ Upload char...');
        settings.image_url = await uploadFile(document.getElementById('input-motion-image').files[0]);
        settings.video_url = uploadedVideoUrls.motion_video;
        settings.character_orientation = document.getElementById('input-character-orientation')?.value;
    }
    
    // Omni
    if (config.showOmnihuman) {
        update('⏳ Upload portrait...');
        settings.image_url = await uploadFile(document.getElementById('input-omni-image').files[0]);
        update('⏳ Upload audio...');
        settings.audio_url = await uploadFile(document.getElementById('input-omni-audio').files[0]);
        settings.resolution = document.getElementById('input-omni-resolution')?.value;
        settings.turbo_mode = document.getElementById('input-turbo-mode')?.checked;
    }
    
    // VFX
    if (config.showVfx) {
        settings.video_url = uploadedVideoUrls.vfx_video;
        settings.filter_type = parseInt(document.getElementById('input-filter-type')?.value);
        settings.fps = parseInt(document.getElementById('input-vfx-fps')?.value);
        if(settings.filter_type===7) settings.bloom_contrast = parseFloat(document.getElementById('input-bloom-contrast')?.value);
        if(settings.filter_type===2) { settings.motion_kernel = parseInt(document.getElementById('input-motion-kernel')?.value); settings.motion_decay = parseFloat(document.getElementById('input-motion-decay')?.value); }
    }
    
    update('⏳ Submitting...');
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
    document.querySelectorAll('.upload-preview').forEach(el => { el.style.display='none'; el.src=''; });
    document.querySelectorAll('.upload-box').forEach(el => el.classList.remove('has-preview'));
    document.querySelectorAll('.btn-remove-upload').forEach(el => el.style.display='none');
    document.querySelectorAll('.upload-placeholder').forEach(el => el.style.display='flex');
    uploadedVideoUrls = {};
    document.querySelectorAll('.video-upload-status').forEach(el => el.innerHTML='');
    document.querySelectorAll('.btn-upload-video').forEach(btn => { btn.innerHTML='📤 Upload Video ke Server'; btn.disabled=true; btn.style.display='none'; });
    updateModelUI();
}

async function loadJobs() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        const { data: jobs } = await supabaseClient.from('jobs').select('*').eq('service', 'videoapi').eq('user_id', user.id).order('created_at', {ascending:false}).limit(50);
        userJobs = jobs || [];
        renderJobs();
    } catch (e) { console.error(e); }
}

function renderJobs() {
    const active = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const history = userJobs.filter(j => !['pending', 'processing'].includes(j.status));
    document.getElementById('active-count').textContent = active.length;
    document.getElementById('history-count').textContent = history.length;
    
    const render = (arr, isActive) => arr.length ? arr.map(j => renderJobCard(j, isActive)).join('') : `<div class="empty-state"><p>Tidak ada data</p></div>`;
    
    document.getElementById('active-jobs').innerHTML = render(active, true);
    document.getElementById('history-jobs').innerHTML = render(history, false);
}

function renderJobCard(job, isActive) {
    const input = job.input_data || {};
    let preview = '';
    if (job.status === 'completed' && job.results) {
        const res = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (res.video_url) preview = `<video src="${res.video_url}" class="job-preview-video" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
    }
    return `<div class="job-card status-${job.status}" onclick="openJobModal('${job.id}')">
        <div class="job-header"><span class="job-model">${input.model_id}</span><span class="job-status status-${job.status}">${job.status}</span></div>
        ${preview}
        <div class="job-info"><span class="job-credits">🪙 ${input.credits_used}</span><span class="job-date">${new Date(job.created_at).toLocaleString()}</span></div>
        ${isActive ? `<div class="job-progress"><div class="progress-bar"><div class="progress-fill" style="width:${job.progress_percent}%"></div></div><span>${job.progress_percent}%</span></div>` : ''}
    </div>`;
}

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    const input = job.input_data || {};
    const res = typeof job.results === 'string' ? JSON.parse(job.results||'{}') : (job.results||{});
    
    document.getElementById('modal-title').textContent = input.model_id;
    document.getElementById('modal-status').className = 'status-badge status-' + job.status;
    document.getElementById('modal-status').textContent = job.status;
    
    const pSec = document.getElementById('modal-progress');
    const rSec = document.getElementById('modal-results');
    const eSec = document.getElementById('modal-error');
    
    if (job.status === 'completed') {
        pSec.style.display='none'; eSec.style.display='none'; rSec.style.display='block';
        if (res.video_url) { document.getElementById('modal-video').src = res.video_url; document.getElementById('modal-download').href = res.video_url; }
        document.getElementById('modal-model').textContent = input.model_id;
        document.getElementById('modal-credits-final').textContent = input.credits_used;
    } else if (job.status === 'failed' || job.status === 'cancelled') {
        pSec.style.display='none'; rSec.style.display='none'; eSec.style.display='block';
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Error';
    } else {
        pSec.style.display='block'; rSec.style.display='none'; eSec.style.display='none';
        document.getElementById('modal-progress-fill').style.width = job.progress_percent + '%';
        document.getElementById('modal-progress-percent').textContent = job.progress_percent + '%';
        document.getElementById('modal-credits-used').textContent = input.credits_used;
        document.getElementById('modal-step').textContent = job.step_name;
    }
    document.getElementById('job-modal').style.display='flex';
}

function closeJobModal() {
    document.getElementById('job-modal').style.display='none';
    const v = document.getElementById('modal-video'); if(v) v.pause();
}

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    if (grid) {
        grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
            <div class="package-card ${pkg.popular?'popular':''} ${pkg.bestValue?'best-value':''}">
                <h3>${pkg.name}</h3><div>${pkg.credits} Kredit</div><div>Rp ${pkg.price.toLocaleString()}</div>
                <button class="btn-buy-package" data-id="${pkg.id}">Beli</button>
            </div>`).join('');
        grid.querySelectorAll('.btn-buy-package').forEach(b => b.addEventListener('click', e => { e.preventDefault(); purchaseCredits(b.dataset.id, b); }));
    }
    document.getElementById('modal-current-credits').textContent = userCredits.toLocaleString() + ' kredit';
    document.getElementById('credits-modal').style.display='flex';
}

function closeCreditsModal() { document.getElementById('credits-modal').style.display='none'; }

async function purchaseCredits(packageId, btn) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return alert('Login dulu');
        btn.disabled=true; btn.textContent='Memproses...';
        
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        const orderId = `VC${Date.now().toString(36).toUpperCase()}`;
        
        await supabaseClient.from('credit_purchases').insert({ user_id: session.user.id, order_id: orderId, package_id: packageId, amount_idr: pkg.price, credits: pkg.credits, status: 'pending' });
        
        const res = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({ plan_id: packageId, order_id: orderId, amount: pkg.price, plan_name: `${pkg.credits} Credits` })
        });
        
        const result = await res.json();
        if (!result.snap_token) throw new Error('Gagal token');
        
        window.snap.pay(result.snap_token, {
            onSuccess: async (r) => {
                const { data } = await supabaseClient.from('user_credits').select('*').eq('user_id', session.user.id).single();
                await supabaseClient.from('user_credits').update({ balance: data.balance + pkg.credits }).eq('user_id', session.user.id);
                await supabaseClient.from('credit_purchases').update({ status: 'paid' }).eq('order_id', orderId);
                alert('Berhasil!'); closeCreditsModal(); await loadUserCredits();
            },
            onPending: () => { alert('Menunggu pembayaran'); closeCreditsModal(); },
            onError: () => alert('Gagal'),
            onClose: () => { btn.disabled=false; btn.textContent='Beli'; }
        });
    } catch (e) { alert(e.message); btn.disabled=false; btn.textContent='Beli'; }
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
    if (tab === 'pricing') loadPricingTable();
}

function loadPricingTable() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;
    let html = '';
    const cats = {'Kling Premium':['kling-2-5-pro','kling-o1-pro-i2v'], 'Seedance':['seedance-480p']}; // Simplified for brevity
    // You can iterate over full MODEL_CONFIGS keys if needed
    for(const k in MODEL_CONFIGS) {
        html += `<div class="pricing-item"><div>${k}</div><div>🪙 ${MODEL_PRICING[k]}</div></div>`;
    }
    grid.innerHTML = `<div class="pricing-list">${html}</div>`;
}

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        if (userJobs.some(j => ['pending', 'processing'].includes(j.status))) { await loadJobs(); await loadUserCredits(); }
    }, POLLING_INTERVAL_MS);
}

function openVideoTutorial() { window.open('video-upload-tutorial.html', '_blank'); }

window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.openCreditsModal = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;
window.openVideoTutorial = openVideoTutorial;
window.purchaseCredits = purchaseCredits;
window.selectModel = selectModel; // EXPORT SELECT MODEL

console.log('✅ Video API Generator loaded');
