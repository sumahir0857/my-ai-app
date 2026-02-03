// ============================================
// VIDEO API GENERATOR v3.0 - FULL REWRITE
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
const JOB_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v3.0 loading...');
    
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

function getCurrentUser() {
    return supabaseClient.auth.getUser().then(({ data }) => data.user).catch(() => null);
}

// ============================================
// INITIALIZE USER (with free trial check)
// ============================================

async function initializeUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        // Update UI with user info
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email;
        document.getElementById('user-avatar').src = user.user_metadata?.avatar_url || '';
        
        // Get or create user credits (includes free trial for new users)
        const { data: creditData, error } = await supabaseClient
            .rpc('get_or_create_user_credits', { p_user_id: user.id });
        
        if (error) {
            console.error('Credit init error:', error);
            return;
        }
        
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
    document.getElementById('user-credits').textContent = userCredits.toLocaleString();
    document.getElementById('stat-credits').textContent = userCredits.toLocaleString();
    document.getElementById('stat-used').textContent = (userStats.total_used || 0).toLocaleString();
    document.getElementById('stat-refunded').textContent = (userStats.total_refunded || 0).toLocaleString();
    
    if (document.getElementById('modal-current-credits')) {
        document.getElementById('modal-current-credits').textContent = userCredits.toLocaleString() + ' kredit';
    }
}

async function loadUserCredits() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        const { data } = await supabaseClient
            .rpc('get_videoapi_user_stats', { p_user_id: user.id });
        
        if (data) {
            userCredits = data.balance || 0;
            userStats = data;
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
    document.getElementById('section-prompt').style.display = config.noPrompt ? 'none' : 'block';
    
    // Show relevant sections based on config
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

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Model change
    document.getElementById('input-model').addEventListener('change', updateModelUI);
    
    // Initialize model UI
    updateModelUI();
    
    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', () => {
            document.getElementById('cfg-value').textContent = cfgSlider.value;
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
    document.getElementById('generator-form').addEventListener('submit', submitJob);
    
    // Buy credits button
    document.getElementById('btn-buy-credits').addEventListener('click', openCreditsModal);
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
    
    // Modal close
    document.getElementById('btn-close-modal').addEventListener('click', closeJobModal);
    document.getElementById('job-modal').addEventListener('click', (e) => {
        if (e.target.id === 'job-modal') closeJobModal();
    });
    
    // VFX filter change
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const filterType = parseInt(filterSelect.value);
            document.getElementById('group-bloom-contrast').style.display = filterType === 7 ? 'block' : 'none';
            document.getElementById('group-motion-blur').style.display = filterType === 2 ? 'block' : 'none';
        });
    }
    
    // Bloom slider
    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) {
        bloomSlider.addEventListener('input', () => {
            document.getElementById('bloom-value').textContent = bloomSlider.value;
        });
    }
    
    // Motion decay slider
    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) {
        decaySlider.addEventListener('input', () => {
            document.getElementById('decay-value').textContent = decaySlider.value;
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
        
        if (isVideo) {
            preview.src = url;
        } else if (isAudio) {
            preview.src = url;
        } else {
            preview.src = url;
        }
        
        preview.style.display = 'block';
        preview.parentElement.querySelector('.upload-placeholder').style.display = 'none';
        preview.parentElement.classList.add('has-preview');
        
        if (removeId) {
            document.getElementById(removeId).style.display = 'block';
        }
    });
    
    if (removeId) {
        const removeBtn = document.getElementById(removeId);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                input.value = '';
                preview.src = '';
                preview.style.display = 'none';
                preview.parentElement.querySelector('.upload-placeholder').style.display = 'flex';
                preview.parentElement.classList.remove('has-preview');
                removeBtn.style.display = 'none';
            });
        }
    }
}

// ============================================
// SUBMIT JOB
// ============================================

