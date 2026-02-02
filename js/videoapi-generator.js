// =====================================================
// VIDEO GENERATOR - FRONTEND
// =====================================================

let currentUser = null;
let creditBalance = 0;
let currentJobId = null;
let pollingInterval = null;

// Credit costs per model
const MODEL_CREDITS = {
    'kling-2-5-pro': { base: 15, per10s: 28 },
    'kling-1-6-pro': { base: 10, per10s: 18 },
    'kling-1-6-std': { base: 6, per10s: 11 },
    'minimax-live': { base: 18, per10s: 18 },
    'minimax-hailuo-1080p': { base: 20, per10s: 20 },
    'wan-i2v-720p': { base: 8, per10s: 15 },
    'wan-t2v-720p': { base: 6, per10s: 11 },
    'seedance-720p': { base: 8, per10s: 15 },
    'runway-gen4': { base: 20, per10s: 35 },
    'vfx': { base: 5, per10s: 5 }
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        await loadUserData();
        showMainContent();
    } else {
        showAuthRequired();
    }
    
    updateModelUI();
});

async function loadUserData() {
    // Get credit balance
    const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', currentUser.id)
        .single();
    
    if (error && error.code === 'PGRST116') {
        // Create if not exists
        await supabase.from('user_credits').insert({ user_id: currentUser.id, balance: 0 });
        creditBalance = 0;
    } else if (data) {
        creditBalance = data.balance;
    }
    
    document.getElementById('creditBalance').textContent = creditBalance;
    document.getElementById('userName').textContent = currentUser.email?.split('@')[0] || 'User';
}

