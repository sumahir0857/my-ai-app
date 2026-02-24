// ============================================================
// VIDEO API GENERATOR v4.0 – Optimized + 3-Column Layout
// ============================================================

'use strict';

// ============================================================
// STATE
// ============================================================

let userJobs = [];
let userCredits = 0;
let userStats = {};
let isNewUser = false;
let uploadedVideoUrls = {};

// Polling
let pollingTimer = null;
let isTabVisible = true;
let pendingFetch = null;         // Request deduplication
let lastFetchTime = 0;
const MIN_FETCH_INTERVAL = 2000; // Minimum ms between fetches

// ============================================================
// CACHE KEYS
// ============================================================

const CACHE_JOBS    = 'vag_jobs_v1';
const CACHE_CREDITS = 'vag_credits_v1';

function saveCache() {
    try {
        localStorage.setItem(CACHE_JOBS, JSON.stringify({ jobs: userJobs, ts: Date.now() }));
        localStorage.setItem(CACHE_CREDITS, JSON.stringify({ credits: userCredits, stats: userStats, ts: Date.now() }));
    } catch (e) { /* storage full or private mode */ }
}

function loadCache() {
    try {
        const jc = localStorage.getItem(CACHE_JOBS);
        if (jc) {
            const { jobs } = JSON.parse(jc);
            userJobs = jobs || [];
            renderJobs();  // Instant render from cache
            updateChatFeed();
        }
        const cc = localStorage.getItem(CACHE_CREDITS);
        if (cc) {
            const { credits, stats } = JSON.parse(cc);
            userCredits = credits || 0;
            userStats   = stats   || {};
            updateCreditsUI();
        }
    } catch (e) { /* parse error */ }
}

// ============================================================
// MODEL PRICING
// ============================================================

const MODEL_PRICING = {
    'kling-2-5-pro':38,'kling-o1-pro-i2v':56,'kling-o1-std-i2v':42,
    'kling-o1-pro-ref':84,'kling-o1-std-ref':63,'kling-2-6-pro':35,
    'kling-2-6-motion-pro':70,'kling-2-6-motion-std':35,'kling-2-1-pro':50,
    'kling-1-6-pro':51,'kling-1-6-std':30,'minimax-live':50,
    'minimax-hailuo-1080p':49,'minimax-hailuo-1080p-fast':33,
    'minimax-hailuo-768p':28,'minimax-hailuo-768p-fast':19,
    'wan-i2v-720p':50,'wan-i2v-1080p':75,'wan-t2v-720p':50,'wan-t2v-1080p':75,
    'seedance-480p':13,'seedance-720p':28,'seedance-1080p':31,
    'ltx-t2v':30,'ltx-i2v':30,'runway-gen4':75,'omnihuman':81,'vfx':9
};

const CREDIT_PACKAGES = [
    { id:'starter',  name:'Starter', credits:599,  price:25000,  pricePerCredit:14 },
    { id:'creator',  name:'Creator', credits:2999,  price:45000,  pricePerCredit:13 },
    { id:'pro',      name:'Pro',     credits:6999,  price:100000, pricePerCredit:11, popular:true },
    { id:'studio',   name:'Studio',  credits:10000, price:180000, pricePerCredit:10, bestValue:true }
];

// ============================================================
// MODEL CONFIGS
// ============================================================

