'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase (menggunakan env yang sudah kamu setting di Vercel)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UGCPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    setLogs([]);
    setVideoResult(null);
    setErrorMsg('');

    // 1. Cek User Login
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Harap login terlebih dahulu.");
      setLoading(false);
      return;
    }

    try {
      // 2. Panggil API Route kita (Backend)
      const response = await fetch('/api/generate-ugc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Gagal memproses permintaan.');
      }

      if (!response.body) return;

      // 3. Baca Stream Data (Agar muncul tulisan berjalan)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Simpan sisa potongan

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Hapus awalan "data: "
              const data = JSON.parse(jsonStr);

              // Ambil Log Progress
              if (data.msg === 'process_generating' && data.output?.data) {
                 // Logika simpel mengambil pesan teks terakhir dari array
                 const rawData = data.output.data;
                 // Cek jika ada string log baru
                 if (Array.isArray(rawData) && rawData.length > 0) {
                    const lastLog = rawData[rawData.length - 1]; // Ambil elemen terakhir
                    // Kadang bentuknya array diff, kadang string, kita filter yang string saja
                    if (typeof lastLog === 'string' && lastLog.length > 2) {
                        // Bersihkan newline agar rapi
                        setLogs(prev => [...prev, lastLog.replace(/\n/g, ' ').trim()]);
                    }
                 }
              }

              // Ambil Hasil Akhir
              if (data.msg === 'process_completed') {
                const results = data.output.data;
                // Di curl kamu, video biasanya ada di index ke-1 (objek dengan url)
                const videoObj = results.find((item: any) => item?.url?.endsWith('.mp4'));
                
                if (videoObj) {
                  setVideoResult(videoObj.url);
                  setLogs(prev => [...prev, "✅ VIDEO SELESAI DIGENERATE!"]);
                }
              }

            } catch (e) {
              // Abaikan error parsing JSON baris kosong/heartbeat
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
    <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            AI UGC Generator
          </h1>
          <p className="text-slate-400">Buat video iklan otomatis dalam hitungan detik.</p>
        </div>

        {/* Error Box */}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all
            ${loading 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white hover:shadow-cyan-500/25'
            }`}
        >
          {loading ? 'Sedang Memproses...' : '🚀 Generate Video Sekarang'}
        </button>

        {/* Terminal Log View */}
        <div className="bg-black/80 rounded-xl border border-slate-800 p-5 font-mono text-xs md:text-sm h-64 overflow-y-auto shadow-inner">
          <div className="flex flex-col gap-2">
            {logs.length === 0 && !loading && (
              <span className="text-slate-600">Menunggu perintah... (Klik tombol di atas)</span>
            )}
            {logs.map((log, i) => (
              <div key={i} className="text-emerald-400 break-words border-l-2 border-emerald-500/30 pl-2">
                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                {log}
              </div>
            ))}
            {loading && <div className="animate-pulse text-cyan-400">_ Processing...</div>}
          </div>
        </div>

        {/* Video Result */}
        {videoResult && (
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-semibold mb-4 text-center">🎉 Hasil Video Anda</h3>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black shadow-2xl">
              <video 
                src={videoResult} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            <a 
              href={videoResult} 
              download="ugc-video.mp4"
              target="_blank"
              className="mt-4 block w-full bg-emerald-600 hover:bg-emerald-500 text-center py-3 rounded-lg font-medium transition-colors"
            >
              Download Video
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
