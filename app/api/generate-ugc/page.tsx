// app/ugc-generator/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client (untuk auth user saat ini)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UGCGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [finalVideo, setFinalVideo] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setLogs([]);
    setFinalVideo(null);
    setErrorMsg('');

    // Ambil User ID dari sesi login saat ini
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Silakan login terlebih dahulu.");
      setLoading(false);
      return;
    }

    try {
      // Panggil API Proxy kita sendiri (Bukan cURL langsung)
      const response = await fetch('/api/generate-ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Terjadi kesalahan.');
      }

      if (!response.body) throw new Error("No response body");

      // LOGIC UNTUK MEMBACA STREAM (SSE)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Proses setiap baris, simpan sisa potongan terakhir di buffer
        buffer = lines.pop() || ''; 

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6); // Hapus "data: "
            try {
              const data = JSON.parse(jsonStr);

              // 1. Tangkap Log Proses
              if (data.msg === 'process_generating' && data.output?.data) {
                // Biasanya log teks ada di index pertama dari array data
                const logData = data.output.data[0];
                
                if (Array.isArray(logData)) {
                   // Gradio sering kirim struktur diff, kita cari string deskriptif
                   // Implementasi sederhana: Ambil string terakhir yang masuk
                   const lastItem = logData[logData.length - 1];
                   if(typeof lastItem === 'string') {
                       // Bersihkan karakter aneh jika perlu
                       setLogs(prev => [...prev, lastItem.replace(/\n/g, ' ')]);
                   }
                }
              }

              // 2. Tangkap Hasil Akhir (Video)
              if (data.msg === 'process_completed') {
                const outputData = data.output.data;
                // Berdasarkan urutan jawaban curl kamu, video ada di index 1
                // Struktur: [log_final_string, {video_obj}, {audio_obj}, ...]
                if (outputData[1] && outputData[1].url) {
                  setFinalVideo(outputData[1].url);
                  setLogs(prev => [...prev, "✅ SELESAI! Video berhasil dibuat."]);
                }
              }

            } catch (e) {
              // Ignore parse error on heartbeat or incomplete lines
            }
          }
        }
      }

    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            UGC ProMax Generator
          </h1>
          <p className="text-gray-400 text-sm mt-1">Generate video iklan otomatis dengan AI.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Tombol Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 
              ${loading 
                ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                : 'bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 text-white'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sedang Memproses...
              </span>
            ) : '✨ Generate Video Sekarang'}
          </button>

          {/* Terminal Logs Display */}
          <div className="bg-black rounded-lg p-4 font-mono text-sm h-64 overflow-y-auto border border-gray-700 shadow-inner custom-scrollbar">
            {logs.length === 0 ? (
              <span className="text-gray-600 italic">Waiting for command...</span>
            ) : (
              <div className="flex flex-col gap-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-green-400 break-words">
                    <span className="text-blue-500 mr-2">➜</span>
                    {log}
                  </div>
                ))}
                {loading && <div className="animate-pulse text-gray-500 mt-2">_</div>}
              </div>
            )}
          </div>

          {/* Result Area */}
          {finalVideo && (
            <div className="mt-6 animate-fade-in">
              <h3 className="text-lg font-semibold mb-2 text-white">Hasil Video:</h3>
              <div className="rounded-lg overflow-hidden border border-gray-600">
                <video 
                  controls 
                  src={finalVideo} 
                  className="w-full h-auto bg-black"
                  autoPlay
                />
              </div>
              <a 
                href={finalVideo} 
                download 
                className="mt-4 block text-center w-full bg-green-600 hover:bg-green-500 py-2 rounded text-sm font-medium transition-colors"
              >
                Download Video
              </a>
            </div>
          )}

        </div>
      </div>

      {/* CSS untuk Scrollbar (Opsional) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; 
          border-radius: 4px;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
