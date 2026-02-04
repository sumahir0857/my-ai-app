// ============================================
// VIDEO API GENERATOR v3.4 - SUPABASE STORAGE
// ============================================

let pollingInterval = null;
let userJobs = [];
let userCredits = 0;
let userStats = {};
let isNewUser = false;

// Track uploaded video URLs
let uploadedVideoUrls = {};

// ============================================
// MODEL PRICING
// ============================================

const MODEL_PRICING = {
    "kling-2-5-pro": 38,
    "kling-o1-pro-i2v": 56,
    "kling-o1-std-i2v": 42,
    "kling-o1-pro-ref": 84,
    "kling-o1-std-ref": 63,
    "kling-2-6-pro": 35,
    "kling-2-6-motion-pro": 70,
    "kling-2-6-motion-std": 35,
    "kling-2-1-pro": 50,
    "kling-1-6-pro": 51,
    "kling-1-6-std": 30,
    "minimax-live": 50,
    "minimax-hailuo-1080p": 49,
    "minimax-hailuo-1080p-fast": 33,
    "minimax-hailuo-768p": 28,
    "minimax-hailuo-768p-fast": 19,
    "wan-i2v-720p": 50,
    "wan-i2v-1080p": 75,
    "wan-t2v-720p": 50,
    "wan-t2v-1080p": 75,
    "seedance-480p": 13,
    "seedance-720p": 28,
    "seedance-1080p": 31,
    "ltx-t2v": 30,
    "ltx-i2v": 30,
    "runway-gen4": 75,
    "omnihuman": 81,
    "vfx": 9,
};

// ============================================
// CREDIT PACKAGES
// ============================================

const CREDIT_PACKAGES = [
    { id: 'starter', name: 'Starter', credits: 500, price: 25000, pricePerCredit: 50 },
    { id: 'creator', name: 'Creator', credits: 1000, price: 45000, pricePerCredit: 45 },
    { id: 'pro', name: 'Pro', credits: 2500, price: 100000, pricePerCredit: 40, popular: true },
    { id: 'studio', name: 'Studio', credits: 5000, price: 180000, pricePerCredit: 36, bestValue: true },
];

// ============================================
// MODEL CONFIGURATIONS - FIXED v3.6
// ============================================

const MODEL_CONFIGS = {
    // ==========================================
    // KLING 2.5 PRO - IMAGE TO VIDEO ONLY (No End Frame)
    // ==========================================
    'kling-2-5-pro': {
        type: 'image_to_video',
        desc: 'Image to Video - Gambar wajib diupload',
        showImage: true, 
        showImageTail: false, // No End Frame for 2.5
        showNegative: true, 
        showCfg: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true // IMPORTANT: Gambar wajib!
    },
    
    'kling-2-6-pro': {
        type: 'kling_2_6',
        desc: 'Text/Image to Video - Gambar opsional',
        showImage: true, 
        showNegative: true, 
        showCfg: true, 
        showAspectKling26: true, 
        showGenerateAudio: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: false // Image optional
    },
    
    'kling-2-1-pro': {
        type: 'image_to_video',
        desc: 'Image to Video - Gambar wajib',
        showImage: true, 
        showImageTail: true, 
        showNegative: true, 
        showCfg: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true
    },
    
    // ==========================================
    // KLING 1.6 - IMAGE TO VIDEO ONLY!
    // ==========================================
    'kling-1-6-pro': {
        type: 'image_to_video',
        desc: '⚠️ IMAGE WAJIB - Tidak bisa text-to-video!',
        showImage: true, 
        showImageTail: true, 
        showNegative: true, 
        showCfg: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true // WAJIB!
    },
    
    'kling-1-6-std': {
        type: 'image_to_video',
        desc: '⚠️ IMAGE WAJIB - Tidak bisa text-to-video!',
        showImage: true, 
        showImageTail: true, 
        showNegative: true, 
        showCfg: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true // WAJIB!
    },
    
    // ==========================================
    // KLING O1 - REQUIRES FIRST FRAME
    // ==========================================
    'kling-o1-pro-i2v': {
        type: 'kling_o1',
        desc: '⚠️ First Frame WAJIB diupload!',
        showFrames: true, 
        showAspectRatio: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresFirstFrame: true
    },
    
    'kling-o1-std-i2v': {
        type: 'kling_o1',
        desc: '⚠️ First Frame WAJIB diupload!',
        showFrames: true, 
        showAspectRatio: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresFirstFrame: true
    },
    
    // ==========================================
    // KLING O1 REFERENCE - REQUIRES REF IMAGES
    // ==========================================
    'kling-o1-pro-ref': {
        type: 'kling_o1_reference',
        desc: '⚠️ Minimal 1 Reference Image wajib!',
        showRefImages: true, 
        showAspectRatio: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresRefImages: true
    },
    
    'kling-o1-std-ref': {
        type: 'kling_o1_reference',
        desc: '⚠️ Minimal 1 Reference Image wajib!',
        showRefImages: true, 
        showAspectRatio: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresRefImages: true
    },
    
    'kling-2-6-motion-pro': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control - Gambar + Video wajib',
        showMotion: true, 
        showCfg: true,
        hideDuration: true
    },
    
    'kling-2-6-motion-std': {
        type: 'kling_2_6_motion',
        desc: 'Motion Control - Gambar + Video wajib',
        showMotion: true, 
        showCfg: true,
        hideDuration: true
    },
    
    // ==========================================
    // MINIMAX LIVE - NO DURATION!
    // ==========================================
    'minimax-live': {
        type: 'minimax_live',
        desc: 'Live Mode - Tanpa opsi durasi',
        showImage: true, 
        showPromptOptimizer: true,
        hideDuration: true,
        requiresImage: false
    },
    
    // ==========================================
    // HAILUO 1080p - FIXED 6 SECONDS
    // ==========================================
    'minimax-hailuo-1080p': {
        type: 'minimax_hailuo',
        desc: 'Fixed 6 detik',
        showFrames: true, 
        showPromptOptimizer: true,
        showDuration: true,
        durationOptions: [6],
        fixedDuration: 6
    },
    
    'minimax-hailuo-1080p-fast': {
        type: 'minimax_hailuo',
        desc: 'Fixed 6 detik - Fast',
        showFrames: true, 
        showPromptOptimizer: true,
        showDuration: true,
        durationOptions: [6],
        fixedDuration: 6
    },
    
    // ==========================================
    // HAILUO 768p - 6 OR 10 SECONDS
    // ==========================================
    'minimax-hailuo-768p': {
        type: 'minimax_hailuo',
        desc: '6 atau 10 detik',
        showFrames: true, 
        showPromptOptimizer: true,
        showDuration: true,
        durationOptions: [6, 10]
    },
    
    'minimax-hailuo-768p-fast': {
        type: 'minimax_hailuo',
        desc: '6 atau 10 detik - Fast',
        showFrames: true, 
        showPromptOptimizer: true,
        showDuration: true,
        durationOptions: [6, 10]
    },
    
    // ==========================================
    // WAN MODELS
    // ==========================================
    'wan-i2v-720p': {
        type: 'wan_i2v',
        desc: 'Image to Video 720p - Gambar wajib',
        showImage: true, 
        showNegative: true, 
        showWanSize: true,
        showPromptExpansion: true, 
        showShotType: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true
    },
    
    'wan-i2v-1080p': {
        type: 'wan_i2v',
        desc: 'Image to Video 1080p - Gambar wajib',
        showImage: true, 
        showNegative: true, 
        showWanSize: true,
        showPromptExpansion: true, 
        showShotType: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true
    },
    
    'wan-t2v-720p': {
        type: 'wan_t2v',
        desc: 'Text to Video 720p',
        showNegative: true, 
        showWanSize: true,
        showPromptExpansion: true, 
        showShotType: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10]
    },
    
    'wan-t2v-1080p': {
        type: 'wan_t2v',
        desc: 'Text to Video 1080p',
        showNegative: true, 
        showWanSize: true,
        showPromptExpansion: true, 
        showShotType: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10]
    },
    
    // ==========================================
    // SEEDANCE
    // ==========================================
    'seedance-480p': {
        type: 'seedance',
        desc: 'Paling hemat - Gambar opsional',
        showImage: true, 
        showAspectSeedance: true,
        showGenerateAudio: true, 
        showCameraFixed: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10]
    },
    
    'seedance-720p': {
        type: 'seedance',
        desc: 'Gambar opsional',
        showImage: true, 
        showAspectSeedance: true,
        showGenerateAudio: true, 
        showCameraFixed: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10]
    },
    
    'seedance-1080p': {
        type: 'seedance',
        desc: 'Gambar opsional',
        showImage: true, 
        showAspectSeedance: true,
        showGenerateAudio: true, 
        showCameraFixed: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10]
    },
    
    // ==========================================
    // LTX - DURATION: 6, 8, or 10 ONLY!
    // ==========================================
    'ltx-t2v': {
        type: 'ltx_t2v',
        desc: 'Text to Video - Durasi: 6, 8, atau 10 detik',
        showLtxResolution: true, 
        showGenerateAudio: true, 
        showFps: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [6, 8, 10]
    },
    
    'ltx-i2v': {
        type: 'ltx_i2v',
        desc: 'Image to Video - Durasi: 6, 8, atau 10 detik',
        showImage: true, 
        showLtxResolution: true,
        showGenerateAudio: true, 
        showFps: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [6, 8, 10],
        requiresImage: true
    },
    
    // ==========================================
    // RUNWAY GEN4 - REQUIRES IMAGE URL
    // ==========================================
    'runway-gen4': {
        type: 'runway',
        desc: '⚠️ Gambar WAJIB diupload!',
        showImage: true, 
        showRunwayRatio: true, 
        showSeed: true,
        showDuration: true,
        durationOptions: [5, 10],
        requiresImage: true
    },
    
    // ==========================================
    // OMNIHUMAN
    // ==========================================
    'omnihuman': {
        type: 'omnihuman',
        desc: 'Portrait + Audio wajib',
        showOmnihuman: true
    },
    
    // ==========================================
    // VFX
    // ==========================================
    'vfx': {
        type: 'vfx',
        desc: 'Video input wajib',
        showVfx: true, 
        noPrompt: true,
        requiresVideoUrl: true
    }
};