const MODEL_CONFIGS = {
    'kling-2-5-pro':       { desc:'Image to Video – Gambar wajib diupload', showImage:true, showNegative:true, showCfg:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'kling-2-6-pro':       { desc:'Text/Image to Video – Gambar opsional', showImage:true, showNegative:true, showCfg:true, showAspectKling26:true, showGenerateAudio:true, showDuration:true, durationOptions:[5,10] },
    'kling-2-1-pro':       { desc:'Image to Video – Gambar wajib', showImage:true, showImageTail:true, showNegative:true, showCfg:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'kling-1-6-pro':       { desc:'⚠️ IMAGE WAJIB – Tidak bisa text-to-video!', showImage:true, showImageTail:true, showNegative:true, showCfg:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'kling-1-6-std':       { desc:'⚠️ IMAGE WAJIB – Tidak bisa text-to-video!', showImage:true, showImageTail:true, showNegative:true, showCfg:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'kling-o1-pro-i2v':    { desc:'⚠️ First Frame WAJIB diupload!', showFrames:true, showAspectRatio:true, showDuration:true, durationOptions:[5,10], requiresFirstFrame:true },
    'kling-o1-std-i2v':    { desc:'⚠️ First Frame WAJIB diupload!', showFrames:true, showAspectRatio:true, showDuration:true, durationOptions:[5,10], requiresFirstFrame:true },
    'kling-o1-pro-ref':    { desc:'⚠️ Minimal 1 Reference Image wajib!', showRefImages:true, showAspectRatio:true, showDuration:true, durationOptions:[5,10], requiresRefImages:true },
    'kling-o1-std-ref':    { desc:'⚠️ Minimal 1 Reference Image wajib!', showRefImages:true, showAspectRatio:true, showDuration:true, durationOptions:[5,10], requiresRefImages:true },
    'kling-2-6-motion-pro':{ desc:'Motion Control – Gambar + Video wajib', showMotion:true, showCfg:true, hideDuration:true },
    'kling-2-6-motion-std':{ desc:'Motion Control – Gambar + Video wajib', showMotion:true, showCfg:true, hideDuration:true },
    'minimax-live':        { desc:'Live Mode – Tanpa opsi durasi', showImage:true, showPromptOptimizer:true, hideDuration:true },
    'minimax-hailuo-1080p':     { desc:'Fixed 6 detik', showFrames:true, showPromptOptimizer:true, showDuration:true, durationOptions:[6], fixedDuration:6 },
    'minimax-hailuo-1080p-fast':{ desc:'Fixed 6 detik – Fast', showFrames:true, showPromptOptimizer:true, showDuration:true, durationOptions:[6], fixedDuration:6 },
    'minimax-hailuo-768p':      { desc:'6 atau 10 detik', showFrames:true, showPromptOptimizer:true, showDuration:true, durationOptions:[6,10] },
    'minimax-hailuo-768p-fast': { desc:'6 atau 10 detik – Fast', showFrames:true, showPromptOptimizer:true, showDuration:true, durationOptions:[6,10] },
    'wan-i2v-720p':  { desc:'Image to Video 720p – Gambar wajib', showImage:true, showNegative:true, showWanSize:true, showPromptExpansion:true, showShotType:true, showSeed:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'wan-i2v-1080p': { desc:'Image to Video 1080p – Gambar wajib', showImage:true, showNegative:true, showWanSize:true, showPromptExpansion:true, showShotType:true, showSeed:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'wan-t2v-720p':  { desc:'Text to Video 720p', showNegative:true, showWanSize:true, showPromptExpansion:true, showShotType:true, showSeed:true, showDuration:true, durationOptions:[5,10] },
    'wan-t2v-1080p': { desc:'Text to Video 1080p', showNegative:true, showWanSize:true, showPromptExpansion:true, showShotType:true, showSeed:true, showDuration:true, durationOptions:[5,10] },
    'seedance-480p': { desc:'Paling hemat – Gambar opsional', showImage:true, showAspectSeedance:true, showCameraFixed:true, showSeed:true, showDuration:true, durationOptions:[5,10] },
    'seedance-720p': { desc:'Gambar opsional', showImage:true, showAspectSeedance:true, showCameraFixed:true, showSeed:true, showDuration:true, durationOptions:[5,10] },
    'seedance-1080p':{ desc:'Gambar opsional', showImage:true, showAspectSeedance:true, showCameraFixed:true, showSeed:true, showDuration:true, durationOptions:[5,10] },
    'ltx-t2v': { desc:'Text to Video – Durasi: 6, 8, atau 10 detik', showLtxResolution:true, showGenerateAudio:true, showFps:true, showSeed:true, showDuration:true, durationOptions:[6,8,10] },
    'ltx-i2v': { desc:'Image to Video – Durasi: 6, 8, atau 10 detik', showImage:true, showLtxResolution:true, showGenerateAudio:true, showFps:true, showSeed:true, showDuration:true, durationOptions:[6,8,10], requiresImage:true },
    'runway-gen4': { desc:'⚠️ Gambar WAJIB diupload!', showImage:true, showRunwayRatio:true, showSeed:true, showDuration:true, durationOptions:[5,10], requiresImage:true },
    'omnihuman':   { desc:'Portrait + Audio wajib', showOmnihuman:true },
    'vfx':         { desc:'Video input wajib', showVfx:true, noPrompt:true, requiresVideoUrl:true }
};

// Model list by brand for sidebar
const BRAND_MODELS = {
    'all': Object.keys(MODEL_PRICING),
    'kling-premium': ['kling-2-5-pro','kling-o1-pro-i2v','kling-o1-pro-ref','kling-2-6-pro','kling-2-6-motion-pro','kling-2-1-pro'],
    'kling-standard': ['kling-o1-std-i2v','kling-o1-std-ref','kling-2-6-motion-std','kling-1-6-pro','kling-1-6-std'],
    'minimax': ['minimax-live','minimax-hailuo-1080p','minimax-hailuo-1080p-fast','minimax-hailuo-768p','minimax-hailuo-768p-fast'],
    'wan': ['wan-i2v-720p','wan-i2v-1080p','wan-t2v-720p','wan-t2v-1080p'],
    'seedance': ['seedance-480p','seedance-720p','seedance-1080p'],
    'ltx': ['ltx-t2v','ltx-i2v'],
    'runway': ['runway-gen4','omnihuman','vfx']
};

const SUPABASE_STORAGE_BUCKET = 'video-uploads';

// ============================================================
// VISIBILITY API – Pause polling when tab hidden
// ============================================================

document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) {
        // Resume: immediate check then restart polling
        checkAndPoll();
        startPolling();
    } else {
        stopPolling();
    }
});

// ============================================================
// ADAPTIVE POLLING INTERVAL
// ============================================================

function getPollingInterval() {
    const hasActive = userJobs.some(j => ['pending','processing'].includes(j.status));
    if (!hasActive) return 30000; // No active jobs: poll slowly

    // Connection-aware
    try {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            if (conn.saveData) return 20000;
            if (conn.effectiveType === '2g') return 20000;
            if (conn.effectiveType === '3g') return 10000;
        }
    } catch (e) {}

    return 5000; // Active jobs on good connection: poll every 5s
}

function startPolling() {
    stopPolling();
    scheduleNextPoll();
}

function stopPolling() {
    if (pollingTimer) {
        clearTimeout(pollingTimer);
        pollingTimer = null;
    }
}

function scheduleNextPoll() {
    const interval = getPollingInterval();
    pollingTimer = setTimeout(checkAndPoll, interval);
}

async function checkAndPoll() {
    if (!isTabVisible) return;

    const hasActive = userJobs.some(j => ['pending','processing'].includes(j.status));
    if (hasActive) {
        await loadJobsDeduped();
        await loadUserCredits();
    }
    scheduleNextPoll();
}

// ============================================================
// REQUEST DEDUPLICATION
// ============================================================

async function loadJobsDeduped() {
    const now = Date.now();
    if (now - lastFetchTime < MIN_FETCH_INTERVAL) return; // Throttle

    if (pendingFetch) return pendingFetch; // Deduplicate
    pendingFetch = loadJobs().finally(() => { pendingFetch = null; });
    return pendingFetch;
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video AI Generator v4.0');

    // Show cached data instantly
    loadCache();

    const isLoggedIn = await checkAuth();
    if (isLoggedIn) {
        showGeneratorUI();
        await initializeUser();
        setupEventListeners();
        buildModelList('all');
        startPolling();
    } else {
        showLoginUI();
    }
});

async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return !!session;
    } catch (e) { return false; }
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
        } catch (e) { alert('Login gagal: ' + e.message); }
    });
}

function showGeneratorUI() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('generator-section').style.display = 'flex';
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    } catch (e) { return null; }
}

// ============================================================
// INITIALIZE USER
// ============================================================

async function initializeUser() {
    try {
        const user = await getCurrentUser();
        if (!user) return;

        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        if (nameEl) nameEl.textContent = user.user_metadata?.full_name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl && avatarEl) avatarEl.src = avatarUrl;

        const { data: credits, error } = await supabaseClient
            .from('user_credits').select('*').eq('user_id', user.id).single();

        if (error && error.code === 'PGRST116') {
            const { data: nc } = await supabaseClient.from('user_credits').insert({
                user_id: user.id, balance: 50, total_purchased: 0, total_used: 0, total_refunded: 0
            }).select().single();
            if (nc) {
                userCredits = nc.balance;
                userStats = { balance: nc.balance, total_used: 0, total_refunded: 0 };
                isNewUser = true;
            }
        } else if (credits) {
            userCredits = credits.balance || 0;
            userStats = { balance: credits.balance, total_used: credits.total_used || 0, total_refunded: credits.total_refunded || 0 };
        }

        updateCreditsUI();
        saveCache();

        if (isNewUser) {
            setTimeout(() => alert('🎉 Selamat datang!\n\nAnda mendapat 50 kredit GRATIS untuk mencoba layanan kami.'), 1200);
        }

        await loadJobs();
    } catch (e) { console.error('initializeUser:', e); }
}

// ============================================================
// CREDITS UI
// ============================================================

function updateCreditsUI() {
    const fmt = n => (n || 0).toLocaleString('id-ID');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('user-credits', fmt(userCredits));
    set('stat-credits', fmt(userCredits));
    set('stat-used', fmt(userStats.total_used));
    set('stat-refunded', fmt(userStats.total_refunded));
    set('modal-current-credits', fmt(userCredits) + ' kredit');
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
            saveCache();
        }
    } catch (e) {}
}

