// ============================================
// TOOLS HUB - ALL-IN-ONE GENERATOR
// ============================================

// State
let currentTool = 'image';
let imageJobs = [];
let videoJobs = [];
let imageState = { base64: null, dimensions: { width: 0, height: 0 }, ratio: '1:1' };
let videoState = { base64: null, dimensions: { width: 0, height: 0 }, ratio: '16:9' };

// ============================================
// VIEWPORT FIX
// ============================================
function setViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}
setViewportHeight();
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', () => setTimeout(setViewportHeight, 100));

// ============================================
// INITIALIZATION
// ============================================
async function initToolsHub() {
    console.log('🛰️ Initializing Tools Hub...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showMainApp();
        await loadUserData();
        await loadAllJobs();
        startPolling();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    
    const user = getCurrentUser();
    if (user) {
        const avatar = user.user_metadata?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=8b5cf6&color=fff`;
        const name = user.user_metadata?.full_name || user.email?.split('@')[0];
        
        document.getElementById('sidebar-avatar').src = avatar;
        document.getElementById('sidebar-name').textContent = name;
    }
}

// ============================================
// LOAD USER DATA
// ============================================
async function loadUserData() {
    try {
        // Load image credits
        let result = await supabaseClient.rpc('check_service_limit', { p_service: 'image' });
        if (result.data?.[0]) {
            const remaining = result.data[0].daily_limit === -1 ? '∞' : result.data[0].remaining;
            document.getElementById('image-credits').textContent = remaining;
            document.getElementById('sidebar-plan').textContent = result.data[0].plan_name || 'Free';
        }
        
        // Load video credits
        result = await supabaseClient.rpc('check_service_limit', { p_service: 'video' });
        if (result.data?.[0]) {
            const remaining = result.data[0].daily_limit === -1 ? '∞' : result.data[0].remaining;
            document.getElementById('video-credits').textContent = remaining;
        }
    } catch (e) {
        console.error('Load user data error:', e);
    }
}

// ============================================
// LOAD JOBS
// ============================================
async function loadAllJobs() {
    const user = getCurrentUser();
    if (!user) return;
    
    const { data: jobs } = await supabaseClient
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    
    if (jobs) {
        imageJobs = jobs.filter(j => j.service === 'image');
        videoJobs = jobs.filter(j => j.service === 'video');
        renderHistory();
    }
}

// ============================================
// SWITCH TOOL
// ============================================
function switchTool(tool) {
    currentTool = tool;
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    
    // Update panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tool}`);
    });
    
    // Update mobile header
    const icons = { image: '🖼️', video: '🎬', ugc: '📽️' };
    const names = { image: 'Image Generator', video: 'Video Generator', ugc: 'UGC Generator' };
    document.getElementById('mobile-tool-icon').textContent = icons[tool];
    document.getElementById('mobile-tool-name').textContent = names[tool];
    
    // Update history
    renderHistory();
    
    // Close mobile sidebar
    closeMobileSidebar();
}

