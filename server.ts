/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI client lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

// Fallback algorithm when Gemini is not available
function generateFallbackAnalysis(logs: {
  poopLogs: any[];
  mealLogs: any[];
  symptomLogs: any[];
  waterLogs: any[];
  activityLogs: any[];
}) {
  const { poopLogs, mealLogs, symptomLogs, waterLogs, activityLogs } = logs;

  if (!poopLogs || poopLogs.length === 0) {
    return {
      healthStatus: 'Belum Ada Data',
      healthScore: 0,
      predictedTimeRange: '--:--',
      confidenceLevel: 0,
      explanation: 'Silakan catat data pencernaan pertama Anda.',
      insights: []
    };
  }

  // 1. Calculate Health Score
  // Base score 75. Modify based on stats.
  let score = 75;
  let status: 'Sehat' | 'Kurang Sehat' | 'Konstipasi' | 'Diare' | 'Optimal' | 'Belum Ada Data' = 'Sehat';

  if (poopLogs.length > 0) {
    // Average Bristol Type
    const totalBristol = poopLogs.reduce((sum, log) => sum + (log.bristolType || 4), 0);
    const avgBristol = totalBristol / poopLogs.length;

    // Check for Constipation (Type 1, 2) or Diarrhea (Type 6, 7)
    let badLogs = 0;
    poopLogs.forEach(log => {
      if (log.bristolType <= 2 || log.bristolType >= 6) {
        badLogs++;
      }
    });

    const badPercentage = badLogs / poopLogs.length;
    if (badPercentage > 0.4) {
      if (avgBristol < 3) {
        status = 'Konstipasi';
        score -= 20;
      } else {
        status = 'Diare';
        score -= 20;
      }
    } else if (avgBristol >= 3 && avgBristol <= 5) {
      status = 'Optimal';
      score += 10;
    } else {
      status = 'Kurang Sehat';
      score -= 5;
    }

    // Straining difficulty
    const painfulCount = poopLogs.filter(log => log.difficulty === 'Painful' || log.difficulty === 'Hard').length;
    score -= painfulCount * 5;
  }

  // Water logs modifier
  let latestWaterGlasses = 8;
  if (waterLogs.length > 0) {
    const sortedWater = [...waterLogs].sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime());
    latestWaterGlasses = sortedWater[0].glasses;
    const target = sortedWater[0].target || 8;
    if (latestWaterGlasses < target) {
      score -= (target - latestWaterGlasses) * 2;
    } else {
      score += 5;
    }
  }

  // Clamp score
  score = Math.max(10, Math.min(100, score));

  // 2. Generate Prediction
  let predictedTimeRange = "07:00 – 08:30";
  let confidenceLevel = 70;
  let explanation = "Prediksi berdasarkan waktu rata-rata BAB Anda di pagi hari.";

  if (poopLogs.length > 0) {
    // Check average time of day
    const times = poopLogs.map(log => {
      const d = new Date(log.poopTime);
      return d.getHours() * 60 + d.getMinutes();
    });
    const avgMinutes = times.reduce((sum, t) => sum + t, 0) / times.length;
    const startHour = Math.floor((avgMinutes - 45) / 60);
    const startMin = Math.floor((avgMinutes - 45) % 60);
    const endHour = Math.floor((avgMinutes + 45) / 60);
    const endMin = Math.floor((avgMinutes + 45) % 60);

    const pad = (n: number) => String(Math.max(0, Math.min(23, n))).padStart(2, '0');
    const padMin = (n: number) => String(Math.max(0, Math.min(59, n))).padStart(2, '0');

    predictedTimeRange = `${pad(startHour)}:${padMin(startMin)} – ${pad(endHour)}:${padMin(endMin)}`;
    confidenceLevel = Math.min(92, 60 + poopLogs.length * 4);
    explanation = "Berdasarkan histori waktu pencernaan rutin harian Anda yang terpantau aktif.";
  }

  // 3. Insights Generation
  const insights = [];

  // Check meal-poop interactions
  const spicyMeals = mealLogs.filter(m => m.spicyLevel === 'Spicy' || m.spicyLevel === 'Extreme');
  if (spicyMeals.length > 0) {
    insights.push("Makanan pedas yang Anda konsumsi dapat meningkatkan sensitivitas dan mempercepat kontraksi usus.");
  } else {
    insights.push("Konsumsi makanan dengan tingkat kepedasan rendah membantu menjaga stabilitas asam lambung.");
  }

  const highFiberMeals = mealLogs.filter(m => m.fiberLevel === 'High');
  if (highFiberMeals.length > 0) {
    insights.push("Serat tinggi dari makanan terakhir Anda mempercepat pembentukan feses sehat tipe 4.");
  } else {
    insights.push("Tambahkan lebih banyak porsi sayur dan buah untuk mendukung kelancaran transit usus.");
  }

  // Water insight
  if (latestWaterGlasses < 8) {
    insights.push(`Asupan air Anda hari ini baru ${latestWaterGlasses} gelas. Kurang ${Math.max(1, 8 - latestWaterGlasses)} gelas lagi untuk hidrasi optimal.`);
  } else {
    insights.push("Target minum air Anda tercapai! Hidrasi yang baik sangat melunakkan feses secara alami.");
  }

  // Activity insight
  const activeLogs = activityLogs.filter(a => a.durationMinutes >= 20);
  if (activeLogs.length > 0) {
    insights.push("Aktivitas fisik aktif Anda merangsang peristaltik usus agar BAB lebih teratur dan bebas hambatan.");
  }

  return {
    healthStatus: status,
    healthScore: Math.round(score),
    predictedTimeRange,
    confidenceLevel,
    explanation,
    insights: insights.slice(0, 3)
  };
}

