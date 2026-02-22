// ============================================
// TOOLS HUB V2 - WITH UGC GENERATOR
// ============================================

// ==========================================
// TOOL REGISTRY
// ==========================================

const TOOLS = {
    image: {
        id: 'image',
        name: 'Image Generator',
        icon: '🖼️',
        service: 'image',
        color: 'primary',
        type: 'chat', // chat | form
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
        type: 'chat',
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
        name: 'UGC Affiliate',
        icon: '📽️',
        service: 'ugc',
        color: 'ugc',
        type: 'form', // UGC menggunakan form kompleks
        enabled: true,
        totalSteps: 8,
        stylePresets: [
            'Default (Auto)',
            'Produk Dipakai/Digunakan',
            'Produk Dipegang Tangan',
            'Flat Lay / Aesthetic',
            'Lifestyle / Aktivitas',
            'Close-up Detail Produk',
            'Before-After Style',
            'Selfie / POV Style',
            'Custom (Tulis Sendiri)'
        ],
        animationOrders: [
            { value: 'veo_first', label: 'VEO 3.1 dulu → Seedance (Kualitas Tinggi)' },
            { value: 'grok_first', label: 'Seedance dulu → VEO 3.1 (Lebih Cepat)' }
        ],
        generateModes: [
            { value: 'full', label: '🚀 Full Pipeline (Gambar + Video + Audio)' },
            { value: 'images_only', label: '🖼️ Gambar Saja (3 Foto)' }
        ]
    }
};

// ==========================================
// STATE
// ==========================================

const state = {
    currentTool: 'image',
    leftCollapsed: false,
    rightCollapsed: false,
    tools: {},
    jobs: {}
};