// ============================================
// CHAT MESSAGES
// ============================================
function addUserMessage(tool, prompt, sourceImage = null) {
    const container = document.getElementById(`${tool}-messages-container`);
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const user = getCurrentUser();
    const initial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();
    
    let sourceHtml = sourceImage ? `<img src="${sourceImage}" class="source-preview ${tool === 'video' ? 'video' : ''}" alt="Source">` : '';
    let modeHtml = sourceImage ? `<span class="mode-badge ${tool === 'video' ? 'video' : ''}">✏️ ${tool === 'video' ? 'Image to Video' : 'Edit Mode'}</span>` : '';
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message user">
            <div class="message-avatar">${initial}</div>
            <div class="message-content">
                <div class="message-bubble">${sourceHtml}${modeHtml}${escapeHtml(prompt)}</div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `);
    
    document.getElementById(`${tool}-welcome`).classList.add('hidden');
    scrollToBottom(tool);
}

function addBotLoading(tool, jobId) {
    const container = document.getElementById(`${tool}-messages-container`);
    const isVideo = tool === 'video';
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message bot" id="msg-${jobId}">
            <div class="message-avatar ${isVideo ? 'video' : ''}">
                ${isVideo ? '🎬' : '🖼️'}
            </div>
            <div class="message-content">
                <div class="message-loading">
                    <div class="loading-header">
                        <div class="typing-indicator">
                            <span class="typing-dot ${isVideo ? 'video' : ''}"></span>
                            <span class="typing-dot ${isVideo ? 'video' : ''}"></span>
                            <span class="typing-dot ${isVideo ? 'video' : ''}"></span>
                        </div>
                        <span class="loading-text">${isVideo ? 'Membuat video...' : 'Membuat gambar...'}</span>
                    </div>
                    <div class="message-progress">
                        <div class="progress-bar">
                            <div class="progress-fill ${isVideo ? 'video' : ''}" id="progress-${jobId}" style="width: 0%"></div>
                        </div>
                        <div class="progress-info">
                            <span id="progress-text-${jobId}">Memulai...</span>
                            <span class="progress-percent ${isVideo ? 'video' : ''}" id="progress-percent-${jobId}">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    scrollToBottom(tool);
}

function updateBotProgress(jobId, percent, text) {
    const bar = document.getElementById(`progress-${jobId}`);
    const textEl = document.getElementById(`progress-text-${jobId}`);
    const percentEl = document.getElementById(`progress-percent-${jobId}`);
    
    if (bar) bar.style.width = `${percent}%`;
    if (textEl) textEl.textContent = text || 'Memproses...';
    if (percentEl) percentEl.textContent = `${percent}%`;
}

function completeBotMessage(tool, jobId, mediaUrl, aspectRatio) {
    const msgEl = document.getElementById(`msg-${jobId}`);
    if (!msgEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isVideo = tool === 'video';
    
    let mediaHtml = isVideo
        ? `<video src="${mediaUrl}" class="message-video" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video>`
        : `<img src="${mediaUrl}" alt="Generated">`;
    
    msgEl.querySelector('.message-content').innerHTML = `
        <div class="message-media-container" onclick="openMediaModal('${mediaUrl}', '${tool}')">
            ${mediaHtml}
            <div class="media-overlay">
                <a href="${mediaUrl}" download class="media-action-btn" onclick="event.stopPropagation()">⬇️ Download</a>
                <button class="media-action-btn" onclick="event.stopPropagation(); useAsSource('${tool}', '${mediaUrl}')">✏️ Edit</button>
            </div>
        </div>
        <span class="message-time">${time} • ${aspectRatio}</span>
    `;
    
    scrollToBottom(tool);
}

function errorBotMessage(tool, jobId, errorMsg) {
    const msgEl = document.getElementById(`msg-${jobId}`);
    if (!msgEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isVideo = tool === 'video';
    
    msgEl.querySelector('.message-content').innerHTML = `
        <div class="message-bubble message-error">
            <p>❌ ${escapeHtml(errorMsg || 'Gagal')}</p>
            ${isVideo ? '<p class="refund-notice">💡 Kuota dikembalikan</p>' : ''}
            <button class="btn-retry" onclick="retryJob('${jobId}')">🔄 Coba Lagi</button>
        </div>
        <span class="message-time">${time}</span>
    `;
    
    scrollToBottom(tool);
}

function scrollToBottom(tool) {
    const container = document.getElementById(`${tool}-messages`);
    setTimeout(() => container.scrollTop = container.scrollHeight, 100);
}

// ============================================
// SUBMIT JOB
// ============================================
async function submitJob(tool) {
    const promptInput = document.getElementById(`${tool}-prompt`);
    const prompt = promptInput.value.trim();
    if (!prompt) return;
    
    const state = tool === 'image' ? imageState : videoState;
    const imageToSend = state.base64;
    const isEditMode = !!imageToSend;
    
    let aspectRatio = state.ratio;
    if (isEditMode) {
        aspectRatio = detectAspectRatio(state.dimensions.width, state.dimensions.height).ratio;
    }
    
    addUserMessage(tool, prompt, imageToSend);
    
    promptInput.value = '';
    promptInput.style.height = 'auto';
    document.getElementById(`btn-${tool}-send`).disabled = true;
    clearPreview(tool);
    
    try {
        const limitResult = await supabaseClient.rpc('check_service_limit', { p_service: tool });
        if (limitResult.data?.[0] && !limitResult.data[0].allowed) {
            throw new Error('Kuota habis!');
        }
        
        const inputData = { prompt: prompt.substring(0, tool === 'video' ? 500 : 1000), aspect_ratio: aspectRatio };
        if (imageToSend) inputData.image_base64 = imageToSend;
        
        const jobResult = await supabaseClient.rpc('create_service_job', {
            p_service: tool,
            p_input_data: inputData,
            p_total_steps: tool === 'video' ? 4 : 3
        });
        
        if (jobResult.error) throw jobResult.error;
        
        const result = jobResult.data?.[0];
        if (!result?.success) throw new Error(result?.message || 'Gagal');
        
        addBotLoading(tool, result.job_id);
        pollJob(tool, result.job_id);
        await loadUserData();
        
    } catch (error) {
        const tempId = 'error-' + Date.now();
        addBotLoading(tool, tempId);
        errorBotMessage(tool, tempId, error.message);
    }
}

async function pollJob(tool, jobId) {
    const poll = async () => {
        const { data: job } = await supabaseClient.from('jobs').select('*').eq('id', jobId).single();
        if (!job) return;
        
        updateBotProgress(jobId, job.progress_percent, job.step_name);
        
        if (job.status === 'completed') {
            let results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
            const mediaUrl = tool === 'video' ? results.video_url : results.image_url;
            completeBotMessage(tool, jobId, mediaUrl, results.aspect_ratio || '1:1');
            await loadAllJobs();
        } else if (job.status === 'failed') {
            errorBotMessage(tool, jobId, job.error_message);
            await loadAllJobs();
            await loadUserData();
        } else {
            setTimeout(poll, tool === 'video' ? 3000 : 2000);
        }
    };
    poll();
}

function startPolling() {
    setInterval(async () => {
        const hasActive = [...imageJobs, ...videoJobs].some(j => ['pending', 'processing'].includes(j.status));
        if (hasActive) await loadAllJobs();
    }, 5000);
}

// ============================================
// IMAGE HANDLING
// ============================================
function detectAspectRatio(w, h) {
    if (!w || !h) return { ratio: '1:1', label: 'Square' };
    const r = w / h;
    if (r > 1.5) return { ratio: '16:9', label: 'Landscape' };
    if (r > 1.1) return { ratio: '4:3', label: 'Classic' };
    if (r < 0.67) return { ratio: '9:16', label: 'Portrait' };
    if (r < 0.9) return { ratio: '3:4', label: 'Portrait' };
    return { ratio: '1:1', label: 'Square' };
}

function handleFileSelect(tool, file) {
    if (!file?.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        alert('File tidak valid atau terlalu besar');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const state = tool === 'image' ? imageState : videoState;
        state.base64 = e.target.result;
        
        const img = new Image();
        img.onload = () => {
            state.dimensions = { width: img.width, height: img.height };
            const detected = detectAspectRatio(img.width, img.height);
            showPreview(tool, state.base64, `${img.width}×${img.height}px • ${detected.ratio}`);
        };
        img.src = state.base64;
    };
    reader.readAsDataURL(file);
}

function showPreview(tool, src, info) {
    document.getElementById(`${tool}-preview-thumb`).src = src;
    document.getElementById(`${tool}-preview-size`).textContent = info;
    document.getElementById(`${tool}-preview-bar`).style.display = 'block';
    document.getElementById(`${tool}-ratio-selector`).style.display = 'none';
}

function clearPreview(tool) {
    const state = tool === 'image' ? imageState : videoState;
    state.base64 = null;
    state.dimensions = { width: 0, height: 0 };
    
    document.getElementById(`${tool}-file-input`).value = '';
    document.getElementById(`${tool}-preview-bar`).style.display = 'none';
    document.getElementById(`${tool}-ratio-selector`).style.display = 'flex';
}

function useAsSource(tool, url) {
    fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const state = tool === 'image' ? imageState : videoState;
            state.base64 = e.target.result;
            
            const img = new Image();
            img.onload = () => {
                state.dimensions = { width: img.width, height: img.height };
                const detected = detectAspectRatio(img.width, img.height);
                showPreview(tool, state.base64, `${img.width}×${img.height}px • ${detected.ratio}`);
                closeMediaModal();
                document.getElementById(`${tool}-prompt`).focus();
            };
            img.src = state.base64;
        };
        reader.readAsDataURL(blob);
    });
}

// ============================================
// HISTORY
// ============================================
function renderHistory() {
    const type = document.querySelector('.history-tab.active')?.dataset.type || 'image';
    const jobs = type === 'image' ? imageJobs : videoJobs;
    const container = document.getElementById('history-list');
    
    const completed = jobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    if (!completed.length) {
        container.innerHTML = '<div class="empty-history"><span>📁</span><p>Belum ada riwayat</p></div>';
        return;
    }
    
    container.innerHTML = completed.map(job => {
        const input = job.input_data || {};
        let results = job.results || {};
        if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
        
        const date = new Date(job.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const thumb = type === 'video' ? results.video_url : results.image_url;
        const status = job.status === 'completed' ? 'completed' : 'failed';
        
        return `
            <div class="history-item" onclick="loadHistoryItem('${type}', '${job.id}')">
                ${thumb ? `<img src="${thumb}" class="history-thumb" alt="">` : '<div class="history-thumb"></div>'}
                <div class="history-info">
                    <div class="history-prompt">${escapeHtml((input.prompt || '').substring(0, 40))}</div>
                    <div class="history-meta">
                        <span><span class="status-dot ${status}"></span>${status === 'completed' ? 'Selesai' : 'Gagal'}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadHistoryItem(type, jobId) {
    const jobs = type === 'image' ? imageJobs : videoJobs;
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'completed') return;
    
    let results = job.results;
    if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
    
    const url = type === 'video' ? results.video_url : results.image_url;
    if (url) openMediaModal(url, type);
    closeHistory();
}

