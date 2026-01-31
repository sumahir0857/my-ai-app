// ============================================
// IMAGE GENERATOR - Gemini Opal
// ============================================

let pollingInterval = null;
let userJobs = [];
let currentMode = 'text-to-image';
let selectedImageBase64 = null;
let selectedImageDimensions = { width: 0, height: 0 };
let currentJobId = null;
let lastResultImageUrl = null;

// ========================================
// INITIALIZATION
// ========================================

async function initImageGenerator() {
    console.log('🖼️ Initializing Image Generator...');
    
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
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('generator-section').style.display = 'none';
    document.getElementById('user-bar').style.display = 'none';
}

function showGeneratorUI() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('generator-section').style.display = 'block';
    document.getElementById('user-bar').style.display = 'flex';
    
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
            p_service: 'image'
        });
        
        if (result.error && result.error.message.includes('does not exist')) {
            result = await supabaseClient.rpc('check_limit');
        }
        
        if (result.error) {
            console.error('❌ Load stats error:', result.error);
            updateStatsUI({ plan_name: 'Free', remaining: 0, daily_limit: 5 });
            return;
        }
        
        if (result.data && result.data.length > 0) {
            updateStatsUI(result.data[0]);
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
            .eq('service', 'image')
            .order('created_at', { ascending: false })
            .limit(30);
        
        if (error) {
            console.error('❌ Load jobs error:', error);
            return;
        }
        
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
    
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    const activeContainer = document.getElementById('active-jobs');
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
    
    const historyContainer = document.getElementById('history-jobs');
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

function createJobCard(job) {
    const input = job.input_data || {};
    let results = job.results || {};
    if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch (e) { results = {}; }
    }
    
    const date = new Date(job.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    
    const statusIcons = {
        pending: '⏳',
        processing: '🔄',
        completed: '✅',
        failed: '❌'
    };
    
    let thumbnailHtml = '';
    if (results.image_url) {
        thumbnailHtml = `<img src="${results.image_url}" alt="Result" class="job-thumbnail">`;
    } else {
        thumbnailHtml = `<div class="job-thumbnail-placeholder">${statusIcons[job.status]}</div>`;
    }
    
    const mode = input.image_base64 || input.image_url ? 'Edit' : 'Generate';
    
    return `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            ${thumbnailHtml}
            <div class="job-card-info">
                <p class="job-prompt">${escapeHtml((input.prompt || 'Image').substring(0, 30))}...</p>
                <div class="job-meta">
                    <span>${mode}</span>
                    <span>•</span>
                    <span>${results.aspect_ratio || input.aspect_ratio || '1:1'}</span>
                </div>
                <span class="job-date">${date}</span>
            </div>
            <span class="status-icon status-${job.status}">${statusIcons[job.status]}</span>
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
    
    const sourceSection = document.getElementById('source-image-section');
    const ratioSection = document.getElementById('ratio-section');
    const promptLabel = document.getElementById('prompt-label');
    const promptInput = document.getElementById('input-prompt');
    
    if (mode === 'image-to-image') {
        sourceSection.style.display = 'block';
        ratioSection.style.display = 'none'; // Hide ratio for edit mode (auto-detect)
        promptLabel.textContent = 'Instruksi Edit ';
        promptLabel.innerHTML += '<span class="required">*</span>';
        promptInput.placeholder = 'Jelaskan perubahan yang ingin dilakukan... Contoh: "Ubah latar belakang menjadi pantai sunset" atau "Tambahkan efek vintage"';
    } else {
        sourceSection.style.display = 'none';
        ratioSection.style.display = 'block';
        promptLabel.textContent = 'Deskripsi Gambar ';
        promptLabel.innerHTML += '<span class="required">*</span>';
        promptInput.placeholder = 'Deskripsikan gambar yang ingin dibuat... Contoh: "Kucing lucu bermain di taman dengan bunga-bunga"';
        clearImage();
    }
}

// ========================================
// IMAGE HANDLING
// ========================================

function detectAspectRatio(width, height) {
    if (width === 0 || height === 0) return { ratio: '1:1', label: 'Square' };
    
    const r = width / height;
    
    if (r > 1.5) return { ratio: '16:9', label: 'Landscape' };
    if (r > 1.1) return { ratio: '4:3', label: 'Classic' };
    if (r < 0.67) return { ratio: '9:16', label: 'Portrait' };
    if (r < 0.9) return { ratio: '3:4', label: 'Portrait' };
    return { ratio: '1:1', label: 'Square' };
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
        
        const img = new Image();
        img.onload = () => {
            selectedImageDimensions = { width: img.width, height: img.height };
            
            const detected = detectAspectRatio(img.width, img.height);
            const ratioInfo = document.getElementById('detected-ratio-info');
            const ratioText = document.getElementById('detected-ratio-text');
            
            if (ratioInfo && ratioText) {
                ratioText.textContent = `Rasio: ${detected.ratio} (${detected.label}) - ${img.width}×${img.height}px`;
                ratioInfo.style.display = 'flex';
            }
        };
        img.src = selectedImageBase64;
        
        document.getElementById('preview-image').src = selectedImageBase64;
        document.getElementById('preview-image').style.display = 'block';
        document.getElementById('upload-placeholder').style.display = 'none';
        document.getElementById('btn-remove-image').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImageBase64 = null;
    selectedImageDimensions = { width: 0, height: 0 };
    
    document.getElementById('input-image').value = '';
    document.getElementById('preview-image').style.display = 'none';
    document.getElementById('preview-image').src = '';
    document.getElementById('upload-placeholder').style.display = 'block';
    document.getElementById('btn-remove-image').style.display = 'none';
    document.getElementById('detected-ratio-info').style.display = 'none';
}

function useResultAsSource(imageUrl) {
    // Fetch the image and convert to base64
    fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageBase64 = e.target.result;
                
                const img = new Image();
                img.onload = () => {
                    selectedImageDimensions = { width: img.width, height: img.height };
                    
                    // Switch to edit mode
                    switchMode('image-to-image');
                    
                    // Show the image
                    document.getElementById('preview-image').src = selectedImageBase64;
                    document.getElementById('preview-image').style.display = 'block';
                    document.getElementById('upload-placeholder').style.display = 'none';
                    document.getElementById('btn-remove-image').style.display = 'block';
                    
                    const detected = detectAspectRatio(img.width, img.height);
                    const ratioInfo = document.getElementById('detected-ratio-info');
                    const ratioText = document.getElementById('detected-ratio-text');
                    if (ratioInfo && ratioText) {
                        ratioText.textContent = `Rasio: ${detected.ratio} (${detected.label})`;
                        ratioInfo.style.display = 'flex';
                    }
                    
                    // Clear prompt
                    document.getElementById('input-prompt').value = '';
                    document.getElementById('char-count').textContent = '0';
                    
                    // Hide result section
                    hideAllSections();
                    
                    // Scroll to form
                    document.getElementById('image-form').scrollIntoView({ behavior: 'smooth' });
                };
                img.src = selectedImageBase64;
            };
            reader.readAsDataURL(blob);
        })
        .catch(err => {
            console.error('Failed to load image:', err);
            alert('Gagal memuat gambar. Coba lagi.');
        });
}

// ========================================
// SUBMIT JOB
// ========================================

async function submitImageJob(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const prompt = document.getElementById('input-prompt')?.value?.trim();
    
    if (!prompt) {
        alert('Masukkan deskripsi atau instruksi');
        return;
    }
    
    if (currentMode === 'image-to-image' && !selectedImageBase64) {
        alert('Upload gambar untuk mode Edit');
        return;
    }
    
    // Determine aspect ratio
    let aspectRatio;
    if (currentMode === 'image-to-image') {
        const detected = detectAspectRatio(selectedImageDimensions.width, selectedImageDimensions.height);
        aspectRatio = detected.ratio;
    } else {
        const ratioInput = document.querySelector('input[name="ratio"]:checked');
        aspectRatio = ratioInput?.value || '1:1';
    }
    
    const submitBtn = document.getElementById('btn-generate');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnLoading = submitBtn?.querySelector('.btn-loading');
    
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    
    hideAllSections();
    document.getElementById('progress-section').style.display = 'block';
    updateProgress(0, 'Memvalidasi...');
    
    try {
        // Check limit
        let limitResult = await supabaseClient.rpc('check_service_limit', {
            p_service: 'image'
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
            prompt: prompt.substring(0, 1000),
            aspect_ratio: aspectRatio
        };
        
        if (selectedImageBase64) {
            inputData.image_base64 = selectedImageBase64;
        }
        
        // Create job
        let jobResult = await supabaseClient.rpc('create_service_job', {
            p_service: 'image',
            p_input_data: inputData,
            p_total_steps: 3
        });
        
        if (jobResult.error && jobResult.error.message.includes('does not exist')) {
            jobResult = await supabaseClient.rpc('create_job_secure', {
                p_service: 'image',
                p_input_data: inputData,
                p_total_steps: 3
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
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
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
                showError(job.error_message || 'Image generation failed');
                await loadJobs();
                await loadUserStats();
            }
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 2000);
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
    document.getElementById('progress-fill').style.width = `${percent || 0}%`;
    document.getElementById('progress-text').textContent = text || 'Memproses...';
    document.getElementById('progress-step').textContent = `${percent || 0}%`;
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
    
    document.getElementById('result-section').style.display = 'block';
    
    const imageUrl = parsedResults?.image_url;
    lastResultImageUrl = imageUrl;
    
    document.getElementById('result-image').src = imageUrl || '';
    document.getElementById('btn-download').href = imageUrl || '#';
    
    document.getElementById('result-info').innerHTML = `
        <span>📐 Rasio: ${parsedResults?.aspect_ratio || '1:1'}</span>
        <span>📏 Ukuran: ${parsedResults?.width || '?'}×${parsedResults?.height || '?'}px</span>
        <span>🎨 Mode: ${parsedResults?.mode || 'text-to-image'}</span>
    `;
}

function showError(message) {
    hideAllSections();
    document.getElementById('error-section').style.display = 'block';
    document.getElementById('error-message').textContent = message || 'Terjadi kesalahan';
}

function hideAllSections() {
    ['progress-section', 'result-section', 'error-section'].forEach(id => {
        document.getElementById(id).style.display = 'none';
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
    
    document.getElementById('modal-title').textContent = (input.prompt || 'Image').substring(0, 50) + '...';
    
    const statusBadge = document.getElementById('modal-status-badge');
    const statusLabels = { pending: '⏳ Menunggu', processing: '🔄 Diproses', completed: '✅ Selesai', failed: '❌ Gagal' };
    statusBadge.textContent = statusLabels[job.status] || job.status;
    statusBadge.className = `status-badge status-${job.status}`;
    
    const progressEl = document.getElementById('modal-progress');
    const resultEl = document.getElementById('modal-result');
    const errorEl = document.getElementById('modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        progressEl.style.display = 'block';
        resultEl.style.display = 'none';
        errorEl.style.display = 'none';
        
        document.getElementById('modal-progress-fill').style.width = `${job.progress_percent || 0}%`;
        document.getElementById('modal-progress-text').textContent = job.step_name || 'Memproses...';
        
    } else if (job.status === 'completed') {
        progressEl.style.display = 'none';
        resultEl.style.display = 'block';
        errorEl.style.display = 'none';
        
        document.getElementById('modal-image').src = results.image_url || '';
        document.getElementById('modal-download').href = results.image_url || '#';
        
    } else if (job.status === 'failed') {
        progressEl.style.display = 'none';
        resultEl.style.display = 'none';
        errorEl.style.display = 'block';
        
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Terjadi kesalahan';
    }
    
    const infoEl = document.getElementById('modal-info');
    const date = new Date(job.created_at).toLocaleString('id-ID');
    const mode = input.image_base64 || input.image_url ? 'Image to Image' : 'Text to Image';
    infoEl.innerHTML = `
        <p><strong>Dibuat:</strong> ${date}</p>
        <p><strong>Mode:</strong> ${mode}</p>
        <p><strong>Rasio:</strong> ${results.aspect_ratio || input.aspect_ratio || '1:1'}</p>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Image Generator...');
    
    initImageGenerator();
    
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
    
    // Image upload
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('input-image');
    
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
    
    document.getElementById('btn-remove-image').addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
    });
    
    // Char count
    const promptInput = document.getElementById('input-prompt');
    const charCount = document.getElementById('char-count');
    promptInput.addEventListener('input', () => {
        charCount.textContent = promptInput.value.length;
    });
    
    // Form submit
    document.getElementById('image-form').addEventListener('submit', submitImageJob);
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Result buttons
    document.getElementById('btn-new-image').addEventListener('click', resetGenerator);
    document.getElementById('btn-retry').addEventListener('click', resetGenerator);
    document.getElementById('btn-edit-result').addEventListener('click', () => {
        if (lastResultImageUrl) {
            useResultAsSource(lastResultImageUrl);
        }
    });
    
    // Modal
    document.getElementById('btn-close-modal').addEventListener('click', closeJobModal);
    document.getElementById('job-modal').addEventListener('click', (e) => {
        if (e.target.id === 'job-modal') closeJobModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeJobModal();
    });
    
    // Login
    document.getElementById('btn-login-google').addEventListener('click', () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/image-generator.html'
            }
        });
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);
});

// Auth state listener
supabaseClient.auth.onAuthStateChange((event, session) => {
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

console.log('✅ Image Generator.js loaded');
