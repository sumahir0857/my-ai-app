// ============================================
// VIDEO API Generator Logic - v1.1
// ============================================
// Menggunakan sistem kredit (bukan kuota harian)
// Terintegrasi dengan Space HF sebagai worker
// Service: 'videoapi'
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;
let modelPricing = {};

// Model credit costs
const MODEL_CREDITS = {
    'kling-2-5-pro': { c5: 15, c10: 28, type: 'image_to_video', showTail: true },
    'kling-1-6-pro': { c5: 10, c10: 18, type: 'image_to_video', showTail: true },
    'kling-1-6-std': { c5: 6, c10: 11, type: 'image_to_video', showTail: true },
    'minimax-live': { c5: 18, c10: 18, type: 'minimax_live', showTail: false },
    'minimax-hailuo-1080p': { c5: 20, c10: 20, type: 'minimax_hailuo', showTail: false },
    'minimax-hailuo-768p': { c5: 12, c10: 12, type: 'minimax_hailuo', showTail: false },
    'wan-i2v-720p': { c5: 8, c10: 15, type: 'wan_i2v', showTail: false },
    'wan-t2v-720p': { c5: 6, c10: 11, type: 'wan_t2v', showTail: false },
    'seedance-720p': { c5: 8, c10: 15, type: 'seedance', showTail: false },
    'seedance-1080p': { c5: 14, c10: 26, type: 'seedance', showTail: false },
    'ltx-t2v': { c5: 8, c10: 15, type: 'ltx_t2v', showTail: false },
    'runway-gen4': { c5: 20, c10: 35, type: 'runway', showTail: false },
    'vfx': { c5: 5, c10: 5, type: 'vfx', showTail: false }
};

// ========================================
// INITIALIZATION
// ========================================

async function initGenerator() {
    console.log('🎬 Initializing Video API Generator v1.1...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        console.log('✅ User is logged in');
        showGeneratorUI();
        await loadUserCredits();
        await loadJobs();
        await loadPricing();
        startPolling();
    } else {
        console.log('⚠️ User not logged in');
        showLoginUI();
    }
}

function showLoginUI() {
    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    
    if (loginSection) loginSection.style.display = 'flex';
    if (generatorSection) generatorSection.style.display = 'none';
}

