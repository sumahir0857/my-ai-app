// ============================================
// UGC Generator Logic - v3.0 SECURE VERSION
// ============================================
// Perubahan keamanan:
// 1. Tidak mengirim user_id dari client
// 2. Menggunakan RPC secure functions
// 3. Validasi dilakukan di server
// ============================================

let pollingInterval = null;
let userJobs = [];

// ========================================
// INITIALIZATION
// ========================================

async function initGenerator() {
    console.log('🔒 Initializing secure generator v3.0...');
    
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
// LOAD USER STATS (SECURE - No user_id param)
// ========================================

async function loadUserStats() {
    try {
        const user = getCurrentUser();
        if (!user) return;
        
        // ✅ SECURE: Tidak mengirim p_user_id - server ambil dari auth.uid()
        const { data, error } = await supabaseClient.rpc('check_limit');
        
        if (error) {
            console.error('❌ Load stats error:', error);
            // Fallback: tampilkan default
            updateStatsUI({ plan_name: 'Free', remaining: 0, daily_limit: 1 });
            return;
        }
        
        if (data && data.length > 0) {
            const stats = data[0];
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
    const animationHint = document.getElementById('animation-order-hint');
    const animationSelect = document.getElementById('input-animation-order');
    
    if (planEl) planEl.textContent = stats.plan_name || 'Free';
    if (remainingEl) {
        remainingEl.textContent = stats.daily_limit === -1 ? '∞' : (stats.remaining || 0);
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

// ========================================
// LOAD JOBS (SECURE - RLS akan filter otomatis)
// ========================================

async function loadJobs() {
    try {
        const user = getCurrentUser();
        if (!user) {
            console.log('⚠️ No user, skipping loadJobs');
            return;
        }
        
        console.log('📥 Loading jobs...');
        
        // ✅ SECURE: RLS akan otomatis filter berdasarkan auth.uid()
        // Tidak perlu .eq('user_id', user.id) karena RLS sudah handle
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
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
    console.log('🎨 Rendering jobs:', userJobs.length);
    
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    console.log('⚡ Active:', activeJobs.length, '📁 History:', historyJobs.length);
    
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
                    <div class="job-title">${escapeHtml(input.product_name || 'Untitled')}</div>
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
// HELPER: Escape HTML untuk mencegah XSS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// SUBMIT JOB (SECURE VERSION)
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
    
    // Validasi input
    if (!productInput.files || !productInput.files[0]) {
        alert('Upload foto produk terlebih dahulu');
        return;
    }
    
    if (!productName) {
        alert('Isi nama produk');
        return;
    }
    
    // Validasi panjang input untuk mencegah abuse
    if (productName.length > 200) {
        alert('Nama produk terlalu panjang (maksimal 200 karakter)');
        return;
    }
    
    const submitBtn = document.getElementById('btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '🔒 Memvalidasi...';
    
    try {
        // ✅ STEP 1: Check limit dulu (SECURE - tanpa user_id)
        console.log('🔍 Checking quota...');
        const { data: limitData, error: limitError } = await supabaseClient.rpc('check_limit');
        
        if (limitError) {
            console.error('❌ Limit check error:', limitError);
            throw new Error('Gagal memeriksa kuota: ' + limitError.message);
        }
        
        if (!limitData || limitData.length === 0) {
            throw new Error('Gagal mendapatkan informasi kuota');
        }
        
        const quota = limitData[0];
        console.log('📊 Quota info:', quota);
        
        if (!quota.allowed) {
            alert(`Limit harian habis! Anda sudah menggunakan ${quota.current_count} dari ${quota.daily_limit} generate hari ini.\n\nUpgrade plan untuk lebih banyak.`);
            return;
        }
        
        // ✅ STEP 2: Upload gambar
        submitBtn.textContent = '📤 Mengupload gambar...';
        
        const productFile = productInput.files[0];
        
        // Validasi ukuran file (max 10MB)
        if (productFile.size > 10 * 1024 * 1024) {
            throw new Error('Ukuran file terlalu besar (maksimal 10MB)');
        }
        
        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(productFile.type)) {
            throw new Error('Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF');
        }
        
        // Generate safe filename
        const fileExt = productFile.name.split('.').pop().toLowerCase();
        const safeFileName = `${Date.now()}_product.${fileExt}`;
        
        // ✅ Path menggunakan user.id - tapi RLS akan validasi di server
        const productPath = `uploads/${user.id}/${safeFileName}`;
        
        const { error: uploadError } = await supabaseClient.storage
            .from('results')
            .upload(productPath, productFile, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (uploadError) {
            console.error('❌ Upload error:', uploadError);
            throw new Error('Gagal upload gambar: ' + uploadError.message);
        }
        
        const { data: { publicUrl: productUrl } } = supabaseClient.storage
            .from('results')
            .getPublicUrl(productPath);
        
        // Upload model image if exists
        let modelUrl = null;
        const modelInput = document.getElementById('input-model-image');
        if (modelInput.files && modelInput.files[0]) {
            const modelFile = modelInput.files[0];
            
            // Validasi model file
            if (modelFile.size > 10 * 1024 * 1024) {
                throw new Error('Ukuran file model terlalu besar (maksimal 10MB)');
            }
            
            if (!allowedTypes.includes(modelFile.type)) {
                throw new Error('Tipe file model tidak didukung');
            }
            
            const modelExt = modelFile.name.split('.').pop().toLowerCase();
            const modelPath = `uploads/${user.id}/${Date.now()}_model.${modelExt}`;
            
            const { error: modelUploadError } = await supabaseClient.storage
                .from('results')
                .upload(modelPath, modelFile, {
                    cacheControl: '3600',
                    upsert: false
                });
            
            if (!modelUploadError) {
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('results')
                    .getPublicUrl(modelPath);
                modelUrl = publicUrl;
            }
        }
        
        // ✅ STEP 3: Create job menggunakan SECURE RPC function
        submitBtn.textContent = '🚀 Membuat job...';
        
        // ✅ SECURE: Tidak mengirim user_id - server akan ambil dari auth.uid()
        const inputData = {
            product_name: productName.substring(0, 200), // Limit panjang
            price: (document.getElementById('input-price').value || '').trim().substring(0, 100),
            pros: (document.getElementById('input-pros').value || '').trim().substring(0, 500),
            style_preset: document.getElementById('input-style').value || 'Default (Auto)',
            custom_style: (document.getElementById('input-custom-style')?.value || '').trim().substring(0, 500),
            animation_order: document.getElementById('input-animation-order')?.value || 'grok_first',
            generate_mode: generateMode,
            product_image_url: productUrl,
            model_image_url: modelUrl
            // ❌ TIDAK ADA user_id - akan diisi otomatis oleh server!
        };
        
        console.log('📦 Submitting job (secure):', { ...inputData, product_image_url: '[URL]' });
        
        // ✅ Gunakan RPC function yang secure
        const { data: jobResult, error: jobError } = await supabaseClient.rpc('create_job_secure', {
            p_service: 'ugc',
            p_input_data: inputData,
            p_total_steps: generateMode === 'images_only' ? 3 : 8
        });
        
        if (jobError) {
            console.error('❌ Create job error:', jobError);
            throw new Error('Gagal membuat job: ' + jobError.message);
        }
        
        console.log('📋 Job result:', jobResult);
        
        // Check response
        if (!jobResult || jobResult.length === 0) {
            throw new Error('Tidak ada response dari server');
        }
        
        const result = jobResult[0];
        
        if (!result.success) {
            // Server menolak (misalnya quota habis)
            alert(result.message || 'Gagal membuat job');
            return;
        }
        
        // ✅ Sukses!
        const modeLabel = generateMode === 'images_only' ? 'Gambar' : 'Full Pipeline';
        alert(`✅ Job ${modeLabel} berhasil dibuat!\n\nSisa kuota hari ini: ${result.remaining_quota}\n\nProses akan berjalan otomatis.`);
        
        // Reset form
        resetForm();
        
        // Switch to active tab
        switchTab('active');
        
        // Reload jobs dan stats
        await Promise.all([loadJobs(), loadUserStats()]);
        
    } catch (error) {
        console.error('❌ Submit error:', error);
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
    
    // Reset custom style visibility
    const customGroup = document.getElementById('custom-style-group');
    if (customGroup) customGroup.style.display = 'none';
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
            await loadUserStats();
        }
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('⏹️ Polling stopped');
    }
}

// ========================================
// TAB SWITCHING
// ========================================

function switchTab(tabName) {
    console.log('📑 Switching to tab:', tabName);
    
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
    
    console.log('📋 Opening modal for job:', jobId);
    
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
    
    // Update header
    document.getElementById('modal-title').textContent = escapeHtml(input.product_name || 'Detail Job');
    
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
            // Sanitize URL
            const safeUrl = encodeURI(url);
            
            if (type === 'image') {
                return `
                    <div class="result-item">
                        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
                            <img src="${safeUrl}" alt="Result ${i+1}" loading="lazy">
                        </a>
                        <a href="${safeUrl}" download="image_${i+1}.jpg" class="download-link" target="_blank" rel="noopener noreferrer">⬇️ Download</a>
                    </div>
                `;
            } else {
                return `
                    <div class="result-item">
                        <video src="${safeUrl}" controls preload="metadata"></video>
                        <a href="${safeUrl}" download="video_${i+1}.mp4" class="download-link" target="_blank" rel="noopener noreferrer">⬇️ Download</a>
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
            // Validasi tipe file
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                alert('Tipe file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF');
                input.value = '';
                return;
            }
            
            // Validasi ukuran
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
            };
            reader.onerror = () => {
                alert('Gagal membaca file');
                input.value = '';
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
    console.log('🚀 DOM loaded, initializing secure generator...');
    
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

// Visibility change - pause/resume polling
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopPolling();
    } else {
        const user = getCurrentUser();
        if (user) {
            startPolling();
        }
    }
});

console.log('✅ Secure Generator.js v3.0 loaded');
