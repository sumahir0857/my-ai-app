/**
 * VIDEO GENERATOR - Frontend JavaScript
 * =====================================
 * With Shared Authentication Support
 */

// ==============================================================================
// CONFIGURATION - SAMAKAN DENGAN HALAMAN UGC ANDA
// ==============================================================================

const CONFIG = {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',      // GANTI dengan URL yang sama seperti di UGC
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',  // GANTI dengan key yang sama
    POLL_INTERVAL: 2000,
    MAX_PROMPT_LENGTH: 500
};

// ==============================================================================
// INITIALIZE SUPABASE - Cek apakah sudah ada instance global
// ==============================================================================

let supabase;

// Jika sudah ada instance Supabase dari halaman lain, gunakan itu
if (window.supabaseClient) {
    supabase = window.supabaseClient;
    console.log('[Auth] Using existing Supabase instance');
} else {
    supabase = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,  // PENTING: untuk OAuth callback
                storage: window.localStorage  // Gunakan localStorage untuk persist
            }
        }
    );
    window.supabaseClient = supabase;
    console.log('[Auth] Created new Supabase instance');
}

// ==============================================================================
// STATE
// ==============================================================================

let currentUser = null;
let currentMode = 'text-to-video';
let selectedImage = null;
let selectedImageBase64 = null;
let currentJobId = null;
let pollInterval = null;
let userQuota = null;

// ==============================================================================
// DOM ELEMENTS
// ==============================================================================

const elements = {
    // Auth
    authSection: document.getElementById('authSection'),
    mainApp: document.getElementById('mainApp'),
    userInfo: document.getElementById('userInfo'),
    userEmail: document.getElementById('userEmail'),
    quotaInfo: document.getElementById('quotaInfo'),
    googleLoginBtn: document.getElementById('googleLoginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Mode
    modeButtons: document.querySelectorAll('.mode-btn'),
    imageUploadSection: document.getElementById('imageUploadSection'),
    
    // Form
    videoForm: document.getElementById('videoForm'),
    uploadArea: document.getElementById('uploadArea'),
    imageInput: document.getElementById('imageInput'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    imagePreview: document.getElementById('imagePreview'),
    removeImage: document.getElementById('removeImage'),
    prompt: document.getElementById('prompt'),
    charCount: document.getElementById('charCount'),
    generateBtn: document.getElementById('generateBtn'),
    grokOption: document.getElementById('grokOption'),
    
    // Progress
    progressSection: document.getElementById('progressSection'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    
    // Result
    resultSection: document.getElementById('resultSection'),
    resultVideo: document.getElementById('resultVideo'),
    downloadBtn: document.getElementById('downloadBtn'),
    newVideoBtn: document.getElementById('newVideoBtn'),
    resultInfo: document.getElementById('resultInfo'),
    
    // Error
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    
    // History
    historyList: document.getElementById('historyList')
};

// ==============================================================================
// AUTHENTICATION - IMPROVED
// ==============================================================================

async function checkAuth() {
    console.log('[Auth] Checking authentication...');
    
    try {
        // Method 1: Check existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('[Auth] Session error:', error);
        }
        
        if (session && session.user) {
            console.log('[Auth] Found existing session:', session.user.email);
            currentUser = session.user;
            showApp();
            await loadUserQuota();
            await loadHistory();
            return;
        }
        
        // Method 2: Check if there's a user (for edge cases)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            console.log('[Auth] Found user:', user.email);
            currentUser = user;
            showApp();
            await loadUserQuota();
            await loadHistory();
            return;
        }
        
        // No session found
        console.log('[Auth] No session found, showing login');
        showAuth();
        
    } catch (error) {
        console.error('[Auth] Check failed:', error);
        showAuth();
    }
}

async function loginWithGoogle() {
    console.log('[Auth] Starting Google login...');
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + window.location.pathname,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        
        if (error) {
            console.error('[Auth] Login error:', error);
            alert('Login failed: ' + error.message);
            return;
        }
        
        console.log('[Auth] OAuth initiated:', data);
        // User will be redirected to Google
        
    } catch (error) {
        console.error('[Auth] Login exception:', error);
        alert('Login failed. Please try again.');
    }
}

async function logout() {
    console.log('[Auth] Logging out...');
    
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        showAuth();
        
    } catch (error) {
        console.error('[Auth] Logout error:', error);
    }
}