function showGeneratorUI() {
    const loginSection = document.getElementById('login-section');
    const generatorSection = document.getElementById('generator-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (generatorSection) generatorSection.style.display = 'block';
    
    const user = getCurrentUser();
    if (user) {
        const avatar = document.getElementById('user-avatar');
        const name = document.getElementById('user-name');
        
        if (avatar) {
            avatar.src = user.user_metadata?.avatar_url || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`;
        }
        if (name) {
            name.textContent = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        }
    }
}

// ========================================
// LOAD USER CREDITS
// ========================================

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
            // No record - create one
            const { data: newData } = await supabaseClient
                .from('user_credits')
                .insert({ user_id: user.id, balance: 0 })
                .select()
                .single();
            
            userCredits = 0;
        } else if (data) {
            userCredits = data.balance || 0;
            updateCreditsUI(data);
        }
        
        console.log('💰 User credits:', userCredits);
        
    } catch (error) {
        console.error('❌ Load credits error:', error);
    }
}

function updateCreditsUI(data) {
    const creditsEl = document.getElementById('user-credits');
    const statCredits = document.getElementById('stat-credits');
    const statUsed = document.getElementById('stat-used');
    const statRefunded = document.getElementById('stat-refunded');
    const modalCredits = document.getElementById('modal-current-credits');
    
    if (creditsEl) creditsEl.textContent = data?.balance || 0;
    if (statCredits) statCredits.textContent = data?.balance || 0;
    if (statUsed) statUsed.textContent = data?.total_used || 0;
    if (statRefunded) statRefunded.textContent = data?.total_refunded || 0;
    if (modalCredits) modalCredits.textContent = `${data?.balance || 0} kredit`;
    
    userCredits = data?.balance || 0;
}

// ========================================
// LOAD PRICING
// ========================================

async function loadPricing() {
    try {
        const { data, error } = await supabaseClient
            .from('video_model_pricing')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        
        if (data) {
            modelPricing = {};
            data.forEach(m => {
                modelPricing[m.id] = m;
            });
            renderPricingTab(data);
        }
    } catch (error) {
        console.error('❌ Load pricing error:', error);
    }
}

function renderPricingTab(models) {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;
    
    grid.innerHTML = models.map(m => `
        <div class="pricing-card ${m.category}">
            <div class="pricing-header">
                <h4>${escapeHtml(m.model_name)}</h4>
                <span class="pricing-category">${m.category}</span>
            </div>
            <div class="pricing-body">
                <div class="pricing-credits">
                    <span class="credits-5s">5s: <strong>${m.credits_5s || m.base_credits}</strong> 🪙</span>
                    ${m.credits_10s ? `<span class="credits-10s">10s: <strong>${m.credits_10s}</strong> 🪙</span>` : ''}
                </div>
                <p class="pricing-desc">${escapeHtml(m.description || '')}</p>
            </div>
        </div>
    `).join('');
}

// ========================================
// LOAD PACKAGES
// ========================================

async function loadPackages() {
    try {
        const { data, error } = await supabaseClient
            .from('credit_packages')
            .select('*')
            .eq('is_active', true)
            .order('display_order');
        
        if (data) {
            renderPackages(data);
        }
    } catch (error) {
        console.error('❌ Load packages error:', error);
    }
}

function renderPackages(packages) {
    const grid = document.getElementById('packages-grid');
    if (!grid) return;
    
    grid.innerHTML = packages.map(p => `
        <div class="package-card ${p.is_popular ? 'popular' : ''}" onclick="buyPackage('${p.id}')">
            ${p.is_popular ? '<span class="popular-badge">POPULAR</span>' : ''}
            <h4>${escapeHtml(p.name)}</h4>
            <div class="package-credits">${p.credits} kredit</div>
            ${p.bonus_credits > 0 ? `<div class="package-bonus">+${p.bonus_credits} bonus</div>` : ''}
            <div class="package-price">Rp ${p.price.toLocaleString('id-ID')}</div>
        </div>
    `).join('');
}

function openCreditsModal() {
    loadPackages();
    document.getElementById('credits-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCreditsModal() {
    document.getElementById('credits-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function buyPackage(packageId) {
    // TODO: Integrate with Midtrans payment
    alert(`Fitur pembelian kredit akan segera hadir!\n\nPaket: ${packageId}`);
}

// ========================================
// LOAD JOBS
// ========================================

async function loadJobs() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        console.log('📥 Loading video jobs...');
        
        // ✅ UPDATED: Changed from 'video' to 'videoapi'
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'videoapi')  // ← CHANGED FROM 'video' TO 'videoapi'
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('❌ Load jobs error:', error);
            return;
        }
        
        console.log('✅ Loaded jobs:', jobs?.length || 0);
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
    
    // Update counts
    const activeCount = document.getElementById('active-count');
    const historyCount = document.getElementById('history-count');
    if (activeCount) activeCount.textContent = activeJobs.length;
    if (historyCount) historyCount.textContent = historyJobs.length;
    
    // Render active
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
    
    const modelName = MODEL_CREDITS[input.model_id]?.type || input.model_id || 'Unknown';
    const creditsUsed = input.credits_used || 0;
    
    let progressHtml = '';
    if (['pending', 'processing'].includes(job.status)) {
        const percent = job.progress_percent || 0;
        progressHtml = `
            <div class="job-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <p class="progress-step">${job.step_name || 'Menunggu...'} (${percent}%)</p>
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
    
    const statusLabels = {
        pending: 'Menunggu',
        processing: 'Diproses',
        completed: 'Selesai',
        failed: 'Gagal'
    };
    
    return `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <div class="job-info">
                    <div class="job-title">${escapeHtml(input.model_id || 'Video Job')}</div>
                    <div class="job-meta">
                        <span class="job-credits">🪙 ${creditsUsed}</span>
                        <span class="job-date">${date}</span>
                    </div>
                </div>
                <span class="status-badge status-${job.status}">${statusLabels[job.status] || job.status}</span>
            </div>
            ${progressHtml}
            ${previewHtml}
        </div>
    `;
}

// ========================================
// SUBMIT JOB
// ========================================

async function submitJob(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const modelId = document.getElementById('input-model').value;
    const prompt = document.getElementById('input-prompt').value.trim();
    const duration = parseInt(document.getElementById('input-duration').value);
    
    if (!prompt) {
        alert('Isi deskripsi video terlebih dahulu');
        return;
    }
    
    // Calculate credits
    const modelConfig = MODEL_CREDITS[modelId];
    if (!modelConfig) {
        alert('Model tidak valid');
        return;
    }
    
    const requiredCredits = duration <= 5 ? modelConfig.c5 : modelConfig.c10;
    
    if (userCredits < requiredCredits) {
        alert(`Kredit tidak mencukupi!\n\nDibutuhkan: ${requiredCredits} kredit\nSaldo Anda: ${userCredits} kredit\n\nSilakan beli kredit terlebih dahulu.`);
        openCreditsModal();
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '🔒 Memvalidasi...';
    
    try {
        // Step 1: Deduct credits
        submitBtn.innerHTML = '💰 Memotong kredit...';
        
        const { data: deductResult, error: deductError } = await supabaseClient
            .rpc('deduct_user_credits', {
                p_user_id: user.id,
                p_amount: requiredCredits,
                p_model_name: modelId,
                p_description: `Video: ${modelId} (${duration}s)`
            });
        
        if (deductError) {
            throw new Error('Gagal memotong kredit: ' + deductError.message);
        }
        
        if (!deductResult?.success) {
            throw new Error(deductResult?.error || 'Kredit tidak mencukupi');
        }
        
        userCredits = deductResult.balance_after;
        updateCreditsUI({ balance: userCredits });
        
        console.log('💰 Credits deducted. New balance:', userCredits);
        
        // Step 2: Upload image if exists
        let imageBase64 = null;
        let imageTailBase64 = null;
        
        const imageInput = document.getElementById('input-image');
        if (imageInput.files && imageInput.files[0]) {
            submitBtn.innerHTML = '📤 Mengupload gambar...';
            imageBase64 = await fileToBase64(imageInput.files[0]);
        }
        
        const imageTailInput = document.getElementById('input-image-tail');
        if (imageTailInput.files && imageTailInput.files[0]) {
            imageTailBase64 = await fileToBase64(imageTailInput.files[0]);
        }
        
        // Step 3: Create job
        submitBtn.innerHTML = '🚀 Membuat job...';
        
        const inputData = {
            model_id: modelId,
            prompt: prompt.substring(0, 1000),
            negative_prompt: (document.getElementById('input-negative').value || '').trim().substring(0, 500),
            duration: duration,
            credits_used: requiredCredits,
            user_id: user.id,
            settings: {
                aspect_ratio: document.getElementById('input-aspect').value,
                cfg_scale: parseFloat(document.getElementById('input-cfg').value),
                seed: parseInt(document.getElementById('input-seed').value),
                image: imageBase64,
                image_tail: imageTailBase64
            }
        };
        
        // ✅ UPDATED: Changed from 'video' to 'videoapi'
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .insert({
                user_id: user.id,
                service: 'videoapi',  // ← CHANGED FROM 'video' TO 'videoapi'!
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
            // Refund credits if job creation fails
            await supabaseClient.rpc('refund_user_credits', {
                p_user_id: user.id,
                p_amount: requiredCredits,
                p_reason: 'Job creation failed'
            });
            throw new Error('Gagal membuat job: ' + jobError.message);
        }
        
        console.log('✅ Job created:', job.id);
        
        alert(`✅ Job berhasil dibuat!\n\nModel: ${modelId}\nKredit: ${requiredCredits}\nSisa saldo: ${userCredits}\n\nProses akan berjalan otomatis di background.`);
        
        // Reset form
        resetForm();
        
        // Switch to active tab
        switchTab('active');
        
        // Reload jobs
        await loadJobs();
        
    } catch (error) {
        console.error('❌ Submit error:', error);
        alert('Gagal submit: ' + (error.message || 'Terjadi kesalahan'));
        // Reload credits to ensure UI is in sync
        await loadUserCredits();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

function resetForm() {
    const form = document.getElementById('generator-form');
    if (form) form.reset();
    
    // Reset previews
    ['preview-image', 'preview-image-tail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
            el.src = '';
        }
    });
    
    ['btn-remove-image', 'btn-remove-image-tail'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    document.querySelectorAll('.upload-box').forEach(box => {
        box.classList.remove('has-preview');
    });
    
    updateEstimatedCredits();
}

// ========================================
// UI HELPERS
// ========================================

function updateEstimatedCredits() {
    const modelId = document.getElementById('input-model').value;
    const duration = parseInt(document.getElementById('input-duration').value);
    const modelConfig = MODEL_CREDITS[modelId];
    
    if (modelConfig) {
        const credits = duration <= 5 ? modelConfig.c5 : modelConfig.c10;
        document.getElementById('estimated-credits').textContent = credits;
        document.getElementById('total-credits').textContent = credits;
        
        // Show/hide tail image
        const tailGroup = document.getElementById('group-image-tail');
        if (tailGroup) {
            tailGroup.style.display = modelConfig.showTail ? '' : 'none';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// POLLING
// ========================================

function startPolling() {
    if (pollingInterval) return;
    
    console.log('🔄 Starting polling...');
    
    pollingInterval = setInterval(async () => {
        const hasActiveJobs = userJobs.some(j => ['pending', 'processing'].includes(j.status));
        if (hasActiveJobs) {
            await loadJobs();
            await loadUserCredits(); // Also refresh credits (for refunds)
        }
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
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
    
    document.getElementById('modal-title').textContent = input.model_id || 'Detail Job';
    
    const statusEl = document.getElementById('modal-status');
    const statusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal' };
    statusEl.textContent = statusLabels[job.status] || job.status;
    statusEl.className = `status-badge status-${job.status}`;
    
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        const percent = job.progress_percent || 0;
        document.getElementById('modal-progress-fill').style.width = `${percent}%`;
        document.getElementById('modal-progress-percent').textContent = `${percent}%`;
        document.getElementById('modal-step').textContent = job.step_name || 'Menunggu...';
        document.getElementById('modal-credits-used').textContent = `${input.credits_used || 0} kredit digunakan`;
        
    } else if (job.status === 'completed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        const videoUrl = results.video_url;
        if (videoUrl) {
            document.getElementById('modal-video').src = videoUrl;
            document.getElementById('modal-download').href = videoUrl;
        }
        
        document.getElementById('modal-model').textContent = input.model_id || 'N/A';
        document.getElementById('modal-credits-final').textContent = `${input.credits_used || 0} kredit`;
        
    } else if (job.status === 'failed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        
        document.getElementById('modal-error-msg').textContent = job.error_message || 'Terjadi kesalahan tidak diketahui';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeJobModal() {
    document.getElementById('job-modal').classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// IMAGE UPLOAD
// ========================================

function setupImageUpload(inputId, previewId, removeBtnId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeBtnId);
    
    if (!input || !preview) return;
    
    const uploadBox = input.closest('.upload-box');
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file terlalu besar (maksimal 10MB)');
                input.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
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

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 DOM loaded, initializing...');
    
    initGenerator();
    
    // Image uploads
    setupImageUpload('input-image', 'preview-image', 'btn-remove-image');
    setupImageUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    
    // Form submit
    const form = document.getElementById('generator-form');
    if (form) form.addEventListener('submit', submitJob);
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Model change
    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateEstimatedCredits);
    }
    
    // Duration change
    const durationSelect = document.getElementById('input-duration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updateEstimatedCredits);
    }
    
    // CFG slider
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', (e) => {
            document.getElementById('cfg-value').textContent = e.target.value;
        });
    }
    
    // Modal close
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeJobModal);
    
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'job-modal') closeJobModal();
        });
    }
    
    // Credits modal
    const creditsModal = document.getElementById('credits-modal');
    if (creditsModal) {
        creditsModal.addEventListener('click', (e) => {
            if (e.target.id === 'credits-modal') closeCreditsModal();
        });
    }
    
    // Buy credits button
    const buyBtn = document.getElementById('btn-buy-credits');
    if (buyBtn) buyBtn.addEventListener('click', openCreditsModal);
    
    // Logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    // Login
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) loginBtn.addEventListener('click', loginWithGoogle);
    
    // ESC to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeJobModal();
            closeCreditsModal();
        }
    });
    
    // Initial UI update
    updateEstimatedCredits();
});

// Cleanup
window.addEventListener('beforeunload', stopPolling);

// Visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopPolling();
    } else if (getCurrentUser()) {
        startPolling();
    }
});

console.log('✅ Video API Generator.js v1.1 loaded');