// ============================================================
// LEFT SIDEBAR: BRAND & MODEL LIST
// ============================================================

function buildModelList(brand) {
    const container = document.getElementById('model-list');
    if (!container) return;

    const models = BRAND_MODELS[brand] || BRAND_MODELS['all'];
    const currentModel = document.getElementById('input-model')?.value;

    container.innerHTML = models.map(id => {
        const config = MODEL_CONFIGS[id];
        const credits = MODEL_PRICING[id];
        const isActive = id === currentModel;
        return `
            <div class="model-list-item ${isActive ? 'active' : ''}" onclick="selectModel('${id}')">
                <div>${id}</div>
                <div class="item-credits">🪙 ${credits} kredit</div>
            </div>
        `;
    }).join('');
}

function selectModel(modelId) {
    const select = document.getElementById('input-model');
    if (select) {
        select.value = modelId;
        updateModelUI();
        buildModelList(getCurrentBrand());
    }
}

function getCurrentBrand() {
    const active = document.querySelector('.brand-btn.active');
    return active ? active.dataset.brand : 'all';
}

// ============================================================
// MODEL UI UPDATE
// ============================================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const credits = MODEL_PRICING[modelId] || 30;
    if (!config) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('estimated-credits', credits);
    set('total-credits', credits);
    set('model-desc', config.desc || '');

    // All optional IDs to toggle
    const allOptionals = [
        'section-image','section-frames','section-ref-images','section-motion',
        'section-omnihuman','section-vfx','group-image-tail','group-negative-prompt',
        'group-cfg-scale','group-aspect-ratio','group-aspect-ratio-kling26',
        'group-aspect-ratio-seedance','group-runway-ratio','group-wan-size',
        'group-ltx-resolution','group-duration','group-seed','group-fps',
        'check-generate-audio','check-prompt-optimizer','check-prompt-expansion',
        'check-camera-fixed','group-shot-type'
    ];
    allOptionals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    // Prompt section
    const ps = document.getElementById('section-prompt');
    if (ps) ps.style.display = config.noPrompt ? 'none' : 'flex';

    // Show relevant sections
    const show = (id, flex) => { const el = document.getElementById(id); if (el) el.style.display = flex ? 'flex' : 'block'; };
    if (config.showImage)           { show('section-image'); show('group-image'); }
    if (config.showImageTail)       show('group-image-tail');
    if (config.showNegative)        show('group-negative-prompt');
    if (config.showCfg)             show('group-cfg-scale');
    if (config.showFrames)          show('section-frames');
    if (config.showRefImages)       show('section-ref-images');
    if (config.showMotion)          show('section-motion');
    if (config.showOmnihuman)       show('section-omnihuman');
    if (config.showVfx)             show('section-vfx');
    if (config.showAspectRatio)     show('group-aspect-ratio');
    if (config.showAspectKling26)   show('group-aspect-ratio-kling26');
    if (config.showAspectSeedance)  show('group-aspect-ratio-seedance');
    if (config.showRunwayRatio)     show('group-runway-ratio');
    if (config.showWanSize)         show('group-wan-size');
    if (config.showLtxResolution)   show('group-ltx-resolution');
    if (config.showSeed)            show('group-seed');
    if (config.showFps)             show('group-fps');
    if (config.showGenerateAudio)   show('check-generate-audio', true);
    if (config.showPromptOptimizer) show('check-prompt-optimizer', true);
    if (config.showPromptExpansion) show('check-prompt-expansion', true);
    if (config.showCameraFixed)     show('check-camera-fixed', true);
    if (config.showShotType)        show('group-shot-type');

    // Duration
    const dg = document.getElementById('group-duration');
    const ds = document.getElementById('input-duration');
    if (config.hideDuration) {
        if (dg) dg.style.display = 'none';
    } else if (config.showDuration && config.durationOptions) {
        if (dg) dg.style.display = 'block';
        if (ds) {
            ds.innerHTML = config.durationOptions.map((d, i) =>
                `<option value="${d}" ${i===0?'selected':''}>${d} detik</option>`
            ).join('');
            ds.disabled = config.durationOptions.length === 1;
        }
    } else {
        if (dg) dg.style.display = 'none';
    }

    uploadedVideoUrls = {};
    updateVideoUploadStatus();
}