// ============================================
// CONSTANTS
// ============================================

const MAX_JOBS_PER_USER = 5;
const POLLING_INTERVAL_MS = 5000;
const SUPABASE_STORAGE_BUCKET = 'video-uploads';

// ============================================
// SUPABASE STORAGE UPLOAD - PRIMARY METHOD
// ============================================

async function uploadToSupabaseStorage(file, progressCallback = null) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error('Harus login untuk upload file');
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${user.id}/${timestamp}_${randomStr}.${ext}`;
        
        if (progressCallback) progressCallback(10, 'Connecting to Supabase...');
        
        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });
        
        if (error) {
            console.error('Supabase upload error:', error);
            throw new Error(error.message);
        }
        
        if (progressCallback) progressCallback(80, 'Getting public URL...');
        
        // Get public URL
        const { data: urlData } = supabaseClient.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(fileName);
        
        if (!urlData?.publicUrl) {
            throw new Error('Gagal mendapatkan public URL');
        }
        
        const publicUrl = urlData.publicUrl;
        console.log('✅ Uploaded to Supabase:', publicUrl);
        
        // Track upload in database (optional)
        try {
            await supabaseClient.from('temp_uploads').insert({
                user_id: user.id,
                file_path: fileName,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                public_url: publicUrl
            });
        } catch (e) {
            console.warn('Could not track upload:', e);
        }
        
        if (progressCallback) progressCallback(100, 'Upload complete!');
        
        return publicUrl;
        
    } catch (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
    }
}

// ============================================
// FALLBACK UPLOAD SERVICES
// ============================================

async function uploadToLitterbox(file, expiry = '1h') {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', expiry);
    formData.append('fileToUpload', file);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const url = await response.text();
            if (url.startsWith('http')) {
                console.log('✅ Uploaded to Litterbox:', url.trim());
                return url.trim();
            }
        }
    } catch (error) {
        console.error('Litterbox upload error:', error);
    }
    return null;
}

async function uploadToCatbox(file) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', file);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);
        
        const response = await fetch('https://catbox.moe/user/api.php', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const url = await response.text();
            if (url.startsWith('http')) {
                console.log('✅ Uploaded to Catbox:', url.trim());
                return url.trim();
            }
        }
    } catch (error) {
        console.error('Catbox upload error:', error);
    }
    return null;
}

// ============================================
// MAIN UPLOAD FUNCTION - SUPABASE FIRST
// ============================================

async function uploadFile(file, progressCallback = null) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    console.log(`📤 Uploading ${file.name} (${sizeMB} MB)...`);
    
    // Check file size limit (100MB)
    if (file.size > 100 * 1024 * 1024) {
        throw new Error(`File terlalu besar (${sizeMB} MB). Maksimal 100 MB.`);
    }
    
    let url = null;
    
    // Try Supabase Storage FIRST (most reliable)
    try {
        if (progressCallback) progressCallback(5, 'Uploading to Supabase...');
        url = await uploadToSupabaseStorage(file, progressCallback);
        if (url) return url;
    } catch (e) {
        console.warn('Supabase upload failed, trying fallback...', e);
    }
    
    // Fallback to Litterbox
    if (!url) {
        try {
            if (progressCallback) progressCallback(30, 'Trying Litterbox...');
            url = await uploadToLitterbox(file, '1h');
            if (url) {
                if (progressCallback) progressCallback(100, 'Upload complete!');
                return url;
            }
        } catch (e) {
            console.warn('Litterbox failed:', e);
        }
    }
    
    // Fallback to Catbox
    if (!url) {
        try {
            if (progressCallback) progressCallback(60, 'Trying Catbox...');
            url = await uploadToCatbox(file);
            if (url) {
                if (progressCallback) progressCallback(100, 'Upload complete!');
                return url;
            }
        } catch (e) {
            console.warn('Catbox failed:', e);
        }
    }
    
    throw new Error('Gagal mengupload file. Pastikan koneksi internet stabil dan coba lagi.');
}

// ============================================
// VIDEO URL VALIDATION
// ============================================

function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function isValidVideoUrl(url) {
    if (!isValidUrl(url)) return false;
    
    const videoPatterns = [
        /\.(mp4|mov|avi|webm|mkv)$/i,
        /supabase\.co\/storage/i,
        /catbox\.moe/i,
        /litterbox\.catbox\.moe/i,
    ];
    
    return videoPatterns.some(pattern => pattern.test(url));
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Video API Generator v3.4 loading...');
    
    const isLoggedIn = await checkAuth();
    
    if (isLoggedIn) {
        showGeneratorUI();
        await initializeUser();
        setupEventListeners();
        startPolling();
    } else {
        showLoginUI();
    }
});

async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return !!session;
    } catch (error) {
        console.error('Auth check error:', error);
        return false;
    }
}

function showLoginUI() {
    document.getElementById('login-section').style.display = 'flex';
    document.getElementById('generator-section').style.display = 'none';
    
    document.getElementById('btn-login-google').addEventListener('click', async () => {
        try {
            await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.href }
            });
        } catch (error) {
            alert('Login gagal: ' + error.message);
        }
    });
}

function showGeneratorUI() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('generator-section').style.display = 'block';
}

async function getCurrentUser() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    } catch (error) {
        return null;
    }
}

// ============================================
// INITIALIZE USER
// ============================================

async function initializeUser() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        document.getElementById('user-name').textContent = user.user_metadata?.full_name || user.email;
        const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
        if (avatarUrl) {
            document.getElementById('user-avatar').src = avatarUrl;
        }
        
        let creditData = null;
        
        const { data: credits, error } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (error && error.code === 'PGRST116') {
            const { data: newCredits, error: insertError } = await supabaseClient
                .from('user_credits')
                .insert({
                    user_id: user.id,
                    balance: 50,
                    total_purchased: 0,
                    total_used: 0,
                    total_refunded: 0
                })
                .select()
                .single();
            
            if (!insertError && newCredits) {
                creditData = {
                    balance: newCredits.balance,
                    total_used: 0,
                    total_refunded: 0,
                    is_new_user: true
                };
            }
        } else if (credits) {
            creditData = {
                balance: credits.balance,
                total_used: credits.total_used || 0,
                total_refunded: credits.total_refunded || 0,
                is_new_user: false
            };
        }
        
        if (creditData) {
            userCredits = creditData.balance || 0;
            userStats = creditData;
            isNewUser = creditData.is_new_user || false;
            
            updateCreditsUI();
            
            if (isNewUser) {
                setTimeout(() => {
                    alert(`🎉 Selamat datang!\n\nAnda mendapat 50 kredit GRATIS untuk mencoba layanan kami.`);
                }, 1000);
            }
        }
        
        await loadJobs();
        
    } catch (error) {
        console.error('Initialize user error:', error);
    }
}

// ============================================
// CREDITS UI
// ============================================

function updateCreditsUI() {
    const creditsFormatted = userCredits.toLocaleString('id-ID');
    
    document.getElementById('user-credits').textContent = creditsFormatted;
    document.getElementById('stat-credits').textContent = creditsFormatted;
    document.getElementById('stat-used').textContent = (userStats.total_used || 0).toLocaleString('id-ID');
    document.getElementById('stat-refunded').textContent = (userStats.total_refunded || 0).toLocaleString('id-ID');
    
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) {
        modalCredits.textContent = creditsFormatted + ' kredit';
    }
}

async function loadUserCredits() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data, error } = await supabaseClient
            .from('user_credits')
            .select('*')
            .eq('user_id', user.id)
            .single();
        
        if (!error && data) {
            userCredits = data.balance || 0;
            userStats = {
                balance: data.balance,
                total_used: data.total_used || 0,
                total_refunded: data.total_refunded || 0
            };
            updateCreditsUI();
        }
    } catch (error) {
        console.error('Load credits error:', error);
    }
}

// ============================================
// MODEL UI UPDATE
// ============================================

function updateModelUI() {
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const credits = MODEL_PRICING[modelId] || 30;
    
    if (!config) return;
    
    document.getElementById('estimated-credits').textContent = credits;
    document.getElementById('total-credits').textContent = credits;
    document.getElementById('model-desc').textContent = config.desc || '';
    
    // Hide all optional sections first
    const sections = [
        'section-image', 'section-frames', 'section-ref-images', 
        'section-motion', 'section-omnihuman', 'section-vfx',
        'group-image-tail', 'group-negative-prompt', 'group-cfg-scale',
        'group-aspect-ratio', 'group-aspect-ratio-kling26', 'group-aspect-ratio-seedance',
        'group-runway-ratio', 'group-wan-size', 'group-ltx-resolution',
        'group-duration',
        'group-seed', 'group-fps',
        'check-generate-audio', 'check-prompt-optimizer', 'check-prompt-expansion',
        'check-camera-fixed', 'group-shot-type'
    ];
    
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Prompt section
    const promptSection = document.getElementById('section-prompt');
    if (promptSection) {
        promptSection.style.display = config.noPrompt ? 'none' : 'block';
    }
    
    // Show relevant sections
    if (config.showImage) {
        const sectionImage = document.getElementById('section-image');
        const groupImage = document.getElementById('group-image');
        if (sectionImage) sectionImage.style.display = 'block';
        if (groupImage) groupImage.style.display = 'block';
    }
    if (config.showImageTail) {
        const el = document.getElementById('group-image-tail');
        if (el) el.style.display = 'block';
    }
    if (config.showNegative) {
        const el = document.getElementById('group-negative-prompt');
        if (el) el.style.display = 'block';
    }
    if (config.showCfg) {
        const el = document.getElementById('group-cfg-scale');
        if (el) el.style.display = 'block';
    }
    if (config.showFrames) {
        const el = document.getElementById('section-frames');
        if (el) el.style.display = 'block';
    }
    if (config.showRefImages) {
        const el = document.getElementById('section-ref-images');
        if (el) el.style.display = 'block';
    }
    if (config.showMotion) {
        const el = document.getElementById('section-motion');
        if (el) el.style.display = 'block';
    }
    if (config.showOmnihuman) {
        const el = document.getElementById('section-omnihuman');
        if (el) el.style.display = 'block';
    }
    if (config.showVfx) {
        const el = document.getElementById('section-vfx');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectRatio) {
        const el = document.getElementById('group-aspect-ratio');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectKling26) {
        const el = document.getElementById('group-aspect-ratio-kling26');
        if (el) el.style.display = 'block';
    }
    if (config.showAspectSeedance) {
        const el = document.getElementById('group-aspect-ratio-seedance');
        if (el) el.style.display = 'block';
    }
    if (config.showRunwayRatio) {
        const el = document.getElementById('group-runway-ratio');
        if (el) el.style.display = 'block';
    }
    if (config.showWanSize) {
        const el = document.getElementById('group-wan-size');
        if (el) el.style.display = 'block';
    }
    if (config.showLtxResolution) {
        const el = document.getElementById('group-ltx-resolution');
        if (el) el.style.display = 'block';
    }
    if (config.showSeed) {
        const el = document.getElementById('group-seed');
        if (el) el.style.display = 'block';
    }
    if (config.showFps) {
        const el = document.getElementById('group-fps');
        if (el) el.style.display = 'block';
    }
    if (config.showGenerateAudio) {
        const el = document.getElementById('check-generate-audio');
        if (el) el.style.display = 'flex';
    }
    if (config.showPromptOptimizer) {
        const el = document.getElementById('check-prompt-optimizer');
        if (el) el.style.display = 'flex';
    }
    if (config.showPromptExpansion) {
        const el = document.getElementById('check-prompt-expansion');
        if (el) el.style.display = 'flex';
    }
    if (config.showCameraFixed) {
        const el = document.getElementById('check-camera-fixed');
        if (el) el.style.display = 'flex';
    }
    if (config.showShotType) {
        const el = document.getElementById('group-shot-type');
        if (el) el.style.display = 'block';
    }
    
    // DURATION HANDLING
    const durationGroup = document.getElementById('group-duration');
    const durationSelect = document.getElementById('input-duration');
    
    if (config.hideDuration) {
        if (durationGroup) durationGroup.style.display = 'none';
    } else if (config.showDuration && config.durationOptions) {
        if (durationGroup) durationGroup.style.display = 'block';
        
        if (durationSelect) {
            durationSelect.innerHTML = '';
            config.durationOptions.forEach((duration, index) => {
                const option = document.createElement('option');
                option.value = duration;
                option.textContent = `${duration} detik`;
                if (index === 0) option.selected = true;
                durationSelect.appendChild(option);
            });
            durationSelect.disabled = config.durationOptions.length === 1;
        }
    } else {
        if (durationGroup) durationGroup.style.display = 'none';
    }
    
    // Reset uploaded video URLs when model changes
    uploadedVideoUrls = {};
    updateVideoUploadStatus();
}

function updateVideoUploadStatus() {
    const motionStatus = document.getElementById('motion-video-status');
    if (motionStatus) {
        if (uploadedVideoUrls.motion_video) {
            motionStatus.innerHTML = `<span class="upload-success">✅ Video ready: ${uploadedVideoUrls.motion_video.substring(0, 40)}...</span>`;
        } else {
            motionStatus.innerHTML = '';
        }
    }
    
    const vfxStatus = document.getElementById('vfx-video-status');
    if (vfxStatus) {
        if (uploadedVideoUrls.vfx_video) {
            vfxStatus.innerHTML = `<span class="upload-success">✅ Video ready: ${uploadedVideoUrls.vfx_video.substring(0, 40)}...</span>`;
        } else {
            vfxStatus.innerHTML = '';
        }
    }
}
// ============================================
// CUSTOM MODEL SELECTOR (Mobile Bottom Sheet)
// ============================================

const MODEL_GROUPS = [
    {
        title: '⭐ Kling Premium',
        models: ['kling-2-5-pro', 'kling-o1-pro-i2v', 'kling-o1-pro-ref', 'kling-2-6-pro', 'kling-2-6-motion-pro', 'kling-2-1-pro']
    },
    {
        title: '🎬 Kling Standard',
        models: ['kling-o1-std-i2v', 'kling-o1-std-ref', 'kling-2-6-motion-std', 'kling-1-6-pro', 'kling-1-6-std']
    },
    {
        title: '🎥 MiniMax / Hailuo',
        models: ['minimax-live', 'minimax-hailuo-1080p', 'minimax-hailuo-1080p-fast', 'minimax-hailuo-768p', 'minimax-hailuo-768p-fast']
    },
    {
        title: '🌊 WAN',
        models: ['wan-i2v-720p', 'wan-i2v-1080p', 'wan-t2v-720p', 'wan-t2v-1080p']
    },
    {
        title: '🌱 Seedance (Hemat)',
        models: ['seedance-480p', 'seedance-720p', 'seedance-1080p']
    },
    {
        title: '⚡ LTX',
        models: ['ltx-t2v', 'ltx-i2v']
    },
    {
        title: '🚀 RunWay & Lainnya',
        models: ['runway-gen4', 'omnihuman', 'vfx']
    }
];

const MODEL_DISPLAY_NAMES = {
    'kling-2-5-pro': 'Kling 2.5 Pro',
    'kling-o1-pro-i2v': 'Kling O1 Pro - Image to Video',
    'kling-o1-std-i2v': 'Kling O1 Std - Image to Video',
    'kling-o1-pro-ref': 'Kling O1 Pro - Video Reference',
    'kling-o1-std-ref': 'Kling O1 Std - Video Reference',
    'kling-2-6-pro': 'Kling 2.6 Pro - Text/Image to Video',
    'kling-2-6-motion-pro': 'Kling 2.6 Pro - Motion Control',
    'kling-2-6-motion-std': 'Kling 2.6 Std - Motion Control',
    'kling-2-1-pro': 'Kling 2.1 Pro',
    'kling-1-6-pro': 'Kling 1.6 Pro',
    'kling-1-6-std': 'Kling 1.6 Std',
    'minimax-live': 'MiniMax Video 01 Live',
    'minimax-hailuo-1080p': 'Hailuo 2.3 - 1080p',
    'minimax-hailuo-1080p-fast': 'Hailuo 2.3 - 1080p Fast',
    'minimax-hailuo-768p': 'Hailuo 2.3 - 768p',
    'minimax-hailuo-768p-fast': 'Hailuo 2.3 - 768p Fast',
    'wan-i2v-720p': 'WAN 2.6 - Image to Video 720p',
    'wan-i2v-1080p': 'WAN 2.6 - Image to Video 1080p',
    'wan-t2v-720p': 'WAN 2.6 - Text to Video 720p',
    'wan-t2v-1080p': 'WAN 2.6 - Text to Video 1080p',
    'seedance-480p': 'Seedance 1.5 Pro - 480p ⭐',
    'seedance-720p': 'Seedance 1.5 Pro - 720p',
    'seedance-1080p': 'Seedance 1.5 Pro - 1080p',
    'ltx-t2v': 'LTX 2.0 Pro - Text to Video',
    'ltx-i2v': 'LTX 2.0 Pro - Image to Video',
    'runway-gen4': 'RunWay Gen4 Turbo',
    'omnihuman': 'OmniHuman 1.5',
    'vfx': 'VFX - Visual Effects'
};

let currentSelectedModel = 'kling-2-5-pro';

function initCustomModelSelector() {
    const trigger = document.getElementById('model-select-trigger');
    const overlay = document.getElementById('model-sheet-overlay');
    const sheet = document.getElementById('model-sheet');
    const closeBtn = document.getElementById('model-sheet-close');
    const searchInput = document.getElementById('model-search');
    const content = document.getElementById('model-sheet-content');
    const valueDisplay = document.getElementById('model-select-value');
    const nativeSelect = document.getElementById('input-model');
    
    if (!trigger || !sheet) return;
    
    // Populate initial content
    renderModelList('');
    
    // Open sheet
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        openModelSheet();
    });
    
    // Close sheet
    overlay.addEventListener('click', closeModelSheet);
    closeBtn.addEventListener('click', closeModelSheet);
    
    // Search
    searchInput.addEventListener('input', (e) => {
        renderModelList(e.target.value.toLowerCase());
    });
    
    // Handle swipe down to close
    let touchStartY = 0;
    sheet.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    sheet.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        
        // If swiping down and at top of scroll
        if (diff > 50 && content.scrollTop === 0) {
            closeModelSheet();
        }
    }, { passive: true });
    
    // Sync with native select
    nativeSelect.addEventListener('change', () => {
        selectModel(nativeSelect.value, false);
    });
}

function openModelSheet() {
    const overlay = document.getElementById('model-sheet-overlay');
    const sheet = document.getElementById('model-sheet');
    const searchInput = document.getElementById('model-search');
    const wrapper = document.getElementById('model-select-wrapper');
    
    overlay.classList.add('active');
    sheet.classList.add('active');
    wrapper.classList.add('open');
    
    // Reset search
    searchInput.value = '';
    renderModelList('');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Focus search after animation
    setTimeout(() => {
        searchInput.focus();
    }, 300);
}

function closeModelSheet() {
    const overlay = document.getElementById('model-sheet-overlay');
    const sheet = document.getElementById('model-sheet');
    const wrapper = document.getElementById('model-select-wrapper');
    
    overlay.classList.remove('active');
    sheet.classList.remove('active');
    wrapper.classList.remove('open');
    
    // Restore body scroll
    document.body.style.overflow = '';
}

function renderModelList(searchTerm) {
    const content = document.getElementById('model-sheet-content');
    let html = '';
    let hasResults = false;
    
    MODEL_GROUPS.forEach(group => {
        const filteredModels = group.models.filter(modelId => {
            const name = MODEL_DISPLAY_NAMES[modelId] || modelId;
            const config = MODEL_CONFIGS[modelId];
            const desc = config?.desc || '';
            
            return name.toLowerCase().includes(searchTerm) || 
                   modelId.toLowerCase().includes(searchTerm) ||
                   desc.toLowerCase().includes(searchTerm);
        });
        
        if (filteredModels.length > 0) {
            hasResults = true;
            html += `<div class="model-group">`;
            html += `<div class="model-group-title">${group.title}</div>`;
            
            filteredModels.forEach(modelId => {
                const name = MODEL_DISPLAY_NAMES[modelId] || modelId;
                const credits = MODEL_PRICING[modelId] || 30;
                const config = MODEL_CONFIGS[modelId];
                const desc = config?.desc || '';
                const isSelected = modelId === currentSelectedModel;
                
                html += `
                    <div class="model-item ${isSelected ? 'selected' : ''}" 
                         data-model-id="${modelId}"
                         onclick="selectModel('${modelId}')">
                        <div class="model-item-info">
                            <div class="model-item-name">${name}</div>
                            <div class="model-item-desc">${desc}</div>
                        </div>
                        <div class="model-item-credits">🪙 ${credits}</div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
    });
    
    if (!hasResults) {
        html = `
            <div class="model-no-results">
                <span>🔍</span>
                <p>Tidak ada model ditemukan</p>
            </div>
        `;
    }
    
    content.innerHTML = html;
}

