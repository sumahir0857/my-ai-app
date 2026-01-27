// UGC Generator Logic - v2.0 Complete

let pollingInterval = null;
let userJobs = [];

// ========================================
// INITIALIZATION
// ========================================

async function initGenerator() {
    console.log('Initializing generator...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        console.log('User is logged in');
        showGeneratorUI();
        await loadUserStats();
        await loadJobs();
        startPolling();
    } else {
        console.log('User not logged in');
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
    
    // Update user info
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
        
        const { data, error } = await supabaseClient.rpc('check_limit', {
            p_user_id: user.id
        });
        
        if (error) {
            console.error('Load stats error:', error);
            return;
        }
        
        if (data && data.length > 0) {
            const stats = data[0];
            const planEl = document.getElementById('user-plan');
            const remainingEl = document.getElementById('user-remaining');
            const animationHint = document.getElementById('animation-order-hint');
            const animationSelect = document.getElementById('input-animation-order');
            
            if (planEl) planEl.textContent = stats.plan_name || 'Free';
            if (remainingEl) {
                remainingEl.textContent = stats.daily_limit === -1 ? '∞' : stats.remaining;
            }
            
            // Free plan restrictions
            const isFree = stats.daily_limit === 1 || (stats.plan_name || '').toLowerCase() === 'free';
            
            if (animationHint) {
                if (isFree) {
                    animationHint.innerHTML = '⚠️ <strong>Free plan hanya menggunakan Grok</strong> (lebih cepat)';
                    animationHint.style.color = '#d97706';
                } else {
                    animationHint.textContent = 'VEO 3.1 menghasilkan kualitas lebih bagus tapi lebih lambat';
                    animationHint.style.color = '';
                }
            }
            
            if (animationSelect) {
                if (isFree) {
                    animationSelect.value = 'grok_first';
                    animationSelect.disabled = true;
                } else {
                    animationSelect.disabled = false;
                }
            }
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// ========================================
// LOAD JOBS
// ========================================

async function loadJobs() {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.log('No user, skipping loadJobs');
            return;
        }
        
        console.log('Loading jobs for user:', user.id);
        
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            console.error('Load jobs error:', error);
            return;
        }
        
        console.log('Loaded jobs:', jobs?.length || 0);
        userJobs = jobs || [];
        renderJobs();
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

// ========================================
// RENDER JOBS
// ========================================

function renderJobs() {
    console.log('Rendering jobs:', userJobs.length);
    
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    console.log('Active:', activeJobs.length, 'History:', historyJobs.length);
    
    // Update tab counts
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
            activeContainer.innerHTML = activeJobs.map(job => createJobCard(job)).join('');
        }
    } else {
        console.error('active-jobs container not found!');
    }
    
    // Render history
    const historyContainer = document.getElementById('history-jobs');
    if (historyContainer) {
        if (historyJobs.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📁</span>
                    <p>Belum ada riwayat</p>
                    <p class="empty-sub">Hasil generate akan muncul di sini</p>
                </div>
            `;
        } else {
            historyContainer.innerHTML = historyJobs.map(job => createJobCard(job)).join('');
        }
    } else {
        console.error('history-jobs container not found!');
    }
}

function createJobCard(job) {
    const input = job.input_data || {};
    
    // Parse results
    let results = job.results || {};
    if (typeof results === 'string') {
        try {
            results = JSON.parse(results);
        } catch (e) {
            results = {};
        }
    }
    
    const date = new Date(job.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    
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
    if (results.images && results.images.length > 0) {
        previewHtml = `
            <div class="job-preview">
                ${results.images.slice(0, 3).map(url => `<img src="${url}" alt="Preview" loading="lazy">`).join('')}
                ${results.images.length > 3 ? `<span class="more-count">+${results.images.length - 3}</span>` : ''}
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
                    <div class="job-title">${input.product_name || 'Untitled'}</div>
                    <div class="job-date">${date}</div>
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
    
    const productInput = document.getElementById('input-product-image');
    const productName = document.getElementById('input-name').value.trim();
    const generateMode = document.getElementById('input-generate-mode')?.value || 'full';
    
    if (!productInput.files || !productInput.files[0]) {
        alert('Upload foto produk terlebih dahulu');
        return;
    }
    
    if (!productName) {
        alert('Isi nama produk');
        return;
    }
    
    // Check limit
    try {
        const { data: limitData, error: limitError } = await supabaseClient.rpc('check_limit', {
            p_user_id: user.id
        });
        
        if (limitError) {
            console.error('Limit check error:', limitError);
        } else if (limitData && limitData.length > 0 && !limitData[0].allowed) {
            alert('Limit harian habis! Upgrade plan untuk lebih banyak.');
            return;
        }
    } catch (error) {
        console.error('Limit check error:', error);
    }
    
    const submitBtn = document.getElementById('btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mengupload...';
    
    try {
        // Upload product image
        const productFile = productInput.files[0];
        const productPath = `uploads/${user.id}/${Date.now()}_product.${productFile.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabaseClient.storage
            .from('results')
            .upload(productPath, productFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl: productUrl } } = supabaseClient.storage
            .from('results')
            .getPublicUrl(productPath);
        
        // Upload model image if exists
        let modelUrl = null;
        const modelInput = document.getElementById('input-model-image');
        if (modelInput.files && modelInput.files[0]) {
            const modelFile = modelInput.files[0];
            const modelPath = `uploads/${user.id}/${Date.now()}_model.${modelFile.name.split('.').pop()}`;
            
            const { error: modelUploadError } = await supabaseClient.storage
                .from('results')
                .upload(modelPath, modelFile);
            
            if (!modelUploadError) {
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('results')
                    .getPublicUrl(modelPath);
                modelUrl = publicUrl;
            }
        }
        
        // Prepare job data
        const inputData = {
            user_id: user.id,
            product_name: productName,
            price: document.getElementById('input-price').value.trim(),
            pros: document.getElementById('input-pros').value.trim(),
            style_preset: document.getElementById('input-style').value,
            custom_style: document.getElementById('input-custom-style')?.value?.trim() || '',
            animation_order: document.getElementById('input-animation-order')?.value || 'grok_first',
            generate_mode: generateMode,
            product_image_url: productUrl,
            model_image_url: modelUrl
        };
        
        console.log('Submitting job with data:', inputData);
        
        // Insert job
        const { error: insertError } = await supabaseClient
            .from('jobs')
            .insert({
                user_id: user.id,
                service: 'ugc',
                status: 'pending',
                input_data: inputData,
                total_steps: generateMode === 'images_only' ? 3 : 8
            });
        
        if (insertError) throw insertError;
        
        const modeLabel = generateMode === 'images_only' ? 'Gambar' : 'Full Pipeline';
        alert(`Job ${modeLabel} berhasil dibuat! Proses akan berjalan otomatis.`);
        
        // Reset form
        resetForm();
        
        // Switch to active tab
        switchTab('active');
        
        // Reload jobs
        await loadJobs();
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('Gagal submit: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function resetForm() {
    const form = document.getElementById('generator-form');
    if (form) form.reset();
    
    // Reset previews
    const previewProduct = document.getElementById('preview-product');
    const previewModel = document.getElementById('preview-model');
    
    if (previewProduct) {
        previewProduct.style.display = 'none';
        previewProduct.src = '';
    }
    if (previewModel) {
        previewModel.style.display = 'none';
        previewModel.src = '';
    }
    
    // Remove has-preview class
    document.querySelectorAll('.upload-box').forEach(box => {
        box.classList.remove('has-preview');
    });
}

// ========================================
// POLLING
// ========================================

function startPolling() {
    if (pollingInterval) return;
    
    pollingInterval = setInterval(async () => {
        const hasActiveJobs = userJobs.some(j => ['pending', 'processing'].includes(j.status));
        if (hasActiveJobs) {
            await loadJobs();
            await loadUserStats();
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
    console.log('Switching to tab:', tabName);
    
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
    
    console.log('Opening modal for job:', jobId);
    
    const modal = document.getElementById('job-modal');
    const input = job.input_data || {};
    
    // Parse results
    let results = job.results || {};
    if (typeof results === 'string') {
        try {
            results = JSON.parse(results);
        } catch (e) {
            console.error('Failed to parse results:', e);
            results = {};
        }
    }
    
    console.log('Parsed results:', results);
    
    // Update header
    document.getElementById('modal-title').textContent = input.product_name || 'Detail Job';
    
    const statusEl = document.getElementById('modal-status');
    const statusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal' };
    statusEl.textContent = statusLabels[job.status] || job.status;
    statusEl.className = `status-badge status-${job.status}`;
    
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        // Show progress
        if (progressSection) progressSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'none';
        
        const percent = job.progress_percent || 0;
        const progressFill = document.getElementById('modal-progress-fill');
        const progressPercent = document.getElementById('modal-progress-percent');
        const stepEl = document.getElementById('modal-step');
        const stepsEl = document.getElementById('modal-steps');
        
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (stepEl) stepEl.textContent = job.step_name || 'Menunggu...';
        if (stepsEl) stepsEl.textContent = `Step ${job.current_step || 0} / ${job.total_steps || 8}`;
        
    } else if (job.status === 'completed') {
        // Show results
        if (progressSection) progressSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        if (errorSection) errorSection.style.display = 'none';
        
        // Images
        renderResultSection('modal-images', results.images, 'image');
        
        // Videos
        renderResultSection('modal-videos', results.videos, 'video');
        
        // Final Video
        const finalVideoEl = document.getElementById('modal-final-video');
        if (finalVideoEl) {
            const section = finalVideoEl.closest('.result-section');
            if (results.final_video) {
                finalVideoEl.src = results.final_video;
                if (section) section.style.display = 'block';
            } else {
                if (section) section.style.display = 'none';
            }
        }
        
        // Audio
        const audioEl = document.getElementById('modal-audio');
        if (audioEl) {
            const section = audioEl.closest('.result-section');
            if (results.audio) {
                audioEl.src = results.audio;
                if (section) section.style.display = 'block';
            } else {
                if (section) section.style.display = 'none';
            }
        }
        
        // Script
        const scriptEl = document.getElementById('modal-script');
        if (scriptEl) {
            const section = scriptEl.closest('.result-section');
            if (results.script) {
                scriptEl.textContent = results.script;
                if (section) section.style.display = 'block';
            } else {
                if (section) section.style.display = 'none';
            }
        }
        
    } else if (job.status === 'failed') {
        // Show error
        if (progressSection) progressSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'block';
        
        const errorMsg = document.getElementById('modal-error-msg');
        if (errorMsg) errorMsg.textContent = job.error_message || 'Terjadi kesalahan tidak diketahui';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function renderResultSection(containerId, items, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const section = container.closest('.result-section');
    
    if (items && items.length > 0) {
        container.innerHTML = items.map((url, i) => {
            if (type === 'image') {
                return `
                    <div class="result-item">
                        <a href="${url}" target="_blank"><img src="${url}" alt="Result ${i+1}" loading="lazy"></a>
                        <a href="${url}" download="image_${i+1}.jpg" class="download-link" target="_blank">⬇️ Download</a>
                    </div>
                `;
            } else {
                return `
                    <div class="result-item">
                        <video src="${url}" controls preload="metadata"></video>
                        <a href="${url}" download="video_${i+1}.mp4" class="download-link" target="_blank">⬇️ Download</a>
                    </div>
                `;
            }
        }).join('');
        if (section) section.style.display = 'block';
    } else {
        if (section) section.style.display = 'none';
    }
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

// ========================================
// IMAGE UPLOAD PREVIEW
// ========================================

function setupImageUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    const uploadBox = input.closest('.upload-box') || preview.parentElement;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                if (uploadBox) uploadBox.classList.add('has-preview');
            };
            reader.readAsDataURL(file);
        } else {
            preview.src = '';
            preview.style.display = 'none';
            if (uploadBox) uploadBox.classList.remove('has-preview');
        }
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    
    initGenerator();
    
    setupImageUpload('input-product-image', 'preview-product');
    setupImageUpload('input-model-image', 'preview-model');
    
    // Form submit
    const form = document.getElementById('generator-form');
    if (form) {
        form.addEventListener('submit', submitJob);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Modal close
    const closeBtn = document.getElementById('btn-close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeJobModal);
    }
    
    const modal = document.getElementById('job-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'job-modal') closeJobModal();
        });
    }
    
    // ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeJobModal();
    });
    
    // Style dropdown
    const styleSelect = document.getElementById('input-style');
    if (styleSelect) {
        styleSelect.addEventListener('change', (e) => {
            const customGroup = document.getElementById('custom-style-group');
            if (customGroup) {
                customGroup.style.display = e.target.value === 'Custom (Tulis Sendiri)' ? 'block' : 'none';
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Login button
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.addEventListener('click', loginWithGoogle);
    }
});

// Cleanup
window.addEventListener('beforeunload', () => {
    stopPolling();
});

console.log('✅ Generator.js loaded');