function updateVideoUploadStatus() {
    const motionStatus = document.getElementById('motion-video-status');
    if (motionStatus) motionStatus.innerHTML = uploadedVideoUrls.motion_video
        ? `<span class="upload-success">✅ Video ready</span><br><small class="upload-url">${uploadedVideoUrls.motion_video.substring(0,50)}...</small>`
        : '';
    const vfxStatus = document.getElementById('vfx-video-status');
    if (vfxStatus) vfxStatus.innerHTML = uploadedVideoUrls.vfx_video
        ? `<span class="upload-success">✅ Video ready</span><br><small class="upload-url">${uploadedVideoUrls.vfx_video.substring(0,50)}...</small>`
        : '';
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    // Model select
    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            updateModelUI();
            buildModelList(getCurrentBrand());
        });
    }
    updateModelUI();

    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) cfgSlider.addEventListener('input', () => {
        const el = document.getElementById('cfg-value');
        if (el) el.textContent = cfgSlider.value;
    });

    // Standard image uploads
    setupFileUpload('input-image', 'preview-image', 'btn-remove-image');
    setupFileUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileUpload('input-first-frame', 'preview-first-frame');
    setupFileUpload('input-last-frame', 'preview-last-frame');
    setupFileUpload('input-motion-image', 'preview-motion-image');
    setupFileUpload('input-omni-image', 'preview-omni-image');
    setupFileUpload('input-omni-audio', 'preview-omni-audio', null, false, true);
    for (let i = 1; i <= 7; i++) setupFileUpload(`input-ref-${i}`, `preview-ref-${i}`);

    // Video uploads
    setupVideoUploadWithPreupload('input-motion-video','preview-motion-video','btn-upload-motion-video','motion-video-status','motion_video');
    setupVideoUploadWithPreupload('input-vfx-video','preview-vfx-video','btn-upload-vfx-video','vfx-video-status','vfx_video');

    // URL inputs
    setupVideoUrlInput('input-motion-video-url', 'motion_video');
    setupVideoUrlInput('input-vfx-video-url', 'vfx_video');

    // Form submit
    const form = document.getElementById('generator-form');
    if (form) form.addEventListener('submit', submitJob);

    // Settings drawer toggle
    const settingsToggle = document.getElementById('btn-settings-toggle');
    if (settingsToggle) {
        settingsToggle.addEventListener('click', () => {
            const drawer = document.getElementById('settings-drawer');
            if (drawer) {
                const isOpen = drawer.classList.contains('open');
                drawer.classList.toggle('open', !isOpen);
                settingsToggle.classList.toggle('active', !isOpen);
                const icon = document.getElementById('settings-toggle-icon');
                if (icon) icon.textContent = isOpen ? '⚙️' : '✖️';
            }
        });
    }

    // Auto-resize prompt textarea
    const promptTA = document.getElementById('input-prompt');
    if (promptTA) {
        promptTA.addEventListener('input', () => {
            promptTA.style.height = 'auto';
            promptTA.style.height = Math.min(promptTA.scrollHeight, 120) + 'px';
        });
        // Submit on Ctrl/Cmd+Enter
        promptTA.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                form && form.requestSubmit();
            }
        });
    }

    // Brand navigation
    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const brand = btn.dataset.brand;
            buildModelList(brand);

            // If brand is not 'all', filter model dropdown
            if (brand !== 'all') {
                const modelIds = BRAND_MODELS[brand] || [];
                const select = document.getElementById('input-model');
                if (select && modelIds.length > 0 && !modelIds.includes(select.value)) {
                    select.value = modelIds[0];
                    updateModelUI();
                }
            }
        });
    });

    // Buy credits
    const buyBtn = document.getElementById('btn-buy-credits');
    if (buyBtn) buyBtn.addEventListener('click', openCreditsModal);

    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // Job modal close
    const closeModalBtn = document.getElementById('btn-close-modal');
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeJobModal);

    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.addEventListener('click', e => { if (e.target.id === 'job-modal') closeJobModal(); });

    // VFX filter
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const ft = parseInt(filterSelect.value);
            const bloomG = document.getElementById('group-bloom-contrast');
            const motionG = document.getElementById('group-motion-blur');
            if (bloomG) bloomG.style.display = ft === 7 ? 'block' : 'none';
            if (motionG) motionG.style.display = ft === 2 ? 'block' : 'none';
        });
    }

    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) bloomSlider.addEventListener('input', () => {
        const el = document.getElementById('bloom-value');
        if (el) el.textContent = bloomSlider.value;
    });

    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) decaySlider.addEventListener('input', () => {
        const el = document.getElementById('decay-value');
        if (el) el.textContent = decaySlider.value;
    });

    // Sidebar toggles (mobile/tablet)
    const leftToggle = document.getElementById('btn-left-toggle');
    if (leftToggle) leftToggle.addEventListener('click', () => toggleSidebar('left'));

    const rightToggle = document.getElementById('btn-right-toggle');
    if (rightToggle) rightToggle.addEventListener('click', () => toggleSidebar('right'));

    // Add overlay div
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebar-overlay';
    overlay.addEventListener('click', closeAllSidebars);
    document.body.appendChild(overlay);
}

function toggleSidebar(side) {
    const sidebarLeft  = document.getElementById('sidebar-left');
    const sidebarRight = document.getElementById('sidebar-right');
    const overlay = document.getElementById('sidebar-overlay');

    if (side === 'left') {
        const isOpen = sidebarLeft.classList.contains('open');
        sidebarLeft.classList.toggle('open', !isOpen);
        if (overlay) overlay.classList.toggle('active', !isOpen);
        if (sidebarRight) sidebarRight.classList.remove('open');
    } else {
        const isOpen = sidebarRight.classList.contains('open');
        sidebarRight.classList.toggle('open', !isOpen);
        if (overlay) overlay.classList.toggle('active', !isOpen);
        if (sidebarLeft) sidebarLeft.classList.remove('open');
    }
}

function closeAllSidebars() {
    document.getElementById('sidebar-left')?.classList.remove('open');
    document.getElementById('sidebar-right')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
}

// ============================================================
// PRICING PANEL
// ============================================================

function togglePricing() {
    const panel = document.getElementById('pricing-panel');
    if (!panel) return;
    const isHidden = panel.style.display === 'none' || !panel.style.display;
    if (isHidden) {
        loadPricingTable();
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
    } else {
        panel.style.display = 'none';
    }
}

function loadPricingTable() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;

    const categories = {
        'Kling Premium': ['kling-2-5-pro','kling-o1-pro-i2v','kling-o1-pro-ref','kling-2-6-pro','kling-2-6-motion-pro','kling-2-1-pro'],
        'Kling Standard': ['kling-o1-std-i2v','kling-o1-std-ref','kling-2-6-motion-std','kling-1-6-pro','kling-1-6-std'],
        'MiniMax / Hailuo': ['minimax-live','minimax-hailuo-1080p','minimax-hailuo-1080p-fast','minimax-hailuo-768p','minimax-hailuo-768p-fast'],
        'WAN': ['wan-i2v-720p','wan-i2v-1080p','wan-t2v-720p','wan-t2v-1080p'],
        'Seedance (Hemat)': ['seedance-480p','seedance-720p','seedance-1080p'],
        'LTX': ['ltx-t2v','ltx-i2v'],
        'RunWay & Lainnya': ['runway-gen4','omnihuman','vfx']
    };

    grid.innerHTML = Object.entries(categories).map(([cat, models]) => `
        <div class="pricing-category">
            <h3>${cat}</h3>
            ${models.map(id => {
                const config = MODEL_CONFIGS[id];
                if (!config) return '';
                return `<div class="pricing-item">
                    <div class="pricing-model">${id}</div>
                    <div class="pricing-desc">${config.desc || ''}</div>
                    <div class="pricing-credits">🪙 ${MODEL_PRICING[id]}</div>
                </div>`;
            }).join('')}
        </div>
    `).join('');
}

// ============================================================
// FILE UPLOAD HELPERS
// ============================================================

function setupFileUpload(inputId, previewId, removeId = null) {
    const input   = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;

    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
        const ph = preview.parentElement?.querySelector('.upload-placeholder');
        if (ph) ph.style.display = 'none';
        preview.parentElement?.classList.add('has-preview');
        if (removeId) {
            const rb = document.getElementById(removeId);
            if (rb) rb.style.display = 'block';
        }
    });

    if (removeId) {
        const rb = document.getElementById(removeId);
        if (rb) rb.addEventListener('click', e => {
            e.stopPropagation();
            input.value = '';
            preview.src = '';
            preview.style.display = 'none';
            const ph = preview.parentElement?.querySelector('.upload-placeholder');
            if (ph) ph.style.display = 'flex';
            preview.parentElement?.classList.remove('has-preview');
            rb.style.display = 'none';
        });
    }
}

// ============================================================
// VIDEO UPLOAD WITH PRE-UPLOAD
// ============================================================