function selectModel(modelId, closeSheet = true) {
    currentSelectedModel = modelId;
    
    // Update native select
    const nativeSelect = document.getElementById('input-model');
    if (nativeSelect) {
        nativeSelect.value = modelId;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Update custom trigger display
    const valueDisplay = document.getElementById('model-select-value');
    const name = MODEL_DISPLAY_NAMES[modelId] || modelId;
    const credits = MODEL_PRICING[modelId] || 30;
    if (valueDisplay) {
        valueDisplay.textContent = `${name} (${credits} kredit)`;
    }
    
    // Update selected state in list
    document.querySelectorAll('.model-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.modelId === modelId);
    });
    
    // Close sheet
    if (closeSheet) {
        closeModelSheet();
    }
    
    // Update model UI
    updateModelUI();
}

// Make function global
window.selectModel = selectModel;

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const modelSelect = document.getElementById('input-model');
    if (modelSelect) {
        modelSelect.addEventListener('change', updateModelUI);
    }
    
    updateModelUI();
    
    const cfgSlider = document.getElementById('input-cfg');
    if (cfgSlider) {
        cfgSlider.addEventListener('input', () => {
            const cfgValue = document.getElementById('cfg-value');
            if (cfgValue) cfgValue.textContent = cfgSlider.value;
        });
    }
    
    // Standard file uploads
    setupFileUpload('input-image', 'preview-image', 'btn-remove-image');
    setupFileUpload('input-image-tail', 'preview-image-tail', 'btn-remove-image-tail');
    setupFileUpload('input-first-frame', 'preview-first-frame');
    setupFileUpload('input-last-frame', 'preview-last-frame');
    setupFileUpload('input-motion-image', 'preview-motion-image');
    setupFileUpload('input-omni-image', 'preview-omni-image');
    setupFileUpload('input-omni-audio', 'preview-omni-audio', null, false, true);
    
    // Video uploads with pre-upload to Supabase
    setupVideoUploadWithPreupload('input-motion-video', 'preview-motion-video', 'btn-upload-motion-video', 'motion-video-status', 'motion_video');
    setupVideoUploadWithPreupload('input-vfx-video', 'preview-vfx-video', 'btn-upload-vfx-video', 'vfx-video-status', 'vfx_video');
    
    // Video URL inputs
    setupVideoUrlInput('input-motion-video-url', 'motion_video');
    setupVideoUrlInput('input-vfx-video-url', 'vfx_video');
    
    for (let i = 1; i <= 7; i++) {
        setupFileUpload(`input-ref-${i}`, `preview-ref-${i}`);
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    const form = document.getElementById('generator-form');
    if (form) {
        form.addEventListener('submit', submitJob);
    }
    
    const buyBtn = document.getElementById('btn-buy-credits');
    if (buyBtn) {
        buyBtn.addEventListener('click', openCreditsModal);
    }
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    }
    
    const closeModalBtn = document.getElementById('btn-close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeJobModal);
    }
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) {
        jobModal.addEventListener('click', (e) => {
            if (e.target.id === 'job-modal') closeJobModal();
        });
    }
    
    // VFX filter handlers
    const filterSelect = document.getElementById('input-filter-type');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const filterType = parseInt(filterSelect.value);
            const bloomGroup = document.getElementById('group-bloom-contrast');
            const motionGroup = document.getElementById('group-motion-blur');
            if (bloomGroup) bloomGroup.style.display = filterType === 7 ? 'block' : 'none';
            if (motionGroup) motionGroup.style.display = filterType === 2 ? 'block' : 'none';
        });
    }
    
    const bloomSlider = document.getElementById('input-bloom-contrast');
    if (bloomSlider) {
        bloomSlider.addEventListener('input', () => {
            const bloomValue = document.getElementById('bloom-value');
            if (bloomValue) bloomValue.textContent = bloomSlider.value;
        });
    }
    
    const decaySlider = document.getElementById('input-motion-decay');
    if (decaySlider) {
        decaySlider.addEventListener('input', () => {
            const decayValue = document.getElementById('decay-value');
            if (decayValue) decayValue.textContent = decaySlider.value;
        });
    }
}