function showAuth() {
    console.log('[Auth] Showing auth section');
    if (elements.authSection) elements.authSection.classList.remove('hidden');
    if (elements.mainApp) elements.mainApp.classList.add('hidden');
    if (elements.userInfo) elements.userInfo.classList.add('hidden');
    
    // Pastikan tombol bisa diklik
    if (elements.googleLoginBtn) {
        elements.googleLoginBtn.disabled = false;
        elements.googleLoginBtn.style.pointerEvents = 'auto';
        elements.googleLoginBtn.style.cursor = 'pointer';
    }
}

function showApp() {
    console.log('[Auth] Showing main app');
    if (elements.authSection) elements.authSection.classList.add('hidden');
    if (elements.mainApp) elements.mainApp.classList.remove('hidden');
    if (elements.userInfo) elements.userInfo.classList.remove('hidden');
    if (elements.userEmail) elements.userEmail.textContent = currentUser?.email || '';
}

// ==============================================================================
// QUOTA MANAGEMENT
// ==============================================================================

async function loadUserQuota() {
    try {
        const { data, error } = await supabase.rpc('check_service_limit', {
            p_service: 'video'
        });
        
        if (error) {
            console.error('[Quota] Error:', error);
            // Fallback: coba function check_limit biasa
            const { data: fallbackData, error: fallbackError } = await supabase.rpc('check_limit');
            if (!fallbackError && fallbackData && fallbackData.length > 0) {
                userQuota = {
                    remaining: fallbackData[0].remaining,
                    daily_limit: fallbackData[0].daily_limit,
                    plan_name: fallbackData[0].plan_name
                };
                updateQuotaDisplay();
                return;
            }
            return;
        }
        
        if (data && data.length > 0) {
            userQuota = data[0];
            updateQuotaDisplay();
            updateEngineAvailability();
        }
    } catch (error) {
        console.error('[Quota] Exception:', error);
    }
}

function updateQuotaDisplay() {
    if (!userQuota || !elements.quotaInfo) return;
    
    const { remaining, daily_limit, plan_name } = userQuota;
    const displayLimit = daily_limit === -1 ? '∞' : daily_limit;
    const displayRemaining = daily_limit === -1 ? '∞' : remaining;
    
    elements.quotaInfo.textContent = `${displayRemaining}/${displayLimit} videos • ${plan_name || 'Free'}`;
    elements.quotaInfo.className = `quota-badge ${remaining <= 0 && daily_limit !== -1 ? 'quota-empty' : ''}`;
    
    if (elements.generateBtn) {
        if (remaining <= 0 && daily_limit !== -1) {
            elements.generateBtn.disabled = true;
            elements.generateBtn.title = 'Daily limit reached';
        } else {
            elements.generateBtn.disabled = false;
            elements.generateBtn.title = '';
        }
    }
}

function updateEngineAvailability() {
    // Untuk free users, hanya Grok yang tersedia
    const planName = userQuota?.plan_name?.toLowerCase() || 'free';
    
    if (planName === 'free') {
        const grokInput = document.querySelector('input[name="engine"][value="grok"]');
        const veoInput = document.querySelector('input[name="engine"][value="veo"]');
        const autoInput = document.querySelector('input[name="engine"][value="auto"]');
        
        if (grokInput) grokInput.checked = true;
        if (veoInput) veoInput.disabled = true;
        if (autoInput) autoInput.disabled = true;
    }
}

// ==============================================================================
// MODE SWITCHING
// ==============================================================================

function switchMode(mode) {
    currentMode = mode;
    
    elements.modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    if (mode === 'image-to-video') {
        elements.imageUploadSection?.classList.remove('hidden');
    } else {
        elements.imageUploadSection?.classList.add('hidden');
        clearImage();
    }
}

// ==============================================================================
// IMAGE HANDLING
// ==============================================================================

function handleImageSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('Image too large. Maximum size is 10MB');
        return;
    }
    
    selectedImage = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        if (elements.imagePreview) {
            elements.imagePreview.src = selectedImageBase64;
            elements.imagePreview.classList.remove('hidden');
        }
        elements.uploadPlaceholder?.classList.add('hidden');
        elements.removeImage?.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImage = null;
    selectedImageBase64 = null;
    if (elements.imageInput) elements.imageInput.value = '';
    if (elements.imagePreview) {
        elements.imagePreview.classList.add('hidden');
        elements.imagePreview.src = '';
    }
    elements.uploadPlaceholder?.classList.remove('hidden');
    elements.removeImage?.classList.add('hidden');
}