function setupVideoUploadWithPreupload(inputId, previewId, uploadBtnId, statusId, urlKey) {
    const input     = document.getElementById(inputId);
    const preview   = document.getElementById(previewId);
    const uploadBtn = document.getElementById(uploadBtnId);
    const statusEl  = document.getElementById(statusId);
    if (!input) return;

    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (preview) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            preview.parentElement?.querySelector('.upload-placeholder')?.setAttribute('style','display:none');
            preview.parentElement?.classList.add('has-preview');
        }
        delete uploadedVideoUrls[urlKey];
        if (statusEl) statusEl.innerHTML = '<span class="upload-pending">⚠️ Klik "Upload Video" untuk mengupload ke server</span>';
        if (uploadBtn) { uploadBtn.disabled = false; uploadBtn.style.display = 'block'; uploadBtn.innerHTML = '📤 Upload Video ke Server'; }
    });

    if (uploadBtn) {
        uploadBtn.addEventListener('click', async e => {
            e.preventDefault();
            const file = input.files[0];
            if (!file) { alert('Pilih video terlebih dahulu!'); return; }
            const sizeMB = file.size / 1024 / 1024;
            if (sizeMB > 100) { alert(`File terlalu besar (${sizeMB.toFixed(1)} MB). Maksimal 100 MB.`); return; }
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '⏳ Mengupload...';
            if (statusEl) statusEl.innerHTML = '<span class="upload-progress">📤 Mengupload video...</span>';
            try {
                const url = await uploadFile(file, (pct, msg) => {
                    if (statusEl) statusEl.innerHTML = `<span class="upload-progress">📤 ${msg} (${pct}%)</span>`;
                    uploadBtn.innerHTML = `⏳ ${pct}%`;
                });
                if (url) {
                    uploadedVideoUrls[urlKey] = url;
                    if (statusEl) statusEl.innerHTML = `<span class="upload-success">✅ Video berhasil diupload!</span><br><small class="upload-url">${url}</small><br><small class="upload-note">⏱️ Link valid 1 jam</small>`;
                    uploadBtn.innerHTML = '✅ Terupload';
                    uploadBtn.disabled = true;
                } else throw new Error('Upload gagal');
            } catch (err) {
                if (statusEl) statusEl.innerHTML = `<span class="upload-error">❌ ${err.message}</span>`;
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '🔄 Coba Upload Lagi';
            }
        });
    }
}

function setupVideoUrlInput(inputId, urlKey) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('input', e => {
        const url = e.target.value.trim();
        const statusEl = input.parentElement?.querySelector('.url-status');
        if (!url) { delete uploadedVideoUrls[urlKey]; if (statusEl) statusEl.innerHTML = ''; return; }
        if (isValidVideoUrl(url)) {
            uploadedVideoUrls[urlKey] = url;
            if (statusEl) statusEl.innerHTML = '<span class="url-valid">✅ URL valid</span>';
        } else {
            delete uploadedVideoUrls[urlKey];
            if (statusEl) statusEl.innerHTML = '<span class="url-invalid">⚠️ Masukkan URL video yang valid</span>';
        }
    });
}

// ============================================================
// UPLOAD FUNCTIONS
// ============================================================
// Note: SUPABASE_URL and SUPABASE_ANON_KEY are defined in supabase-config.js

async function uploadToSupabaseStorage(file, progressCallback = null) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Harus login untuk upload file');
    const timestamp = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const ext  = file.name.split('.').pop().toLowerCase();
    const fileName = `${user.id}/${timestamp}_${rand}.${ext}`;
    if (progressCallback) progressCallback(10, 'Connecting to Supabase...');
    const { error } = await supabaseClient.storage.from(SUPABASE_STORAGE_BUCKET).upload(fileName, file, { cacheControl:'3600', upsert:false, contentType:file.type });
    if (error) throw new Error(error.message);
    if (progressCallback) progressCallback(80, 'Getting public URL...');
    const { data: urlData } = supabaseClient.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(fileName);
    if (!urlData?.publicUrl) throw new Error('Gagal mendapatkan public URL');
    if (progressCallback) progressCallback(100, 'Upload complete!');
    return urlData.publicUrl;
}

async function uploadToLitterbox(file) {
    const fd = new FormData();
    fd.append('reqtype','fileupload'); fd.append('time','1h'); fd.append('fileToUpload', file);
    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 120000);
        const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', { method:'POST', body:fd, signal:ctrl.signal });
        clearTimeout(tid);
        if (res.ok) { const url = await res.text(); if (url.startsWith('http')) return url.trim(); }
    } catch (e) {}
    return null;
}

async function uploadToCatbox(file) {
    const fd = new FormData();
    fd.append('reqtype','fileupload'); fd.append('fileToUpload', file);
    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 120000);
        const res = await fetch('https://catbox.moe/user/api.php', { method:'POST', body:fd, signal:ctrl.signal });
        clearTimeout(tid);
        if (res.ok) { const url = await res.text(); if (url.startsWith('http')) return url.trim(); }
    } catch (e) {}
    return null;
}

async function uploadFile(file, progressCallback = null) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    if (file.size > 100 * 1024 * 1024) throw new Error(`File terlalu besar (${sizeMB} MB). Maksimal 100 MB.`);
    try {
        if (progressCallback) progressCallback(5, 'Uploading to Supabase...');
        const url = await uploadToSupabaseStorage(file, progressCallback);
        if (url) return url;
    } catch (e) { console.warn('Supabase upload failed:', e); }
    const url2 = await uploadToLitterbox(file);
    if (url2) { if (progressCallback) progressCallback(100, 'Upload complete!'); return url2; }
    const url3 = await uploadToCatbox(file);
    if (url3) { if (progressCallback) progressCallback(100, 'Upload complete!'); return url3; }
    throw new Error('Gagal mengupload file. Pastikan koneksi internet stabil.');
}

function isValidUrl(s) {
    try { const u = new URL(s); return u.protocol==='http:'||u.protocol==='https:'; } catch { return false; }
}
function isValidVideoUrl(url) {
    if (!isValidUrl(url)) return false;
    return [/\.(mp4|mov|avi|webm|mkv)$/i, /supabase\.co\/storage/i, /catbox\.moe/i, /litterbox\.catbox\.moe/i].some(p => p.test(url));
}

// ============================================================
// SUBMIT JOB
// ============================================================