function setupFileUpload(inputId, previewId, removeId = null, isVideo = false, isAudio = false) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const url = URL.createObjectURL(file);
        preview.src = url;
        preview.style.display = 'block';
        
        const placeholder = preview.parentElement.querySelector('.upload-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        
        preview.parentElement.classList.add('has-preview');
        
        if (removeId) {
            const removeBtn = document.getElementById(removeId);
            if (removeBtn) removeBtn.style.display = 'block';
        }
    });
    
    if (removeId) {
        const removeBtn = document.getElementById(removeId);
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                input.value = '';
                preview.src = '';
                preview.style.display = 'none';
                
                const placeholder = preview.parentElement.querySelector('.upload-placeholder');
                if (placeholder) placeholder.style.display = 'flex';
                
                preview.parentElement.classList.remove('has-preview');
                removeBtn.style.display = 'none';
            });
        }
    }
}

// ============================================
// VIDEO UPLOAD WITH PRE-UPLOAD TO SUPABASE
// ============================================

function setupVideoUploadWithPreupload(inputId, previewId, uploadBtnId, statusId, urlKey) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const uploadBtn = document.getElementById(uploadBtnId);
    const statusEl = document.getElementById(statusId);
    
    if (!input) return;
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Show preview
        if (preview) {
            const url = URL.createObjectURL(file);
            preview.src = url;
            preview.style.display = 'block';
            
            const placeholder = preview.parentElement?.querySelector('.upload-placeholder');
            if (placeholder) placeholder.style.display = 'none';
            
            preview.parentElement?.classList.add('has-preview');
        }
        
        // Clear previous upload
        delete uploadedVideoUrls[urlKey];
        if (statusEl) {
            statusEl.innerHTML = `<span class="upload-pending">⚠️ Klik "Upload Video" untuk mengupload ke server</span>`;
        }
        
        // Enable upload button
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.style.display = 'block';
            uploadBtn.innerHTML = '📤 Upload Video ke Server';
        }
    });
    
    // Upload button handler
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const file = input.files[0];
            if (!file) {
                alert('Pilih video terlebih dahulu!');
                return;
            }
            
            // Check file size
            const sizeMB = file.size / 1024 / 1024;
            if (sizeMB > 100) {
                alert(`File terlalu besar (${sizeMB.toFixed(1)} MB).\nMaksimal 100 MB.`);
                return;
            }
            
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '⏳ Mengupload...';
            
            if (statusEl) {
                statusEl.innerHTML = '<span class="upload-progress">📤 Mengupload video ke Supabase...</span>';
            }
            
            try {
                const uploadedUrl = await uploadFile(file, (percent, msg) => {
                    if (statusEl) {
                        statusEl.innerHTML = `<span class="upload-progress">📤 ${msg} (${percent}%)</span>`;
                    }
                    uploadBtn.innerHTML = `⏳ ${percent}%`;
                });
                
                if (uploadedUrl) {
                    uploadedVideoUrls[urlKey] = uploadedUrl;
                    
                    if (statusEl) {
                        statusEl.innerHTML = `
                            <span class="upload-success">✅ Video berhasil diupload!</span>
                            <br><small class="upload-url">${uploadedUrl}</small>
                            <br><small class="upload-note">⏱️ Link valid 1 jam</small>
                        `;
                    }
                    
                    uploadBtn.innerHTML = '✅ Terupload';
                    uploadBtn.disabled = true;
                } else {
                    throw new Error('Upload gagal');
                }
            } catch (error) {
                console.error('Video upload error:', error);
                
                if (statusEl) {
                    statusEl.innerHTML = `<span class="upload-error">❌ ${error.message}</span>`;
                }
                
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '🔄 Coba Upload Lagi';
            }
        });
    }
}

