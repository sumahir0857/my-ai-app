// app/api/generate-ugc/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Inisialisasi Supabase (Server Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Gunakan Service Role untuk cek data user dengan aman
);

export async function POST(req: NextRequest) {
  try {
    // 1. Ambil User ID dari body request (dikirim dari frontend)
    // Catatan: Di produksi, sebaiknya gunakan auth header/cookie session untuk keamanan lebih.
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // 2. Cek Supabase: Apakah User Premium?
    const { data: user, error } = await supabase
      .from('users') // Sesuaikan dengan nama tabelmu (misal: 'profiles' atau 'users')
      .select('is_premium')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.is_premium !== true) {
      return NextResponse.json(
        { error: 'Upgrade to Premium to generate UGC.' },
        { status: 403 }
      );
    }

    // 3. Jika Premium, Lanjutkan ke cURL (Fetch ke HuggingFace)
    // Payload JSON dari cURL kamu
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

    // Melakukan request ke HF Space (Proxy)
    const hfResponse = await fetch("https://sumahir-ugcpromax.hf.space/gradio_api/queue/join?", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7",
        "content-type": "application/json",
        "origin": "https://sumahir-ugcpromax.hf.space",
        "priority": "u=1, i",
        "referer": "https://sumahir-ugcpromax.hf.space/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-gradio-user": "app"
      },
      body: JSON.stringify(payload)
    });

    if (!hfResponse.ok) {
      return NextResponse.json({ error: 'Failed to connect to AI server' }, { status: 502 });
    }

    // 4. Streaming Response ke Frontend
    // Kita pipe stream dari HF langsung ke user agar log muncul berurutan
    return new NextResponse(hfResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