async function submitJob(event) {
    event.preventDefault();
    const user = await getCurrentUser();
    if (!user) { alert('Silakan login terlebih dahulu'); return; }

    const modelId = document.getElementById('input-model').value;
    const config  = MODEL_CONFIGS[modelId];
    if (!config) { alert('Model tidak valid'); return; }

    const prompt = document.getElementById('input-prompt')?.value?.trim() || '';
    if (!prompt && !config.noPrompt) { alert('Prompt wajib diisi!'); return; }

    if (config.requiresImage && !document.getElementById('input-image')?.files[0]) { alert(`Model ${modelId} membutuhkan gambar!`); return; }
    if (config.requiresFirstFrame && !document.getElementById('input-first-frame')?.files[0]) { alert(`Model ${modelId} membutuhkan First Frame!`); return; }
    if (config.requiresRefImages) {
        let has = false;
        for (let i = 1; i <= 7; i++) if (document.getElementById(`input-ref-${i}`)?.files[0]) { has = true; break; }
        if (!has) { alert(`Model ${modelId} membutuhkan Reference Images!`); return; }
    }
    if (config.showMotion && !uploadedVideoUrls.motion_video) { alert('Video Motion belum diupload!'); return; }
    if (config.showVfx    && !uploadedVideoUrls.vfx_video)    { alert('Video VFX belum diupload!');   return; }

    const submitBtn = document.getElementById('btn-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '⏳'; }

    try {
        const settings = await collectSettings(modelId, config);
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) throw new Error('Session expired. Silakan login ulang.');

        const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-video-job`, {
            method: 'POST',
            headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}`, 'apikey':SUPABASE_ANON_KEY },
            body: JSON.stringify({ model_id:modelId, prompt, negative_prompt:document.getElementById('input-negative')?.value||'', settings })
        });

        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Gagal submit job');

        userCredits = result.balance_remaining;
        userStats.total_used = (userStats.total_used || 0) + result.credits_charged;
        updateCreditsUI();
        saveCache();

        alert(`✅ Job berhasil dibuat!\n\nModel: ${modelId}\nKredit: ${result.credits_charged}\nSisa: ${result.balance_remaining}`);

        resetForm();
        // Close settings drawer
        const drawer = document.getElementById('settings-drawer');
        if (drawer) drawer.classList.remove('open');
        const icon = document.getElementById('settings-toggle-icon');
        if (icon) icon.textContent = '⚙️';
        document.getElementById('btn-settings-toggle')?.classList.remove('active');

        await loadJobs();

    } catch (err) {
        console.error('Submit error:', err);
        alert('Gagal: ' + err.message);
        await loadUserCredits();
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '🚀'; }
    }
}

async function fileToBase64(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
    });
}

async function collectSettings(modelId, config) {
    const settings = {};
    if (config.showDuration && !config.hideDuration) {
        const ds = document.getElementById('input-duration');
        if (ds) settings.duration = parseInt(ds.value);
        else if (config.fixedDuration) settings.duration = config.fixedDuration;
    }
    if (config.showCfg)             settings.cfg_scale  = parseFloat(document.getElementById('input-cfg')?.value || 0.5);
    if (config.showSeed)            settings.seed        = parseInt(document.getElementById('input-seed')?.value || -1);
    if (config.showFps)             settings.fps         = parseInt(document.getElementById('input-fps')?.value || 25);
    if (config.showAspectRatio)     settings.aspect_ratio = document.getElementById('input-aspect-ratio')?.value;
    if (config.showAspectKling26)   settings.aspect_ratio = document.getElementById('input-aspect-ratio-kling26')?.value;
    if (config.showAspectSeedance)  settings.aspect_ratio = document.getElementById('input-aspect-ratio-seedance')?.value;
    if (config.showRunwayRatio)     settings.ratio        = document.getElementById('input-runway-ratio')?.value;
    if (config.showWanSize)         settings.size         = document.getElementById('input-wan-size')?.value;
    if (config.showLtxResolution)   settings.resolution   = document.getElementById('input-ltx-resolution')?.value;
    if (config.showGenerateAudio)   settings.generate_audio       = document.getElementById('input-generate-audio')?.checked || false;
    if (config.showPromptOptimizer) settings.prompt_optimizer     = document.getElementById('input-prompt-optimizer')?.checked ?? true;
    if (config.showPromptExpansion) settings.enable_prompt_expansion = document.getElementById('input-prompt-expansion')?.checked || false;
    if (config.showCameraFixed)     settings.camera_fixed         = document.getElementById('input-camera-fixed')?.checked || false;
    if (config.showShotType)        settings.shot_type            = document.getElementById('input-shot-type')?.value || 'single';

    if (config.showImage) { const f = document.getElementById('input-image')?.files[0]; if (f) settings.image = await fileToBase64(f); }
    if (config.showImageTail) { const f = document.getElementById('input-image-tail')?.files[0]; if (f) settings.image_tail = await fileToBase64(f); }
    if (config.showFrames) {
        const ff = document.getElementById('input-first-frame')?.files[0]; if (ff) settings.first_frame = await fileToBase64(ff);
        const lf = document.getElementById('input-last-frame')?.files[0];  if (lf) settings.last_frame  = await fileToBase64(lf);
    }
    if (config.showRefImages) {
        const refs = [];
        for (let i = 1; i <= 7; i++) { const f = document.getElementById(`input-ref-${i}`)?.files[0]; if (f) refs.push(await fileToBase64(f)); }
        if (refs.length) settings.reference_images = refs;
    }
    if (config.showMotion) {
        const mi = document.getElementById('input-motion-image')?.files[0];
        if (mi) settings.image_url = await uploadFile(mi);
        settings.video_url = uploadedVideoUrls.motion_video;
        settings.character_orientation = document.getElementById('input-character-orientation')?.value || 'video';
    }
    if (config.showOmnihuman) {
        const oi = document.getElementById('input-omni-image')?.files[0]; if (oi) settings.image_url = await uploadFile(oi);
        const oa = document.getElementById('input-omni-audio')?.files[0]; if (oa) settings.audio_url  = await uploadFile(oa);
        settings.resolution  = document.getElementById('input-omni-resolution')?.value || '1080p';
        settings.turbo_mode  = document.getElementById('input-turbo-mode')?.checked || false;
    }
    if (config.showVfx) {
        settings.video_url   = uploadedVideoUrls.vfx_video;
        settings.filter_type = parseInt(document.getElementById('input-filter-type')?.value || 1);
        settings.fps         = parseInt(document.getElementById('input-vfx-fps')?.value || 24);
        const ft = settings.filter_type;
        if (ft === 7) settings.bloom_contrast  = parseFloat(document.getElementById('input-bloom-contrast')?.value || 1.2);
        if (ft === 2) { settings.motion_kernel = parseInt(document.getElementById('input-motion-kernel')?.value || 5); settings.motion_decay = parseFloat(document.getElementById('input-motion-decay')?.value || 0.8); }
    }
    return settings;
}

// ============================================================
// RESET FORM
// ============================================================