// ============================================
// VIDEO URL INPUT
// ============================================

function setupVideoUrlInput(inputId, urlKey) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        const statusEl = input.parentElement?.querySelector('.url-status');
        
        if (url === '') {
            delete uploadedVideoUrls[urlKey];
            if (statusEl) statusEl.innerHTML = '';
            return;
        }
        
        if (isValidVideoUrl(url)) {
            uploadedVideoUrls[urlKey] = url;
            if (statusEl) {
                statusEl.innerHTML = '<span class="url-valid">✅ URL valid</span>';
            }
        } else {
            delete uploadedVideoUrls[urlKey];
            if (statusEl) {
                statusEl.innerHTML = '<span class="url-invalid">⚠️ Masukkan URL video yang valid</span>';
            }
        }
    });
}

// ============================================
// SUBMIT JOB (UPDATED WITH FULL VALIDATION)
// ============================================

async function submitJob(event) {
    event.preventDefault();
    
    const user = await getCurrentUser();
    if (!user) {
        alert('Silakan login terlebih dahulu');
        return;
    }
    
    const modelId = document.getElementById('input-model').value;
    const config = MODEL_CONFIGS[modelId];
    const requiredCredits = MODEL_PRICING[modelId] || 30;
    
    if (!config) {
        alert('Model tidak valid');
        return;
    }
    
    // ==========================================
    // VALIDATION - Check required inputs
    // ==========================================
    
    const promptEl = document.getElementById('input-prompt');
    const prompt = promptEl?.value?.trim() || '';
    
    // Check prompt (unless noPrompt model)
    if (!prompt && !config.noPrompt) {
        alert('Prompt wajib diisi!');
        return;
    }
    
    // Check image requirement (Image-to-Video models)
    if (config.requiresImage) {
        const imageFile = document.getElementById('input-image')?.files[0];
        if (!imageFile) {
            alert(`⚠️ Model ${modelId} WAJIB menggunakan gambar!\n\nModel ini adalah Image-to-Video, bukan Text-to-Video.\nSilakan upload gambar terlebih dahulu.`);
            return;
        }
    }
    
    // Check first frame requirement (Kling O1)
    if (config.requiresFirstFrame) {
        const firstFrameFile = document.getElementById('input-first-frame')?.files[0];
        if (!firstFrameFile) {
            alert(`⚠️ Model ${modelId} membutuhkan First Frame!\n\nUpload gambar di bagian "First Frame" terlebih dahulu.`);
            return;
        }
    }
    
    // Check reference images requirement (Kling O1 Ref)
    if (config.requiresRefImages) {
        let hasRefImage = false;
        for (let i = 1; i <= 7; i++) {
            if (document.getElementById(`input-ref-${i}`)?.files[0]) {
                hasRefImage = true;
                break;
            }
        }
        if (!hasRefImage) {
            alert(`⚠️ Model ${modelId} membutuhkan Reference Images!\n\nUpload minimal 1 gambar referensi.`);
            return;
        }
    }
    
    // Check Motion Control requirements
    if (config.showMotion) {
        if (!uploadedVideoUrls.motion_video) {
            alert('Video Motion belum diupload!\n\nKlik tombol "Upload Video ke Server" terlebih dahulu.');
            return;
        }
        const motionImg = document.getElementById('input-motion-image')?.files[0];
        if (!motionImg) {
            alert('Gambar karakter wajib diupload untuk Motion Control!');
            return;
        }
    }
    
    // Check VFX requirements
    if (config.showVfx) {
        if (!uploadedVideoUrls.vfx_video) {
            alert('Video VFX belum diupload!\n\nKlik tombol "Upload Video ke Server" terlebih dahulu.');
            return;
        }
    }
    
    // ==========================================
    // CHECK JOB LIMITS & CREDITS
    // ==========================================
    
    const activeJobsCount = userJobs.filter(j => ['pending', 'processing'].includes(j.status)).length;
    if (activeJobsCount >= MAX_JOBS_PER_USER) {
        alert(`Anda sudah memiliki ${activeJobsCount} job yang sedang berjalan.\n\nMaksimal ${MAX_JOBS_PER_USER} job bersamaan.`);
        return;
    }
    
    if (userCredits < requiredCredits) {
        alert(`Kredit tidak mencukupi!\n\nDibutuhkan: ${requiredCredits} kredit\nSaldo: ${userCredits} kredit`);
        openCreditsModal();
        return;
    }
    
    // ==========================================
    // SUBMIT PROCESS
    // ==========================================
    
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Memproses...';
    
    try {
        const inputData = await collectInputData(modelId, config, prompt, requiredCredits, user.id);
        
        const { data: currentCredits, error: fetchError } = await supabaseClient
            .from('user_credits')
            .select('balance, total_used')
            .eq('user_id', user.id)
            .single();
        
        if (fetchError || !currentCredits) {
            throw new Error('Gagal mengambil data kredit');
        }
        
        if (currentCredits.balance < requiredCredits) {
            throw new Error('Kredit tidak mencukupi');
        }
        
        const newBalance = currentCredits.balance - requiredCredits;
        const newTotalUsed = (currentCredits.total_used || 0) + requiredCredits;
        
        const { error: updateError } = await supabaseClient
            .from('user_credits')
            .update({ 
                balance: newBalance,
                total_used: newTotalUsed,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);
        
        if (updateError) {
            throw new Error('Gagal memotong kredit: ' + updateError.message);
        }
        
        userCredits = newBalance;
        userStats.total_used = newTotalUsed;
        updateCreditsUI();
        
        const { data: job, error: jobError } = await supabaseClient
            .from('jobs')
            .insert({
                user_id: user.id,
                service: 'videoapi',
                status: 'pending',
                input_data: inputData,
                total_steps: 4,
                current_step: 0,
                step_name: 'Queued',
                progress_percent: 0
            })
            .select()
            .single();
        
        if (jobError) {
            // Rollback credits
            await supabaseClient
                .from('user_credits')
                .update({ 
                    balance: currentCredits.balance,
                    total_used: currentCredits.total_used || 0
                })
                .eq('user_id', user.id);
            
            userCredits = currentCredits.balance;
            userStats.total_used = currentCredits.total_used || 0;
            updateCreditsUI();
            
            throw new Error('Gagal membuat job: ' + jobError.message);
        }
        
        alert(`✅ Job berhasil dibuat!\n\nModel: ${modelId}\nKredit: ${requiredCredits}\nSisa: ${userCredits}`);
        
        resetForm();
        switchTab('active');
        await loadJobs();
        
    } catch (error) {
        console.error('Submit error:', error);
        alert('Gagal: ' + error.message);
        await loadUserCredits();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚀 Generate Video';
    }
}

// ============================================
// COLLECT INPUT DATA
// ============================================

async function collectInputData(modelId, config, prompt, credits, userId) {
    const data = {
        model_id: modelId,
        prompt: prompt,
        negative_prompt: document.getElementById('input-negative')?.value || '',
        credits_used: credits,
        user_id: userId,
        settings: {}
    };
    
    const settings = data.settings;
    const submitBtn = document.getElementById('btn-submit');
    
    const updateStatus = (text) => {
        if (submitBtn) submitBtn.innerHTML = text;
    };
    
    // Duration
    if (config.showDuration && !config.hideDuration) {
        const durationSelect = document.getElementById('input-duration');
        if (durationSelect) {
            settings.duration = parseInt(durationSelect.value);
        } else if (config.fixedDuration) {
            settings.duration = config.fixedDuration;
        }
    }
    
    if (config.showCfg) {
        settings.cfg_scale = parseFloat(document.getElementById('input-cfg')?.value || 0.5);
    }
    if (config.showSeed) {
        settings.seed = parseInt(document.getElementById('input-seed')?.value || -1);
    }
    if (config.showFps) {
        settings.fps = parseInt(document.getElementById('input-fps')?.value || 25);
    }
    if (config.showAspectRatio) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio')?.value;
    }
    if (config.showAspectKling26) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio-kling26')?.value;
    }
    if (config.showAspectSeedance) {
        settings.aspect_ratio = document.getElementById('input-aspect-ratio-seedance')?.value;
    }
    if (config.showRunwayRatio) {
        settings.ratio = document.getElementById('input-runway-ratio')?.value || '1280:720';
    }
    if (config.showWanSize) {
        settings.size = document.getElementById('input-wan-size')?.value;
    }
    if (config.showLtxResolution) {
        settings.resolution = document.getElementById('input-ltx-resolution')?.value;
    }
    if (config.showGenerateAudio) {
        settings.generate_audio = document.getElementById('input-generate-audio')?.checked || false;
    }
    if (config.showPromptOptimizer) {
        settings.prompt_optimizer = document.getElementById('input-prompt-optimizer')?.checked ?? true;
    }
    if (config.showPromptExpansion) {
        settings.enable_prompt_expansion = document.getElementById('input-prompt-expansion')?.checked || false;
    }
    if (config.showCameraFixed) {
        settings.camera_fixed = document.getElementById('input-camera-fixed')?.checked || false;
    }
    if (config.showShotType) {
        settings.shot_type = document.getElementById('input-shot-type')?.value || 'single';
    }
    
    // Image uploads (base64)
    if (config.showImage) {
        const imgFile = document.getElementById('input-image')?.files[0];
        if (imgFile) {
            updateStatus('⏳ Processing image...');
            settings.image = await fileToBase64(imgFile);
        }
    }
    if (config.showImageTail) {
        const tailFile = document.getElementById('input-image-tail')?.files[0];
        if (tailFile) {
            settings.image_tail = await fileToBase64(tailFile);
        }
    }
    if (config.showFrames) {
        const firstFile = document.getElementById('input-first-frame')?.files[0];
        if (firstFile) {
            updateStatus('⏳ Processing first frame...');
            settings.first_frame = await fileToBase64(firstFile);
        }
        const lastFile = document.getElementById('input-last-frame')?.files[0];
        if (lastFile) {
            settings.last_frame = await fileToBase64(lastFile);
        }
    }
    if (config.showRefImages) {
        const refImages = [];
        for (let i = 1; i <= 7; i++) {
            const refFile = document.getElementById(`input-ref-${i}`)?.files[0];
            if (refFile) {
                updateStatus(`⏳ Processing ref image ${i}...`);
                refImages.push(await fileToBase64(refFile));
            }
        }
        if (refImages.length > 0) settings.reference_images = refImages;
    }
    
    // Motion Control - use pre-uploaded URL
    if (config.showMotion) {
        const motionImg = document.getElementById('input-motion-image')?.files[0];
        
        if (!motionImg) {
            throw new Error('Gambar karakter wajib diupload!');
        }
        
        if (!uploadedVideoUrls.motion_video) {
            throw new Error('Video motion belum diupload!');
        }
        
        updateStatus('⏳ Uploading character image...');
        settings.image_url = await uploadFile(motionImg);
        settings.video_url = uploadedVideoUrls.motion_video;
        settings.character_orientation = document.getElementById('input-character-orientation')?.value || 'video';
    }
    
    // OmniHuman
    if (config.showOmnihuman) {
        const omniImg = document.getElementById('input-omni-image')?.files[0];
        const omniAudio = document.getElementById('input-omni-audio')?.files[0];
        
        if (!omniImg || !omniAudio) {
            throw new Error('OmniHuman membutuhkan gambar dan audio!');
        }
        
        updateStatus('⏳ Uploading portrait...');
        settings.image_url = await uploadFile(omniImg);
        
        updateStatus('⏳ Uploading audio...');
        settings.audio_url = await uploadFile(omniAudio);
        
        settings.resolution = document.getElementById('input-omni-resolution')?.value || '1080p';
        settings.turbo_mode = document.getElementById('input-turbo-mode')?.checked || false;
    }
    
    // VFX - use pre-uploaded URL
    if (config.showVfx) {
        if (!uploadedVideoUrls.vfx_video) {
            throw new Error('Video VFX belum diupload!');
        }
        
        settings.video_url = uploadedVideoUrls.vfx_video;
        settings.filter_type = parseInt(document.getElementById('input-filter-type')?.value || 1);
        settings.fps = parseInt(document.getElementById('input-vfx-fps')?.value || 24);
        
        if (settings.filter_type === 7) {
            settings.bloom_contrast = parseFloat(document.getElementById('input-bloom-contrast')?.value || 1.2);
        }
        if (settings.filter_type === 2) {
            settings.motion_kernel = parseInt(document.getElementById('input-motion-kernel')?.value || 5);
            settings.motion_decay = parseFloat(document.getElementById('input-motion-decay')?.value || 0.8);
        }
    }
    
    updateStatus('⏳ Submitting job...');
    return data;
}