// ==============================================================================
// VIDEO GENERATION
// ==============================================================================

async function generateVideo(e) {
    e.preventDefault();
    
    const prompt = elements.prompt?.value?.trim();
    const ratioInput = document.querySelector('input[name="ratio"]:checked');
    const engineInput = document.querySelector('input[name="engine"]:checked');
    
    const ratio = ratioInput?.value || '9:16';
    const engine = engineInput?.value || 'auto';
    
    if (!prompt) {
        alert('Please enter a video description');
        return;
    }
    
    if (currentMode === 'image-to-video' && !selectedImageBase64) {
        alert('Please upload an image for Image-to-Video mode');
        return;
    }
    
    setGenerateButtonLoading(true);
    hideAllSections();
    elements.progressSection?.classList.remove('hidden');
    updateProgress(0, 'Creating job...');
    
    try {
        const inputData = {
            prompt: prompt,
            aspect_ratio: ratio,
            engine: engine
        };
        
        if (selectedImageBase64) {
            inputData.image_base64 = selectedImageBase64;
        }
        
        // Coba function baru dulu
        let result = await supabase.rpc('create_service_job', {
            p_service: 'video',
            p_input_data: inputData,
            p_total_steps: 4
        });
        
        // Fallback ke function lama jika tidak ada
        if (result.error && result.error.message.includes('does not exist')) {
            console.log('[Generate] Falling back to create_job_secure');
            result = await supabase.rpc('create_job_secure', {
                p_service: 'video',
                p_input_data: inputData,
                p_total_steps: 4
            });
        }
        
        if (result.error) throw result.error;
        
        const data = result.data;
        if (!data || data.length === 0 || !data[0].success) {
            throw new Error(data?.[0]?.message || 'Failed to create job');
        }
        
        currentJobId = data[0].job_id;
        if (userQuota) {
            userQuota.remaining = data[0].remaining_quota;
            updateQuotaDisplay();
        }
        
        startPolling();
        
    } catch (error) {
        console.error('[Generate] Error:', error);
        showError(error.message);
        setGenerateButtonLoading(false);
    }
}

// ==============================================================================
// JOB POLLING
// ==============================================================================

function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    
    pollInterval = setInterval(async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', currentJobId)
                .single();
            
            if (error) throw error;
            if (!data) return;
            
            updateProgress(data.progress_percent, data.step_name);
            
            if (data.status === 'completed') {
                stopPolling();
                showResult(data.results);
            } else if (data.status === 'failed') {
                stopPolling();
                showError(data.error_message || 'Video generation failed');
            }
            
        } catch (error) {
            console.error('[Polling] Error:', error);
        }
    }, CONFIG.POLL_INTERVAL);
}

function stopPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
    }
    setGenerateButtonLoading(false);
}

function updateProgress(percent, text) {
    if (elements.progressFill) elements.progressFill.style.width = `${percent}%`;
    if (elements.progressText) elements.progressText.textContent = text || 'Processing...';
}

// ==============================================================================
// RESULTS & ERRORS
// ==============================================================================

function showResult(results) {
    hideAllSections();
    elements.resultSection?.classList.remove('hidden');
    
    const videoUrl = results?.video_url;
    if (elements.resultVideo) elements.resultVideo.src = videoUrl || '';
    if (elements.downloadBtn) elements.downloadBtn.href = videoUrl || '#';
    
    if (elements.resultInfo) {
        elements.resultInfo.innerHTML = `
            <span>🎬 Engine: ${results?.engine_used?.toUpperCase() || 'AI'}</span>
            <span>📐 Ratio: ${results?.aspect_ratio || '9:16'}</span>
            <span>📹 Mode: ${results?.mode || 'text-to-video'}</span>
        `;
    }
    
    loadHistory();
}

function showError(message) {
    hideAllSections();
    elements.errorSection?.classList.remove('hidden');
    if (elements.errorMessage) elements.errorMessage.textContent = message;
    setGenerateButtonLoading(false);
}

function hideAllSections() {
    elements.progressSection?.classList.add('hidden');
    elements.resultSection?.classList.add('hidden');
    elements.errorSection?.classList.add('hidden');
}

function resetForm() {
    hideAllSections();
    if (elements.prompt) elements.prompt.value = '';
    if (elements.charCount) elements.charCount.textContent = '0';
    clearImage();
    currentJobId = null;
    loadUserQuota();
}