function resetForm() {
    const form = document.getElementById('generator-form');
    if (form) form.reset();
    document.querySelectorAll('.upload-preview').forEach(el => { el.style.display='none'; el.src=''; });
    document.querySelectorAll('.upload-box').forEach(el => el.classList.remove('has-preview'));
    document.querySelectorAll('.btn-remove-upload').forEach(el => el.style.display='none');
    document.querySelectorAll('.upload-placeholder').forEach(el => el.style.display='flex');
    uploadedVideoUrls = {};
    const mStatus = document.getElementById('motion-video-status'); if (mStatus) mStatus.innerHTML='';
    const vStatus = document.getElementById('vfx-video-status');    if (vStatus) vStatus.innerHTML='';
    const mBtn = document.getElementById('btn-upload-motion-video');
    if (mBtn) { mBtn.innerHTML='📤 Upload Video ke Server'; mBtn.disabled=true; mBtn.style.display='none'; }
    const vBtn = document.getElementById('btn-upload-vfx-video');
    if (vBtn) { vBtn.innerHTML='📤 Upload Video ke Server'; vBtn.disabled=true; vBtn.style.display='none'; }
    document.querySelectorAll('.video-url-input').forEach(el => el.value='');
    const promptEl = document.getElementById('input-prompt');
    if (promptEl) { promptEl.value=''; promptEl.style.height='auto'; }
    updateModelUI();
}

// ============================================================
// LOAD JOBS
// ============================================================

async function loadJobs() {
    try {
        lastFetchTime = Date.now();
        const user = await getCurrentUser();
        if (!user) return;
        const { data: jobs, error } = await supabaseClient
            .from('jobs').select('*').eq('service','videoapi').eq('user_id', user.id)
            .order('created_at', { ascending:false }).limit(50);
        if (error) throw error;
        userJobs = jobs || [];
        renderJobs();
        updateChatFeed();
        saveCache();
    } catch (e) { console.error('loadJobs:', e); }
}

// ============================================================
// RENDER JOBS – Right Sidebar
// ============================================================

function renderJobs() {
    const activeJobs   = userJobs.filter(j => ['pending','processing'].includes(j.status));
    const historyJobs  = userJobs.filter(j => ['completed','failed','cancelled'].includes(j.status));

    const setCount = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = n; };
    setCount('active-count', activeJobs.length);
    setCount('history-count', historyJobs.length);

    // Active jobs sidebar
    const activeContainer = document.getElementById('active-jobs');
    if (activeContainer) {
        activeContainer.innerHTML = activeJobs.length === 0
            ? '<div class="sidebar-empty">🚀 Tidak ada proses</div>'
            : activeJobs.map(job => renderSidebarJob(job, true)).join('');
    }

    // History sidebar
    const histContainer = document.getElementById('history-jobs');
    if (histContainer) {
        histContainer.innerHTML = historyJobs.length === 0
            ? '<div class="sidebar-empty">📁 Belum ada riwayat</div>'
            : historyJobs.map(job => renderSidebarJob(job, false)).join('');
    }
}

function renderSidebarJob(job, isActive) {
    const input    = job.input_data || {};
    const modelId  = input.model_id || 'Unknown';
    const credits  = input.credits_used || 0;
    const progress = job.progress_percent || 0;
    const stepName = job.step_name || 'Waiting...';
    const createdAt = new Date(job.created_at).toLocaleString('id-ID', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });

    const statusMap = { pending:'⏳', processing:'⚙️', completed:'✅', failed:'❌', cancelled:'🚫' };
    const statusIcon = statusMap[job.status] || '?';

    let thumb = '';
    if (job.status === 'completed' && job.results) {
        const results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (results.video_url) {
            thumb = `<video src="${results.video_url}" class="sj-thumb" muted playsinline preload="none" onmouseover="this.play()" onmouseout="this.pause(); this.currentTime=0;"></video>`;
        }
    }

    return `
        <div class="sidebar-job status-${job.status}" onclick="openJobModal('${job.id}')">
            <div class="sj-header">
                <span class="sj-model" title="${modelId}">${modelId}</span>
                <span class="status-badge status-${job.status}">${statusIcon}</span>
            </div>
            ${thumb}
            ${isActive ? `
                <div class="sj-progress">
                    <div class="sj-progress-bar"><div class="sj-progress-fill" style="width:${progress}%"></div></div>
                    <div class="sj-step">${progress}% – ${stepName}</div>
                </div>
            ` : ''}
            <div class="sj-info">
                <span class="sj-credits">🪙 ${credits}</span>
                <span>${createdAt}</span>
            </div>
        </div>
    `;
}

// ============================================================
// CHAT FEED – Main content
// ============================================================

function updateChatFeed() {
    const feed   = document.getElementById('chat-feed');
    const empty  = document.getElementById('chat-empty');
    if (!feed) return;

    // Show only most recent 20 jobs in the feed
    const feedJobs = [...userJobs].slice(0, 20);

    if (feedJobs.length === 0) {
        if (empty) empty.style.display = 'flex';
        // Remove existing job cards
        feed.querySelectorAll('.chat-job-card').forEach(el => el.remove());
        return;
    }

    if (empty) empty.style.display = 'none';

    // Update existing cards or add new ones
    const existingCards = {};
    feed.querySelectorAll('.chat-job-card').forEach(el => { existingCards[el.dataset.jobId] = el; });

    // Remove cards not in current jobs
    Object.keys(existingCards).forEach(id => {
        if (!feedJobs.find(j => j.id === id)) existingCards[id].remove();
    });

    // Process jobs in reverse (oldest first = bottom of feed)
    [...feedJobs].reverse().forEach(job => {
        const existing = existingCards[job.id];
        const newCard  = renderChatJobCard(job);
        if (existing) {
            existing.outerHTML = newCard;
        } else {
            feed.insertAdjacentHTML('afterbegin', newCard);
        }
    });

    // Auto-scroll to bottom if user is near bottom
    const isNearBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 100;
    if (isNearBottom) feed.scrollTop = feed.scrollHeight;
}

function renderChatJobCard(job) {
    const input    = job.input_data || {};
    const modelId  = input.model_id || 'Unknown';
    const credits  = input.credits_used || 0;
    const progress = job.progress_percent || 0;
    const stepName = job.step_name || 'Menunggu...';
    const prompt   = job.input_data?.prompt || '';
    const createdAt = new Date(job.created_at).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

    const statusLabels = { pending:'⏳ Menunggu', processing:'⚙️ Memproses', completed:'✅ Selesai', failed:'❌ Gagal', cancelled:'🚫 Dibatalkan' };
    const statusLabel = statusLabels[job.status] || job.status;

    let videoEl = '';
    if (job.status === 'completed' && job.results) {
        const results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (results.video_url) {
            videoEl = `<video src="${results.video_url}" class="chat-card-video" controls preload="none"></video>`;
        }
    }

    let progressEl = '';
    if (['pending','processing'].includes(job.status)) {
        progressEl = `
            <div class="chat-card-progress">
                <div class="chat-progress-bar"><div class="chat-progress-fill" style="width:${progress}%"></div></div>
                <div class="chat-card-step">${progress}% – ${stepName}</div>
            </div>
        `;
    }

    return `
        <div class="chat-job-card status-${job.status}" data-job-id="${job.id}" onclick="openJobModal('${job.id}')">
            <div class="chat-card-header">
                <span class="chat-card-model">🤖 ${modelId}</span>
                <span class="status-badge status-${job.status}">${statusLabel}</span>
            </div>
            ${prompt ? `<div class="chat-card-prompt">"${prompt}"</div>` : ''}
            ${videoEl}
            ${progressEl}
            <div class="chat-card-footer">
                <span class="chat-card-credits">🪙 ${credits} kredit</span>
                <span>${createdAt}</span>
            </div>
        </div>
    `;
}