// ============================================
// MODALS & SIDEBARS
// ============================================
function openMediaModal(url, type) {
    const modal = document.getElementById('media-modal');
    const img = document.getElementById('modal-image');
    const video = document.getElementById('modal-video');
    const download = document.getElementById('modal-download');
    const editBtn = document.getElementById('modal-edit');
    
    if (type === 'video') {
        img.style.display = 'none';
        video.style.display = 'block';
        video.src = url;
        video.play();
    } else {
        video.style.display = 'none';
        img.style.display = 'block';
        img.src = url;
    }
    
    download.href = url;
    editBtn.onclick = () => useAsSource(type, url);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMediaModal() {
    const modal = document.getElementById('media-modal');
    document.getElementById('modal-video').pause();
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openHistory() {
    document.getElementById('history-sidebar').classList.add('active');
    document.getElementById('history-overlay').classList.add('active');
}

function closeHistory() {
    document.getElementById('history-sidebar').classList.remove('active');
    document.getElementById('history-overlay').classList.remove('active');
}

function openMobileSidebar() {
    document.getElementById('sidebar').classList.add('mobile-open');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

function toggleSidebarCollapse() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

// ============================================
// UTILITIES
// ============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initToolsHub();
    
    // Login
    document.getElementById('btn-login-google').addEventListener('click', () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    // Tool navigation
    document.querySelectorAll('.nav-item[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!btn.disabled) switchTool(btn.dataset.tool);
        });
    });
    
    // Sidebar collapse
    document.getElementById('btn-collapse-sidebar').addEventListener('click', toggleSidebarCollapse);
    
    // Mobile sidebar
    document.getElementById('btn-open-sidebar').addEventListener('click', openMobileSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);
    
    // History
    document.getElementById('btn-mobile-history').addEventListener('click', openHistory);
    document.getElementById('btn-close-history').addEventListener('click', closeHistory);
    document.getElementById('history-overlay').addEventListener('click', closeHistory);
    
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderHistory();
        });
    });
    
    // Modal
    document.getElementById('btn-close-modal').addEventListener('click', closeMediaModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeMediaModal);
    
    // IMAGE GENERATOR
    const imagePrompt = document.getElementById('image-prompt');
    const imageSendBtn = document.getElementById('btn-image-send');
    
    imagePrompt.addEventListener('input', () => {
        imagePrompt.style.height = 'auto';
        imagePrompt.style.height = Math.min(imagePrompt.scrollHeight, 100) + 'px';
        imageSendBtn.disabled = !imagePrompt.value.trim();
    });
    
    imagePrompt.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (imagePrompt.value.trim()) submitJob('image');
        }
    });
    
    imageSendBtn.addEventListener('click', () => submitJob('image'));
    
    document.getElementById('btn-image-attach').addEventListener('click', () => {
        document.getElementById('image-file-input').click();
    });
    
    document.getElementById('image-file-input').addEventListener('change', e => {
        if (e.target.files?.[0]) handleFileSelect('image', e.target.files[0]);
    });
    
    document.getElementById('btn-remove-image-preview').addEventListener('click', () => clearPreview('image'));
    
    document.querySelectorAll('#image-ratio-selector .ratio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#image-ratio-selector .ratio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            imageState.ratio = btn.dataset.ratio;
        });
    });
    
    document.querySelectorAll('#panel-image .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            imagePrompt.value = chip.dataset.prompt;
            imagePrompt.dispatchEvent(new Event('input'));
            imagePrompt.focus();
        });
    });
    
    // VIDEO GENERATOR
    const videoPrompt = document.getElementById('video-prompt');
    const videoSendBtn = document.getElementById('btn-video-send');
    
    videoPrompt.addEventListener('input', () => {
        videoPrompt.style.height = 'auto';
        videoPrompt.style.height = Math.min(videoPrompt.scrollHeight, 100) + 'px';
        videoSendBtn.disabled = !videoPrompt.value.trim();
    });
    
    videoPrompt.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (videoPrompt.value.trim()) submitJob('video');
        }
    });
    
    videoSendBtn.addEventListener('click', () => submitJob('video'));
    
    document.getElementById('btn-video-attach').addEventListener('click', () => {
        document.getElementById('video-file-input').click();
    });
    
    document.getElementById('video-file-input').addEventListener('change', e => {
        if (e.target.files?.[0]) handleFileSelect('video', e.target.files[0]);
    });
    
    document.getElementById('btn-remove-video-preview').addEventListener('click', () => clearPreview('video'));
    
    document.querySelectorAll('#video-ratio-selector .ratio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#video-ratio-selector .ratio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            videoState.ratio = btn.dataset.ratio;
        });
    });
    
    document.querySelectorAll('#panel-video .chip').forEach(chip => {
        chip.addEventListener('click', () => {
            videoPrompt.value = chip.dataset.prompt;
            videoPrompt.dispatchEvent(new Event('input'));
            videoPrompt.focus();
        });
    });
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeMediaModal();
            closeHistory();
            closeMobileSidebar();
        }
    });
});

// Auth listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showMainApp();
        loadUserData();
        loadAllJobs();
    } else if (event === 'SIGNED_OUT') {
        showLoginScreen();
    }
});

console.log('✅ Tools Hub loaded');