// REST API for health analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { poopLogs = [], mealLogs = [], symptomLogs = [], waterLogs = [], activityLogs = [] } = req.body;

    if (!poopLogs || poopLogs.length === 0) {
      return res.json({
        healthStatus: 'Belum Ada Data',
        healthScore: 0,
        predictedTimeRange: '--:--',
        confidenceLevel: 0,
        explanation: 'Silakan catat data pencernaan pertama Anda.',
        insights: [],
        isFallback: true
      });
    }

    const ai = getAiClient();
    if (!ai) {
      // Return fallback response directly if Gemini client is not initialized
      const fallback = generateFallbackAnalysis({ poopLogs, mealLogs, symptomLogs, waterLogs, activityLogs });
      return res.json({ ...fallback, isFallback: true });
    }

    // Format logs details for prompt context
    const dataContext = {
      poopLogs: poopLogs.map((p: any) => ({
        time: p.poopTime,
        bristolType: p.bristolType,
        color: p.color,
        difficulty: p.difficulty,
        duration: p.duration,
        notes: p.notes || ''
      })),
      mealLogs: mealLogs.map((m: any) => ({
        time: m.mealTime,
        name: m.mealName,
        fiber: m.fiberLevel,
        spicy: m.spicyLevel,
        beverages: m.beverages,
        notes: m.notes || ''
      })),
      symptomLogs: symptomLogs.map((s: any) => ({
        time: s.logDate,
        symptoms: s.symptoms,
        severity: s.severity,
        notes: s.notes || ''
      })),
      waterLogs: waterLogs.map((w: any) => ({
        date: w.logDate,
        glasses: w.glasses,
        target: w.target
      })),
      activityLogs: activityLogs.map((a: any) => ({
        time: a.activityTime,
        type: a.activityType,
        duration: a.durationMinutes,
        notes: a.notes || ''
      }))
    };

    const promptText = `
Anda adalah asisten pakar gastroenterologi dan analisis kesehatan pencernaan bernama PoopCycle.
Silakan analisis data pelacakan kesehatan usus pengguna berikut ini untuk menghasilkan status kesehatan, skor kesehatan, prediksi BAB berikutnya (waktu dan keyakinan), penjelasan prediksi, serta 3 poin ringkasan insight otomatis yang mendalam.

Data pengguna saat ini:
${JSON.stringify(dataContext, null, 2)}

Ketentuan Output:
1. Kembalikan respons murni dalam format JSON yang valid. Jangan gunakan penutup markdown (\`\`\`json).
2. Semua penjelasan, teks, dan insight harus dalam BAHASA INDONESIA yang ramah, sopan, komunikatif, dan berbasis data ilmiah.
3. Struktur JSON wajib persis seperti berikut:
{
  "healthStatus": "Sehat" | "Kurang Sehat" | "Konstipasi" | "Diare" | "Optimal",
  "healthScore": 10-100 (integer representasi skor pencernaan harian),
  "predictedTimeRange": "Rentang waktu perkiraan BAB berikutnya, misal '06:30 – 08:00' atau '19:30 – 21:00' atau 'Besok pagi'",
  "confidenceLevel": 10-95 (integer persentase keyakinan prediksi),
  "explanation": "Penjelasan singkat bahasa Indonesia mengapa memprediksi jam tersebut (hubungkan dengan makanan, air, atau waktu BAB terakhir)",
  "insights": [
    "Insight 1 (misal tentang hubungan makanan & tipe feses)",
    "Insight 2 (misal tentang konsumsi air / hidrasi tubuh)",
    "Insight 3 (misal tentang aktivitas fisik atau saran pencegahan gejala)"
  ]
}

Analisis dengan saksama dan berikan umpan balik terbaik untuk pengguna!`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text?.trim() || '{}';
    // Safely parse JSON from model
    const cleanText = text.replace(/^```json/, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanText);

    res.json({
      ...result,
      isFallback: false
    });
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    // If anything fails, fallback gracefully to prevent errors
    const fallback = generateFallbackAnalysis(req.body || { poopLogs: [], mealLogs: [], symptomLogs: [], waterLogs: [], activityLogs: [] });
    res.json({ ...fallback, isFallback: true, error: error.message });
  }
});

// Configure Vite or Static Files depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