// ============================================================
// JOB MODAL
// ============================================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    const input   = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});

    const set     = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const setHtml = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v; };

    set('modal-title', input.model_id || 'Job Details');
    const statusEl = document.getElementById('modal-status');
    if (statusEl) { statusEl.textContent = job.status; statusEl.className = 'status-badge status-' + job.status; }

    const ps = document.getElementById('modal-progress');
    const rs = document.getElementById('modal-results');
    const es = document.getElementById('modal-error');

    if (job.status === 'completed') {
        if (ps) ps.style.display='none'; if (es) es.style.display='none'; if (rs) rs.style.display='block';
        if (results.video_url) {
            const mv = document.getElementById('modal-video'); if (mv) mv.src = results.video_url;
            const md = document.getElementById('modal-download'); if (md) md.href = results.video_url;
        }
        set('modal-model', input.model_id||'-');
        set('modal-credits-final', (input.credits_used||0)+' kredit');
    } else if (['failed','cancelled'].includes(job.status)) {
        if (ps) ps.style.display='none'; if (rs) rs.style.display='none'; if (es) es.style.display='block';
        set('modal-error-msg', job.error_message||'Proses tidak selesai dalam waktu yang ditentukan');
    } else {
        if (ps) ps.style.display='block'; if (rs) rs.style.display='none'; if (es) es.style.display='none';
        const pf = document.getElementById('modal-progress-fill'); if (pf) pf.style.width=(job.progress_percent||0)+'%';
        set('modal-progress-percent', (job.progress_percent||0)+'%');
        set('modal-credits-used', (input.credits_used||0)+' kredit');
        set('modal-step', job.step_name||'Waiting...');
    }

    const modal = document.getElementById('job-modal');
    if (modal) modal.style.display = 'flex';
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) modal.style.display = 'none';
    const mv = document.getElementById('modal-video');
    if (mv) mv.pause();
}

// ============================================================
// CREDITS MODAL
// ============================================================

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    if (grid) {
        grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
            <div class="package-card ${pkg.popular?'popular':''} ${pkg.bestValue?'best-value':''}">
                ${pkg.popular   ? '<span class="package-badge">⭐ Recommended</span>' : ''}
                ${pkg.bestValue ? '<span class="package-badge best">💎 Best Value</span>' : ''}
                <h3 class="package-name">${pkg.name}</h3>
                <div class="package-credits">${pkg.credits.toLocaleString('id-ID')} Kredit</div>
                <div class="package-price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
                <div class="package-per-credit">Rp ${pkg.pricePerCredit}/kredit</div>
                <button class="btn-buy-package" data-package-id="${pkg.id}">Beli Sekarang</button>
            </div>
        `).join('');
        grid.querySelectorAll('.btn-buy-package').forEach(btn => {
            btn.addEventListener('click', e => { e.preventDefault(); purchaseCredits(btn.dataset.packageId, btn); });
        });
    }
    const mc = document.getElementById('modal-current-credits');
    if (mc) mc.textContent = userCredits.toLocaleString('id-ID') + ' kredit';
    const modal = document.getElementById('credits-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCreditsModal() {
    const modal = document.getElementById('credits-modal');
    if (modal) modal.style.display = 'none';
}

async function purchaseCredits(packageId, buttonElement) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) { alert('Silakan login terlebih dahulu'); return; }

        const btn = buttonElement;
        const origText = btn.textContent;
        btn.disabled = true; btn.textContent = 'Memproses...';

        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) throw new Error('Paket tidak ditemukan');

        const timestamp = Date.now().toString(36).toUpperCase();
        const rand  = Math.random().toString(36).substr(2,4).toUpperCase();
        const orderId = `VC${timestamp}${rand}`;

        try {
            await supabaseClient.from('credit_purchases').insert({
                user_id: session.user.id, order_id: orderId, package_id: packageId,
                amount_idr: pkg.price, credits: pkg.credits, status: 'pending'
            });
        } catch (e) { console.warn('Could not save purchase:', e); }

        if (typeof window.snap === 'undefined') {
            alert('💳 Midtrans belum dimuat.\n\nSilakan refresh halaman dan coba lagi.');
            btn.disabled = false; btn.textContent = origText; return;
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
            method: 'POST',
            headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${session.access_token}`, 'apikey':SUPABASE_ANON_KEY },
            body: JSON.stringify({ plan_id:packageId, order_id:orderId, amount:pkg.price, plan_name:`${pkg.credits} Credits` })
        });

        if (!response.ok) throw new Error('Gagal membuat pembayaran');
        const result = await response.json();
        if (!result.success || !result.snap_token) throw new Error(result.message || 'Gagal mendapatkan token');

        window.snap.pay(result.snap_token, {
            onSuccess: async paymentResult => {
                try {
                    const { data: cur } = await supabaseClient.from('user_credits').select('balance,total_purchased').eq('user_id', session.user.id).single();
                    if (cur) await supabaseClient.from('user_credits').update({ balance: cur.balance + pkg.credits, total_purchased: (cur.total_purchased||0) + pkg.credits, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
                    await supabaseClient.from('credit_purchases').update({ status:'paid', paid_at: new Date().toISOString(), payment_data: paymentResult }).eq('order_id', orderId);
                } catch (e) { console.error(e); }
                alert(`🎉 Pembayaran berhasil!\n\n+${pkg.credits} kredit ditambahkan.`);
                closeCreditsModal();
                await loadUserCredits();
            },
            onPending: () => { alert('⏳ Menunggu pembayaran...'); closeCreditsModal(); },
            onError: err => {
                console.error(err);
                alert('❌ Pembayaran gagal. Silakan coba lagi.');
                supabaseClient.from('credit_purchases').update({ status:'failed' }).eq('order_id', orderId);
            },
            onClose: () => { btn.disabled = false; btn.textContent = origText; }
        });

    } catch (err) {
        console.error('purchaseCredits:', err);
        alert('Gagal: ' + err.message);
        if (buttonElement) { buttonElement.disabled = false; buttonElement.textContent = 'Beli Sekarang'; }
    }
}

// ============================================================
// TUTORIAL
// ============================================================

function openVideoTutorial() { window.open('video-upload-tutorial.html', '_blank'); }

// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.openJobModal      = openJobModal;
window.closeJobModal     = closeJobModal;
window.openCreditsModal  = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;
window.openVideoTutorial = openVideoTutorial;
window.purchaseCredits   = purchaseCredits;
window.selectModel       = selectModel;
window.togglePricing     = togglePricing;

console.log('✅ Video AI Generator v4.0 loaded');