// ==============================================================================
// HISTORY
// ==============================================================================

async function loadHistory() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('service', 'video')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        renderHistory(data || []);
        
    } catch (error) {
        console.error('[History] Error:', error);
    }
}

function renderHistory(jobs) {
    if (!elements.historyList) return;
    
    if (!jobs || jobs.length === 0) {
        elements.historyList.innerHTML = '<p class="no-history">No videos yet. Create your first one!</p>';
        return;
    }
    
    const html = jobs.map(job => {
        const date = new Date(job.created_at).toLocaleDateString();
        const status = getStatusBadge(job.status);
        const videoUrl = job.results?.video_url;
        
        return `
            <div class="history-item">
                <div class="history-thumb">
                    ${videoUrl ? 
                        `<video src="${videoUrl}" muted></video>` : 
                        `<div class="history-thumb-placeholder">${status}</div>`
                    }
                </div>
                <div class="history-info">
                    <p class="history-prompt">${(job.input_data?.prompt || 'No description').substring(0, 50)}...</p>
                    <span class="history-date">${date}</span>
                    <span class="history-status ${job.status}">${status}</span>
                </div>
                ${videoUrl ? `<a href="${videoUrl}" class="history-download" download title="Download">⬇️</a>` : ''}
            </div>
        `;
    }).join('');
    
    elements.historyList.innerHTML = html;
}

function getStatusBadge(status) {
    return { 'pending': '⏳', 'processing': '🔄', 'completed': '✅', 'failed': '❌' }[status] || '❓';
}

// ==============================================================================
// UI HELPERS
// ==============================================================================

function setGenerateButtonLoading(loading) {
    if (!elements.generateBtn) return;
    
    const btnText = elements.generateBtn.querySelector('.btn-text');
    const btnLoading = elements.generateBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText?.classList.add('hidden');
        btnLoading?.classList.remove('hidden');
        elements.generateBtn.disabled = true;
    } else {
        btnText?.classList.remove('hidden');
        btnLoading?.classList.add('hidden');
        elements.generateBtn.disabled = false;
    }
}

// ==============================================================================
// INITIALIZATION
// ==============================================================================

function initEventListeners() {
    // Auth
    elements.googleLoginBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('[Click] Google login button clicked');
        loginWithGoogle();
    });
    
    elements.logoutBtn?.addEventListener('click', logout);
    
    // Auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('[Auth] State changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
            currentUser = session.user;
            showApp();
            loadUserQuota();
            loadHistory();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuth();
        }
    });
    
    // Mode switching
    elements.modeButtons?.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
    
    // Image upload
    elements.uploadArea?.addEventListener('click', () => elements.imageInput?.click());
    elements.imageInput?.addEventListener('change', (e) => {
        if (e.target.files?.[0]) handleImageSelect(e.target.files[0]);
    });
    elements.removeImage?.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
    });
    
    // Drag and drop
    elements.uploadArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    elements.uploadArea?.addEventListener('dragleave', () => {
        elements.uploadArea?.classList.remove('dragover');
    });
    elements.uploadArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea?.classList.remove('dragover');
        if (e.dataTransfer?.files?.[0]) handleImageSelect(e.dataTransfer.files[0]);
    });
    
    // Prompt character count
    elements.prompt?.addEventListener('input', () => {
        const length = elements.prompt.value.length;
        if (elements.charCount) elements.charCount.textContent = length;
        if (length > CONFIG.MAX_PROMPT_LENGTH) {
            elements.prompt.value = elements.prompt.value.substring(0, CONFIG.MAX_PROMPT_LENGTH);
            if (elements.charCount) elements.charCount.textContent = CONFIG.MAX_PROMPT_LENGTH;
        }
    });
    
    // Form submission
    elements.videoForm?.addEventListener('submit', generateVideo);
    
    // Result actions
    elements.newVideoBtn?.addEventListener('click', resetForm);
    elements.retryBtn?.addEventListener('click', resetForm);
}

// ==============================================================================
// START
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] Video Generator starting...');
    console.log('[Init] Supabase URL:', CONFIG.SUPABASE_URL ? 'Set' : 'NOT SET!');
    
    // Initialize event listeners first
    initEventListeners();
    
    // Then check auth
    checkAuth();
});

// Juga cek auth ketika window focus (user kembali dari tab lain)
window.addEventListener('focus', () => {
    if (!currentUser) {
        checkAuth();
    }
});
