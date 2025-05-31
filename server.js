require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Konfigurasi sesuai permintaan
const allowedOrigin = 'https://mojigoi-nouryoku.vercel.app'; // Contoh: kalau kamu buka HTML dari Live Server

app.use(cors({
    origin: allowedOrigin, 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting storage (gunakan Map untuk menyimpan IP dan request count)
const rateLimitStore = new Map();
const RATE_LIMIT = 5; // 5 request per IP
const COOLDOWN_TIME = 60000; // 1 menit dalam milliseconds

// Middleware untuk rate limiting
function rateLimitMiddleware(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  
  // Bersihkan data lama (lebih dari cooldown time)
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.firstRequest > COOLDOWN_TIME) {
      rateLimitStore.delete(ip);
    }
  }
  
  // Cek apakah IP sudah ada di store
  if (rateLimitStore.has(clientIP)) {
    const ipData = rateLimitStore.get(clientIP);
    
    // Jika masih dalam periode cooldown
    if (now - ipData.firstRequest < COOLDOWN_TIME) {
      if (ipData.count >= RATE_LIMIT) {
        const remainingTime = Math.ceil((COOLDOWN_TIME - (now - ipData.firstRequest)) / 1000);
        return res.status(429).json({
          success: false,
          error: 'rate_limit_exceeded',
          message: `Terlalu banyak permintaan. Silakan tunggu ${remainingTime} detik lagi.`,
          remainingTime: remainingTime,
          limit: RATE_LIMIT,
          used: ipData.count
        });
      } else {
        // Tambah counter
        ipData.count++;
      }
    } else {
      // Reset counter jika sudah lewat cooldown
      rateLimitStore.set(clientIP, {
        count: 1,
        firstRequest: now
      });
    }
  } else {
    // IP baru, buat entry baru
    rateLimitStore.set(clientIP, {
      count: 1,
      firstRequest: now
    });
  }
  
  next();
}


// Endpoint untuk generate soal GOI
app.post('/api/generate-question', rateLimitMiddleware, async (req, res) => {
  try {
const prompt = `Buatkan 1 soal GOI (sinonim) JLPT dalam format JSON berikut:
{
  "question": "kalimat dengan kata yang digaris bawahi atau diberikan kurung contoh 「優しい」",
  "options": ["A. pilihan1", "B. pilihan2", "C. pilihan3", "D. pilihan4"],
  "correct": "A",
  "explanation": "penjelasan singkat kenapa jawaban tersebut benar"
}

Instruksi:
- Soal harus berupa kalimat pendek yang mengandung satu kata target dalam tanda kurung (contoh: 「あらう」).
- Pilih kata target berupa **kata kerja, kata benda, atau kata sifat** yang umum digunakan pada JLPT level **N4–N2**.
- Berikan 4 pilihan jawaban (A-D), di mana hanya satu yang merupakan **sinonim yang paling tepat** dengan konteks kalimat.
- Gunakan variasi bentuk (bukan hanya kata dasar), bisa bentuk ～ている、～ていた、～しまいます、～しまった、～られる、～られた bentuk sopan, atau bentuk kamus jika sesuai konteks.
- Pastikan kalimat tidak selalu dalam format "Saya melakukan X", variasikan dengan kalimat pasif, transitive, atau yang ada subjek lain.
- Hindari pengulangan kata atau format soal yang terlalu mirip satu sama lain.
- Gunakan campuran dari kosakata JLPT N4–N2 (bukan hanya N4–N3).
- Soal dan pilihan jawaban harus dalam **bahasa Jepang**, penjelasan tetap dalam **bahasa Indonesia**.
- Hindari soal seperti 「元気」dan pilihan ganda seperti「げんき」. Goi itu berfokus pada persamaan kata/sinonim bukan cara baca kanji!
- Teliti dalam membuat soal dan pilhan ganda dan pahami intruksi di atas dengan detail sebelum men generate soal secara akurat tanpa bias!


Contoh soal bagus:
{
  "question": "この服を「せんたくします」",
  "options": ["A. あらう", "B. きます", "C. つかいます", "D. ききます"],
  "correct": "A",
  "explanation": " 「せんたくします」(romaji/latin) artinya mencuci untuk pakaian maka persamaan yg tepat dengan 「せんたくします」(romaji/latin) adalah 「あらう」(romaji/latin) berarti mencuci biasanya digunakan untuk mencuci tangan/piring."
}

Buatkan soal baru yang berbeda dan variatif setiap kali.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Parsing response untuk menghilangkan markdown dan simbol aneh
      let cleanText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      cleanText = cleanText.replace(/\//g, '').replace(/\//g, '');
      
      try {
        const questionData = JSON.parse(cleanText);
        res.json({ success: true, data: questionData });
      } catch (parseError) {
        // Jika gagal parse JSON, coba ekstrak manual
        const fallbackQuestion = {
          question: "明日は服を「せんたく」します。",
          options: ["A. あらいます", "B. かいます", "C. もっています", "D. ききます"],
          correct: "A",
          explanation: "せんたく (洗濯) berarti mencuci pakaian, sinonimnya adalah あらう (洗う)"
        };
        res.json({ success: true, data: fallbackQuestion });
      }
    } else {
      throw new Error('Invalid response from Gemini API');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Gagal generate soal',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});

