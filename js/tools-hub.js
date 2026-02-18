// ============================================
// TOOLS HUB V2 - MODULAR ARCHITECTURE
// ============================================

// ==========================================
// TOOL REGISTRY - TAMBAH/HAPUS TOOL DI SINI
// ==========================================

const TOOLS = {
    image: {
        id: 'image',
        name: 'Image Generator',
        icon: '🖼️',
        service: 'image',
        color: 'primary', // primary | video
        enabled: true,
        ratios: ['1:1', '9:16', '16:9', '4:3'],
        defaultRatio: '1:1',
        maxPromptLength: 1000,
        placeholder: 'Deskripsikan gambar yang ingin dibuat...',
        welcomeText: 'Powered by Nano Banana Pro',
        suggestions: [
            { icon: '🐱', text: 'Kucing lucu', prompt: 'Kucing lucu bermain di taman bunga yang indah' },
            { icon: '🌄', text: 'Sunset', prompt: 'Pemandangan gunung saat sunset dengan warna dramatis' },
            { icon: '🤖', text: 'Robot', prompt: 'Robot futuristik dengan efek neon cyberpunk' },
            { icon: '🏰', text: 'Fantasi', prompt: 'Kastil fantasi melayang di atas awan' }
        ],
        totalSteps: 3
    },
    video: {
        id: 'video',
        name: 'Video Generator',
        icon: '🎬',
        service: 'video',
        color: 'video',
        enabled: true,
        ratios: ['9:16', '16:9', '1:1'],
        defaultRatio: '16:9',
        maxPromptLength: 500,
        placeholder: 'Deskripsikan video yang ingin dibuat...',
        welcomeText: 'Powered by VEO 3.1',
        timeNotice: 'Estimasi: 2-4 menit',
        suggestions: [
            { icon: '🏝️', text: 'Pantai', prompt: 'Drone cinematic view pantai Bali saat sunset' },
            { icon: '🐱', text: 'Kucing', prompt: 'Kucing lucu bermain dengan bola benang, slow motion' },
            { icon: '🌃', text: 'Kota', prompt: 'Timelapse kota metropolitan malam hari' },
            { icon: '🚀', text: 'Astronot', prompt: 'Astronot berjalan di permukaan bulan' }
        ],
        totalSteps: 4
    },
    ugc: {
        id: 'ugc',
        name: 'UGC Generator',
        icon: '📽️',
        service: 'ugc',
        color: 'primary',
        enabled: true,
        comingSoon: false, // Set true jika coming soon
        externalLink: 'generator.html',
        features: [
            '✓ Gambar produk otomatis',
            '✓ Video animasi',
            '✓ Voice over AI',
            '✓ Script marketing'
        ]
    }
    // TAMBAH TOOL BARU DI SINI:
    // music: { id: 'music', name: 'Music Generator', icon: '🎵', ... }
};

// ==========================================
// STATE MANAGEMENT
// ==========================================

const state = {
    currentTool: 'image',
    leftCollapsed: false,
    rightCollapsed: false,
    tools: {},
    jobs: {}
};

// Initialize tool states
Object.keys(TOOLS).forEach(id => {
    state.tools[id] = {
        base64: null,
        dimensions: { width: 0, height: 0 },
        ratio: TOOLS[id].defaultRatio || '1:1'
    };
    state.jobs[id] = [];
});

// ==========================================
// VIEWPORT FIX
// ==========================================

function setVH() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => setTimeout(setVH, 100));

// ==========================================
// INITIALIZATION
// ==========================================

