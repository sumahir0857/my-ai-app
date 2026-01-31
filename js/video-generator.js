/**
 * VIDEO GENERATOR - Frontend JavaScript
 * =====================================
 * Handles UI interactions, Supabase integration, and job polling
 */

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const CONFIG = {
    SUPABASE_URL: 'https://xhjwmhoxrszzrwsmqhxi.supabase.co',  // Replace with your Supabase URL
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoandtaG94cnN6enJ3c21xaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDg1MjUsImV4cCI6MjA4MzAyNDUyNX0.JfMp7BY0PMhTc3xV2CoM6fTLsHSIrLyJyj9WMgeVFDM',  // Replace with your anon key
    POLL_INTERVAL: 2000,  // Poll every 2 seconds
    MAX_PROMPT_LENGTH: 500
};

// ==============================================================================
// INITIALIZE SUPABASE
// ==============================================================================

const supabase = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
);

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
// AUTHENTICATION
// ==============================================================================

async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showApp();
        await loadUserQuota();
        await loadHistory();
    } else {
        showAuth();
    }
}

async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.href
        }
    });
    
    if (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
    showAuth();
}

function showAuth() {
    elements.authSection.classList.remove('hidden');
    elements.mainApp.classList.add('hidden');
    elements.userInfo.classList.add('hidden');
}

function showApp() {
    elements.authSection.classList.add('hidden');
    elements.mainApp.classList.remove('hidden');
    elements.userInfo.classList.remove('hidden');
    elements.userEmail.textContent = currentUser.email;
}

// ==============================================================================
// QUOTA MANAGEMENT
// ==============================================================================

async function loadUserQuota() {
    try {
        const { data, error } = await supabase.rpc('check_service_limit', {
            p_service: 'video'
        });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            userQuota = data[0];
            updateQuotaDisplay();
            updateGrokAvailability();
        }
    } catch (error) {
        console.error('Failed to load quota:', error);
    }
}

function updateQuotaDisplay() {
    if (!userQuota) return;
    
    const { remaining, daily_limit, plan_name } = userQuota;
    const displayLimit = daily_limit === -1 ? '∞' : daily_limit;
    const displayRemaining = daily_limit === -1 ? '∞' : remaining;
    
    elements.quotaInfo.textContent = `${displayRemaining}/${displayLimit} videos • ${plan_name}`;
    elements.quotaInfo.className = `quota-badge ${remaining <= 0 && daily_limit !== -1 ? 'quota-empty' : ''}`;
    
    // Disable generate button if no quota
    if (remaining <= 0 && daily_limit !== -1) {
        elements.generateBtn.disabled = true;
        elements.generateBtn.title = 'Daily limit reached';
    } else {
        elements.generateBtn.disabled = false;
        elements.generateBtn.title = '';
    }
}

function updateGrokAvailability() {
    // For free users, only Grok is available (per your requirements)
    if (userQuota && userQuota.plan_name === 'Free') {
        document.querySelector('input[name="engine"][value="grok"]').checked = true;
        document.querySelector('input[name="engine"][value="veo"]').disabled = true;
        document.querySelector('input[name="engine"][value="auto"]').disabled = true;
    }
}

// ==============================================================================
// MODE SWITCHING
// ==============================================================================

function switchMode(mode) {
    currentMode = mode;
    
    // Update button states
    elements.modeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide image upload
    if (mode === 'image-to-video') {
        elements.imageUploadSection.classList.remove('hidden');
    } else {
        elements.imageUploadSection.classList.add('hidden');
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
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('Image too large. Maximum size is 10MB');
        return;
    }
    
    selectedImage = file;
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
        selectedImageBase64 = e.target.result;
        elements.imagePreview.src = selectedImageBase64;
        elements.imagePreview.classList.remove('hidden');
        elements.uploadPlaceholder.classList.add('hidden');
        elements.removeImage.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    selectedImage = null;
    selectedImageBase64 = null;
    elements.imageInput.value = '';
    elements.imagePreview.classList.add('hidden');
    elements.imagePreview.src = '';
    elements.uploadPlaceholder.classList.remove('hidden');
    elements.removeImage.classList.add('hidden');
}

// ==============================================================================
// VIDEO GENERATION
// ==============================================================================

async function generateVideo(e) {
    e.preventDefault();
    
    const prompt = elements.prompt.value.trim();
    const ratio = document.querySelector('input[name="ratio"]:checked').value;
    const engine = document.querySelector('input[name="engine"]:checked').value;
    
    // Validation
    if (!prompt) {
        alert('Please enter a video description');
        return;
    }
    
    if (currentMode === 'image-to-video' && !selectedImageBase64) {
        alert('Please upload an image for Image-to-Video mode');
        return;
    }
    
    // Show loading state
    setGenerateButtonLoading(true);
    hideAllSections();
    elements.progressSection.classList.remove('hidden');
    updateProgress(0, 'Creating job...');
    
    try {
        // Prepare input data
        const inputData = {
            prompt: prompt,
            aspect_ratio: ratio,
            engine: engine
        };
        
        if (selectedImageBase64) {
            inputData.image_base64 = selectedImageBase64;
        }
        
        // Create job via Supabase function
        const { data, error } = await supabase.rpc('create_service_job', {
            p_service: 'video',
            p_input_data: inputData,
            p_total_steps: 4
        });
        
        if (error) throw error;
        
        if (!data || data.length === 0 || !data[0].success) {
            const message = data?.[0]?.message || 'Failed to create job';
            throw new Error(message);
        }
        
        currentJobId = data[0].job_id;
        userQuota.remaining = data[0].remaining_quota;
        updateQuotaDisplay();
        
        // Start polling for progress
        startPolling();
        
    } catch (error) {
        console.error('Generate error:', error);
        showError(error.message);
        setGenerateButtonLoading(false);
    }
}

