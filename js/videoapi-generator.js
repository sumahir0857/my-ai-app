// ============================================
// VIDEO API GENERATOR v2.0 - FULL MODELS
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;

// ============================================
// MODEL CONFIGURATIONS - SEMUA MODEL!
// ============================================

const MODEL_CONFIGS = {
    // ==================== KLING ====================
    'kling-2-5-pro': {
        type: 'image_to_video',
        credits: { 5: 15, 10: 28 },
        desc: 'Model terbaru dengan kualitas tinggi',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDurationStd: true
    },
    'kling-2-6-pro': {
        type: 'kling_2_6',
        credits: { 5: 18, 10: 32 },
        desc: 'Text/Image to Video dengan audio generation',
        showImage: true, showNegative: true, showCfg: true, showDurationStd: true, 
        showAspectKling26: true, showGenerateAudio: true
    },
    'kling-2-1-pro': {
        type: 'image_to_video',
        credits: { 5: 14, 10: 26 },
        desc: 'Model 2.1 Pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDurationStd: true
    },
    'kling-1-6-pro': {
        type: 'image_to_video',
        credits: { 5: 10, 10: 18 },
        desc: 'Model klasik dengan kualitas pro',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDurationStd: true
    },
    'kling-1-6-std': {
        type: 'image_to_video',
        credits: { 5: 6, 10: 11 },
        desc: 'Model hemat biaya',
        showImage: true, showImageTail: true, showNegative: true, showCfg: true, showDurationStd: true
    },
    'kling-o1-pro-i2v': {
        type: 'kling_o1',
        credits: { 5: 20, 10: 35 },
        desc: 'Kling O1 Pro - Image to Video dengan first/last frame',
        showFrames: true, showDurationStd: true, showAspectRatio: true
    },
    'kling-o1-std-i2v': {
        type: 'kling_o1',
        credits: { 5: 12, 10: 22 },
        desc: 'Kling O1 Standard - Image to Video',
        showFrames: true, showDurationStd: true, showAspectRatio: true
    },
    'kling-o1-pro-ref': {
        type: 'kling_o1_reference',
        credits: { 5: 22, 10: 40 },
        desc: 'Video Reference dengan max 7 gambar referensi',
        showRefImages: true, showDurationStd: true, showAspectRatio: true
    },
    'kling-o1-std-ref': {
        type: 'kling_o1_reference',
        credits: { 5: 14, 10: 25 },
        desc: 'Video Reference Standard',
        showRefImages: true, showDurationStd: true, showAspectRatio: true
    },
    'kling-2-6-motion-pro': {
        type: 'kling_2_6_motion',
        credits: { 5: 25, 10: 25 },
        desc: 'Motion Control - Character Image + Motion Video',
        showMotion: true, showCfg: true
    },
    'kling-2-6-motion-std': {
        type: 'kling_2_6_motion',
        credits: { 5: 16, 10: 16 },
        desc: 'Motion Control Standard',
        showMotion: true, showCfg: true
    },
    
    // ==================== MINIMAX ====================
    'minimax-live': {
        type: 'minimax_live',
        credits: { 5: 18, 10: 18 },
        desc: 'MiniMax Live Mode',
        showImage: true, showPromptOptimizer: true
    },
    'minimax-hailuo-1080p': {
        type: 'minimax_hailuo',
        credits: { 6: 20 },
        desc: 'Hailuo 1080p - 6 detik',
        showFrames: true, showDurationHailuo: true, showPromptOptimizer: true
    },
    'minimax-hailuo-1080p-fast': {
        type: 'minimax_hailuo',
        credits: { 6: 22 },
        desc: 'Hailuo 1080p Fast',
        showFrames: true, showDurationHailuo: true, showPromptOptimizer: true
    },
    'minimax-hailuo-768p': {
        type: 'minimax_hailuo',
        credits: { 6: 12 },
        desc: 'Hailuo 768p - 6 detik',
        showFrames: true, showDurationHailuo: true, showPromptOptimizer: true
    },
    'minimax-hailuo-768p-fast': {
        type: 'minimax_hailuo',
        credits: { 6: 14 },
        desc: 'Hailuo 768p Fast',
        showFrames: true, showDurationHailuo: true, showPromptOptimizer: true
    },
    
    // ==================== WAN ====================
    'wan-i2v-720p': {
        type: 'wan_i2v',
        credits: { 5: 8, 10: 15, 15: 22 },
        desc: 'WAN Image to Video 720p',
        showImage: true, showNegative: true, showDurationWan: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-i2v-1080p': {
        type: 'wan_i2v',
        credits: { 5: 12, 10: 22, 15: 32 },
        desc: 'WAN Image to Video 1080p',
        showImage: true, showNegative: true, showDurationWan: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-t2v-720p': {
        type: 'wan_t2v',
        credits: { 5: 6, 10: 11, 15: 16 },
        desc: 'WAN Text to Video 720p',
        showNegative: true, showDurationWan: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    'wan-t2v-1080p': {
        type: 'wan_t2v',
        credits: { 5: 10, 10: 18, 15: 26 },
        desc: 'WAN Text to Video 1080p',
        showNegative: true, showDurationWan: true, showWanSize: true,
        showPromptExpansion: true, showShotType: true, showSeed: true
    },
    
    // ==================== SEEDANCE ====================
    'seedance-480p': {
        type: 'seedance',
        credits: { 5: 5, 10: 9, 12: 13 },
        desc: 'Seedance 480p (4-12 detik)',
        showImage: true, showDurationSeedance: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    'seedance-720p': {
        type: 'seedance',
        credits: { 5: 8, 10: 15, 12: 22 },
        desc: 'Seedance 720p',
        showImage: true, showDurationSeedance: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    'seedance-1080p': {
        type: 'seedance',
        credits: { 5: 14, 10: 26, 12: 38 },
        desc: 'Seedance 1080p',
        showImage: true, showDurationSeedance: true, showAspectSeedance: true,
        showGenerateAudio: true, showCameraFixed: true, showSeed: true
    },
    
    // ==================== LTX ====================
    'ltx-t2v': {
        type: 'ltx_t2v',
        credits: { 6: 8, 10: 15 },
        desc: 'LTX Text to Video',
        showDurationLtx: true, showLtxResolution: true, showGenerateAudio: true, showFps: true, showSeed: true
    },
    'ltx-i2v': {
        type: 'ltx_i2v',
        credits: { 6: 10, 10: 18 },
        desc: 'LTX Image to Video',
        showImage: true, showDurationLtx: true, showLtxResolution: true, 
        showGenerateAudio: true, showFps: true, showSeed: true
    },
    
    // ==================== RUNWAY ====================
    'runway-gen4': {
        type: 'runway',
        credits: { 5: 20, 10: 35 },
        desc: 'RunWay Gen4 Turbo',
        showImage: true, showDurationRunway: true, showRunwayRatio: true, showSeed: true
    },
    
    // ==================== OMNIHUMAN ====================
    'omnihuman': {
        type: 'omnihuman',
        credits: { 5: 25 },
        desc: 'OmniHuman - Portrait animation dengan audio',
        showOmnihuman: true
    },
    
    // ==================== VFX ====================
    'vfx': {
        type: 'vfx',
        credits: { 5: 5 },
        desc: 'Apply visual effects ke video',
        showVfx: true, noPrompt: true
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v2.0 loading...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showGeneratorUI();
        await loadUserCredits();
        await loadJobs();
        startPolling();
    } else {
        showLoginUI();
    }
    
    setupEventListeners();
    updateModelUI();
});

function showLoginUI() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('generator-section').style.display = 'none';
}

function showGeneratorUI() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('generator-section').style.display = 'block';
    
    const user = getCurrentUser();
    if (user) {
        document.getElementById('user-avatar').src = user.user_metadata?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`;
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    }
}

// ============================================
// LOAD USER CREDITS
// ============================================

async function loadUserCredits() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const { data, error } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            await supabaseClient.from('user_credits').insert({ user_id: user.id, balance: 0 });
            userCredits = 0;
        } else if (data) {
            userCredits = data.balance || 0;
            updateCreditsUI(data);
        }
    } catch (error) {
        console.error('❌ Load credits error:', error);
    }
}

function updateCreditsUI(data) {
    document.getElementById('user-credits').textContent = data?.balance || 0;
    document.getElementById('stat-credits').textContent = data?.balance || 0;
    document.getElementById('stat-used').textContent = data?.total_used || 0;
    document.getElementById('stat-refunded').textContent = data?.total_refunded || 0;
    document.getElementById('modal-current-credits').textContent = `${data?.balance || 0} kredit`;
    userCredits = data?.balance || 0;
}

// ============================================
// MODEL UI UPDATE
// ============================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    
    if (!config) return;
    
    // Update description
    document.getElementById('model-desc').textContent = config.desc || '';
    
    // Calculate credits
    const duration = getCurrentDuration(modelId);
    const credits = getCreditsForDuration(modelId, duration);
    document.getElementById('estimated-credits').textContent = credits;
    document.getElementById('total-credits').textContent = credits;
    
    // Hide all optional sections
    hideAllOptionalSections();
    
    // Show sections based on config
    if (config.showImage) show('section-image');
    if (config.showImageTail) show('group-image-tail');
    if (config.showFrames) show('section-frames');
    if (config.showRefImages) show('section-ref-images');
    if (config.showMotion) show('section-motion');
    if (config.showOmnihuman) show('section-omnihuman');
    if (config.showVfx) show('section-vfx');
    
    // Prompt section
    if (config.noPrompt) {
        hide('section-prompt');
    } else {
        show('section-prompt');
    }
    
    if (config.showNegative) show('group-negative-prompt');
    
    // Duration controls
    if (config.showDurationStd) show('group-duration-std');
    if (config.showDurationHailuo) show('group-duration-hailuo');
    if (config.showDurationWan) show('group-duration-wan');
    if (config.showDurationSeedance) show('group-duration-seedance');
    if (config.showDurationLtx) show('group-duration-ltx');
    if (config.showDurationRunway) show('group-duration-runway');
    
    // Aspect ratio controls
    if (config.showAspectRatio) show('group-aspect-ratio');
    if (config.showAspectKling26) show('group-aspect-ratio-kling26');
    if (config.showAspectSeedance) show('group-aspect-ratio-seedance');
    if (config.showRunwayRatio) show('group-runway-ratio');
    if (config.showWanSize) show('group-wan-size');
    if (config.showLtxResolution) show('group-ltx-resolution');
    
    // Other controls
    if (config.showCfg) show('group-cfg-scale');
    if (config.showSeed) show('group-seed');
    if (config.showFps) show('group-fps');
    
    // Checkboxes
    if (config.showGenerateAudio) show('check-generate-audio');
    if (config.showPromptOptimizer) show('check-prompt-optimizer');
    if (config.showPromptExpansion) show('check-prompt-expansion');
    if (config.showCameraFixed) show('check-camera-fixed');
    if (config.showShotType) show('group-shot-type');
}

function hideAllOptionalSections() {
    const sections = [
        'section-image', 'group-image-tail', 'section-frames', 'section-ref-images',
        'section-motion', 'section-omnihuman', 'section-vfx',
        'group-negative-prompt', 'group-duration-std', 'group-duration-hailuo',
        'group-duration-wan', 'group-duration-seedance', 'group-duration-ltx',
        'group-duration-runway', 'group-aspect-ratio', 'group-aspect-ratio-kling26',
        'group-aspect-ratio-seedance', 'group-runway-ratio', 'group-wan-size',
        'group-ltx-resolution', 'group-cfg-scale', 'group-seed', 'group-fps',
        'check-generate-audio', 'check-prompt-optimizer', 'check-prompt-expansion',
        'check-camera-fixed', 'group-shot-type'
    ];
    sections.forEach(id => hide(id));
}

function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function getCurrentDuration(modelId) {
    const config = MODEL_CONFIGS[modelId];
    if (!config) return 5;
    
    if (config.showDurationHailuo) return 6;
    if (config.showDurationWan) return parseInt(document.getElementById('input-duration-wan').value) || 5;
    if (config.showDurationSeedance) return parseInt(document.getElementById('input-duration-seedance').value) || 5;
    if (config.showDurationLtx) return parseInt(document.getElementById('input-duration-ltx').value) || 6;
    if (config.showDurationRunway) return parseInt(document.getElementById('input-duration-runway').value) || 10;
    
    return parseInt(document.getElementById('input-duration').value) || 5;
}

function getCreditsForDuration(modelId, duration) {
    const config = MODEL_CONFIGS[modelId];
    if (!config || !config.credits) return 10;
    
    // Find closest duration
    const durations = Object.keys(config.credits).map(Number).sort((a, b) => a - b);
    let selectedDur = durations[0];
    
    for (const dur of durations) {
        if (duration >= dur) selectedDur = dur;
    }
    
    return config.credits[selectedDur] || 10;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Model change
    document.getElementById('input-model').addEventListener('change', updateModelUI);
    
    // Duration changes
    ['input-duration', 'input-duration-wan', 'input-duration-seedance', 
     'input-duration-ltx', 'input-duration-runway'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateModelUI);
    });
    
    // Seedance duration slider
    const seedanceDur = document.getElementById('input-duration-seedance');
    if (seedanceDur) {
        seedanceDur.addEventListener('input', (e) => {
            document.getElementById('seedance-dur-value').textContent = e.target.value;
            updateModelUI();
        });
    }
    
    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', (e) => {
            document.getElementById('cfg-value').textContent = e.target.value;
        });
    }
    
    // Bloom contrast
    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) {
        bloomSlider.addEventListener('input', (e) => {
            document.getElementById('bloom-value').textContent = e.target.value;
        });
    }
    
    // Motion decay
    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) {
        decaySlider.addEventListener('input', (e) => {
            document.getElementById('decay-value').textContent = e.target.value;
        });
    }
    
    // VFX filter type change
    const filterType = document.getElementById('input-filter-type');
    if (filterType) {
        filterType.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('group-bloom-contrast').style.display = val === 7 ? '' : 'none';
            document.getElementById('group-motion-blur').style.display = val === 2 ? '' : 'none';
        });
    }
    
    // File inputs
    setupFileInput('input-image', 'preview-image', 'btn-remove-image');
    setupFileInput('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileInput('input-first-frame', 'preview-first-frame');
    setupFileInput('input-last-frame', 'preview-last-frame');
    setupFileInput('input-motion-image', 'preview-motion-image');
    setupFileInput('input-omni-image', 'preview-omni-image');
    
    // Video inputs
    setupVideoInput('input-motion-video', 'preview-motion-video');
    setupVideoInput('input-vfx-video', 'preview-vfx-video');
    
    // Audio input
    setupAudioInput('input-omni-audio', 'preview-omni-audio');
    
    // Reference images
    for (let i = 1; i <= 7; i++) {
        setupFileInput(`input-ref-${i}`, `preview-ref-${i}`);
    }
    
    // Form submit
    document.getElementById('generator-form').addEventListener('submit', submitJob);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Modals
    document.getElementById('btn-close-modal').addEventListener('click', closeJobModal);
    document.getElementById('job-modal').addEventListener('click', (e) => {
        if (e.target.id === 'job-modal') closeJobModal();
    });
    document.getElementById('credits-modal').addEventListener('click', (e) => {
        if (e.target.id === 'credits-modal') closeCreditsModal();
    });
    
    // Buy credits
    document.getElementById('btn-buy-credits').addEventListener('click', openCreditsModal);
    
    // Auth buttons
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-login-google').addEventListener('click', loginWithGoogle);
    
    // ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeJobModal();
            closeCreditsModal();
        }
    });
}

function setupFileInput(inputId, previewId, removeBtnId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    
    const uploadBox = input.closest('.upload-box');
    const removeBtn = removeBtnId ? document.getElementById(removeBtnId) : null;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                preview.src = ev.target.result;
                preview.style.display = 'block';
                if (uploadBox) uploadBox.classList.add('has-preview');
                if (removeBtn) removeBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            input.value = '';
            preview.src = '';
            preview.style.display = 'none';
            if (uploadBox) uploadBox.classList.remove('has-preview');
            removeBtn.style.display = 'none';
        });
    }
}

function setupVideoInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
            input.closest('.upload-box').classList.add('has-preview');
        }
    });
}

function setupAudioInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        }
    });
}

// ============================================
// SUBMIT JOB
// ============================================

async function submitJob(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    
    if (!config) {
        alert('Model tidak valid');
        return;
    }
    
    // Get prompt
    const prompt = document.getElementById('input-prompt')?.value?.trim() || '';
    if (!prompt && !config.noPrompt) {
        alert('Prompt wajib diisi!');
        return;
    }
    
    // Calculate credits
    const duration = getCurrentDuration(modelId);
    const requiredCredits = getCreditsForDuration(modelId, duration);
    
    if (userCredits < requiredCredits) {
        alert(`Kredit tidak mencukupi!\n\nDibutuhkan: ${requiredCredits} kredit\nSaldo: ${userCredits} kredit`);
        openCreditsModal();
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Processing...';
    
    try {
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
        updateCreditsUI({ balance: userCredits });
        
        // Collect input data
        const inputData = await collectInputData(modelId, config, prompt, duration, requiredCredits, user.id);
        
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
            await supabaseClient.rpc('refund_user_credits', {
                p_user_id: user.id,
                p_amount: requiredCredits,
                p_reason: 'Job creation failed'
            });
            throw new Error('Gagal membuat job');
        }
        
        alert(`✅ Job berhasil dibuat!\n\nModel: ${modelId}\nKredit: ${requiredCredits}\nSisa: ${userCredits}`);
        
        resetForm();
        switchTab('active');
        await loadJobs();
        
    } catch (error) {
        console.error('❌ Submit error:', error);
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
        settings.prompt_optimizer = document.getElementById('input-prompt-optimizer')?.checked || true;
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
        
        // For motion control, we need to upload to public URL
        // Here we'll send as base64 and let worker handle the upload
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
    
    // Reset all previews
    document.querySelectorAll('.upload-preview').forEach(el => {
        el.style.display = 'none';
        el.src = '';
    });
    document.querySelectorAll('.upload-box').forEach(el => el.classList.remove('has-preview'));
    document.querySelectorAll('.btn-remove-upload').forEach(el => el.style.display = 'none');
    
    updateModelUI();
}

// ============================================
// LOAD & RENDER JOBS
// ============================================

async function loadJobs() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const { data: jobs } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'videoapi')
            .order('created_at', { ascending: false })
            .limit(50);
        
        userJobs = jobs || [];
        renderJobs();
    } catch (error) {
        console.error('❌ Load jobs error:', error);
    }
}

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    const activeContainer = document.getElementById('active-jobs');
    if (activeJobs.length === 0) {
        activeContainer.innerHTML = '<div class="empty-state"><span class="empty-icon">🚀</span><p>Tidak ada proses berjalan</p></div>';
    } else {
        activeContainer.innerHTML = activeJobs.map(createJobCard).join('');
    }
    
    const historyContainer = document.getElementById('history-jobs');
    if (historyJobs.length === 0) {
        historyContainer.innerHTML = '<div class="empty-state"><span class="empty-icon">📁</span><p>Belum ada riwayat</p></div>';
    } else {
        historyContainer.innerHTML = historyJobs.map(createJobCard).join('');
    }
}

function createJobCard(job) {
    const input = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});
    const date = new Date(job.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    
    let progressHtml = '';
    if (['pending', 'processing'].includes(job.status)) {
        progressHtml = `
            <div class="job-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${job.progress_percent || 0}%"></div></div>
                <p class="progress-step">${job.step_name || 'Menunggu...'} (${job.progress_percent || 0}%)</p>
            </div>
        `;
    }
    
    let previewHtml = '';
    if (results.video_url) {
        previewHtml = `<div class="job-preview"><video src="${results.video_url}" muted></video></div>`;
    }
    
    const statusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal' };
    
    return `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <div class="job-info">
                    <div class="job-title">${escapeHtml(input.model_id || 'Video')}</div>
                    <div class="job-meta"><span class="job-credits">🪙 ${input.credits_used || 0}</span><span class="job-date">${date}</span></div>
                </div>
                <span class="status-badge status-${job.status}">${statusLabels[job.status]}</span>
            </div>
            ${progressHtml}
            ${previewHtml}
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ============================================
// MODALS
// ============================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const input = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});
    
    document.getElementById('modal-title').textContent = input.model_id || 'Detail Job';
    
    const statusEl = document.getElementById('modal-status');
    const statusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal' };
    statusEl.textContent = statusLabels[job.status];
    statusEl.className = `status-badge status-${job.status}`;
    
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        document.getElementById('modal-progress-fill').style.width = `${job.progress_percent || 0}%`;
        document.getElementById('modal-progress-percent').textContent = `${job.progress_percent || 0}%`;
        document.getElementById('modal-step').textContent = job.step_name || 'Menunggu...';
        document.getElementById('modal-credits-used').textContent = `${input.credits_used || 0} kredit`;
        
    } else if (job.status === 'completed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        if (results.video_url) {
            document.getElementById('modal-video').src = results.video_url;
            document.getElementById('modal-download').href = results.video_url;
        }
        document.getElementById('modal-model').textContent = input.model_id;
        document.getElementById('modal-credits-final').textContent = `${input.credits_used || 0} kredit`;
        
    } else if (job.status === 'failed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Terjadi kesalahan';
    }
    
    document.getElementById('job-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function openCreditsModal() {
    document.getElementById('credits-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const { data: packages } = await supabaseClient
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    
    const container = document.getElementById('packages-grid');
    container.innerHTML = (packages || []).map(pkg => `
        <div class="package-card ${pkg.is_popular ? 'popular' : ''}" onclick="buyPackage('${pkg.id}')">
            ${pkg.is_popular ? '<span class="popular-badge">POPULAR</span>' : ''}
            <h4>${pkg.name}</h4>
            <div class="package-credits">${pkg.credits} kredit</div>
            ${pkg.bonus_credits > 0 ? `<div class="package-bonus">+${pkg.bonus_credits} bonus</div>` : ''}
            <div class="package-price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
        </div>
    `).join('');
}

function closeCreditsModal() {
    document.getElementById('credits-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function buyPackage(packageId) {
    alert(`Fitur pembelian kredit akan segera hadir!\n\nPaket: ${packageId}`);
}

// ============================================
// TABS & POLLING
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${tabName}`));
    
    if (tabName === 'pricing') loadPricing();
}

async function loadPricing() {
    const { data } = await supabaseClient.from('video_model_pricing').select('*').eq('is_active', true).order('display_order');
    
    const grid = document.getElementById('pricing-grid');
    grid.innerHTML = (data || []).map(m => `
        <div class="pricing-card ${m.category}">
            <div class="pricing-header"><h4>${m.model_name}</h4><span class="pricing-category">${m.category}</span></div>
            <div class="pricing-body">
                <div class="pricing-credits">
                    <span>5s: <strong>${m.credits_5s || m.base_credits}</strong>🪙</span>
                    ${m.credits_10s ? `<span>10s: <strong>${m.credits_10s}</strong>🪙</span>` : ''}
                </div>
                <p class="pricing-desc">${m.description || ''}</p>
            </div>
        </div>
    `).join('');
}

function startPolling() {
    if (pollingInterval) return;
    pollingInterval = setInterval(async () => {
        if (userJobs.some(j => ['pending', 'processing'].includes(j.status))) {
            await loadJobs();
            await loadUserCredits();
        }
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
}

window.addEventListener('beforeunload', stopPolling);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPolling();
    else if (getCurrentUser()) startPolling();
});

console.log('✅ Video API Generator v2.0 loaded');
