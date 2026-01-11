import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({message: 'Method not allowed'});

  // 1. Security Check
  const referer = req.headers.referer || "";
  if (!referer.includes("orbitbot.pro")) { // Ganti dengan domain Anda
      return res.status(403).json({ message: "⛔ Akses Ditolak" });
  }

  const { image_data, prompt, price, desc, timestamp } = req.body;
  
  // Cek masa aktif cURL (60 detik)
  if (Date.now() - timestamp > 60000) {
      return res.status(408).json({ message: "⏳ Sesi kadaluarsa. Refresh halaman." });
  }

  if (!image_data) return res.status(400).json({message: "Wajib upload gambar"});

  // 2. Config Space
  const targetSpace = "https://sumahir-ugcpromax.hf.space";
  const sessionHash = randomBytes(5).toString('hex');

  // 3. Siapkan Object Gambar
  const imagePayload = {
      "path": null,
      "url": image_data, // Base64 masuk sini
      "orig_name": "input.webp",
      "size": image_data.length,
      "mime_type": "image/webp", // Sesuaikan dengan cURL Anda yg webp
      "meta": { "_type": "gradio.FileData" }
  };

  // 4. Struktur Data (Sesuai cURL asli Space Anda)
  // [null, Gambar, null, Prompt, Harga, Deskripsi]
  const payload = {
    data: [
      null,
      imagePayload,
      null,
      prompt || "Produk",
      price || "Promo",
      desc || "Best Seller"
    ],
    fn_index: 0,
    trigger_id: 20, // Sesuai cURL Anda
    session_hash: sessionHash
  };

  try {
    const response = await fetch(`${targetSpace}/gradio_api/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if(!response.ok) throw new Error("Gagal kirim ke AI Server");

    return res.status(200).json({ 
        session_hash: sessionHash, 
        space_url: targetSpace 
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