// ==============================================================================
// JOB POLLING
// ==============================================================================

function startPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    
    pollInterval = setInterval(async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', currentJobId)
                .single();
            
            if (error) throw error;
            
            if (!data) return;
            
            // Update progress
            updateProgress(data.progress_percent, data.step_name);
            
            // Check status
            if (data.status === 'completed') {
                stopPolling();
                showResult(data.results);
            } else if (data.status === 'failed') {
                stopPolling();
                showError(data.error_message || 'Video generation failed');
            }
            
        } catch (error) {
            console.error('Polling error:', error);
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
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = text || 'Processing...';
}

// ==============================================================================
// RESULTS & ERRORS
// ==============================================================================

function showResult(results) {
    hideAllSections();
    elements.resultSection.classList.remove('hidden');
    
    const videoUrl = results.video_url;
    elements.resultVideo.src = videoUrl;
    elements.downloadBtn.href = videoUrl;
    
    // Show result info
    elements.resultInfo.innerHTML = `
        <span>🎬 Engine: ${results.engine_used?.toUpperCase() || 'AI'}</span>
        <span>📐 Ratio: ${results.aspect_ratio || '9:16'}</span>
        <span>📹 Mode: ${results.mode || 'text-to-video'}</span>
    `;
    
    // Reload history
    loadHistory();
}

function showError(message) {
    hideAllSections();
    elements.errorSection.classList.remove('hidden');
    elements.errorMessage.textContent = message;
    setGenerateButtonLoading(false);
}

function hideAllSections() {
    elements.progressSection.classList.add('hidden');
    elements.resultSection.classList.add('hidden');
    elements.errorSection.classList.add('hidden');
}

function resetForm() {
    hideAllSections();
    elements.prompt.value = '';
    elements.charCount.textContent = '0';
    clearImage();
    currentJobId = null;
    loadUserQuota();
}

// ==============================================================================
// HISTORY
// ==============================================================================

async function loadHistory() {
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
        console.error('Failed to load history:', error);
    }
}

function renderHistory(jobs) {
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
                    <p class="history-prompt">${job.input_data?.prompt?.substring(0, 50) || 'No description'}...</p>
                    <span class="history-date">${date}</span>
                    <span class="history-status ${job.status}">${status}</span>
                </div>
                ${videoUrl ? `
                    <a href="${videoUrl}" class="history-download" download title="Download">⬇️</a>
                ` : ''}
            </div>
        `;
    }).join('');
    
    elements.historyList.innerHTML = html;
}

function getStatusBadge(status) {
    const badges = {
        'pending': '⏳',
        'processing': '🔄',
        'completed': '✅',
        'failed': '❌'
    };
    return badges[status] || '❓';
}

// ==============================================================================
// UI HELPERS
// ==============================================================================

function setGenerateButtonLoading(loading) {
    const btnText = elements.generateBtn.querySelector('.btn-text');
    const btnLoading = elements.generateBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        elements.generateBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        elements.generateBtn.disabled = false;
    }
}

// ==============================================================================
// EVENT LISTENERS
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuth();
    
    // Auth listeners
    elements.googleLoginBtn.addEventListener('click', loginWithGoogle);
    elements.logoutBtn.addEventListener('click', logout);
    
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
            showApp();
            loadUserQuota();
            loadHistory();
        } else {
            currentUser = null;
            showAuth();
        }
    });
    
    // Mode switching
    elements.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => switchMode(btn.dataset.mode));
    });
    
    // Image upload
    elements.uploadArea.addEventListener('click', () => elements.imageInput.click());
    elements.imageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImageSelect(e.target.files[0]);
    });
    elements.removeImage.addEventListener('click', (e) => {
        e.stopPropagation();
        clearImage();
    });
    
    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });
    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });
    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0]);
    });
    
    // Prompt character count
    elements.prompt.addEventListener('input', () => {
        const length = elements.prompt.value.length;
        elements.charCount.textContent = length;
        if (length > CONFIG.MAX_PROMPT_LENGTH) {
            elements.prompt.value = elements.prompt.value.substring(0, CONFIG.MAX_PROMPT_LENGTH);
            elements.charCount.textContent = CONFIG.MAX_PROMPT_LENGTH;
        }
    });
    
    // Form submission
    elements.videoForm.addEventListener('submit', generateVideo);
    
    // Result actions
    elements.newVideoBtn.addEventListener('click', resetForm);
    elements.retryBtn.addEventListener('click', resetForm);
});