function showAuthRequired() {
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

function showMainContent() {
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('userInfo').style.display = 'flex';
}

async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// =====================================================
// UI UPDATES
// =====================================================

function updateModelUI() {
    updateCredits();
}

function updateCredits() {
    const modelId = document.getElementById('modelSelector').value;
    const duration = parseInt(document.getElementById('duration').value);
    const pricing = MODEL_CREDITS[modelId] || { base: 10, per10s: 18 };
    
    const credits = duration <= 5 ? pricing.base : pricing.per10s;
    
    document.getElementById('creditCost').textContent = credits;
    document.getElementById('totalCredits').textContent = credits;
}

function previewImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('imagePreview').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

function addLog(message, type = 'info') {
    const log = document.getElementById('statusLog');
    const time = new Date().toLocaleTimeString();
    log.innerHTML += `<p class="${type}">[${time}] ${message}</p>`;
    log.scrollTop = log.scrollHeight;
}

function updateProgress(percent, text) {
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressText').textContent = text;
}

// =====================================================
// GENERATE VIDEO
// =====================================================

async function generateVideo() {
    const modelId = document.getElementById('modelSelector').value;
    const prompt = document.getElementById('promptInput').value.trim();
    const duration = parseInt(document.getElementById('duration').value);
    
    if (!prompt && modelId !== 'vfx') {
        alert('Prompt is required!');
        return;
    }
    
    // Calculate credits
    const pricing = MODEL_CREDITS[modelId] || { base: 10, per10s: 18 };
    const requiredCredits = duration <= 5 ? pricing.base : pricing.per10s;
    
    if (creditBalance < requiredCredits) {
        alert(`Not enough credits! Need ${requiredCredits}, have ${creditBalance}`);
        showBuyCreditsModal();
        return;
    }
    
    // Disable button
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    // Show progress
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('statusLog').innerHTML = '';
    
    addLog(`Model: ${modelId}`, 'info');
    addLog(`Credits: ${requiredCredits}`, 'info');
    
    try {
        // Prepare image if exists
        let imageBase64 = null;
        const imageInput = document.getElementById('imageInput');
        if (imageInput.files[0]) {
            imageBase64 = await fileToBase64(imageInput.files[0]);
        }
        
        // ✅ DEDUCT CREDITS - GUNAKAN deduct_user_credits (bukan deduct_credits)
        addLog('Deducting credits...', 'info');
        const { data: deductResult, error: deductError } = await supabase
            .rpc('deduct_user_credits', {
                p_user_id: currentUser.id,
                p_amount: requiredCredits,
                p_model_name: modelId,
                p_description: `Video: ${modelId}`
            });
        
        if (deductError || !deductResult?.success) {
            throw new Error(deductResult?.error || 'Failed to deduct credits');
        }
        
        creditBalance = deductResult.balance_after;
        document.getElementById('creditBalance').textContent = creditBalance;
        addLog(`Credits deducted. Balance: ${creditBalance}`, 'success');
        
        // Create job
        addLog('Creating job...', 'info');
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert({
                user_id: currentUser.id,
                service: 'video',
                status: 'pending',
                input_data: {
                    model_id: modelId,
                    prompt: prompt,
                    negative_prompt: document.getElementById('negativePrompt').value,
                    duration: duration,
                    credits_used: requiredCredits,
                    user_id: currentUser.id,
                    settings: {
                        aspect_ratio: document.getElementById('aspectRatio').value,
                        cfg_scale: 0.5,
                        image: imageBase64
                    }
                },
                step_name: 'Queued',
                progress_percent: 0
            })
            .select()
            .single();
        
        if (jobError) throw jobError;
        
        currentJobId = job.id;
        addLog(`Job created: ${currentJobId.slice(0, 8)}...`, 'success');
        addLog('Waiting for worker to pick up...', 'info');
        
        // Start polling
        startPolling(currentJobId);
        
    } catch (error) {
        console.error('Generate error:', error);
        addLog(`Error: ${error.message}`, 'error');
        resetButton();
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

// =====================================================
// POLLING
// =====================================================

function startPolling(jobId) {
    pollingInterval = setInterval(async () => {
        try {
            const { data: job, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();
            
            if (error) throw error;
            
            updateProgress(job.progress_percent || 0, job.step_name || 'Processing...');
            
            if (job.status === 'completed') {
                clearInterval(pollingInterval);
                handleSuccess(job);
            } else if (job.status === 'failed') {
                clearInterval(pollingInterval);
                handleFailure(job);
            }
            
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000);
}

function handleSuccess(job) {
    addLog('✅ Video generated successfully!', 'success');
    
    const videoUrl = job.results?.video_url;
    if (videoUrl) {
        const video = document.getElementById('resultVideo');
        video.src = videoUrl;
        video.style.display = 'block';
        document.getElementById('placeholder').style.display = 'none';
        
        document.getElementById('downloadBtn').href = videoUrl;
        document.getElementById('videoActions').style.display = 'flex';
        
        addLog(`Video: ${videoUrl}`, 'success');
    }
    
    resetButton();
}

function handleFailure(job) {
    addLog(`❌ Failed: ${job.error_message || 'Unknown error'}`, 'error');
    addLog('Credits will be refunded automatically.', 'info');
    
    // Reload balance
    loadUserData();
    resetButton();
}

function resetButton() {
    const btn = document.getElementById('generateBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-play"></i> Generate Video';
}

// =====================================================
// CREDITS MODAL
// =====================================================

async function showBuyCreditsModal() {
    document.getElementById('buyCreditsModal').style.display = 'flex';
    
    const { data: packages } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
    
    const container = document.getElementById('creditPackages');
    container.innerHTML = packages.map(pkg => `
        <div class="package-card ${pkg.is_popular ? 'popular' : ''}" onclick="buyCredits('${pkg.id}')">
            <div class="package-info">
                <h4>${pkg.name}</h4>
                <div class="credits">${pkg.credits} kredit</div>
                ${pkg.bonus_credits ? `<div class="bonus">+${pkg.bonus_credits} bonus</div>` : ''}
            </div>
            <div class="price">Rp ${pkg.price.toLocaleString('id-ID')}</div>
        </div>
    `).join('');
}

function closeBuyCreditsModal() {
    document.getElementById('buyCreditsModal').style.display = 'none';
}

async function buyCredits(packageId) {
    // TODO: Integrate with Midtrans
    alert(`Coming soon! Package: ${packageId}`);
}
