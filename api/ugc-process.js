import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({message: 'Method not allowed'});

  // --- SECURITY: CEK DOMAIN & WAKTU ---
  const referer = req.headers.referer || "";
  const allowedDomain = "orbitbot.pro";
  
  if (!referer.includes(allowedDomain)) {
      return res.status(403).json({ message: "⛔ Akses Ditolak" });
  }

  const { image_data, prompt, price, desc, timestamp } = req.body;

  if (Date.now() - timestamp > 60000) {
      return res.status(408).json({ message: "⏳ Sesi kadaluarsa. Refresh halaman." });
  }

  // --- DATA PROCESSING ---
  if (!image_data) return res.status(400).json({message: "Gambar wajib diupload"});

  const targetSpace = "https://sumahir-ugcpromax.hf.space";
  const sessionHash = randomBytes(5).toString('hex');

  // Format Gambar untuk Gradio
  const imagePayload = {
      "path": null, 
      "url": image_data, // Base64 dari Frontend masuk sini
      "orig_name": "product.jpg",
      "size": image_data.length,
      "mime_type": "image/jpeg",
      "meta": { "_type": "gradio.FileData" }
  };

  // Struktur Payload sesuai cURL Anda
  // Index 0: null (biasanya hidden state)
  // Index 1: Gambar
  // Index 2: null (biasanya hidden state)
  // Index 3: Prompt ("Baju Bonia")
  // Index 4: Harga ("50k")
  // Index 5: Deskripsi ("Bahan tebal...")
  const payload = {
    data: [
      null,
      imagePayload,
      null,
      prompt || "Produk Keren",
      price || "Promo",
      desc || "Bahan berkualitas"
    ],
    fn_index: 0,
    trigger_id: 20,
    session_hash: sessionHash
  };

  try {
    const response = await fetch(`${targetSpace}/gradio_api/queue/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "x-gradio-user": "app"
      },
      body: JSON.stringify(payload)
    });

    if(!response.ok) {
        const errText = await response.text();
        console.error("HF Error:", errText);
        throw new Error("Gagal kirim ke Server UGC");
    }

    return res.status(200).json({ 
        session_hash: sessionHash, 
        space_url: targetSpace 
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
