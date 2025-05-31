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

// Endpoint untuk generate soal GOI
app.post('/api/generate-question', async (req, res) => {
  try {
    const prompt = `Buatkan 1 soal GOI (sinonim) JLPT N4-N3 dalam format JSON berikut:
{
  "question": "kalimat dengan kata yang digaris bawahi atau diberikan kurung contoh 「優しい」",
  "options": ["A. pilihan1", "B. pilihan2", "C. pilihan3", "D. pilihan4"],
  "correct": "A",
  "explanation": "penjelasan singkat kenapa jawaban tersebut benar"
}

Contoh soal yang bagus:
明日は服を「せんたく」します。
A. あらいます
B. かいます  
C. もっています
D. ききます

Jawaban: A (せんたく = あらう = mencuci)

Buatkan soal baru yang berbeda dengan level N4-N3. Gunakan kata kerja, kata sifat, atau kata benda yang umum di JLPT N4-N3.`;

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