async function init() {
    console.log('🛰️ Tools Hub V2 initializing...');
    
    renderToolsNav();
    renderToolPanels();
    renderHistoryTabs();
    
    const loggedIn = await checkAuth();
    
    if (loggedIn) {
        showApp();
        await loadUserData();
        await loadAllJobs();
        startPolling();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'grid';
    
    const user = getCurrentUser();
    if (user) {
        const avatar = user.user_metadata?.avatar_url || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=8b5cf6&color=fff`;
        document.getElementById('sidebar-avatar').src = avatar;
        document.getElementById('sidebar-name').textContent = user.user_metadata?.full_name || user.email?.split('@')[0];
    }
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

function renderToolsNav() {
    const nav = document.getElementById('tools-nav');
    
    const activeTools = Object.values(TOOLS).filter(t => t.enabled && !t.comingSoon);
    const comingTools = Object.values(TOOLS).filter(t => t.comingSoon);
    
    let html = '<div class="nav-section"><div class="nav-section-label">Generators</div>';
    
    activeTools.forEach(tool => {
        const isActive = tool.id === state.currentTool;
        html += `
            <button class="nav-item ${isActive ? 'active' : ''}" data-tool="${tool.id}">
                <span class="nav-icon">${tool.icon}</span>
                <span class="nav-text">${tool.name}</span>
                <span class="nav-badge" id="credits-${tool.id}">0</span>
            </button>
        `;
    });
    html += '</div>';
    
    if (comingTools.length) {
        html += '<div class="nav-section"><div class="nav-section-label">Coming Soon</div>';
        comingTools.forEach(tool => {
            html += `
                <button class="nav-item disabled" disabled>
                    <span class="nav-icon">${tool.icon}</span>
                    <span class="nav-text">${tool.name}</span>
                </button>
            `;
        });
        html += '</div>';
    }
    
    nav.innerHTML = html;
}

function renderToolPanels() {
    const main = document.getElementById('main-content');
    let html = '';
    
    Object.values(TOOLS).filter(t => t.enabled && !t.comingSoon).forEach(tool => {
        const isActive = tool.id === state.currentTool;
        const isVideo = tool.color === 'video';
        
        // External link tool (like UGC)
        if (tool.externalLink) {
            html += `
                <div id="panel-${tool.id}" class="tool-panel ${isActive ? 'active' : ''}">
                    <div class="coming-soon-box">
                        <div class="icon">${tool.icon}</div>
                        <h2>${tool.name}</h2>
                        <p>${tool.welcomeText || ''}</p>
                        <div class="features-list">
                            ${(tool.features || []).map(f => `<div class="item">${f}</div>`).join('')}
                        </div>
                        <a href="${tool.externalLink}" class="btn-launch">🚀 Launch ${tool.name}</a>
                    </div>
                </div>
            `;
            return;
        }
        
        // Regular generator tool
        html += `
            <div id="panel-${tool.id}" class="tool-panel ${isActive ? 'active' : ''}">
                <div class="panel-inner">
                    <div class="chat-area" id="chat-${tool.id}">
                        <div class="welcome-box" id="welcome-${tool.id}">
                            <div class="welcome-icon">${tool.icon}</div>
                            <h2>${tool.name}</h2>
                            <p>${tool.welcomeText || ''}</p>
                            <div class="chips-container">
                                ${tool.suggestions.map(s => `
                                    <button class="chip" data-tool="${tool.id}" data-prompt="${s.prompt}">
                                        ${s.icon} ${s.text}
                                    </button>
                                `).join('')}
                            </div>
                            ${tool.timeNotice ? `<div class="info-notice">⏱️ ${tool.timeNotice}</div>` : ''}
                        </div>
                        <div class="messages-list" id="messages-${tool.id}"></div>
                    </div>
                    
                    <div class="input-section">
                        <div class="preview-bar" id="preview-${tool.id}">
                            <div class="preview-inner ${isVideo ? 'video' : ''}">
                                <img id="preview-img-${tool.id}" src="" alt="">
                                <div class="preview-info">
                                    <div class="label">${isVideo ? '🎬 Image to Video' : '✏️ Edit Mode'}</div>
                                    <div class="size" id="preview-size-${tool.id}">-</div>
                                </div>
                                <button class="btn-remove-preview" data-tool="${tool.id}">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        
                        <div class="ratio-selector" id="ratios-${tool.id}">
                            ${tool.ratios.map(r => `
                                <button class="ratio-btn ${r === tool.defaultRatio ? 'active' : ''} ${isVideo ? 'video' : ''}" 
                                        data-tool="${tool.id}" data-ratio="${r}">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        ${getRatioSVG(r)}
                                    </svg>
                                    <span>${r}</span>
                                </button>
                            `).join('')}
                        </div>
                        
                        <div class="input-row ${isVideo ? 'video' : ''}">
                            <input type="file" id="file-${tool.id}" accept="image/*" hidden>
                            <button class="btn-attach ${isVideo ? 'video' : ''}" data-tool="${tool.id}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                </svg>
                            </button>
                            <textarea id="prompt-${tool.id}" 
                                      class="prompt-input" 
                                      placeholder="${tool.placeholder}" 
                                      rows="1" 
                                      maxlength="${tool.maxPromptLength}"></textarea>
                            <button id="send-${tool.id}" class="btn-send ${isVideo ? 'video' : ''}" disabled>
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    main.innerHTML = html;
}

function getRatioSVG(ratio) {
    const svgs = {
        '1:1': '<rect x="4" y="4" width="16" height="16" rx="2"/>',
        '9:16': '<rect x="6" y="2" width="12" height="20" rx="2"/>',
        '16:9': '<rect x="2" y="6" width="20" height="12" rx="2"/>',
        '4:3': '<rect x="3" y="5" width="18" height="14" rx="2"/>',
        '3:4': '<rect x="5" y="3" width="14" height="18" rx="2"/>'
    };
    return svgs[ratio] || svgs['1:1'];
}

function renderHistoryTabs() {
    const tabs = document.getElementById('history-tabs');
    const generatorTools = Object.values(TOOLS).filter(t => t.enabled && !t.comingSoon && !t.externalLink);
    
    tabs.innerHTML = generatorTools.map(tool => `
        <button class="history-tab ${tool.id === state.currentTool ? 'active' : ''}" data-tool="${tool.id}">
            ${tool.icon} ${tool.name.replace(' Generator', '')}
        </button>
    `).join('');
}

// ==========================================
// TOOL SWITCHING
// ==========================================

function switchTool(toolId) {
    if (!TOOLS[toolId] || TOOLS[toolId].comingSoon) return;
    
    state.currentTool = toolId;
    const tool = TOOLS[toolId];
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolId);
    });
    
    // Update panels
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${toolId}`);
    });
    
    // Update mobile header
    document.getElementById('mobile-tool-icon').textContent = tool.icon;
    document.getElementById('mobile-tool-name').textContent = tool.name;
    
    // Update history tabs
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tool === toolId);
    });
    
    renderHistory();
    closeMobileSidebars();
}

// ==========================================
// SIDEBAR CONTROLS
// ==========================================

function toggleLeftSidebar() {
    state.leftCollapsed = !state.leftCollapsed;
    document.getElementById('main-app').classList.toggle('left-collapsed', state.leftCollapsed);
}

function toggleRightSidebar() {
    state.rightCollapsed = !state.rightCollapsed;
    document.getElementById('main-app').classList.toggle('right-collapsed', state.rightCollapsed);
}

function openMobileLeft() {
    document.getElementById('sidebar-left').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function openMobileRight() {
    document.getElementById('sidebar-right').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('active');
}

function closeMobileSidebars() {
    document.getElementById('sidebar-left').classList.remove('open');
    document.getElementById('sidebar-right').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// ==========================================
// LOAD DATA
// ==========================================

async function loadUserData() {
    try {
        for (const toolId of Object.keys(TOOLS)) {
            const tool = TOOLS[toolId];
            if (!tool.service || tool.externalLink) continue;
            
            const result = await supabaseClient.rpc('check_service_limit', { p_service: tool.service });
            if (result.data?.[0]) {
                const remaining = result.data[0].daily_limit === -1 ? '∞' : result.data[0].remaining;
                const el = document.getElementById(`credits-${toolId}`);
                if (el) el.textContent = remaining;
                
                if (toolId === 'image') {
                    document.getElementById('sidebar-plan').textContent = result.data[0].plan_name || 'Free';
                }
            }
        }
    } catch (e) {
        console.error('Load user data error:', e);
    }
}

async function loadAllJobs() {
    const user = getCurrentUser();
    if (!user) return;
    
    const { data: jobs } = await supabaseClient
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
    
    if (jobs) {
        Object.keys(TOOLS).forEach(toolId => {
            const tool = TOOLS[toolId];
            if (tool.service) {
                state.jobs[toolId] = jobs.filter(j => j.service === tool.service);
            }
        });
        renderHistory();
    }
}

// ==========================================
// HISTORY
// ==========================================

function renderHistory() {
    const toolId = state.currentTool;
    const jobs = state.jobs[toolId] || [];
    const container = document.getElementById('history-list');
    const tool = TOOLS[toolId];
    const isVideo = tool?.color === 'video';
    
    const completed = jobs.filter(j => ['completed', 'failed'].includes(j.status));
    
    if (!completed.length) {
        container.innerHTML = '<div class="empty-history"><span>📁</span><p>Belum ada riwayat</p></div>';
        return;
    }
    
    container.innerHTML = completed.map(job => {
        const input = job.input_data || {};
        let results = job.results || {};
        if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
        
        const date = new Date(job.created_at).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
        
        const thumb = isVideo ? results.video_url : results.image_url;
        const status = job.status;
        
        let thumbHtml = '';
        if (thumb && status === 'completed') {
            thumbHtml = isVideo 
                ? `<video src="${thumb}" class="history-thumb" muted></video>`
                : `<img src="${thumb}" class="history-thumb" alt="">`;
        } else {
            thumbHtml = `<div class="history-thumb-placeholder">${status === 'failed' ? '❌' : tool.icon}</div>`;
        }
        
        return `
            <div class="history-item" data-tool="${toolId}" data-job="${job.id}">
                ${thumbHtml}
                <div class="history-info">
                    <div class="history-prompt">${escapeHtml((input.prompt || '').substring(0, 35))}</div>
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

