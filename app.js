// ==================================
// UGC GENERATOR - MAIN APP
// ==================================

// State
let currentUser = null;
let currentJobs = [];
let pollingInterval = null;

// DOM Elements
const screens = {
    loading: document.getElementById('loading-screen'),
    login: document.getElementById('login-screen'),
    main: document.getElementById('main-screen')
};

// ==================================
// INITIALIZATION
// ==================================

async function init() {
    showScreen('loading');
    
    // Check existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserData();
        showScreen('main');
        startPolling();
    } else {
        showScreen('login');
    }
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            await loadUserData();
            showScreen('main');
            startPolling();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            stopPolling();
            showScreen('login');
        }
    });
    
    setupEventListeners();
}

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ==================================
// AUTHENTICATION
// ==================================

async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin
        }
    });
    
    if (error) {
        showToast('Gagal login: ' + error.message, 'error');
    }
}

async function logout() {
    await supabase.auth.signOut();
    showToast('Berhasil logout');
}

// ==================================
// USER DATA
// ==================================

async function loadUserData() {
    if (!currentUser) return;
    
    // Update UI with user info
    document.getElementById('user-avatar').src = currentUser.user_metadata?.avatar_url || '';
    document.getElementById('user-name').textContent = currentUser.user_metadata?.full_name || currentUser.email;
    
    // Load user stats
    await loadUserStats();
    
    // Load jobs
    await loadJobs();
}