async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
    });
}

function resetForm() {
    const form = document.getElementById('generator-form');
    if (form) form.reset();
    
    document.querySelectorAll('.upload-preview').forEach(el => {
        el.style.display = 'none';
        el.src = '';
    });
    document.querySelectorAll('.upload-box').forEach(el => el.classList.remove('has-preview'));
    document.querySelectorAll('.btn-remove-upload').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.upload-placeholder').forEach(el => el.style.display = 'flex');
    
    // Reset video uploads
    uploadedVideoUrls = {};
    
    document.querySelectorAll('.video-upload-status').forEach(el => {
        el.innerHTML = '';
    });
    
    document.querySelectorAll('.btn-upload-video').forEach(btn => {
        btn.innerHTML = '📤 Upload Video ke Server';
        btn.disabled = true;
        btn.style.display = 'none';
    });
    
    document.querySelectorAll('.video-url-input').forEach(el => {
        el.value = '';
    });
    
    updateModelUI();
}

// ============================================
// LOAD & RENDER JOBS (Sisanya sama seperti sebelumnya)
// ============================================

async function loadJobs() {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const { data: jobs, error } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('service', 'videoapi')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        userJobs = jobs || [];
        renderJobs();
        
    } catch (error) {
        console.error('Load jobs error:', error);
    }
}

