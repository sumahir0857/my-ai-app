// ============================================
// CHAT UI - IMAGE GENERATOR
// ============================================

let pollingInterval = null;
let userJobs = [];
let selectedImageBase64 = null;
let selectedImageDimensions = { width: 0, height: 0 };
let currentRatio = '1:1';
let chatMessages = [];

// ========================================
// INITIALIZATION
// ========================================

async function initImageGenerator() {
    console.log('🚀 Initializing Chat Image Generator...');
    
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
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=6366f1&color=fff`;
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
            p_service: 'image'
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
            .eq('service', 'image')
            .order('created_at', { ascending: false })
            .limit(30);
        
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
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                <p>Belum ada riwayat</p>
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
        
        const thumb = results.image_url || '';
        
        return `
            <div class="history-item" onclick="loadHistoryItem('${job.id}')">
                ${thumb ? `<img src="${thumb}" class="history-thumb" alt="Thumbnail">` : 
                    '<div class="history-thumb"></div>'}
                <div class="history-info">
                    <div class="history-prompt">${escapeHtml((input.prompt || 'Image').substring(0, 50))}</div>
                    <div class="history-meta">
                        <span class="history-status">
                            <span class="status-dot ${job.status}"></span>
                            ${job.status === 'completed' ? 'Selesai' : 'Gagal'}
                        </span>
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
    
    if (results.image_url) {
        openImageModal(results.image_url);
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
    if (sourceImage) {
        sourceHtml = `<img src="${sourceImage}" class="source-image-preview" alt="Source">`;
    }
    
    const messageHtml = `
        <div class="message user">
            <div class="message-avatar">${initial}</div>
            <div class="message-content">
                <div class="message-bubble">
                    ${sourceHtml}
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

function addBotLoading(jobId) {
    const container = document.getElementById('messages-container');
    
    const messageHtml = `
        <div class="message bot" id="msg-${jobId}">
            <div class="message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                </svg>
            </div>
            <div class="message-content">
                <div class="message-loading">
                    <div class="typing-indicator">
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                        <span class="typing-dot"></span>
                    </div>
                    <span class="loading-text">Membuat gambar...</span>
                </div>
                <div class="message-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-${jobId}" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="progress-text-${jobId}">Memulai...</div>
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
    
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${stepName || 'Memproses...'} (${progress}%)`;
}

function completeBotMessage(jobId, imageUrl, aspectRatio) {
    const messageEl = document.getElementById(`msg-${jobId}`);
    if (!messageEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.querySelector('.message-content').innerHTML = `
        <div class="message-image-container" onclick="openImageModal('${imageUrl}')">
            <img src="${imageUrl}" class="message-image" alt="Generated Image">
            <div class="image-overlay">
                <a href="${imageUrl}" download="orbitbot-${Date.now()}.webp" class="img-action-btn" onclick="event.stopPropagation()">⬇️ Download</a>
                <button class="img-action-btn" onclick="event.stopPropagation(); useAsSource('${imageUrl}')">✏️ Edit</button>
            </div>
        </div>
        <span class="message-time">${time} • ${aspectRatio}</span>
    `;
    
    scrollToBottom();
}

function errorBotMessage(jobId, errorMsg) {
    const messageEl = document.getElementById(`msg-${jobId}`);
    if (!messageEl) return;
    
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    messageEl.querySelector('.message-content').innerHTML = `
        <div class="message-bubble message-error">
            <p>❌ ${escapeHtml(errorMsg || 'Gagal membuat gambar')}</p>
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
    
    // Add user message
    addUserMessage(prompt, selectedImageBase64);
    
    // Clear input
    promptInput.value = '';
    promptInput.style.height = 'auto';
    document.getElementById('btn-send').disabled = true;
    
    // Determine aspect ratio
    let aspectRatio = currentRatio;
    if (selectedImageBase64) {
        const detected = detectAspectRatio(selectedImageDimensions.width, selectedImageDimensions.height);
        aspectRatio = detected.ratio;
    }
    
    // Clear preview
    clearImagePreview();
    
    try {
        // Check limit
        let limitResult = await supabaseClient.rpc('check_service_limit', {
            p_service: 'image'
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
        
        // Add loading message
        addBotLoading(result.job_id);
        
        // Start polling for this job
        pollJob(result.job_id);
        
        await loadUserStats();
        
    } catch (error) {
        console.error('Submit error:', error);
        
        // Show error as bot message
        const tempId = 'error-' + Date.now();
        addBotLoading(tempId);
        errorBotMessage(tempId, error.message);
    }
}

async function pollJob(jobId) {
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
                
                completeBotMessage(jobId, results.image_url, results.aspect_ratio || '1:1');
                await loadJobs();
                
            } else if (job.status === 'failed') {
                errorBotMessage(jobId, job.error_message);
                await loadJobs();
                await loadUserStats();
                
            } else {
                // Continue polling
                setTimeout(poll, 2000);
            }
            
        } catch (error) {
            console.error('Poll error:', error);
            setTimeout(poll, 3000);
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
            showImagePreview(selectedImageBase64, `${img.width}×${img.height}px`);
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
    
    // Hide ratio selector in edit mode
    document.getElementById('ratio-selector').style.display = 'none';
    document.getElementById('input-prompt').placeholder = 'Jelaskan perubahan yang ingin dilakukan...';
}

function clearImagePreview() {
    selectedImageBase64 = null;
    selectedImageDimensions = { width: 0, height: 0 };
    
    document.getElementById('input-image').value = '';
    document.getElementById('image-preview-bar').style.display = 'none';
    document.getElementById('ratio-selector').style.display = 'flex';
    document.getElementById('input-prompt').placeholder = 'Deskripsikan gambar yang ingin dibuat...';
}

function useAsSource(imageUrl) {
    fetch(imageUrl)
        .then(res => res.blob())
        .then(blob => {
            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageBase64 = e.target.result;
                
                const img = new Image();
                img.onload = () => {
                    selectedImageDimensions = { width: img.width, height: img.height };
                    showImagePreview(selectedImageBase64, `${img.width}×${img.height}px`);
                    closeImageModal();
                    document.getElementById('input-prompt').focus();
                };
                img.src = selectedImageBase64;
            };
            reader.readAsDataURL(blob);
        })
        .catch(err => {
            console.error('Failed to load image:', err);
            alert('Gagal memuat gambar');
        });
}

function retryFromError(jobId) {
    // Find job and retry with same prompt
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

function openImageModal(imageUrl) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const modalDownload = document.getElementById('modal-download');
    
    modalImage.src = imageUrl;
    modalDownload.href = imageUrl;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Setup edit button
    document.getElementById('modal-edit').onclick = () => useAsSource(imageUrl);
}

function closeImageModal() {
    document.getElementById('image-modal').classList.remove('active');
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
    initImageGenerator();
    
    // Login
    document.getElementById('btn-login-google').addEventListener('click', () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/image-generator.html'
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
    
    // Ratio buttons
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRatio = btn.dataset.ratio;
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
    
    // Image modal
    document.getElementById('btn-close-modal').addEventListener('click', closeImageModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeImageModal);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
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

console.log('✅ Chat Image Generator loaded');
