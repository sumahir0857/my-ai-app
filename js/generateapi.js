// ============================================
// VIDEO GENERATOR API - Frontend Logic
// ============================================

// State
let pollingInterval = null;
let currentJobId = null;
let userJobs = [];
let selectedImageBase64 = null;

// Model configurations (matching backend)
const MODEL_INFO = {
    // Kling
    kling_2_5_pro: { name: "Kling 2.5 Pro", requiresImage: true, type: "i2v" },
    kling_2_6_pro: { name: "Kling 2.6 Pro", requiresImage: false, type: "t2v/i2v" },
    kling_2_1_pro: { name: "Kling 2.1 Pro", requiresImage: true, type: "i2v" },
    kling_o1_pro_i2v: { name: "Kling O1 Pro", requiresImage: true, type: "i2v" },
    kling_o1_std_i2v: { name: "Kling O1 Std", requiresImage: true, type: "i2v" },
    kling_1_6_pro: { name: "Kling 1.6 Pro", requiresImage: true, type: "i2v" },
    kling_1_6_std: { name: "Kling 1.6 Std", requiresImage: true, type: "i2v" },
    // MiniMax
    minimax_live: { name: "MiniMax Live", requiresImage: true, type: "i2v" },
    minimax_hailuo_1080p: { name: "Hailuo 1080p", requiresImage: false, type: "t2v/i2v" },
    minimax_hailuo_768p: { name: "Hailuo 768p", requiresImage: false, type: "t2v/i2v" },
    // WAN
    wan_t2v_720p: { name: "WAN T2V 720p", requiresImage: false, type: "t2v" },
    wan_t2v_1080p: { name: "WAN T2V 1080p", requiresImage: false, type: "t2v" },
    wan_i2v_720p: { name: "WAN I2V 720p", requiresImage: true, type: "i2v" },
    wan_i2v_1080p: { name: "WAN I2V 1080p", requiresImage: true, type: "i2v" },
    // Seedance
    seedance_480p: { name: "Seedance 480p", requiresImage: false, type: "t2v/i2v" },
    seedance_720p: { name: "Seedance 720p", requiresImage: false, type: "t2v/i2v" },
    seedance_1080p: { name: "Seedance 1080p", requiresImage: false, type: "t2v/i2v" },
    // LTX
    ltx_t2v: { name: "LTX T2V", requiresImage: false, type: "t2v" },
    ltx_i2v: { name: "LTX I2V", requiresImage: true, type: "i2v" },
    // RunWay
    runway_gen4: { name: "RunWay Gen4", requiresImage: true, type: "i2v" },
};

// ========================================
// INITIALIZATION
// ========================================

async function initAPIGenerator() {
    console.log('🎬 Initializing Video Generator API...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showGeneratorUI();
        await loadUserStats();
        await loadJobs();
        startPolling();
    } else {
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
        document.getElementById('user-avatar').src = user.user_metadata?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`;
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email.split('@')[0];
    }
}

// ========================================
// USER STATS
// ========================================

async function loadUserStats() {
    try {
        const { data, error } = await supabaseClient.rpc('check_api_limit');
        
        if (error) {
            console.error('Stats error:', error);
            updateStatsUI({ plan_name: 'Free', remaining: 10, daily_limit: 10 });
            return;
        }
        
        if (data && data.length > 0) {
            updateStatsUI(data[0]);
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

function updateStatsUI(stats) {
    document.getElementById('user-plan').textContent = stats.plan_name || 'Free';
    document.getElementById('user-remaining').textContent = stats.daily_limit === -1 ? '∞' : (stats.remaining || 0);
    
    const btn = document.getElementById('btn-generate');
    if (stats.remaining <= 0 && stats.daily_limit !== -1) {
        btn.disabled = true;
        btn.title = 'Limit harian habis';
    } else {
        btn.disabled = false;
        btn.title = '';
    }
}

// ========================================
// JOBS
// ========================================

async function loadJobs() {
    try {
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'api')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) {
            console.error('Load jobs error:', error);
            return;
        }
        
        userJobs = jobs || [];
        renderJobs();
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    // Active jobs
    const activeContainer = document.getElementById('active-jobs');
    if (activeJobs.length === 0) {
        activeContainer.innerHTML = '';
    } else {
        activeContainer.innerHTML = activeJobs.map(job => createJobCard(job, true)).join('');
    }
    
    // History jobs
    const historyContainer = document.getElementById('history-jobs');
    if (historyJobs.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📁</span>
                <p>Belum ada riwayat</p>
            </div>
        `;
    } else {
        historyContainer.innerHTML = historyJobs.map(job => createJobCard(job, false)).join('');
    }
}

function createJobCard(job, isActive) {
    const input = job.input_data || {};
    let results = job.results || {};
    if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch (e) { results = {}; }
    }
    
    const date = new Date(job.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
    
    const modelInfo = MODEL_INFO[input.model] || { name: input.model || 'Unknown' };
    const statusIcons = { pending: '⏳', processing: '🔄', completed: '✅', failed: '❌' };
    
    if (isActive) {
        return `
            <div class="job-card" onclick="openJobModal('${job.id}')">
                <div class="job-card-content">
                    <p class="job-prompt">${escapeHtml((input.prompt || 'Video').substring(0, 50))}...</p>
                    <div class="job-meta">
                        <span>${statusIcons[job.status]} ${job.step_name || 'Processing...'}</span>
                        <span>${modelInfo.name}</span>
                    </div>
                    <div class="progress-bar" style="margin-top: 8px; height: 4px;">
                        <div class="progress-fill" style="width: ${job.progress_percent || 0}%"></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        let thumbnail = '';
        if (results.video_url && job.status === 'completed') {
            thumbnail = `<video src="${results.video_url}" class="job-thumbnail" muted></video>`;
        } else {
            thumbnail = `<div class="job-thumbnail-placeholder">${statusIcons[job.status]}</div>`;
        }
        
        return `
            <div class="job-card" onclick="openJobModal('${job.id}')">
                ${thumbnail}
                <div class="job-card-content">
                    <p class="job-prompt">${escapeHtml((input.prompt || 'Video').substring(0, 30))}...</p>
                    <div class="job-meta">
                        <span>${modelInfo.name}</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ========================================
// MODEL SELECTION
// ========================================

function onModelChange(modelId) {
    const info = MODEL_INFO[modelId];
    const infoEl = document.getElementById('model-info');
    const imageSection = document.getElementById('image-section');
    
    if (info) {
        if (info.requiresImage) {
            infoEl.innerHTML = `⚠️ Model ini <strong>membutuhkan gambar</strong> sebagai input`;
            infoEl.className = 'model-info requires-image';
            imageSection.style.display = 'block';
        } else {
            infoEl.innerHTML = `💡 Model ini bisa digunakan <strong>tanpa gambar</strong> (Text to Video)`;
            infoEl.className = 'model-info';
            imageSection.style.display = 'block'; // Still show for optional image
        }
    } else {
        infoEl.innerHTML = '';
        imageSection.style.display = 'none';
    }
}

// ========================================
// IMAGE HANDLING
// ========================================

function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Pilih file gambar yang valid');
        return;
    }
    
    if (file.size > 10 * 1024 * 
