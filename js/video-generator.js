// ============================================
// CHAT UI - VIDEO GENERATOR (VEO 3.1)
// ============================================

let pollingInterval = null;
let userJobs = [];
let selectedImageBase64 = null;
let selectedImageDimensions = { width: 0, height: 0 };
let currentRatio = '16:9';

// ========================================
// INITIALIZATION
// ========================================

async function initVideoGenerator() {
    console.log('🎬 Initializing Chat Video Generator (VEO 3.1)...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showChatApp();
        await loadUserStats();
        await loadJobs();
        startPolling();
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('chat-app').style.display = 'none';
}

function showChatApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('chat-app').style.display = 'flex';
    
    const user = getCurrentUser();
    if (user) {
        const avatar = user.user_metadata?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=f59e0b&color=fff`;
        const name = user.user_metadata?.full_name || user.email?.split('@')[0];
        
        document.getElementById('menu-avatar').src = avatar;
        document.getElementById('menu-name').textContent = name;
    }
}

// ========================================
// USER STATS
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
            console.error('Load stats error:', result.error);
            return;
        }
        
        if (result.data && result.data.length > 0) {
            const stats = result.data[0];
            document.getElementById('user-remaining').textContent = 
                stats.daily_limit === -1 ? '∞' : (stats.remaining || 0);
            document.getElementById('menu-plan').textContent = 
                (stats.plan_name || 'Free') + ' Plan';
        }
    } catch (error) {
        console.error('Load stats error:', error);
    }
}

// ========================================
// JOBS
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
            console.error('Load jobs error:', error);
            return;
        }
        
        userJobs = jobs || [];
        renderHistory();
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderHistory() {
    const container = document.getElementById('history-list');
    const completedJobs = userJobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    if (completedJobs.length === 0) {
        container.innerHTML = `
            <div class="empty-history">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>Belum ada riwayat video</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = completedJobs.map(job => {
        const input = job.input_data || {};
        let results = job.results || {};
        if (typeof results === 'string') {
            try { results = JSON.parse(results); } catch (e) { results = {}; }
        }
        
        const date = new Date(job.created_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        
        const mode = input.image_base64 ? '🖼️ I2V' : '✍️ T2V';
        
        let thumbHtml = '';
        if (job.status === 'completed' && results.video_url) {
            thumbHtml = `<video src="${results.video_url}" class="history-thumb" muted></video>`;
        } else {
            thumbHtml = `<div class="history-thumb-placeholder">${job.status === 'failed' ? '❌' : '🎬'}</div>`;
        }
        
        return `
            <div class="history-item" onclick="loadHistoryItem('${job.id}')">
                ${thumbHtml}
                <div class="history-info">
                    <div class="history-prompt">${escapeHtml((input.prompt || 'Video').substring(0, 40))}</div>
                    <div class="history-meta">
                        <span class="history-status">
                            <span class="status-dot ${job.status}"></span>
                            ${job.status === 'completed' ? 'Selesai' : 'Gagal'}
                        </span>
                        <span>•</span>
                        <span>${mode}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadHistoryItem(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job || job.status !== 'completed') return;
    
    let results = job.results || {};
    if (typeof results === 'string') {
        try { results = JSON.parse(results); } catch (e) { results = {}; }
    }
    
    if (results.video_url) {
        openVideoModal(results.video_url);
    }
    
    closeSidebar();
}

// ========================================
// CHAT MESSAGES
// ========================================

function addUserMessage(prompt, sourceImage = null) {
    const container = document.getElementById('messages-container');
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const user = getCurrentUser();
    const initial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();
    
    let sourceHtml = '';
    let modeLabel = '';
    
    if (sourceImage) {
        sourceHtml = `<img src="${sourceImage}" class="source-image-preview" alt="Source">`;
        modeLabel = '<span class="mode-badge video">🎬 Image to Video</span>';
    }
    
    const messageHtml = `
        <div class="message user">
            <div class="message-avatar">${initial}</div>
            <div class="message-content">
                <div class="message-bubble">
                    ${sourceHtml}
                    ${modeLabel}
                    ${escapeHtml(prompt)}
                </div>
                <span class="message-time">${time}</span>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
    
    // Hide welcome screen
    document.getElementById('welcome-screen').classList.add('hidden');
}

function addBotLoading(jobId, isImageToVideo = false) {
    const container = document.getElementById('messages-container');
    
    const modeText = isImageToVideo ? 'Menganimasikan gambar...' : 'Membuat video...';
    
    const messageHtml = `
        <div class="message bot" id="msg-${jobId}">
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"/>
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-loading">
                    <div class="loading-header">
                        <div class="typing-indicator">
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                            <span class="typing-dot"></span>
                        </div>
                        <span class="loading-text">${modeText}</span>
                    </div>
                    <div class="message-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-${jobId}" style="width: 0%"></div>
                        </div>
                        <div class="progress-info">
                            <span class="progress-text" id="progress-text-${jobId}">Memulai...</span>
                            <span class="progress-percent" id="progress-percent-${jobId}">0%</span>
                        </div>
                        <div class="progress-time-notice">
                            ⏱️ Estimasi: 2-4 menit
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

function updateBotMessage(jobId, progress, stepName) {
    const progressBar = document.getElementById(`progress-${jobId}`);
    const progressText = document.getElementById(`progress-text-${jobId}`);
    const progressPercent = document.getElementById(`progress-percent-${jobId}`);
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = stepName || 'Memproses...';
    if (progressPercent) progressPercent.textContent = `${progress}%`;
}

function completeBotMessage(jobId, videoUrl, aspectRatio, isImageToVideo = false) {
    const messageEl = document.getElementById(`msg-${jobId}`);
    if (!messageEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const modeLabel = isImageToVideo ? '🖼️→🎬' : '✍️→🎬';
    
    messageEl.querySelector('.message-content').innerHTML = `
        <div class="message-video-container" onclick="openVideoModal('${videoUrl}')">
            <video src="${videoUrl}" class="message-video" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video>
            <div class="video-overlay">
                <a href="${videoUrl}" download="orbitbot-video-${Date.now()}.mp4" class="video-action-btn" onclick="event.stopPropagation()">⬇️ Download</a>
                <button class="video-action-btn" onclick="event.stopPropagation(); openVideoModal('${videoUrl}')">▶️ Play</button>
            </div>
        </div>
        <span class="message-time">${time} • ${modeLabel} • ${aspectRatio} • VEO 3.1</span>
    `;
    
    scrollToBottom();
}

function errorBotMessage(jobId, errorMsg) {
    const messageEl = document.getElementById(`msg-${jobId}`);
    if (!messageEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.querySelector('.message-content').innerHTML = `
        <div class="message-bubble message-error">
            <p>❌ ${escapeHtml(errorMsg || 'Gagal membuat video')}</p>
            <p class="refund-notice">💡 Kuota dikembalikan otomatis</p>
            <div class="error-actions">
                <button class="btn-retry" onclick="retryFromError('${jobId}')">🔄 Coba Lagi</button>
            </div>
        </div>
        <span class="message-time">${time}</span>
    `;
    
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function clearChat() {
    document.getElementById('messages-container').innerHTML = '';
    document.getElementById('welcome-screen').classList.remove('hidden');
}

// ========================================
// SUBMIT & POLLING
// ========================================

async function submitPrompt() {
    const promptInput = document.getElementById('input-prompt');
    const prompt = promptInput.value.trim();
    
    if (!prompt) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    // Simpan nilai ke variabel lokal SEBELUM clear
    const imageToSend = selectedImageBase64;
    const dimensionsToUse = { ...selectedImageDimensions };
    const isImageToVideo = !!imageToSend;
    
    console.log('📤 Submit Mode:', isImageToVideo ? 'IMAGE-TO-VIDEO' : 'TEXT-TO-VIDEO');
    
    // Determine aspect ratio
    let aspectRatio = currentRatio;
    if (isImageToVideo) {
        const detected = detectAspectRatio(dimensionsToUse.width, dimensionsToUse.height);
        aspectRatio = detected.ratio;
        console.log('📐 Detected ratio from image:', aspectRatio);
    }
    
    // Add user message
    addUserMessage(prompt, imageToSend);
    
    // Clear input dan preview SETELAH menyimpan data
    promptInput.value = '';
    promptInput.style.height = 'auto';
    document.getElementById('btn-send').disabled = true;
    clearImagePreview();
    
    try {
        // Check limit
        let limitResult = await supabaseClient.rpc('check_service_limit', {
            p_service: 'video'
        });
        
        if (limitResult.error && limitResult.error.message.includes('does not exist')) {
            limitResult = await supabaseClient.rpc('check_limit');
        }
        
        if (limitResult.error) throw new Error('Gagal cek kuota');
        
        const quota = limitResult.data?.[0];
        if (quota && !quota.allowed) {
            throw new Error(`Kuota habis! (${quota.current_count}/${quota.daily_limit})`);
        }
        
        // Prepare input
        const inputData = {
            prompt: prompt.substring(0, 500),
            aspect_ratio: aspectRatio
        };
        
        // Tambahkan gambar jika mode image-to-video
        if (isImageToVideo && imageToSend) {
            inputData.image_base64 = imageToSend;
            console.log('✅ Image base64 added to inputData');
        }
        
        console.log('📦 Input data keys:', Object.keys(inputData));
        
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
        
        console.log('✅ Job created:', result.job_id, '| Mode:', isImageToVideo ? 'I2V' : 'T2V');
        
        // Add loading message
        addBotLoading(result.job_id, isImageToVideo);
        
        // Start polling for this job
        pollJob(result.job_id, isImageToVideo);
        
        await loadUserStats();
        
    } catch (error) {
        console.error('❌ Submit error:', error);
        
        // Show error as bot message
        const tempId = 'error-' + Date.now();
        addBotLoading(tempId, isImageToVideo);
        errorBotMessage(tempId, error.message);
    }
}

async function pollJob(jobId, isImageToVideo = false) {
    const poll = async () => {
        try {
            const { data: job, error } = await supabaseClient
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();
            
            if (error) throw error;
            if (!job) return;
            
            updateBotMessage(jobId, job.progress_percent, job.step_name);
            
            if (job.status === 'completed') {
                let results = job.results || {};
                if (typeof results === 'string') {
                    try { results = JSON.parse(results); } catch (e) { results = {}; }
                }
                
                completeBotMessage(jobId, results.video_url, results.aspect_ratio || '16:9', isImageToVideo);
                await loadJobs();
                
            } else if (job.status === 'failed') {
                errorBotMessage(jobId, job.error_message);
                await loadJobs();
                await loadUserStats(); // Reload to show refunded quota
                
            } else {
                // Continue polling (longer interval for video)
                setTimeout(poll, 3000);
            }
            
        } catch (error) {
            console.error('Poll error:', error);
            setTimeout(poll, 5000);
        }
    };
    
    poll();
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

// ========================================
// IMAGE HANDLING
// ========================================

function detectAspectRatio(width, height) {
    if (width === 0 || height === 0) return { ratio: '16:9', label: 'Landscape' };
    
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
        
        const img = new Image();
        img.onload = () => {
            selectedImageDimensions = { width: img.width, height: img.height };
            
            const detected = detectAspectRatio(img.width, img.height);
            console.log('📷 Image loaded:', img.width, 'x', img.height, '| Ratio:', detected.ratio);
            
            showImagePreview(selectedImageBase64, `${img.width}×${img.height}px • ${detected.ratio}`);
        };
        img.src = selectedImageBase64;
    };
    reader.readAsDataURL(file);
}

function showImagePreview(src, sizeText) {
    const previewBar = document.getElementById('image-preview-bar');
    const previewThumb = document.getElementById('preview-thumb');
    const previewSize = document.getElementById('preview-size');
    
    previewThumb.src = src;
    previewSize.textContent = sizeText;
    previewBar.style.display = 'block';
    
    // Hide ratio selector in image-to-video mode (auto-detect)
    document.getElementById('ratio-selector').style.display = 'none';
    document.getElementById('input-prompt').placeholder = 'Deskripsikan gerakan atau animasi yang diinginkan...';
    
    console.log('✅ Image preview shown - Image-to-Video mode activated');
}

function clearImagePreview() {
    selectedImageBase64 = null;
    selectedImageDimensions = { width: 0, height: 0 };
    
    document.getElementById('input-image').value = '';
    document.getElementById('image-preview-bar').style.display = 'none';
    document.getElementById('ratio-selector').style.display = 'flex';
    document.getElementById('input-prompt').placeholder = 'Deskripsikan video yang ingin dibuat...';
    
    console.log('🗑️ Image preview cleared - Text-to-Video mode activated');
}

function retryFromError(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (job && job.input_data) {
        document.getElementById('input-prompt').value = job.input_data.prompt || '';
        document.getElementById('input-prompt').focus();
        document.getElementById('btn-send').disabled = false;
    }
}

// ========================================
// MODALS & SIDEBARS
// ========================================

function openVideoModal(videoUrl) {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    const modalDownload = document.getElementById('modal-download');
    
    modalVideo.src = videoUrl;
    modalDownload.href = videoUrl;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Auto play
    modalVideo.play();
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video');
    
    modalVideo.pause();
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function openSidebar() {
    document.getElementById('history-sidebar').classList.add('active');
    document.getElementById('sidebar-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('history-sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleDropdown() {
    document.getElementById('dropdown-menu').classList.toggle('active');
}

// ========================================
// UTILITIES
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initVideoGenerator();
    
    // Login
    document.getElementById('btn-login-google').addEventListener('click', () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/video-generator.html'
            }
        });
    });
    
    // Prompt input
    const promptInput = document.getElementById('input-prompt');
    const sendBtn = document.getElementById('btn-send');
    
    promptInput.addEventListener('input', () => {
        // Auto resize
        promptInput.style.height = 'auto';
        promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + 'px';
        
        // Enable/disable send button
        sendBtn.disabled = !promptInput.value.trim();
    });
    
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (promptInput.value.trim()) {
                submitPrompt();
            }
        }
    });
    
    sendBtn.addEventListener('click', submitPrompt);
    
    // Image upload
    const imageInput = document.getElementById('input-image');
    
    document.getElementById('btn-attach').addEventListener('click', () => {
        imageInput.click();
    });
    
    imageInput.addEventListener('change', (e) => {
        if (e.target.files?.[0]) {
            handleImageSelect(e.target.files[0]);
        }
    });
    
    document.getElementById('btn-remove-preview').addEventListener('click', clearImagePreview);
    
    // Drag & drop support for chat area
    const chatMessages = document.getElementById('chat-messages');
    
    chatMessages.addEventListener('dragover', (e) => {
        e.preventDefault();
        chatMessages.classList.add('drag-over');
    });
    
    chatMessages.addEventListener('dragleave', () => {
        chatMessages.classList.remove('drag-over');
    });
    
    chatMessages.addEventListener('drop', (e) => {
        e.preventDefault();
        chatMessages.classList.remove('drag-over');
        
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageSelect(file);
        }
    });
    
    // Ratio buttons
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRatio = btn.dataset.ratio;
            console.log('📐 Ratio selected:', currentRatio);
        });
    });
    
    // Suggestion chips
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            promptInput.value = chip.dataset.prompt;
            promptInput.dispatchEvent(new Event('input'));
            promptInput.focus();
        });
    });
    
    // History sidebar
    document.getElementById('btn-history').addEventListener('click', openSidebar);
    document.getElementById('btn-close-history').addEventListener('click', closeSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
    
    // Dropdown menu
    document.getElementById('btn-menu').addEventListener('click', toggleDropdown);
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#btn-menu') && !e.target.closest('#dropdown-menu')) {
            document.getElementById('dropdown-menu').classList.remove('active');
        }
    });
    
    // Dropdown actions
    document.getElementById('btn-clear-chat').addEventListener('click', () => {
        if (confirm('Hapus semua chat?')) {
            clearChat();
            toggleDropdown();
        }
    });
    
    document.getElementById('btn-logout').addEventListener('click', () => {
        logout();
        toggleDropdown();
    });
    
    // Video modal
    document.getElementById('btn-close-modal').addEventListener('click', closeVideoModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeVideoModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            closeSidebar();
        }
    });
});

// Auth state listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showChatApp();
        loadUserStats();
        loadJobs();
        startPolling();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showLoginScreen();
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

console.log('✅ Chat Video Generator (VEO 3.1) loaded');