function renderJobs() {
    const activeJobs = userJobs.filter(j => ['pending', 'processing'].includes(j.status));
    const historyJobs = userJobs.filter(j => ['completed', 'failed', 'cancelled'].includes(j.status));
    
    document.getElementById('active-count').textContent = activeJobs.length;
    document.getElementById('history-count').textContent = historyJobs.length;
    
    const activeContainer = document.getElementById('active-jobs');
    if (activeJobs.length === 0) {
        activeContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🚀</span>
                <p>Tidak ada proses berjalan</p>
            </div>
        `;
    } else {
        activeContainer.innerHTML = activeJobs.map(job => renderJobCard(job, true)).join('');
    }
    
    const historyContainer = document.getElementById('history-jobs');
    if (historyJobs.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📁</span>
                <p>Belum ada riwayat</p>
            </div>
        `;
    } else {
        historyContainer.innerHTML = historyJobs.map(job => renderJobCard(job, false)).join('');
    }
}

function renderJobCard(job, isActive) {
    const input = job.input_data || {};
    const modelId = input.model_id || 'Unknown';
    const credits = input.credits_used || 0;
    const progress = job.progress_percent || 0;
    const stepName = job.step_name || 'Waiting...';
    const createdAt = new Date(job.created_at).toLocaleString('id-ID');
    
    const statusLabels = {
        'pending': '⏳ Menunggu',
        'processing': '⚙️ Memproses',
        'completed': '✅ Selesai',
        'failed': '❌ Gagal',
        'cancelled': '🚫 Dibatalkan'
    };
    
    let resultPreview = '';
    if (job.status === 'completed' && job.results) {
        const results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
        if (results.video_url) {
            resultPreview = `<video src="${results.video_url}" class="job-preview-video" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`;
        }
    }
    
    return `
        <div class="job-card status-${job.status}" onclick="openJobModal('${job.id}')">
            <div class="job-header">
                <span class="job-model">${modelId}</span>
                <span class="job-status status-${job.status}">${statusLabels[job.status]}</span>
            </div>
            ${resultPreview}
            <div class="job-info">
                <span class="job-credits">🪙 ${credits} kredit</span>
                <span class="job-date">${createdAt}</span>
            </div>
            ${isActive ? `
                <div class="job-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}% - ${stepName}</span>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// JOB MODAL - Bagian ini SEBELUM purchaseCredits
// ============================================

function openJobModal(jobId) {
    const job = userJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const input = job.input_data || {};
    const results = typeof job.results === 'string' ? JSON.parse(job.results || '{}') : (job.results || {});
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) modalTitle.textContent = input.model_id || 'Job Details';
    
    const statusEl = document.getElementById('modal-status');
    if (statusEl) {
        statusEl.textContent = job.status;
        statusEl.className = 'status-badge status-' + job.status;
    }
    
    const progressSection = document.getElementById('modal-progress');
    const resultsSection = document.getElementById('modal-results');
    const errorSection = document.getElementById('modal-error');
    
    if (job.status === 'completed') {
        if (progressSection) progressSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'block';
        
        if (results.video_url) {
            const modalVideo = document.getElementById('modal-video');
            const modalDownload = document.getElementById('modal-download');
            if (modalVideo) modalVideo.src = results.video_url;
            if (modalDownload) modalDownload.href = results.video_url;
        }
        
        const modalModel = document.getElementById('modal-model');
        const modalCreditsFinal = document.getElementById('modal-credits-final');
        if (modalModel) modalModel.textContent = input.model_id || '-';
        if (modalCreditsFinal) modalCreditsFinal.textContent = (input.credits_used || 0) + ' kredit';
        
    } else if (job.status === 'failed' || job.status === 'cancelled') {
        if (progressSection) progressSection.style.display = 'none';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'block';
        
        const modalErrorMsg = document.getElementById('modal-error-msg');
        if (modalErrorMsg) modalErrorMsg.textContent = job.error_message || 'Proses tidak selesai dalam waktu yang ditentukan';
        
    } else {
        if (progressSection) progressSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        if (errorSection) errorSection.style.display = 'none';
        
        const progress = job.progress_percent || 0;
        const modalProgressFill = document.getElementById('modal-progress-fill');
        const modalProgressPercent = document.getElementById('modal-progress-percent');
        const modalCreditsUsed = document.getElementById('modal-credits-used');
        const modalStep = document.getElementById('modal-step');
        
        if (modalProgressFill) modalProgressFill.style.width = progress + '%';
        if (modalProgressPercent) modalProgressPercent.textContent = progress + '%';
        if (modalCreditsUsed) modalCreditsUsed.textContent = (input.credits_used || 0) + ' kredit';
        if (modalStep) modalStep.textContent = job.step_name || 'Waiting...';
    }
    
    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.style.display = 'flex';
}

