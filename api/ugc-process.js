import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({message: 'Method not allowed'});

  // 1. Security Check
  const referer = req.headers.referer || "";
  if (!referer.includes("orbitbot.pro")) return res.status(403).json({ message: "⛔ Akses Ditolak" });

  const { image_data, prompt, price, desc, timestamp } = req.body;
  if (Date.now() - timestamp > 60000) return res.status(408).json({ message: "⏳ Sesi kadaluarsa." });
  if (!image_data) return res.status(400).json({message: "Gambar kosong"});

  const SPACE_URL = "https://sumahir-ugcpromax.hf.space";
  
  try {
    // --- LANGKAH 1: UPLOAD GAMBAR KE HF DULU (Agar tidak macet) ---
    // Kita ubah Base64 jadi Blob untuk diupload
    const base64Data = image_data.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Boundary untuk multipart/form-data manual (Tanpa library tambahan)
    const boundary = '----WebKitFormBoundary' + randomBytes(16).toString('hex');
    
    let body = `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="files"; filename="upload.webp"\r\n`;
    body += `Content-Type: image/webp\r\n\r\n`;
    
    const payloadBuffer = Buffer.concat([
        Buffer.from(body, 'utf-8'),
        buffer,
        Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8')
    ]);

    const uploadRes = await fetch(`${SPACE_URL}/upload`, {
        method: "POST",
        headers: {
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "User-Agent": "Mozilla/5.0",
            "x-gradio-user": "app"
        },
        body: payloadBuffer
    });

    if (!uploadRes.ok) throw new Error("Gagal upload gambar ke server AI");
    
    // Ambil Path Gambar yang sudah diupload ([ "tmp/gradio/..." ])
    const uploadResult = await uploadRes.json();
    const uploadedPath = uploadResult[0]; // Ini path file di server HF

    // --- LANGKAH 2: KIRIM REQUEST GENERATE ---
    const sessionHash = randomBytes(5).toString('hex');

    // Buat object gambar sesuai format cURL asli (Pakai Path, bukan Base64 lagi)
    const imageObject = {
        "path": uploadedPath,
        "url": `${SPACE_URL}/file=${uploadedPath}`,
        "orig_name": "upload.webp",
        "size": buffer.length,
        "mime_type": "image/webp",
        "meta": { "_type": "gradio.FileData" }
    };

    const payload = {
      data: [
        null,
        imageObject, // <-- Kirim object yang valid (bukan base64)
        null,
        prompt || "Produk",
        price || "Promo",
        desc || "Best Seller"
      ],
      fn_index: 0,
      trigger_id: 20,
      session_hash: sessionHash
    };

    const joinRes = await fetch(`${SPACE_URL}/gradio_api/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if(!joinRes.ok) throw new Error("Gagal masuk antrian");

    return res.status(200).json({ 
        session_hash: sessionHash, 
        space_url: SPACE_URL 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error: " + error.message });
  }
}
