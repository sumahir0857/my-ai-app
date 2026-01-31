// ============================================
// VIDEO GENERATOR - VEO 3.1 Only
// ============================================

let pollingInterval = null;
let userJobs = [];
let currentMode = 'text-to-video';
let selectedImageBase64 = null;
let selectedImageDimensions = { width: 0, height: 0 };
let currentJobId = null;

// ========================================
// INITIALIZATION
// ========================================

async function initVideoGenerator() {
    console.log('🎬 Initializing Video Generator (VEO 3.1)...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        console.log('✅ User is logged in');
        showGeneratorUI();
        await loadUserStats();
        await loadJobs();
        startPolling();
    } else {
        console.log('⚠️ User not logged in');
        showLoginUI();
    }
}

function showLoginUI() {
    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    const userBar = document.getElementById('user-bar');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (generatorSection) generatorSection.style.display = 'none';
    if (userBar) userBar.style.display = 'none';
}

function showGeneratorUI() {
    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    const userBar = document.getElementById('user-bar');
    
    if (loginSection) loginSection.style.display = 'none';
    if (generatorSection) generatorSection.style.display = 'block';
    if (userBar) userBar.style.display = 'flex';
    
    const user = getCurrentUser();
    if (user) {
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        
        if (avatar) {
            avatar.src = user.user_metadata?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`;
        }
        if (name) {
            name.textContent = user.user_metadata?.full_name || user.email;
        }
    }
}

// ========================================
// LOAD USER STATS
// ========================================

async function loadUserStats() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        let result = await supabaseClient.rpc('check_service_limit', {
            p_service: 'video'
        });
        
        if (result.error && result.error.message.includes('does not exist')) {
            result = await supabaseClient.rpc('check_limit');
        }
        
        if (result.error) {
            console.error('❌ Load stats error:', result.error);
            updateStatsUI({ plan_name: 'Free', remaining: 0, daily_limit: 1 });
            return;
        }
        
        if (result.data && result.data.length > 0) {
            const stats = result.data[0];
            console.log('📊 User stats:', stats);
            updateStatsUI(stats);
        }
    } catch (error) {
        console.error('❌ Load stats error:', error);
    }
}

function updateStatsUI(stats) {
    const planEl = document.getElementById('user-plan');
    const remainingEl = document.getElementById('user-remaining');
    
    if (planEl) planEl.textContent = stats.plan_name || 'Free';
    if (remainingEl) {
        remainingEl.textContent = stats.daily_limit === -1 ? '∞' : (stats.remaining || 0);
    }
    
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
        if (stats.remaining <= 0 && stats.daily_limit !== -1) {
            generateBtn.disabled = true;
            generateBtn.title = 'Limit harian habis';
        } else {
            generateBtn.disabled = false;
            generateBtn.title = '';
        }
    }
}

// ========================================
// LOAD JOBS
// ========================================

async function loadJobs() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'video')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('❌ Load jobs error:', error);
            return;
        }
        
        console.log('✅ Loaded video jobs:', jobs?.length || 0);
        userJobs = jobs || [];
        renderJobs();
    } catch (error) {
        console.error('❌ Load jobs error:', error);
    }
}

// ========================================
// RENDER JOBS
// ========================================

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    const activeCount = document.getElementById('active-count');
    const historyCount = document.getElementById('history-count');
    if (activeCount) activeCount.textContent = activeJobs.length;
    if (historyCount) historyCount.textContent = historyJobs.length;
    
    const activeContainer = document.getElementById('active-jobs');
    if (activeContainer) {
        if (activeJobs.length === 0) {
            activeContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">🚀</span>
                    <p>Tidak ada proses berjalan</p>
                </div>
            `;
        } else {
            activeContainer.innerHTML = activeJobs.map(job => createJobCard(job)).join('');
        }
    }
    
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
            historyContainer.innerHTML = historyJobs.map(job => createJobCard(job)).join('');
        }
    }
}

