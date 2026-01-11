export const config = {
  runtime: 'edge', 
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 1. Terima data dari Frontend
    const body = await request.json();
    const { 
      userId, 
      image1,      // Base64 string dari frontend
      image2,      // Base64 string dari frontend
      productName, // Teks
      price,       // Teks
      discount     // Teks
    } = body;

    if (!userId) return new Response(JSON.stringify({ error: 'User ID required' }), { status: 401 });

    // 2. Cek Supabase (User Premium?)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const checkUser = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=is_premium`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const userData = await checkUser.json();

    if (!userData || userData.length === 0) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 404 });
    if (userData[0].is_premium !== true) return new Response(JSON.stringify({ error: 'Upgrade ke Premium untuk generate.' }), { status: 403 });

    // 3. Format Payload untuk Gradio (HuggingFace)
    // Kita bungkus Base64 gambar ke format objek Gradio
    const formatImage = (base64Str, name) => {
        if (!base64Str) return null;
        return {
            path: null, // Path server kosong karena kita kirim langsung datanya
            url: base64Str, // Data URI (data:image/jpeg;base64,...)
            orig_name: name,
            size: null,
            mime_type: null,
            meta: { _type: "gradio.FileData" }
        };
    };

    const payload = {
      data: [
        null, // Parameter pertama di curl kamu null
        formatImage(image1, "image1.jpg"), // Gambar 1
        formatImage(image2, "image2.jpg"), // Gambar 2
        productName || "Produk Keren",     // Nama Produk
        price || "Rp 100.000",             // Harga
        discount || "Diskon Spesial"       // Diskon
      ],
      fn_index: 0,
      trigger_id: 20,
      session_hash: "p4aowt93d3s"
    };

    // 4. Kirim ke HF Space
    const hfResponse = await fetch("https://sumahir-ugcpromax.hf.space/gradio_api/queue/join?", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(payload)
    });

    // 5. Stream Balik
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