async function submitJob(event) {
    event.preventDefault();
    
    const { data: { user } } = await supabaseClient.auth.getUser();
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
    const prompt = document.getElementById('input-prompt')?.value?.trim() || '';
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
        // Collect input data
        const inputData = await collectInputData(modelId, config, prompt, requiredCredits, user.id);
        
        // Deduct credits
        const { data: deductResult, error: deductError } = await supabaseClient
            .rpc('deduct_user_credits', {
                p_user_id: user.id,
                p_amount: requiredCredits,
                p_model_name: modelId,
                p_description: `Video: ${modelId}`
            });
        
        if (deductError || !deductResult?.success) {
            throw new Error(deductResult?.error || 'Gagal memotong kredit');
        }
        
        userCredits = deductResult.balance_after;
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
            await supabaseClient.rpc('cancel_videoapi_job', { p_job_id: job?.id, p_user_id: user.id });
            throw new Error('Gagal membuat job');
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
    document.getElementById('generator-form').reset();
    
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
        const { data: { user } } = await supabaseClient.auth.getUser();
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
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    // Render active jobs
    const activeContainer = document.getElementById('active-jobs');
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
    
    // Render history
    const historyContainer = document.getElementById('history-jobs');
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
        cancelButton = `<button class="btn-cancel-job" onclick="cancelJob('${job.id}')">🛑 Batalkan</button>`;
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
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        
        const { data, error } = await supabaseClient
            .rpc('cancel_videoapi_job', {
                p_job_id: jobId,
                p_user_id: user.id
            });
        
        if (error) throw error;
        
        if (data?.success) {
            alert('✅ Job dibatalkan dan kredit dikembalikan');
            await loadJobs();
            await loadUserCredits();
        } else {
            alert('Gagal: ' + (data?.error || 'Unknown error'));
        }
        
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
    
    document.getElementById('modal-title').textContent = input.model_id || 'Job Details';
    
    const statusEl = document.getElementById('modal-status');
    statusEl.textContent = job.status;
    statusEl.className = 'status-badge status-' + job.status;
    
    // Progress section
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
        
        document.getElementById('modal-model').textContent = input.model_id || '-';
        document.getElementById('modal-credits-final').textContent = (input.credits_used || 0) + ' kredit';
        
    } else if (job.status === 'failed' || job.status === 'cancelled') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Unknown error';
        
    } else {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        const progress = job.progress_percent || 0;
        document.getElementById('modal-progress-fill').style.width = progress + '%';
        document.getElementById('modal-progress-percent').textContent = progress + '%';
        document.getElementById('modal-credits-used').textContent = (input.credits_used || 0) + ' kredit';
        document.getElementById('modal-step').textContent = job.step_name || 'Waiting...';
    }
    
    document.getElementById('job-modal').style.display = 'flex';
}

function closeJobModal() {
    document.getElementById('job-modal').style.display = 'none';
    document.getElementById('modal-video').pause();
}

// ============================================
// CREDITS MODAL & PURCHASE
// ============================================

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
        <div class="package-card ${pkg.popular ? 'popular' : ''} ${pkg.bestValue ? 'best-value' : ''}">
            ${pkg.popular ? '<span class="package-badge">⭐ Recommended</span>' : ''}
            ${pkg.bestValue ? '<span class="package-badge best">💎 Best Value</span>' : ''}
            <h3 class="package-name">${pkg.name}</h3>
            <div class="package-credits">${pkg.credits.toLocaleString()} Kredit</div>
            <div class="package-price">Rp ${pkg.price.toLocaleString()}</div>
            <div class="package-per-credit">Rp ${pkg.pricePerCredit}/kredit</div>
            <button class="btn-buy-package" onclick="purchaseCredits('${pkg.id}')">Beli Sekarang</button>
        </div>
    `).join('');
    
    document.getElementById('modal-current-credits').textContent = userCredits.toLocaleString() + ' kredit';
    document.getElementById('credits-modal').style.display = 'flex';
}

function closeCreditsModal() {
    document.getElementById('credits-modal').style.display = 'none';
}

async function purchaseCredits(packageId) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert('Silakan login terlebih dahulu');
            return;
        }
        
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = 'Memproses...';
        
        // Call edge function to create payment
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
            throw new Error(result.message || 'Failed to create payment');
        }
        
        // Open Midtrans Snap
        if (window.snap && result.snap_token) {
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
                }
            });
        } else if (result.redirect_url) {
            window.open(result.redirect_url, '_blank');
        }
        
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Gagal: ' + error.message);
    } finally {
        const btn = event.target;
        btn.disabled = false;
        btn.textContent = 'Beli Sekarang';
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
    
    const categories = {
        'Kling': ['kling-2-5-pro', 'kling-o1-pro-i2v', 'kling-o1-std-i2v', 'kling-o1-pro-ref', 'kling-o1-std-ref', 'kling-2-6-pro', 'kling-2-6-motion-pro', 'kling-2-6-motion-std', 'kling-2-1-pro', 'kling-1-6-pro', 'kling-1-6-std'],
        'MiniMax': ['minimax-live', 'minimax-hailuo-1080p', 'minimax-hailuo-1080p-fast', 'minimax-hailuo-768p', 'minimax-hailuo-768p-fast'],
        'WAN': ['wan-i2v-720p', 'wan-i2v-1080p', 'wan-t2v-720p', 'wan-t2v-1080p'],
        'Seedance': ['seedance-480p', 'seedance-720p', 'seedance-1080p'],
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
window.purchaseCredits = purchaseCredits;

console.log('✅ Video API Generator v3.0 loaded');
