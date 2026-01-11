export const config = {
  runtime: 'edge', // Wajib agar bisa streaming cepat
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 401 });
    }

    // 1. Cek Supabase User via REST API (Tanpa Library, biar simpel)
    // Menggunakan Service Role Key untuk bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Asumsi tabel kamu bernama 'users' atau 'profiles'. Sesuaikan endpoint di bawah:
    // Contoh: /rest/v1/users?id=eq.${userId}&select=is_premium
    const checkUser = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=is_premium`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    const userData = await checkUser.json();

    if (!userData || userData.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found in DB' }), { status: 404 });
    }

    if (userData[0].is_premium !== true) {
      return new Response(JSON.stringify({ error: 'Upgrade to Premium to generate UGC.' }), { status: 403 });
    }

    // 2. Kirim Request ke HuggingFace (cURL)
    const payload = {
      data: [
        null,
        {
          path: "/tmp/gradio/181673a0593e5c053e08c301813c7cb8f717f15abc50e5600a7ca0271316abd2/no_brand_central-baju_kaos_santai_motif_fire_lengan_pendek_pria_casual_full14_tldyv8jt.webp",
          url: "https://sumahir-ugcpromax.hf.space/gradio_api/file=/tmp/gradio/181673a0593e5c053e08c301813c7cb8f717f15abc50e5600a7ca0271316abd2/no_brand_central-baju_kaos_santai_motif_fire_lengan_pendek_pria_casual_full14_tldyv8jt.webp",
          orig_name: "no_brand_central-baju_kaos_santai_motif_fire_lengan_pendek_pria_casual_full14_tldyv8jt.webp",
          size: 27190,
          mime_type: "image/webp",
          meta: { _type: "gradio.FileData" }
        },
        {
          path: "/tmp/gradio/1dee633504b941ad9dc7e5b46b41de15d81c4080b9fdf9f53306df72c7082bd4/202511061045-main.cropped_1762400740.jpg",
          url: "https://sumahir-ugcpromax.hf.space/gradio_api/file=/tmp/gradio/1dee633504b941ad9dc7e5b46b41de15d81c4080b9fdf9f53306df72c7082bd4/202511061045-main.cropped_1762400740.jpg",
          orig_name: "202511061045-main.cropped_1762400740.jpg",
          size: 41261,
          mime_type: "image/jpeg",
          meta: { _type: "gradio.FileData" }
        },
        "Sepatu Running Nike",
        "1.2jt",
        "Diskon Spesial Hari Ini"
      ],
      fn_index: 0,
      trigger_id: 20,
      session_hash: "p4aowt93d3s"
    };

    const hfResponse = await fetch("https://sumahir-ugcpromax.hf.space/gradio_api/queue/join?", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        // Header lain disederhanakan agar fetch serverless lancar, tambahkan jika HF menolak
      },
      body: JSON.stringify(payload)
    });

    // 3. Streaming response balik ke User
    return new Response(hfResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
