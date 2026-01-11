import { randomBytes } from 'crypto';

export default async function handler(req, res) {
  // -----------------------------------------------------------
  // 1. KEAMANAN: GEMBOK PINTU MASUK (Security Check)
  // -----------------------------------------------------------
  
  // A. Cek Method
  if (req.method !== 'POST') return res.status(405).json({message: 'Dilarang masuk!'});

  // B. Cek Asal Request (Agar cURL dari CMD orang lain gagal)
  // Vercel otomatis memberi header 'referer' atau 'origin'
  const referer = req.headers.referer || req.headers.referrer || "";
  const origin = req.headers.origin || "";
  
  // Ganti domain ini dengan domain web asli Anda
  const allowedDomain = "orbitbot.pro"; 

  // Jika request bukan dari domain sendiri, tolak!
  if (!referer.includes(allowedDomain) && !origin.includes(allowedDomain)) {
      return res.status(403).json({ 
          message: "Akses Ditolak: Request illegal dari luar website resmi." 
      });
  }

  // C. (Opsional) Cek Login/Session User
  // Di sini Anda bisa cek cookie user jika punya sistem login
  // const userCookie = req.cookies.session_user;
  // if (!userCookie) return res.status(401).json({message: "Login dulu!"});

  // -----------------------------------------------------------
  // 2. LOGIKA UTAMA (Proses Gambar)
  // -----------------------------------------------------------
  
  const { prompt, image_data, ratio } = req.body;

  // Validasi Input
  if (!image_data) return res.status(400).json({message: "Gambar wajib ada"});

  // --- KONFIGURASI ---
  const spaces = ["https://sumahir-grok.hf.space"]; 
  const targetSpace = spaces[Math.floor(Math.random() * spaces.length)];
  const SECRET_KEY = "SUMAHIR_SECRET_V99"; // Harus sama dengan Python
  
  // Buat Token Waktu
  const currentMin = Math.floor(Date.now() / 1000 / 60);
  const secureToken = `${SECRET_KEY}${currentMin}`;
  const sessionHash = randomBytes(5).toString('hex');

  // --- PERBAIKAN FORMAT GAMBAR UNTUK GRADIO ---
  // Kita harus bungkus Base64 jadi object file agar Python menerimanya
  const imagePayload = {
      "path": null, // Path null karena kita kirim base64
      "url": image_data, // Data Base64 masuk sini
      "orig_name": "upload_image.jpg",
      "size": image_data.length,
      "mime_type": "image/jpeg",
      "meta": { "_type": "gradio.FileData" }
  };

  const payload = {
    data: [
      imagePayload, // <-- Kirim Object, bukan string mentah
      prompt, 
      ratio || "2:3", 
      secureToken 
    ],
    fn_index: 0,
    trigger_id: 9,
    session_hash: sessionHash
  };

  try {
    const response = await fetch(`${targetSpace}/gradio_api/queue/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "x-gradio-user": "app",
        // Token ZeroGPU jika diperlukan space Anda
        "x-zerogpu-token": "1717581985:dGTi8g+ho/J3FCPPaED3mixgzFejt4A6RIDQYCFygCBFW3R8NjwAaxT435PE0DXm1ArNPuO+iZnortsZMJci90AWV5BJHUKPIjsMTHAWSwyQl7WeyMg3+k/yx8Mk3//Vm9CgxX3bJkoM8GUcRJziH86SJcXllRfm0UdDgtSnth+3AQc1+DpRxWL0dqA80eFM0CRJNTUYVIcNarTzXbpQ3LFjgQJ7QDpVPIleBFawuCzYP9jWFYoMuQ04uACep5IrybrpBeJ7jFVUbaNDl+Ah1hBcvU2++fHv+tj+Fr60hFKkIdf/sOa+uXHDtpO/0ZdKLWKU87m5kGUXVJ6g+qLtzCdzgaPZh+jQJvQzy+axd7LJtzH+uBVnNS3fY3JdOdk0meIdgiE86YAlexkQBFAFoZj5zCVVH0/+uU6oCJHj+U6f8nJpk5ooNzYvnUEXBokB/6vLeqZ7krMexuw5DD5hpJ2hcsdjhqKaV6gd5WJgI1GMEMMPDIx6m/iQfT0PmwXIxcdxkNiDiezuxBih9ZT6BHBmEIcuvJbdmQoi/oOaGQIUyLlTVnj2mM1zdVWXMmfVtUrtZ3ps3aDX1mn9hMZQGJG5trY3H6ueVyp4xYim/TGwxR2iSWPIkdebVUANy1tEw8aL8oEz1mDPXmZid99AOFUeP4QWxcmER39Rn6vqGCI=:i5y/UnM2c7gAdhfBykDfonrDjVQysEDgRowTcR4T9g1m15Ty7H7RQKngr9/qG5Kaj7FgBbXPQJcfrpz7P1v5OaVvhaLRSQgvF++j7bW1JA5b4K54ZHgyJB5Yil5RkZKGRCCjbQP+I3Hk1O/Jp+XBWEwVxb3PTw1u1qfMoyajQm9FP2/Qn4MI10MVCEcC3R1p3g+VPlHIwhq8xUXjIdfpw5JNgeRezpUUQpC47qvPSEd8vlHX64lDWIhzBx81dqamptYgcmXGwI6V8PCeOqi4nJgmPSwQ1BAbMQ+xtVfsEA1wBjNdEfXaI1MIvd6M7u3XBH2AXAsV982a9CIff+fCFJ3pGPPOk7XenkKBq+HzTnZsn9k5LoKP7ecFDgD0BImf8zOivT6uIxMAQQFVoa3lROiK7QuNJ7EpUYGFQ9OGtYIjcsSHptfvpzu1iToENwR4IMGclrvTMG7bRYIxJWTvBT340aWXjyWia7ut5tksH+Iz5auYbTJFbI5EI0Xd6THMpKIxgT93R9lC2TcOMg+8xsDHEqKDwanJ0U+D/I2NtuDGJnREGDCMCE/ALZxekEdXzHk1pW5dPG1dX4GO693Z2rKBi/rZF3ayEhHpM9Iu0xPnGy3FZCG/CqkSoI/Mne4Q3P7Pixhso01iV9DzNI5Z8rbnl6BHXeYSxM8LOP2W9ua05lw4Yco=",
        "x-zerogpu-uuid": "qKhfOqos23QaA9XTu3fPi"
      },
      body: JSON.stringify(payload)
    });

    // Cek error dari HF
    if(!response.ok) {
        const errText = await response.text();
        console.error("HF Error:", errText);
        throw new Error("Gagal kirim ke Server AI (Space Error)");
    }

    return res.status(200).json({ 
        session_hash: sessionHash, 
        space_url: targetSpace 
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