// ==========================================
// CHAT MESSAGES
// ==========================================

function addUserMsg(toolId, prompt, sourceImg = null) {
    const container = document.getElementById(`messages-${toolId}`);
    const tool = TOOLS[toolId];
    const isVideo = tool.color === 'video';
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const user = getCurrentUser();
    const initial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();
    
    let srcHtml = sourceImg ? `<img src="${sourceImg}" class="source-thumb ${isVideo ? 'video' : ''}" alt="">` : '';
    let modeHtml = sourceImg ? `<span class="mode-tag ${isVideo ? 'video' : ''}">✏️ ${isVideo ? 'Image to Video' : 'Edit Mode'}</span>` : '';
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message user">
            <div class="msg-avatar">${initial}</div>
            <div class="msg-content">
                <div class="msg-bubble">${srcHtml}${modeHtml}${escapeHtml(prompt)}</div>
                <span class="msg-time">${time}</span>
            </div>
        </div>
    `);
    
    document.getElementById(`welcome-${toolId}`).classList.add('hidden');
    scrollToBottom(toolId);
}

function addBotLoading(toolId, jobId) {
    const container = document.getElementById(`messages-${toolId}`);
    const tool = TOOLS[toolId];
    const isVideo = tool.color === 'video';
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message bot" id="msg-${jobId}">
            <div class="msg-avatar ${isVideo ? 'video' : ''}">${tool.icon}</div>
            <div class="msg-content">
                <div class="msg-loading">
                    <div class="loading-top">
                        <div class="dots">
                            <span class="dot ${isVideo ? 'video' : ''}"></span>
                            <span class="dot ${isVideo ? 'video' : ''}"></span>
                            <span class="dot ${isVideo ? 'video' : ''}"></span>
                        </div>
                        <span class="loading-text">${isVideo ? 'Membuat video...' : 'Membuat gambar...'}</span>
                    </div>
                    <div class="progress-wrap">
                        <div class="progress-track">
                            <div class="progress-bar ${isVideo ? 'video' : ''}" id="pbar-${jobId}" style="width:0%"></div>
                        </div>
                        <div class="progress-meta">
                            <span id="ptext-${jobId}">Memulai...</span>
                            <span class="progress-pct ${isVideo ? 'video' : ''}" id="ppct-${jobId}">0%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    
    scrollToBottom(toolId);
}

function updateBotProgress(jobId, percent, text) {
    const bar = document.getElementById(`pbar-${jobId}`);
    const textEl = document.getElementById(`ptext-${jobId}`);
    const pctEl = document.getElementById(`ppct-${jobId}`);
    
    if (bar) bar.style.width = `${percent}%`;
    if (textEl) textEl.textContent = text || 'Memproses...';
    if (pctEl) pctEl.textContent = `${percent}%`;
}

function completeBotMsg(toolId, jobId, mediaUrl, ratio) {
    const msgEl = document.getElementById(`msg-${jobId}`);
    if (!msgEl) return;
    
    const tool = TOOLS[toolId];
    const isVideo = tool.color === 'video';
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const mediaHtml = isVideo
        ? `<video src="${mediaUrl}" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video>`
        : `<img src="${mediaUrl}" alt="">`;
    
    msgEl.querySelector('.msg-content').innerHTML = `
        <div class="msg-media" onclick="openModal('${mediaUrl}', '${toolId}')">
            ${mediaHtml}
            <div class="media-actions">
                <a href="${mediaUrl}" download class="media-btn" onclick="event.stopPropagation()">⬇️ Download</a>
                <button class="media-btn" onclick="event.stopPropagation(); useAsSource('${toolId}', '${mediaUrl}')">✏️ Edit</button>
            </div>
        </div>
        <span class="msg-time">${time} • ${ratio}</span>
    `;
    
    scrollToBottom(toolId);
}

function errorBotMsg(toolId, jobId, errMsg) {
    const msgEl = document.getElementById(`msg-${jobId}`);
    if (!msgEl) return;
    
    const tool = TOOLS[toolId];
    const isVideo = tool.color === 'video';
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    msgEl.querySelector('.msg-content').innerHTML = `
        <div class="msg-bubble msg-error">
            <p>❌ ${escapeHtml(errMsg || 'Gagal')}</p>
            ${isVideo ? '<p class="refund-note">💡 Kuota dikembalikan</p>' : ''}
            <button class="retry-btn" onclick="retryJob('${toolId}', '${jobId}')">🔄 Coba Lagi</button>
        </div>
        <span class="msg-time">${time}</span>
    `;
    
    scrollToBottom(toolId);
}

function scrollToBottom(toolId) {
    const chat = document.getElementById(`chat-${toolId}`);
    if (chat) setTimeout(() => chat.scrollTop = chat.scrollHeight, 100);
}

// ==========================================
// SUBMIT JOB
// ==========================================

async function submitJob(toolId) {
    const prompt = document.getElementById(`prompt-${toolId}`).value.trim();
    if (!prompt) return;
    
    const tool = TOOLS[toolId];
    const toolState = state.tools[toolId];
    const imageToSend = toolState.base64;
    const isEditMode = !!imageToSend;
    
    let ratio = toolState.ratio;
    if (isEditMode) {
        ratio = detectRatio(toolState.dimensions.width, toolState.dimensions.height).ratio;
    }
    
    addUserMsg(toolId, prompt, imageToSend);
    
    document.getElementById(`prompt-${toolId}`).value = '';
    document.getElementById(`send-${toolId}`).disabled = true;
    clearPreview(toolId);
    
    try {
        const limitRes = await supabaseClient.rpc('check_service_limit', { p_service: tool.service });
        if (limitRes.data?.[0] && !limitRes.data[0].allowed) {
            throw new Error('Kuota habis!');
        }
        
        const inputData = { 
            prompt: prompt.substring(0, tool.maxPromptLength), 
            aspect_ratio: ratio 
        };
        if (imageToSend) inputData.image_base64 = imageToSend;
        
        const jobRes = await supabaseClient.rpc('create_service_job', {
            p_service: tool.service,
            p_input_data: inputData,
            p_total_steps: tool.totalSteps
        });
        
        if (jobRes.error) throw jobRes.error;
        
        const result = jobRes.data?.[0];
        if (!result?.success) throw new Error(result?.message || 'Gagal');
        
        addBotLoading(toolId, result.job_id);
        pollJob(toolId, result.job_id);
        await loadUserData();
        
    } catch (error) {
        const tempId = 'err-' + Date.now();
        addBotLoading(toolId, tempId);
        errorBotMsg(toolId, tempId, error.message);
    }
}

async function pollJob(toolId, jobId) {
    const tool = TOOLS[toolId];
    const isVideo = tool.color === 'video';
    
    const poll = async () => {
        const { data: job } = await supabaseClient.from('jobs').select('*').eq('id', jobId).single();
        if (!job) return;
        
        updateBotProgress(jobId, job.progress_percent, job.step_name);
        
        if (job.status === 'completed') {
            let results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
            const url = isVideo ? results.video_url : results.image_url;
            completeBotMsg(toolId, jobId, url, results.aspect_ratio || tool.defaultRatio);
            await loadAllJobs();
        } else if (job.status === 'failed') {
            errorBotMsg(toolId, jobId, job.error_message);
            await loadAllJobs();
            await loadUserData();
        } else {
            setTimeout(poll, isVideo ? 3000 : 2000);
        }
    };
    poll();
}

function retryJob(toolId, jobId) {
    const jobs = state.jobs[toolId] || [];
    const job = jobs.find(j => j.id === jobId);
    if (job?.input_data?.prompt) {
        document.getElementById(`prompt-${toolId}`).value = job.input_data.prompt;
        document.getElementById(`send-${toolId}`).disabled = false;
    }
}

function startPolling() {
    setInterval(async () => {
        const allJobs = Object.values(state.jobs).flat();
        if (allJobs.some(j => ['pending', 'processing'].includes(j.status))) {
            await loadAllJobs();
        }
    }, 5000);
}

// ==========================================
// IMAGE HANDLING
// ==========================================

function detectRatio(w, h) {
    if (!w || !h) return { ratio: '1:1', label: 'Square' };
    const r = w / h;
    if (r > 1.5) return { ratio: '16:9', label: 'Landscape' };
    if (r > 1.1) return { ratio: '4:3', label: 'Classic' };
    if (r < 0.67) return { ratio: '9:16', label: 'Portrait' };
    if (r < 0.9) return { ratio: '3:4', label: 'Portrait' };
    return { ratio: '1:1', label: 'Square' };
}

function handleFile(toolId, file) {
    if (!file?.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        alert('File tidak valid atau > 10MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const toolState = state.tools[toolId];
        toolState.base64 = e.target.result;
        
        const img = new Image();
        img.onload = () => {
            toolState.dimensions = { width: img.width, height: img.height };
            const detected = detectRatio(img.width, img.height);
            showPreview(toolId, toolState.base64, `${img.width}×${img.height}px • ${detected.ratio}`);
        };
        img.src = toolState.base64;
    };
    reader.readAsDataURL(file);
}

function showPreview(toolId, src, info) {
    document.getElementById(`preview-img-${toolId}`).src = src;
    document.getElementById(`preview-size-${toolId}`).textContent = info;
    document.getElementById(`preview-${toolId}`).classList.add('active');
    document.getElementById(`ratios-${toolId}`).style.display = 'none';
}

function clearPreview(toolId) {
    const toolState = state.tools[toolId];
    toolState.base64 = null;
    toolState.dimensions = { width: 0, height: 0 };
    
    document.getElementById(`file-${toolId}`).value = '';
    document.getElementById(`preview-${toolId}`).classList.remove('active');
    document.getElementById(`ratios-${toolId}`).style.display = 'flex';
}

function useAsSource(toolId, url) {
    fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const toolState = state.tools[toolId];
            toolState.base64 = e.target.result;
            
            const img = new Image();
            img.onload = () => {
                toolState.dimensions = { width: img.width, height: img.height };
                const detected = detectRatio(img.width, img.height);
                showPreview(toolId, toolState.base64, `${img.width}×${img.height}px • ${detected.ratio}`);
                closeModal();
                switchTool(toolId);
                document.getElementById(`prompt-${toolId}`).focus();
            };
            img.src = toolState.base64;
        };
        reader.readAsDataURL(blob);
    });
}

// ==========================================
// MODAL
// ==========================================

function openModal(url, toolId) {
    const modal = document.getElementById('media-modal');
    const img = document.getElementById('modal-image');
    const video = document.getElementById('modal-video');
    const download = document.getElementById('modal-download');
    const editBtn = document.getElementById('modal-edit');
    
    const isVideo = TOOLS[toolId]?.color === 'video';
    
    if (isVideo) {
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
    editBtn.onclick = () => useAsSource(toolId, url);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('media-modal').classList.remove('active');
    document.getElementById('modal-video').pause();
    document.body.style.overflow = '';
}

function loadHistoryItem(toolId, jobId) {
    const jobs = state.jobs[toolId] || [];
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status !== 'completed') return;
    
    let results = job.results;
    if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
    
    const isVideo = TOOLS[toolId]?.color === 'video';
    const url = isVideo ? results.video_url : results.image_url;
    if (url) openModal(url, toolId);
}

// ==========================================
// UTILITIES
// ==========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Login
    document.getElementById('btn-login-google').addEventListener('click', () => {
        supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        });
    });
    
    // Logout
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    // Sidebar controls
    document.getElementById('btn-collapse-left').addEventListener('click', toggleLeftSidebar);
    document.getElementById('btn-collapse-right').addEventListener('click', toggleRightSidebar);
    document.getElementById('btn-open-left').addEventListener('click', openMobileLeft);
    document.getElementById('btn-open-right').addEventListener('click', openMobileRight);
    document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebars);
    
    // Modal
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeMobileSidebars();
        }
    });
    
    // Delegated events
    document.addEventListener('click', e => {
        // Tool nav
        if (e.target.closest('.nav-item[data-tool]')) {
            const btn = e.target.closest('.nav-item');
            if (!btn.disabled) switchTool(btn.dataset.tool);
        }
        
        // History tabs
        if (e.target.closest('.history-tab')) {
            const tab = e.target.closest('.history-tab');
            switchTool(tab.dataset.tool);
        }
        
        // History items
        if (e.target.closest('.history-item')) {
            const item = e.target.closest('.history-item');
            loadHistoryItem(item.dataset.tool, item.dataset.job);
        }
        
        // Chips
        if (e.target.closest('.chip')) {
            const chip = e.target.closest('.chip');
            const toolId = chip.dataset.tool;
            const prompt = chip.dataset.prompt;
            document.getElementById(`prompt-${toolId}`).value = prompt;
            document.getElementById(`send-${toolId}`).disabled = false;
            document.getElementById(`prompt-${toolId}`).focus();
        }
        
        // Ratio buttons
        if (e.target.closest('.ratio-btn')) {
            const btn = e.target.closest('.ratio-btn');
            const toolId = btn.dataset.tool;
            const ratio = btn.dataset.ratio;
            
            document.querySelectorAll(`#ratios-${toolId} .ratio-btn`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.tools[toolId].ratio = ratio;
        }
        
        // Attach buttons
        if (e.target.closest('.btn-attach')) {
            const btn = e.target.closest('.btn-attach');
            document.getElementById(`file-${btn.dataset.tool}`).click();
        }
        
        // Remove preview
        if (e.target.closest('.btn-remove-preview')) {
            const btn = e.target.closest('.btn-remove-preview');
            clearPreview(btn.dataset.tool);
        }
    });
    
    // Input events
    document.addEventListener('input', e => {
        if (e.target.classList.contains('prompt-input')) {
            const toolId = e.target.id.replace('prompt-', '');
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px';
            document.getElementById(`send-${toolId}`).disabled = !e.target.value.trim();
        }
    });
    
    document.addEventListener('keydown', e => {
        if (e.target.classList.contains('prompt-input') && e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const toolId = e.target.id.replace('prompt-', '');
            if (e.target.value.trim()) submitJob(toolId);
        }
    });
    
    // Send buttons
    document.addEventListener('click', e => {
        if (e.target.closest('.btn-send')) {
            const btn = e.target.closest('.btn-send');
            const toolId = btn.id.replace('send-', '');
            submitJob(toolId);
        }
    });
    
    // File inputs
    document.addEventListener('change', e => {
        if (e.target.type === 'file' && e.target.id.startsWith('file-')) {
            const toolId = e.target.id.replace('file-', '');
            if (e.target.files?.[0]) handleFile(toolId, e.target.files[0]);
        }
    });
});

// Auth listener
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showApp();
        loadUserData();
        loadAllJobs();
    } else if (event === 'SIGNED_OUT') {
        showLogin();
    }
});

console.log('✅ Tools Hub V2 loaded');
