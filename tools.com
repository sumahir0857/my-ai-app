<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Tools Hub - OrbitBot</title>
    
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <link rel="stylesheet" href="css/tools-hub.css">
</head>
<body>
    <!-- Login Screen -->
    <div id="login-screen" class="login-screen">
        <div class="login-container">
            <div class="login-logo">
                <div class="logo-icon"><span>🛰️</span></div>
                <h1>OrbitBot</h1>
                <p>AI Tools Hub</p>
            </div>
            <div class="login-features">
                <div class="feature-item"><span class="feature-icon">🎬</span><span>Video Generator - VEO 3.1</span></div>
                <div class="feature-item"><span class="feature-icon">🖼️</span><span>Image Generator - Nano Banana</span></div>
                <div class="feature-item"><span class="feature-icon">📽️</span><span>UGC Affiliate Generator</span></div>
            </div>
            <button id="btn-login-google" class="btn-google">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Masuk dengan Google
            </button>
        </div>
    </div>

    <!-- Main App Container -->
    <div id="main-app" class="main-app" style="display: none;">
        
        <!-- LEFT SIDEBAR -->
        <aside id="sidebar-left" class="sidebar-left">
            <div class="sidebar-header">
                <a href="/" class="logo">
                    <span class="logo-icon">🛰️</span>
                    <span class="logo-text">OrbitBot</span>
                </a>
                <button id="btn-collapse-left" class="btn-collapse" title="Collapse">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
                    </svg>
                </button>
            </div>

            <div class="sidebar-user">
                <img id="sidebar-avatar" src="" alt="Avatar">
                <div class="user-info">
                    <span id="sidebar-name">User</span>
                    <span id="sidebar-plan" class="plan-badge">Free</span>
                </div>
            </div>

            <nav class="sidebar-nav" id="tools-nav"></nav>

            <div class="sidebar-footer">
                <a href="pricing.html" class="upgrade-btn">
                    <span>⚡</span><span class="btn-label">Upgrade</span>
                </a>
                <button id="btn-logout" class="logout-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                    </svg>
                    <span class="btn-label">Keluar</span>
                </button>
            </div>
        </aside>

        <!-- MOBILE HEADER -->
        <header class="mobile-header">
            <button id="btn-open-left" class="btn-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
            <div class="mobile-title">
                <span id="mobile-tool-icon">🖼️</span>
                <span id="mobile-tool-name">Image Generator</span>
            </div>
            <button id="btn-open-right" class="btn-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
            </button>
        </header>

        <div id="sidebar-overlay" class="sidebar-overlay"></div>

        <!-- MAIN CONTENT -->
        <main class="main-content" id="main-content"></main>

        <!-- RIGHT SIDEBAR (HISTORY) -->
        <aside id="sidebar-right" class="sidebar-right">
            <div class="sidebar-header">
                <h3>📁 Riwayat</h3>
                <button id="btn-collapse-right" class="btn-collapse" title="Collapse">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 5l7 7-7 7M6 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
            <div class="history-tabs" id="history-tabs"></div>
            <div class="history-warning">⚠️ Dihapus otomatis setelah 3 jam</div>
            <div class="history-list" id="history-list">
                <div class="empty-history"><span>📁</span><p>Belum ada riwayat</p></div>
            </div>
        </aside>
    </div>
        </aside>

        <!-- TOMBOL UNTUK MEMBUKA SIDEBAR RIWAYAT (FIX 2) -->
        <button id="btn-expand-right" class="btn-expand-right" title="Buka Riwayat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
    </div>

    <!-- MEDIA MODAL -->
    <div id="media-modal" class="media-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <button class="modal-close" id="btn-close-modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <img id="modal-image" src="" alt="Preview" style="display: none;">
            <video id="modal-video" controls style="display: none;"></video>
            <div class="modal-actions">
                <a id="modal-download" class="modal-btn primary" download>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    Download
                </a>
                <button id="modal-edit" class="modal-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
            </div>
        </div>
    </div>

    <!-- UGC RESULT MODAL -->
    <div id="ugc-modal" class="media-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content ugc-modal-content">
            <button class="modal-close" id="btn-close-ugc-modal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <div class="ugc-modal-body">
                <h2 id="ugc-modal-title">Detail Job</h2>
                <div id="ugc-modal-status" class="ugc-status-badge">pending</div>
                
                <!-- Progress -->
                <div id="ugc-modal-progress" class="ugc-progress-section">
                    <div class="progress-track"><div id="ugc-progress-bar" class="progress-bar"></div></div>
                    <div class="progress-meta">
                        <span id="ugc-progress-step">Menunggu...</span>
                        <span id="ugc-progress-pct">0%</span>
                    </div>
                </div>
                
                <!-- Results -->
                <div id="ugc-modal-results" class="ugc-results-section" style="display:none;">
                    <div class="ugc-result-group">
                        <h4>📸 Gambar</h4>
                        <div id="ugc-result-images" class="ugc-gallery"></div>
                    </div>
                    <div class="ugc-result-group">
                        <h4>🎬 Video Clips</h4>
                        <div id="ugc-result-videos" class="ugc-gallery"></div>
                    </div>
                    <div class="ugc-result-group" id="ugc-final-video-group" style="display:none;">
                        <h4>🎥 Video Final</h4>
                        <video id="ugc-result-final" controls class="ugc-final-video"></video>
                        <a id="ugc-download-final" class="ugc-download-btn" download>⬇️ Download Video</a>
                    </div>
                    <div class="ugc-result-group" id="ugc-audio-group" style="display:none;">
                        <h4>🎵 Audio</h4>
                        <audio id="ugc-result-audio" controls class="ugc-audio"></audio>
                        <a id="ugc-download-audio" class="ugc-download-btn" download>⬇️ Download Audio</a>
                    </div>
                    <div class="ugc-result-group" id="ugc-script-group" style="display:none;">
                        <h4>📝 Script</h4>
                        <p id="ugc-result-script" class="ugc-script"></p>
                    </div>
                </div>
                
                <!-- Error -->
                <div id="ugc-modal-error" class="ugc-error-section" style="display:none;">
                    <p id="ugc-error-msg"></p>
                </div>
            </div>
        </div>
    </div>

    <script src="js/supabase-config.js"></script>
    <script src="js/tools-hub.js"></script>
</body>
</html>