async function loadUserStats() {
    try {
        // Check limit
        const { data: limitData } = await supabase.rpc('check_limit', {
            p_user_id: currentUser.id
        });
        
        if (limitData && limitData.length > 0) {
            const stats = limitData[0];
            document.getElementById('user-plan').textContent = stats.plan_name || 'Free';
            
            if (stats.daily_limit === -1) {
                document.getElementById('user-remaining').textContent = '∞';
            } else {
                document.getElementById('user-remaining').textContent = stats.remaining || 0;
            }
        }
        
        // Count total jobs
        const { count } = await supabase
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .eq('status', 'completed');
        
        document.getElementById('user-total').textContent = count || 0;
        
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// ==================================
// JOBS
// ==================================

async function loadJobs() {
    try {
        const { data: jobs, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        currentJobs = jobs || [];
        renderJobs();
        
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderJobs() {
    // Active jobs (pending, processing)
    const activeJobs = currentJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const activeContainer = document.getElementById('active-jobs-list');
    
    if (activeJobs.length === 0) {
        activeContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">☕</span>
                <p>Tidak ada proses yang sedang berjalan</p>
            </div>
        `;
    } else {
        activeContainer.innerHTML = activeJobs.map(job => createJobCard(job)).join('');
    }
    
    // History (completed, failed)
    const historyJobs = currentJobs.filter(j => ['completed', 'failed'].includes(j.status));
    const historyContainer = document.getElementById('history-jobs-list');
    
    if (historyJobs.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>Belum ada riwayat generate</p>
            </div>
        `;
    } else {
        historyContainer.innerHTML = historyJobs.map(job => createJobCard(job)).join('');
    }
}

function createJobCard(job) {
    const inputData = job.input_data || {};
    const results = job.results || {};
    const date = new Date(job.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let previewHtml = '';
    if (results.images && results.images.length > 0) {
        previewHtml = `
            <div class="job-preview">
                ${results.images.slice(0, 3).map(url => `<img src="${url}" alt="Preview">`).join('')}
            </div>
        `;
    }
    
    let progressHtml = '';
    if (['pending', 'processing'].includes(job.status)) {
        progressHtml = `
            <div class="job-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${job.progress_percent || 0}%"></div>
                </div>
                <p class="job-step">${job.step_name || 'Menunggu...'}</p>
            </div>
        `;
    }
    
    return `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <div>
                    <div class="job-title">${inputData.product_name || 'Untitled'}</div>
                    <div class="job-date">${date}</div>
                </div>
                <span class="status-badge ${job.status}">${job.status}</span>
            </div>
            ${progressHtml}
            ${previewHtml}
        </div>
    `;
}

// ==================================
// SUBMIT JOB
// ==================================

async function submitJob() {
    // Validate
    const productInput = document.getElementById('input-product-image');
    const productName = document.getElementById('input-name').value.trim();
    
    if (!productInput.files || !productInput.files[0]) {
        showToast('Upload foto produk terlebih dahulu', 'error');
        return;
    }
    
    if (!productName) {
        showToast('Isi nama produk', 'error');
        return;
    }
    
    // Check limit
    const { data: limitData } = await supabase.rpc('check_limit', {
        p_user_id: currentUser.id
    });
    
    if (limitData && limitData.length > 0 && !limitData[0].allowed) {
        showToast('Limit harian habis! Upgrade plan untuk lebih banyak.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit-job');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengupload...';
    
    try {
        // Upload product image
        const productFile = productInput.files[0];
        const productPath = `uploads/${currentUser.id}/${Date.now()}_product.jpg`;
        
        const { error: uploadError } = await supabase.storage
            .from('results')
            .upload(productPath, productFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl: productUrl } } = supabase.storage
            .from('results')
            .getPublicUrl(productPath);
        
        // Upload model image if exists
        let modelUrl = null;
        const modelInput = document.getElementById('input-model-image');
        if (modelInput.files && modelInput.files[0]) {
            const modelFile = modelInput.files[0];
            const modelPath = `uploads/${currentUser.id}/${Date.now()}_model.jpg`;
            
            await supabase.storage.from('results').upload(modelPath, modelFile);
            
            const { data: { publicUrl } } = supabase.storage
                .from('results')
                .getPublicUrl(modelPath);
            modelUrl = publicUrl;
        }
        
        // Prepare job data
        const inputData = {
            user_id: currentUser.id,
            product_name: productName,
            price: document.getElementById('input-price').value.trim(),
            pros: document.getElementById('input-pros').value.trim(),
            style_preset: document.getElementById('input-style').value,
            custom_style: document.getElementById('input-custom-style').value.trim(),
            animation_order: document.getElementById('input-animation-order').value,
            product_image_url: productUrl,
            model_image_url: modelUrl
        };
        
        // Insert job
        const { data: job, error: insertError } = await supabase
            .from('jobs')
            .insert({
                user_id: currentUser.id,
                service: 'ugc',
                status: 'pending',
                input_data: inputData
            })
            .select()
            .single();
        
        if (insertError) throw insertError;
        
        showToast('Job berhasil dibuat! Proses akan berjalan otomatis.', 'success');
        
        // Reset form
        resetForm();
        
        // Switch to active tab
        switchTab('active');
        
        // Reload jobs
        await loadJobs();
        
    } catch (error) {
        console.error('Submit error:', error);
        showToast('Gagal submit: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Generate UGC Content';
    }
}

function resetForm() {
    document.getElementById('input-product-image').value = '';
    document.getElementById('input-model-image').value = '';
    document.getElementById('input-name').value = '';
    document.getElementById('input-price').value = '';
    document.getElementById('input-pros').value = '';
    document.getElementById('input-style').value = 'Default (Auto)';
    document.getElementById('input-custom-style').value = '';
    
    document.getElementById('preview-product').src = '';
    document.getElementById('preview-model').src = '';
    document.getElementById('upload-product').classList.remove('has-image');
    document.getElementById('upload-model').classList.remove('has-image');
}

// ==================================
// JOB MODAL
// ==================================

function openJobModal(jobId) {
    const job = currentJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const modal = document.getElementById('job-modal');
    const inputData = job.input_data || {};
    const results = job.results || {};
    
    // Header
    document.getElementById('modal-title').textContent = inputData.product_name || 'Detail Job';
    document.getElementById('modal-status').textContent = job.status;
    document.getElementById('modal-status').className = `status-badge ${job.status}`;
    
    // Progress
    const progressSection = document.getElementById('modal-progress-section');
    const resultsSection = document.getElementById('modal-results-section');
    const errorSection = document.getElementById('modal-error-section');
    
    if (['pending', 'processing'].includes(job.status)) {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        document.getElementById('modal-progress-fill').style.width = `${job.progress_percent || 0}%`;
        document.getElementById('modal-step-name').textContent = job.step_name || 'Menunggu...';
        
    } else if (job.status === 'completed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        // Images
        const imagesContainer = document.getElementById('modal-images');
        if (results.images && results.images.length > 0) {
            imagesContainer.innerHTML = results.images.map(url => 
                `<img src="${url}" onclick="window.open('${url}', '_blank')">`
            ).join('');
        } else {
            imagesContainer.innerHTML = '<p>Tidak ada gambar</p>';
        }
        
        // Videos
        const videosContainer = document.getElementById('modal-videos');
        if (results.videos && results.videos.length > 0) {
            videosContainer.innerHTML = results.videos.map(url => 
                `<video src="${url}" controls onclick="window.open('${url}', '_blank')"></video>`
            ).join('');
        } else {
            videosContainer.innerHTML = '<p>Tidak ada video</p>';
        }
        
        // Final video
        const finalVideoSection = document.getElementById('modal-final-video-section');
        if (results.final_video) {
            finalVideoSection.style.display = 'block';
            document.getElementById('modal-final-video').src = results.final_video;
        } else {
            finalVideoSection.style.display = 'none';
        }
        
        // Audio
        const audioSection = document.getElementById('modal-audio-section');
        if (results.audio) {
            audioSection.style.display = 'block';
            document.getElementById('modal-audio').src = results.audio;
        } else {
            audioSection.style.display = 'none';
        }
        
        // Script
        const scriptSection = document.getElementById('modal-script-section');
        if (results.script) {
            scriptSection.style.display = 'block';
            document.getElementById('modal-script').textContent = results.script;
        } else {
            scriptSection.style.display = 'none';
        }
        
    } else if (job.status === 'failed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        
        document.getElementById('modal-error-message').textContent = job.error_message || 'Terjadi kesalahan';
    }
    
    modal.classList.add('active');
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
}

// ==================================
// POLLING
// ==================================

function startPolling() {
    if (pollingInterval) return;
    
    pollingInterval = setInterval(async () => {
        const hasActiveJobs = currentJobs.some(j => ['pending', 'processing'].includes(j.status));
        
        if (hasActiveJobs) {
            await loadJobs();
            await loadUserStats();
        }
    }, 5000); // Poll every 5 seconds
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

// ==================================
// TABS
// ==================================

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabName}`);
    });
}

// ==================================
// TOAST
// ==================================

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================================
// EVENT LISTENERS
// ==================================

function setupEventListeners() {
    // Login button
    document.getElementById('btn-google-login').addEventListener('click', loginWithGoogle);
    
    // Logout button
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    // Submit job
    document.getElementById('btn-submit-job').addEventListener('click', submitJob);
    
    // Close modal
    document.getElementById('btn-close-modal').addEventListener('click', closeJobModal);
    document.getElementById('job-modal').addEventListener('click', (e) => {
        if (e.target.id === 'job-modal') closeJobModal();
    });
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Image uploads
    setupImageUpload('upload-product', 'input-product-image', 'preview-product');
    setupImageUpload('upload-model', 'input-model-image', 'preview-model');
    
    // Style dropdown - show/hide custom input
    document.getElementById('input-style').addEventListener('change', (e) => {
        const customGroup = document.getElementById('custom-style-group');
        customGroup.style.display = e.target.value === 'Custom (Tulis Sendiri)' ? 'block' : 'none';
    });
}

function setupImageUpload(areaId, inputId, previewId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    area.addEventListener('click', () => input.click());
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                area.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });
}

// ==================================
// START APP
// ==================================

init();