function createJobCard(job) {
    const input = job.input_data || {};
    let results = job.results || {};
    if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch (e) { results = {}; }
    }
    
    const date = new Date(job.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    
    const statusLabels = {
        pending: '⏳ Menunggu',
        processing: '🔄 Diproses',
        completed: '✅ Selesai',
        failed: '❌ Gagal'
    };
    
    let progressHtml = '';
    if (['pending', 'processing'].includes(job.status)) {
        const percent = job.progress_percent || 0;
        progressHtml = `
            <div class="job-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <p class="progress-text">${job.step_name || 'Menunggu...'} (${percent}%)</p>
            </div>
        `;
    }
    
    let previewHtml = '';
    if (results.video_url) {
        previewHtml = `
            <div class="job-preview">
                <video src="${results.video_url}" muted></video>
            </div>
        `;
    }
    
    const mode = input.image_base64 || input.image_url ? 'Image→Video' : 'Text→Video';
    
    return `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <div class="job-info">
                    <div class="job-title">${escapeHtml((input.prompt || 'Video').substring(0, 40))}...</div>
                    <div class="job-meta">
                        <span>${date}</span>
                        <span>•</span>
                        <span>${results.aspect_ratio || input.aspect_ratio || '9:16'}</span>
                        <span>•</span>
                        <span>${mode}</span>
                    </div>
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

// ========================================
// MODE SWITCHING
// ========================================

function switchMode(mode) {
    currentMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    const imageSection = document.getElementById('image-upload-section');
    const ratioSection = document.getElementById('ratio-section');
    
    if (mode === 'image-to-video') {
        if (imageSection) imageSection.style.display = 'block';
        // Hide manual ratio selection for image-to-video (will use auto-detect)
        if (ratioSection) ratioSection.style.display = 'none';
    } else {
        if (imageSection) imageSection.style.display = 'none';
        // Show manual ratio selection for text-to-video
        if (ratioSection) ratioSection.style.display = 'block';
        clearImage();
    }
}

// ========================================
// IMAGE HANDLING WITH AUTO-DETECT RATIO
// ========================================

function detectAspectRatio(width, height) {
    if (width === 0 || height === 0) return { ratio: '9:16', label: 'Portrait' };
    
    const r = width / height;
    
    if (r > 1.2) {
        return { ratio: '16:9', label: 'Landscape' };
    } else if (r < 0.8) {
        return { ratio: '9:16', label: 'Portrait' };
    } else {
        return { ratio: '1:1', label: 'Square' };
    }
}

function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Pilih file gambar yang valid');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file terlalu besar (maks 10MB)');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        
        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
            selectedImageDimensions = { width: img.width, height: img.height };
            
            // Detect and show aspect ratio
            const detected = detectAspectRatio(img.width, img.height);
            const ratioInfo = document.getElementById('detected-ratio-info');
            const ratioText = document.getElementById('detected-ratio-text');
            
            if (ratioInfo && ratioText) {
                ratioText.textContent = `Rasio terdeteksi: ${detected.ratio} (${detected.label}) - ${img.width}×${img.height}px`;
                ratioInfo.style.display = 'flex';
            }
            
            console.log(`📐 Image: ${img.width}x${img.height} → Ratio: ${detected.ratio}`);
        };
        img.src = selectedImageBase64;
        
        const preview = document.getElementById('preview-image');
        const placeholder = document.getElementById('upload-placeholder');
        const removeBtn = document.getElementById('btn-remove-image');
        
        if (preview) {
            preview.src = selectedImageBase64;
            preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImageBase64 = null;
    selectedImageDimensions = { width: 0, height: 0 };
    
    const input = document.getElementById('input-image');
    const preview = document.getElementById('preview-image');
    const placeholder = document.getElementById('upload-placeholder');
    const removeBtn = document.getElementById('btn-remove-image');
    const ratioInfo = document.getElementById('detected-ratio-info');
    
    if (input) input.value = '';
    if (preview) {
        preview.style.display = 'none';
        preview.src = '';
    }
    if (placeholder) placeholder.style.display = 'block';
    if (removeBtn) removeBtn.style.display = 'none';
    if (ratioInfo) ratioInfo.style.display = 'none';
}

// ========================================
// SUBMIT JOB
// ========================================

async function submitVideoJob(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const prompt = document.getElementById('input-prompt')?.value?.trim();
    
    // Validasi
    if (!prompt) {
        alert('Masukkan deskripsi video');
        return;
    }
    
    if (currentMode === 'image-to-video' && !selectedImageBase64) {
        alert('Upload gambar untuk mode Image-to-Video');
        return;
    }
    
    // Determine aspect ratio
    let aspectRatio;
    if (currentMode === 'image-to-video') {
        // Auto-detect from image
        const detected = detectAspectRatio(selectedImageDimensions.width, selectedImageDimensions.height);
        aspectRatio = detected.ratio;
        console.log(`📐 Using auto-detected ratio: ${aspectRatio}`);
    } else {
        // Use selected radio button
        const ratioInput = document.querySelector('input[name="ratio"]:checked');
        aspectRatio = ratioInput?.value || '9:16';
    }
    
    const submitBtn = document.getElementById('btn-generate');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline-flex';
    
    hideAllSections();
    const progressSection = document.getElementById('progress-section');
    if (progressSection) progressSection.style.display = 'block';
    updateProgress(0, 'Memvalidasi...');
    
    try {
        // Check limit
        let limitResult = await supabaseClient.rpc('check_service_limit', {
            p_service: 'video'
        });
        
        if (limitResult.error && limitResult.error.message.includes('does not exist')) {
            limitResult = await supabaseClient.rpc('check_limit');
        }
        
        if (limitResult.error) throw new Error('Gagal cek kuota: ' + limitResult.error.message);
        
        const quota = limitResult.data?.[0];
        if (quota && !quota.allowed) {
            throw new Error(`Limit harian habis! (${quota.current_count}/${quota.daily_limit})`);
        }
        
        updateProgress(10, 'Membuat job...');
        
        // Prepare input data
        const inputData = {
            prompt: prompt.substring(0, 500),
            aspect_ratio: aspectRatio
        };
        
        if (selectedImageBase64) {
            inputData.image_base64 = selectedImageBase64;
        }
        
        // Create job
        let jobResult = await supabaseClient.rpc('create_service_job', {
            p_service: 'video',
            p_input_data: inputData,
            p_total_steps: 4
        });
        
        if (jobResult.error && jobResult.error.message.includes('does not exist')) {
            jobResult = await supabaseClient.rpc('create_job_secure', {
                p_service: 'video',
                p_input_data: inputData,
                p_total_steps: 4
            });
        }
        
        if (jobResult.error) throw jobResult.error;
        
        const result = jobResult.data?.[0];
        if (!result || !result.success) {
            throw new Error(result?.message || 'Gagal membuat job');
        }
        
        console.log('✅ Job created:', result.job_id);
        currentJobId = result.job_id;
        
        startJobPolling(result.job_id);
        await loadUserStats();
        
        // Reset form
        document.getElementById('input-prompt').value = '';
        document.getElementById('char-count').textContent = '0';
        clearImage();
        
    } catch (error) {
        console.error('❌ Submit error:', error);
        showError(error.message);
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
    }
}

// ========================================
// JOB POLLING
// ========================================

function startJobPolling(jobId) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        try {
            const { data: job, error } = await supabaseClient
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();
            
            if (error) throw error;
            if (!job) return;
            
            updateProgress(job.progress_percent, job.step_name);
            
            if (job.status === 'completed') {
                stopPolling();
                showResult(job.results);
                await loadJobs();
            } else if (job.status === 'failed') {
                stopPolling();
                showError(job.error_message || 'Video generation failed');
                await loadJobs();
                await loadUserStats(); // Reload to show refunded quota
            }
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
}

function startPolling() {
    if (pollingInterval) return;
    
    pollingInterval = setInterval(async () => {
        const hasActive = userJobs.some(j => ['pending', 'processing'].includes(j.status));
        if (hasActive) {
            await loadJobs();
        }
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

function updateProgress(percent, text) {
    const fill = document.getElementById('progress-fill');
    const textEl = document.getElementById('progress-text');
    const stepEl = document.getElementById('progress-step');
    
    if (fill) fill.style.width = `${percent || 0}%`;
    if (textEl) textEl.textContent = text || 'Memproses...';
    if (stepEl) stepEl.textContent = `${percent || 0}%`;
}

// ========================================
// RESULT & ERROR
// ========================================

function showResult(results) {
    hideAllSections();
    
    let parsedResults = results;
    if (typeof results === 'string') {
        try { parsedResults = JSON.parse(results); } catch (e) { parsedResults = {}; }
    }
    
    const resultSection = document.getElementById('result-section');
    const video = document.getElementById('result-video');
    const downloadBtn = document.getElementById('btn-download');
    const resultInfo = document.getElementById('result-info');
    
    if (resultSection) resultSection.style.display = 'block';
    
    const videoUrl = parsedResults?.video_url;
    if (video && videoUrl) video.src = videoUrl;
    if (downloadBtn && videoUrl) downloadBtn.href = videoUrl;
    
    if (resultInfo) {
        resultInfo.innerHTML = `
            <span>🎬 Engine: VEO 3.1</span>
            <span>📐 Rasio: ${parsedResults?.aspect_ratio || '9:16'}</span>
            <span>📹 Mode: ${parsedResults?.mode || 'text-to-video'}</span>
        `;
    }
}

function showError(message) {
    hideAllSections();
    
    const errorSection = document.getElementById('error-section');
    const errorMsg = document.getElementById('error-message');
    
    if (errorSection) errorSection.style.display = 'block';
    if (errorMsg) errorMsg.textContent = message || 'Terjadi kesalahan';
}

function hideAllSections() {
    const sections = ['progress-section', 'result-section', 'error-section'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function resetGenerator() {
    hideAllSections();
    currentJobId = null;
    loadJobs();
    loadUserStats();
}

// ========================================
// TAB SWITCHING
// ========================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
}

// ========================================
// JOB MODAL
// ========================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const modal = document.getElementById('job-modal');
    const input = job.input_data || {};
    
    let results = job.results || {};
    if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch (e) { results = {}; }
    }
    
    const title = document.getElementById('modal-title');
    if (title) title.textContent = (input.prompt || 'Video').substring(0, 50) + '...';
    
    const statusBadge = document.getElementById('modal-status-badge');
    const statusLabels = { pending: '⏳ Menunggu', processing: '🔄 Diproses', completed: '✅ Selesai', failed: '❌ Gagal' };
    if (statusBadge) {
        statusBadge.textContent = statusLabels[job.status] || job.status;
        statusBadge.className = `status-badge status-${job.status}`;
    }
    
    const progressEl = document.getElementById('modal-progress');
    const resultEl = document.getElementById('modal-result');
    const errorEl = document.getElementById('modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        if (progressEl) progressEl.style.display = 'block';
        if (resultEl) resultEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        
        const fill = document.getElementById('modal-progress-fill');
        const text = document.getElementById('modal-progress-text');
        const step = document.getElementById('modal-progress-step');
        
        if (fill) fill.style.width = `${job.progress_percent || 0}%`;
        if (text) text.textContent = job.step_name || 'Memproses...';
        if (step) step.textContent = `Step ${job.current_step || 0}/${job.total_steps || 4}`;
        
    } else if (job.status === 'completed') {
        if (progressEl) progressEl.style.display = 'none';
        if (resultEl) resultEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';
        
        const video = document.getElementById('modal-video');
        const download = document.getElementById('modal-download');
        
        if (video && results.video_url) video.src = results.video_url;
        if (download && results.video_url) download.href = results.video_url;
        
    } else if (job.status === 'failed') {
        if (progressEl) progressEl.style.display = 'none';
        if (resultEl) resultEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
        
        const errorMsg = document.getElementById('modal-error-msg');
        if (errorMsg) errorMsg.textContent = job.error_message || 'Terjadi kesalahan';
    }
    
    const infoEl = document.getElementById('modal-info');
    if (infoEl) {
        const date = new Date(job.created_at).toLocaleString('id-ID');
        const mode = input.image_base64 || input.image_url ? 'Image to Video' : 'Text to Video';
        infoEl.innerHTML = `
            <p><strong>Dibuat:</strong> ${date}</p>
            <p><strong>Mode:</strong> ${mode}</p>
            <p><strong>Rasio:</strong> ${results.aspect_ratio || input.aspect_ratio || '9:16'}</p>
            <p><strong>Engine:</strong> VEO 3.1</p>
        `;
    }
    
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing Video Generator (VEO 3.1)...');
    
    initVideoGenerator();
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
    
    // Image upload
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('input-image');
    const removeBtn = document.getElementById('btn-remove-image');
    
    if (uploadArea && imageInput) {
        uploadArea.addEventListener('click', (e) => {
            if (e.target.id !== 'btn-remove-image') {
                imageInput.click();
            }
        });
        
        imageInput.addEventListener('change', (e) => {
            if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer?.files?.[0]) handleImageSelect(e.dataTransfer.files[0]);
        });
    }
    
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearImage();
        });
    }
    
    // Char count
    const promptInput = document.getElementById('input-prompt');
    const charCount = document.getElementById('char-count');
    if (promptInput && charCount) {
        promptInput.addEventListener('input', () => {
            charCount.textContent = promptInput.value.length;
        });
    }
    
    // Form submit
    const form = document.getElementById('video-form');
    if (form) {
        form.addEventListener('submit', submitVideoJob);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Result buttons
    const newVideoBtn = document.getElementById('btn-new-video');
    const retryBtn = document.getElementById('btn-retry');
    if (newVideoBtn) newVideoBtn.addEventListener('click', resetGenerator);
    if (retryBtn) retryBtn.addEventListener('click', resetGenerator);
    
    // Modal
    const closeModalBtn = document.getElementById('btn-close-modal');
    const modal = document.getElementById('job-modal');
    
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeJobModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'job-modal') closeJobModal();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeJobModal();
    });
    
    // Login button
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/video-generator.html'
                }
            });
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Auth state listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('🔄 Auth state changed:', event);
    
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showGeneratorUI();
        loadUserStats();
        loadJobs();
        startPolling();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showLoginUI();
        stopPolling();
    }
});

// Visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopPolling();
    } else {
        const user = getCurrentUser();
        if (user) {
            loadJobs();
            startPolling();
        }
    }
});

window.addEventListener('beforeunload', stopPolling);

console.log('✅ Video Generator.js (VEO 3.1 Only) loaded');