function closeJobModal() {
    const jobModal = document.getElementById('job-modal');
    if (jobModal) jobModal.style.display = 'none';
    
    const modalVideo = document.getElementById('modal-video');
    if (modalVideo) modalVideo.pause();
}

// ============================================
// CREDITS MODAL & PURCHASE - LETAKKAN DI SINI!
// ============================================

function openCreditsModal() {
    const grid = document.getElementById('packages-grid');
    if (grid) {
        grid.innerHTML = CREDIT_PACKAGES.map(pkg => `
            <div class="package-card ${pkg.popular ? 'popular' : ''} ${pkg.bestValue ? 'best-value' : ''}">
                ${pkg.popular ? '<span class="package-badge">⭐ Recommended</span>' : ''}
                ${pkg.bestValue ? '<span class="package-badge best">💎 Best Value</span>' : ''}
                <h3 class="package-name">${pkg.name}</h3>
                <div class="package-credits">${pkg.credits.toLocaleString('id-ID')} Kredit</div>
                <div class="package-price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
                <div class="package-per-credit">Rp ${pkg.pricePerCredit}/kredit</div>
                <button class="btn-buy-package" data-package-id="${pkg.id}">Beli Sekarang</button>
            </div>
        `).join('');
        
        grid.querySelectorAll('.btn-buy-package').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const packageId = btn.dataset.packageId;
                purchaseCredits(packageId, btn);
            });
        });
    }
    
    const modalCredits = document.getElementById('modal-current-credits');
    if (modalCredits) {
        modalCredits.textContent = userCredits.toLocaleString('id-ID') + ' kredit';
    }
    
    const creditsModal = document.getElementById('credits-modal');
    if (creditsModal) creditsModal.style.display = 'flex';
}

function closeCreditsModal() {
    const creditsModal = document.getElementById('credits-modal');
    if (creditsModal) creditsModal.style.display = 'none';
}

async function purchaseCredits(packageId, buttonElement) {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            alert('Silakan login terlebih dahulu');
            return;
        }
        
        const btn = buttonElement;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Memproses...';
        
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg) {
            throw new Error('Paket tidak ditemukan');
        }
        
        // Generate short order ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        const orderId = `VC${timestamp}${random}`;
        
        // Save to database
        try {
            await supabaseClient
                .from('credit_purchases')
                .insert({
                    user_id: session.user.id,
                    order_id: orderId,
                    package_id: packageId,
                    amount_idr: pkg.price,
                    credits: pkg.credits,
                    status: 'pending'
                });
        } catch (e) {
            console.warn('Could not save purchase:', e);
        }
        
        // Check if Midtrans Snap is loaded
        if (typeof window.snap === 'undefined') {
            alert('💳 Midtrans belum dimuat.\n\nSilakan refresh halaman dan coba lagi.');
            btn.disabled = false;
            btn.textContent = originalText;
            return;
        }
        
        // Short item name (max 50 chars)
        const itemName = `${pkg.credits} Credits`;
        
        // Call Edge Function to create payment
        const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ 
                plan_id: packageId,
                order_id: orderId,
                amount: pkg.price,
                plan_name: itemName
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Payment error:', response.status, errorText);
            throw new Error('Gagal membuat pembayaran');
        }
        
        const result = await response.json();
        
        if (!result.success || !result.snap_token) {
            throw new Error(result.message || 'Gagal mendapatkan token');
        }
        
        // Open Midtrans Snap popup
        window.snap.pay(result.snap_token, {
            onSuccess: async function(paymentResult) {
                console.log('Payment success:', paymentResult);
                
                try {
                    // Update credits in database
                    const { data: currentCredits } = await supabaseClient
                        .from('user_credits')
                        .select('balance, total_purchased')
                        .eq('user_id', session.user.id)
                        .single();
                    
                    if (currentCredits) {
                        await supabaseClient
                            .from('user_credits')
                            .update({
                                balance: currentCredits.balance + pkg.credits,
                                total_purchased: (currentCredits.total_purchased || 0) + pkg.credits,
                                updated_at: new Date().toISOString()
                            })
                            .eq('user_id', session.user.id);
                    }
                    
                    // Update purchase status
                    await supabaseClient
                        .from('credit_purchases')
                        .update({ 
                            status: 'paid', 
                            paid_at: new Date().toISOString(),
                            payment_data: paymentResult
                        })
                        .eq('order_id', orderId);
                        
                } catch (e) {
                    console.error('Credit update error:', e);
                }
                
                alert(`🎉 Pembayaran berhasil!\n\n+${pkg.credits} kredit ditambahkan ke akun Anda.`);
                closeCreditsModal();
                await loadUserCredits();
            },
            
            onPending: function(pendingResult) {
                console.log('Payment pending:', pendingResult);
                alert('⏳ Menunggu pembayaran...\n\nKredit akan ditambahkan otomatis setelah pembayaran dikonfirmasi.');
                closeCreditsModal();
            },
            
            onError: function(errorResult) {
                console.error('Payment error:', errorResult);
                alert('❌ Pembayaran gagal.\n\nSilakan coba lagi.');
                
                // Update purchase status
                supabaseClient
                    .from('credit_purchases')
                    .update({ status: 'failed' })
                    .eq('order_id', orderId);
            },
            
            onClose: function() {
                console.log('Payment popup closed');
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
        
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Gagal: ' + error.message);
        
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = 'Beli Sekarang';
        }
    }
}

// ============================================
// TABS & PRICING - Bagian ini SETELAH purchaseCredits
// ============================================

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });
    
    if (tabName === 'pricing') loadPricingTable();
}

function loadPricingTable() {
    const grid = document.getElementById('pricing-grid');
    if (!grid) return;
    
    const categories = {
        'Kling Premium': ['kling-2-5-pro', 'kling-o1-pro-i2v', 'kling-o1-pro-ref', 'kling-2-6-pro', 'kling-2-6-motion-pro', 'kling-2-1-pro'],
        'Kling Standard': ['kling-o1-std-i2v', 'kling-o1-std-ref', 'kling-2-6-motion-std', 'kling-1-6-pro', 'kling-1-6-std'],
        'MiniMax / Hailuo': ['minimax-live', 'minimax-hailuo-1080p', 'minimax-hailuo-1080p-fast', 'minimax-hailuo-768p', 'minimax-hailuo-768p-fast'],
        'WAN': ['wan-i2v-720p', 'wan-i2v-1080p', 'wan-t2v-720p', 'wan-t2v-1080p'],
        'Seedance (Hemat)': ['seedance-480p', 'seedance-720p', 'seedance-1080p'],
        'LTX': ['ltx-t2v', 'ltx-i2v'],
        'Lainnya': ['runway-gen4', 'omnihuman', 'vfx']
    };
    
    let html = '';
    for (const [category, models] of Object.entries(categories)) {
        html += `<div class="pricing-category"><h3>${category}</h3>`;
        for (const modelId of models) {
            const config = MODEL_CONFIGS[modelId];
            const credits = MODEL_PRICING[modelId];
            if (!config) continue;
            html += `
                <div class="pricing-item">
                    <div class="pricing-model">${modelId}</div>
                    <div class="pricing-desc">${config.desc || ''}</div>
                    <div class="pricing-credits">🪙 ${credits} kredit</div>
                </div>
            `;
        }
        html += '</div>';
    }
    grid.innerHTML = html;
}

// ============================================
// POLLING
// ============================================

function startPolling() {
    if (pollingInterval) clearInterval(pollingInterval);
    
    pollingInterval = setInterval(async () => {
        const hasActiveJobs = userJobs.some(j => ['pending', 'processing'].includes(j.status));
        if (hasActiveJobs) {
            await loadJobs();
            await loadUserCredits();
        }
    }, POLLING_INTERVAL_MS);
}

// ============================================
// TUTORIAL LINK
// ============================================

function openVideoTutorial() {
    window.open('video-upload-tutorial.html', '_blank');
}

// ============================================
// GLOBAL EXPORTS
// ============================================

window.openJobModal = openJobModal;
window.closeJobModal = closeJobModal;
window.openCreditsModal = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;
window.openVideoTutorial = openVideoTutorial;
window.purchaseCredits = purchaseCredits;

console.log('✅ Video API Generator loaded');