Object.keys(TOOLS).forEach(id => {
    state.tools[id] = {
        base64: null,
        modelBase64: null, // untuk UGC
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
// RENDER NAVIGATION
// ==========================================

function renderToolsNav() {
    const nav = document.getElementById('tools-nav');
    const activeTools = Object.values(TOOLS).filter(t => t.enabled);
    
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
    
    nav.innerHTML = html;
}

// ==========================================
// RENDER TOOL PANELS
// ==========================================

function renderToolPanels() {
    const main = document.getElementById('main-content');
    let html = '';
    
    Object.values(TOOLS).filter(t => t.enabled).forEach(tool => {
        const isActive = tool.id === state.currentTool;
        
        if (tool.type === 'form') {
            // UGC Form Panel
            html += renderUGCPanel(tool, isActive);
        } else {
            // Chat Panel (Image/Video)
            html += renderChatPanel(tool, isActive);
        }
    });
    
    main.innerHTML = html;
}

function renderChatPanel(tool, isActive) {
    const isVideo = tool.color === 'video';
    
    return `
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
                                <svg viewBox="0 0 24 24" fill="currentColor">${getRatioSVG(r)}</svg>
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
                        <textarea id="prompt-${tool.id}" class="prompt-input" 
                                  placeholder="${tool.placeholder}" rows="1" 
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
}

function renderUGCPanel(tool, isActive) {
    return `
        <div id="panel-${tool.id}" class="tool-panel ${isActive ? 'active' : ''}">
            <div class="ugc-form-panel">
                <form id="ugc-form" class="ugc-form">
                    <!-- Upload Section -->
                    <div class="ugc-section">
                        <h3>📷 Upload Gambar</h3>
                        <div class="ugc-upload-row">
                            <div class="ugc-upload-group">
                                <label>Foto Produk (WAJIB)</label>
                                <div class="ugc-upload-box" id="ugc-upload-product">
                                    <input type="file" id="ugc-file-product" accept="image/*" hidden>
                                    <div class="ugc-upload-placeholder">
                                        <span class="ugc-upload-icon">📦</span>
                                        <span class="ugc-upload-text">Klik untuk upload</span>
                                    </div>
                                    <img id="ugc-preview-product" class="ugc-upload-preview" src="">
                                </div>
                            </div>
                            <div class="ugc-upload-group">
                                <label>Foto Model (Opsional)</label>
                                <div class="ugc-upload-box" id="ugc-upload-model">
                                    <input type="file" id="ugc-file-model" accept="image/*" hidden>
                                    <div class="ugc-upload-placeholder">
                                        <span class="ugc-upload-icon">👤</span>
                                        <span class="ugc-upload-text">Klik untuk upload</span>
                                    </div>
                                    <img id="ugc-preview-model" class="ugc-upload-preview" src="">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Product Details -->
                    <div class="ugc-section">
                        <h3>📝 Detail Produk</h3>
                        <div class="ugc-form-group">
                            <label>Nama Produk *</label>
                            <input type="text" id="ugc-product-name" placeholder="Contoh: Sepatu Sneakers Premium" required>
                        </div>
                        <div class="ugc-form-row">
                            <div class="ugc-form-group">
                                <label>Harga</label>
                                <input type="text" id="ugc-price" placeholder="Contoh: Rp 299.000">
                            </div>
                            <div class="ugc-form-group">
                                <label>Kelebihan</label>
                                <input type="text" id="ugc-pros" placeholder="Contoh: Ringan, anti air">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Style Options -->
                    <div class="ugc-section">
                        <h3>🎨 Pengaturan Gaya</h3>
                        <div class="ugc-form-group">
                            <label>Preset Gaya Foto</label>
                            <select id="ugc-style">
                                ${tool.stylePresets.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="ugc-form-group" id="ugc-custom-style-group" style="display:none;">
                            <label>Instruksi Custom</label>
                            <textarea id="ugc-custom-style" placeholder="Contoh: Model memakai sepatu sambil jogging"></textarea>
                        </div>
                        <div class="ugc-form-group">
                            <label>Urutan Video Generator</label>
                            <select id="ugc-animation-order">
                                ${tool.animationOrders.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                            </select>
                            <p class="ugc-form-hint" id="ugc-animation-hint">VEO 3.1 menghasilkan kualitas lebih bagus tapi lebih lambat</p>
                        </div>
                    </div>
                    
                    <!-- Generate Mode -->
                    <div class="ugc-section">
                        <h3>⚡ Mode Generate</h3>
                        <div class="ugc-form-group">
                            <label>Pilih apa yang ingin digenerate</label>
                            <select id="ugc-generate-mode">
                                ${tool.generateModes.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Submit -->
                    <div class="ugc-submit-section">
                        <button type="submit" id="ugc-submit-btn" class="ugc-submit-btn">
                            🚀 Generate Sekarang
                        </button>
                        <p class="ugc-form-note">
                            Proses generate membutuhkan waktu 5-20 menit.<br>
                            Kamu bisa menutup halaman dan kembali nanti.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function getRatioSVG(ratio) {
    const svgs = {
        '1:1': '<rect x="4" y="4" width="16" height="16" rx="2"/>',
        '9:16': '<rect x="6" y="2" width="12" height="20" rx="2"/>',
        '16:9': '<rect x="2" y="6" width="20" height="12" rx="2"/>',
        '4:3': '<rect x="3" y="5" width="18" height="14" rx="2"/>'
    };
    return svgs[ratio] || svgs['1:1'];
}

function renderHistoryTabs() {
    const tabs = document.getElementById('history-tabs');
    const tools = Object.values(TOOLS).filter(t => t.enabled);
    
    tabs.innerHTML = tools.map(tool => `
        <button class="history-tab ${tool.id === state.currentTool ? 'active' : ''}" data-tool="${tool.id}">
            ${tool.icon}
        </button>
    `).join('');
}

// ==========================================
// TOOL SWITCHING
// ==========================================

function switchTool(toolId) {
    if (!TOOLS[toolId]) return;
    
    state.currentTool = toolId;
    const tool = TOOLS[toolId];
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === toolId);
    });
    
    document.querySelectorAll('.tool-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${toolId}`);
    });
    
    document.getElementById('mobile-tool-icon').textContent = tool.icon;
    document.getElementById('mobile-tool-name').textContent = tool.name;
    
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
            if (!tool.service) continue;
            
            let result;
            if (toolId === 'ugc') {
                result = await supabaseClient.rpc('check_limit');
            } else {
                result = await supabaseClient.rpc('check_service_limit', { p_service: tool.service });
            }
            
            if (result.data?.[0]) {
                const remaining = result.data[0].daily_limit === -1 ? '∞' : result.data[0].remaining;
                const el = document.getElementById(`credits-${toolId}`);
                if (el) el.textContent = remaining;
                
                if (toolId === 'image' || toolId === 'ugc') {
                    document.getElementById('sidebar-plan').textContent = result.data[0].plan_name || 'Free';
                }
                
                // UGC specific: update animation hint for free users
                if (toolId === 'ugc') {
                    const isFree = result.data[0].daily_limit === 1 || (result.data[0].plan_name || '').toLowerCase() === 'free';
                    const hintEl = document.getElementById('ugc-animation-hint');
                    const selectEl = document.getElementById('ugc-animation-order');
                    
                    if (hintEl && isFree) {
                        hintEl.innerHTML = '⚠️ <strong>Free plan hanya menggunakan Seedance</strong>';
                        hintEl.classList.add('warning');
                    }
                    if (selectEl && isFree) {
                        selectEl.value = 'grok_first';
                        selectEl.disabled = true;
                    }
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
        
        // Get thumbnail based on tool type
        let thumb = '';
        if (toolId === 'ugc') {
            thumb = results.images?.[0] || '';
        } else if (toolId === 'video') {
            thumb = results.video_url || '';
        } else {
            thumb = results.image_url || '';
        }
        
        const title = toolId === 'ugc' ? (input.product_name || 'UGC') : (input.prompt || 'Item');
        
        let thumbHtml = '';
        if (thumb && job.status === 'completed') {
            if (toolId === 'video') {
                thumbHtml = `<video src="${thumb}" class="history-thumb" muted></video>`;
            } else {
                thumbHtml = `<img src="${thumb}" class="history-thumb" alt="">`;
            }
        } else {
            thumbHtml = `<div class="history-thumb-placeholder">${job.status === 'failed' ? '❌' : tool.icon}</div>`;
        }
        
        return `
            <div class="history-item" data-tool="${toolId}" data-job="${job.id}">
                ${thumbHtml}
                <div class="history-info">
                    <div class="history-prompt">${escapeHtml(title.substring(0, 30))}</div>
                    <div class="history-meta">
                        <span><span class="status-dot ${job.status}"></span>${job.status === 'completed' ? 'Selesai' : 'Gagal'}</span>
                        <span>•</span>
                        <span>${date}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// CHAT MESSAGES (Image/Video)
// ==========================================

function addUserMsg(toolId, prompt, sourceImg = null) {
    const container = document.getElementById(`messages-${toolId}`);
    if (!container) return;
    
    const tool = TOOLS[toolId];
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const user = getCurrentUser();
    const initial = (user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase();
    
    let srcHtml = sourceImg ? `<img src="${sourceImg}" class="source-thumb ${tool.color}" alt="">` : '';
    let modeHtml = sourceImg ? `<span class="mode-tag ${tool.color}">✏️ Edit</span>` : '';
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message user">
            <div class="msg-avatar">${initial}</div>
            <div class="msg-content">
                <div class="msg-bubble">${srcHtml}${modeHtml}${escapeHtml(prompt)}</div>
                <span class="msg-time">${time}</span>
            </div>
        </div>
    `);
    
    document.getElementById(`welcome-${toolId}`)?.classList.add('hidden');
    scrollToBottom(toolId);
}

function addBotLoading(toolId, jobId) {
    const container = document.getElementById(`messages-${toolId}`);
    if (!container) return;
    
    const tool = TOOLS[toolId];
    
    container.insertAdjacentHTML('beforeend', `
        <div class="message bot" id="msg-${jobId}">
            <div class="msg-avatar ${tool.color}">${tool.icon}</div>
            <div class="msg-content">
                <div class="msg-loading">
                    <div class="loading-top">
                        <div class="dots">
                            <span class="dot ${tool.color}"></span>
                            <span class="dot ${tool.color}"></span>
                            <span class="dot ${tool.color}"></span>
                        </div>
                        <span class="loading-text">Memproses...</span>
                    </div>
                    <div class="progress-wrap">
                        <div class="progress-track">
                            <div class="progress-bar ${tool.color}" id="pbar-${jobId}" style="width:0%"></div>
                        </div>
                        <div class="progress-meta">
                            <span id="ptext-${jobId}">Memulai...</span>
                            <span class="progress-pct ${tool.color}" id="ppct-${jobId}">0%</span>
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
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    msgEl.querySelector('.msg-content').innerHTML = `
        <div class="msg-bubble msg-error">
            <p>❌ ${escapeHtml(errMsg || 'Gagal')}</p>
            ${tool.color === 'video' || tool.color === 'ugc' ? '<p class="refund-note">💡 Kuota dikembalikan</p>' : ''}
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
// SUBMIT JOB (Image/Video)
// ==========================================

async function submitJob(toolId) {
    const prompt = document.getElementById(`prompt-${toolId}`).value.trim();
    if (!prompt) return;
    
    const tool = TOOLS[toolId];
    const toolState = state.tools[toolId];
    const imageToSend = toolState.base64;
    
    let ratio = toolState.ratio;
    if (imageToSend) {
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

// ==========================================
// SUBMIT UGC JOB
// ==========================================

async function submitUGCJob(event) {
    event.preventDefault();
    
    const user = getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const productFile = document.getElementById('ugc-file-product').files[0];
    const productName = document.getElementById('ugc-product-name').value.trim();
    
    if (!productFile) {
        alert('Upload foto produk terlebih dahulu');
        return;
    }
    
    if (!productName) {
        alert('Isi nama produk');
        return;
    }
    
    const submitBtn = document.getElementById('ugc-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = '🔒 Memvalidasi...';
    
    try {
        // Check limit
        const { data: limitData, error: limitError } = await supabaseClient.rpc('check_limit');
        
        if (limitError) throw new Error('Gagal memeriksa kuota');
        
        const quota = limitData?.[0];
        if (!quota?.allowed) {
            alert(`Limit harian habis! (${quota.current_count}/${quota.daily_limit})`);
            return;
        }
        
        // Upload product image
        submitBtn.textContent = '📤 Mengupload gambar...';
        
        const fileExt = productFile.name.split('.').pop().toLowerCase();
        const productPath = `uploads/${user.id}/${Date.now()}_product.${fileExt}`;
        
        const { error: uploadError } = await supabaseClient.storage
            .from('results')
            .upload(productPath, productFile);
        
        if (uploadError) throw new Error('Gagal upload gambar');
        
        const { data: { publicUrl: productUrl } } = supabaseClient.storage
            .from('results')
            .getPublicUrl(productPath);
        
        // Upload model image if exists
        let modelUrl = null;
        const modelFile = document.getElementById('ugc-file-model').files[0];
        if (modelFile) {
            const modelExt = modelFile.name.split('.').pop().toLowerCase();
            const modelPath = `uploads/${user.id}/${Date.now()}_model.${modelExt}`;
            
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
        
        // Create job
        submitBtn.textContent = '🚀 Membuat job...';
        
        const generateMode = document.getElementById('ugc-generate-mode').value;
        
        const inputData = {
            product_name: productName.substring(0, 200),
            price: (document.getElementById('ugc-price').value || '').trim().substring(0, 100),
            pros: (document.getElementById('ugc-pros').value || '').trim().substring(0, 500),
            style_preset: document.getElementById('ugc-style').value,
            custom_style: (document.getElementById('ugc-custom-style')?.value || '').trim().substring(0, 500),
            animation_order: document.getElementById('ugc-animation-order')?.value || 'grok_first',
            generate_mode: generateMode,
            product_image_url: productUrl,
            model_image_url: modelUrl
        };
        
        const { data: jobResult, error: jobError } = await supabaseClient.rpc('create_job_secure', {
            p_service: 'ugc',
            p_input_data: inputData,
            p_total_steps: generateMode === 'images_only' ? 3 : 8
        });
        
        if (jobError) throw jobError;
        
        const result = jobResult?.[0];
        if (!result?.success) {
            alert(result?.message || 'Gagal membuat job');
            return;
        }
        
        alert(`✅ Job berhasil dibuat!\n\nSisa kuota: ${result.remaining_quota}`);
        
        // Reset form
        document.getElementById('ugc-form').reset();
        document.querySelectorAll('.ugc-upload-box').forEach(box => box.classList.remove('has-preview'));
        document.querySelectorAll('.ugc-upload-preview').forEach(img => { img.style.display = 'none'; img.src = ''; });
        
        await Promise.all([loadAllJobs(), loadUserData()]);
        
    } catch (error) {
        alert('Gagal: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '🚀 Generate Sekarang';
    }
}

// ==========================================
// POLLING
// ==========================================

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

function startPolling() {
    setInterval(async () => {
        const allJobs = Object.values(state.jobs).flat();
        if (allJobs.some(j => ['pending', 'processing'].includes(j.status))) {
            await loadAllJobs();
        }
    }, 5000);
}

function retryJob(toolId, jobId) {
    const jobs = state.jobs[toolId] || [];
    const job = jobs.find(j => j.id === jobId);
    if (job?.input_data?.prompt) {
        const promptEl = document.getElementById(`prompt-${toolId}`);
        if (promptEl) {
            promptEl.value = job.input_data.prompt;
            document.getElementById(`send-${toolId}`).disabled = false;
        }
    }
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
                document.getElementById(`prompt-${toolId}`)?.focus();
            };
            img.src = toolState.base64;
        };
        reader.readAsDataURL(blob);
    });
}

// ==========================================
// MODALS
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

function openUGCModal(jobId) {
    const job = state.jobs.ugc.find(j => j.id === jobId);
    if (!job) return;
    
    const modal = document.getElementById('ugc-modal');
    const input = job.input_data || {};
    let results = job.results || {};
    if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
    
    document.getElementById('ugc-modal-title').textContent = input.product_name || 'Detail Job';
    
    const statusEl = document.getElementById('ugc-modal-status');
    const statusLabels = { pending: 'Menunggu', processing: 'Diproses', completed: 'Selesai', failed: 'Gagal' };
    statusEl.textContent = statusLabels[job.status] || job.status;
    statusEl.className = `ugc-status-badge ${job.status}`;
    
    const progressSection = document.getElementById('ugc-modal-progress');
    const resultsSection = document.getElementById('ugc-modal-results');
    const errorSection = document.getElementById('ugc-modal-error');
    
    if (['pending', 'processing'].includes(job.status)) {
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        document.getElementById('ugc-progress-bar').style.width = `${job.progress_percent || 0}%`;
        document.getElementById('ugc-progress-step').textContent = job.step_name || 'Menunggu...';
        document.getElementById('ugc-progress-pct').textContent = `${job.progress_percent || 0}%`;
        
    } else if (job.status === 'completed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        // Render images
        const imagesContainer = document.getElementById('ugc-result-images');
        if (results.images?.length) {
            imagesContainer.innerHTML = results.images.map((url, i) => `
                <div class="ugc-gallery-item">
                    <img src="${url}" alt="Image ${i+1}">
                    <a href="${url}" download>⬇️</a>
                </div>
            `).join('');
            imagesContainer.parentElement.style.display = 'block';
        } else {
            imagesContainer.parentElement.style.display = 'none';
        }
        
        // Render videos
        const videosContainer = document.getElementById('ugc-result-videos');
        if (results.videos?.length) {
            videosContainer.innerHTML = results.videos.map((url, i) => `
                <div class="ugc-gallery-item">
                    <video src="${url}" muted loop onmouseenter="this.play()" onmouseleave="this.pause()"></video>
                    <a href="${url}" download>⬇️</a>
                </div>
            `).join('');
            videosContainer.parentElement.style.display = 'block';
        } else {
            videosContainer.parentElement.style.display = 'none';
        }
        
        // Final video
        const finalGroup = document.getElementById('ugc-final-video-group');
        if (results.final_video) {
            document.getElementById('ugc-result-final').src = results.final_video;
            document.getElementById('ugc-download-final').href = results.final_video;
            finalGroup.style.display = 'block';
        } else {
            finalGroup.style.display = 'none';
        }
        
        // Audio
        const audioGroup = document.getElementById('ugc-audio-group');
        if (results.audio) {
            document.getElementById('ugc-result-audio').src = results.audio;
            document.getElementById('ugc-download-audio').href = results.audio;
            audioGroup.style.display = 'block';
        } else {
            audioGroup.style.display = 'none';
        }
        
        // Script
        const scriptGroup = document.getElementById('ugc-script-group');
        if (results.script) {
            document.getElementById('ugc-result-script').textContent = results.script;
            scriptGroup.style.display = 'block';
        } else {
            scriptGroup.style.display = 'none';
        }
        
    } else if (job.status === 'failed') {
        progressSection.style.display = 'none';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'block';
        document.getElementById('ugc-error-msg').textContent = job.error_message || 'Terjadi kesalahan';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUGCModal() {
    document.getElementById('ugc-modal').classList.remove('active');
    document.body.style.overflow = '';
}

function loadHistoryItem(toolId, jobId) {
    if (toolId === 'ugc') {
        openUGCModal(jobId);
    } else {
        const jobs = state.jobs[toolId] || [];
        const job = jobs.find(j => j.id === jobId);
        if (!job || job.status !== 'completed') return;
        
        let results = job.results;
        if (typeof results === 'string') try { results = JSON.parse(results); } catch(e) {}
        
        const isVideo = TOOLS[toolId]?.color === 'video';
        const url = isVideo ? results.video_url : results.image_url;
        if (url) openModal(url, toolId);
    }
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
    
    // Modals
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-close-ugc-modal').addEventListener('click', closeUGCModal);
    document.querySelectorAll('.modal-backdrop').forEach(el => {
        el.addEventListener('click', () => {
            closeModal();
            closeUGCModal();
        });
    });
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeModal();
            closeUGCModal();
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
            const promptEl = document.getElementById(`prompt-${toolId}`);
            if (promptEl) {
                promptEl.value = prompt;
                document.getElementById(`send-${toolId}`).disabled = false;
                promptEl.focus();
            }
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
        
        // UGC Upload boxes
        if (e.target.closest('#ugc-upload-product')) {
            document.getElementById('ugc-file-product').click();
        }
        if (e.target.closest('#ugc-upload-model')) {
            document.getElementById('ugc-file-model').click();
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
        
        // UGC style change
        if (e.target.id === 'ugc-style') {
            const customGroup = document.getElementById('ugc-custom-style-group');
            if (customGroup) {
                customGroup.style.display = e.target.value === 'Custom (Tulis Sendiri)' ? 'block' : 'none';
            }
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
    
    // File inputs (Image/Video)
    document.addEventListener('change', e => {
        if (e.target.type === 'file' && e.target.id.startsWith('file-')) {
            const toolId = e.target.id.replace('file-', '');
            if (e.target.files?.[0]) handleFile(toolId, e.target.files[0]);
        }
        
        // UGC file inputs
        if (e.target.id === 'ugc-file-product' && e.target.files?.[0]) {
            handleUGCFile('product', e.target.files[0]);
        }
        if (e.target.id === 'ugc-file-model' && e.target.files?.[0]) {
            handleUGCFile('model', e.target.files[0]);
        }
    });
    
    // UGC Form submit
    document.addEventListener('submit', e => {
        if (e.target.id === 'ugc-form') {
            submitUGCJob(e);
        }
    });
});

function handleUGCFile(type, file) {
    if (!file?.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        alert('File tidak valid atau > 10MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById(`ugc-preview-${type}`);
        const box = document.getElementById(`ugc-upload-${type}`);
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        box.classList.add('has-preview');
    };
    reader.readAsDataURL(file);
}

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

console.log('✅ Tools Hub V2 with UGC loaded');
