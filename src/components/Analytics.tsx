/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PoopLog, MealLog, SymptomLog, WaterLog } from '../types';
import { Language } from '../lib/translations';
import { 
  BarChart2, 
  AlertTriangle, 
  HelpCircle,
  Lightbulb,
  HeartPulse,
  Brain,
  Sparkles
} from 'lucide-react';

interface AnalyticsProps {
  poopLogs: PoopLog[];
  mealLogs: MealLog[];
  symptomLogs: SymptomLog[];
  waterLogs: WaterLog[];
  lang: Language;
  theme: 'light' | 'dark';
}

export default function Analytics({
  poopLogs,
  mealLogs,
  symptomLogs,
  waterLogs,
  lang,
  theme
}: AnalyticsProps) {

  // 1. Bristol scale distribution
  const getBristolDistribution = () => {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // type 1 to 7
    poopLogs.forEach(log => {
      const type = log.bristolType;
      if (type >= 1 && type <= 7) {
        counts[type - 1]++;
      }
    });

    const total = poopLogs.length || 1;
    return counts.map((count, idx) => ({
      type: idx + 1,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  const bristolDist = getBristolDistribution();

  // 2. Color distribution
  const getColorDistribution = () => {
    const colors: Record<string, { count: number, bg: string, label: string }> = {
      Brown: { count: 0, bg: 'bg-amber-800', label: 'Cokelat' },
      Green: { count: 0, bg: 'bg-emerald-800', label: 'Hijau' },
      Yellow: { count: 0, bg: 'bg-yellow-500', label: 'Kuning' },
      Black: { count: 0, bg: 'bg-zinc-900', label: 'Hitam' },
      Clay: { count: 0, bg: 'bg-stone-300', label: 'Pucat/Abu' },
      Red: { count: 0, bg: 'bg-rose-600', label: 'Merah' }
    };

    poopLogs.forEach(log => {
      if (colors[log.color]) {
        colors[log.color].count++;
      }
    });

    const total = poopLogs.length || 1;
    return Object.entries(colors).map(([id, data]) => ({
      id,
      ...data,
      percentage: Math.round((data.count / total) * 100)
    })).filter(item => item.count > 0);
  };

  const colorDist = getColorDistribution();

  // 3. Symptom occurrence rates
  const getSymptomOccurrences = () => {
    const map: Record<string, { label: string, count: number }> = {
      Bloating: { label: 'Kembung (Bloating)', count: 0 },
      Cramping: { label: 'Kram Perut (Cramping)', count: 0 },
      Gas: { label: 'Buang Angin Berlebih', count: 0 },
      'Acid Reflux': { label: 'Asam Lambung Naik', count: 0 },
      Nausea: { label: 'Mual (Nausea)', count: 0 },
      Diarrhea: { label: 'Diare', count: 0 },
      Constipation: { label: 'Sembelit', count: 0 },
    };

    symptomLogs.forEach(log => {
      log.symptoms.forEach(sym => {
        if (map[sym]) {
          map[sym].count++;
        }
      });
    });

    return Object.entries(map).map(([id, data]) => ({
      id,
      ...data
    })).sort((a, b) => b.count - a.count);
  };

  const symptomStats = getSymptomOccurrences();

  // 4. Calculate gut health correlation insights
  const getCorrelations = () => {
    const list: string[] = [];

    // Analyze spicy food vs Bristol scale
    const spicyMeals = mealLogs.filter(m => m.spicyLevel === 'Spicy' || m.spicyLevel === 'Extreme');
    const looseStools = poopLogs.filter(p => p.bristolType >= 6);

    if (spicyMeals.length > 0 && looseStools.length > 0) {
      list.push("🌶️ Korelasi Makanan Pedas: Pola mencatat makanan pedas tinggi berkolerasi kuat dengan insiden feses tipe 6/7 (Diare ringan). Hindari rempah ekstrim saat pencernaan sensitif.");
    }

    // Analyze fiber vs normal stool
    const highFiberMeals = mealLogs.filter(m => m.fiberLevel === 'High');
    const normalStools = poopLogs.filter(p => p.bristolType === 4 || p.bristolType === 3);

    if (highFiberMeals.length > 0 && normalStools.length > 0) {
      list.push("🟢 Efektivitas Serat: Menu tinggi serat yang dicatat secara konsisten menghasilkan fese sehat tipe ideal 4 dalam kurun waktu 12–24 jam setelahnya.");
    }

    // Analyze water vs constipation
    const lowWaterDays = waterLogs.filter(w => w.glasses < 5);
    const constipatedStools = poopLogs.filter(p => p.bristolType <= 2);

    if (lowWaterDays.length > 0 && constipatedStools.length > 0) {
      list.push("💧 Kurang Cairan & Sembelit: Hari-hari dengan hidrasi di bawah 5 gelas berkolerasi dengan kesulitan mengejan dan feses Tipe 1 atau 2.");
    }

    // Default general guidelines if data is scarce
    if (list.length === 0) {
      list.push("💡 Pelacakan Teratur: Terus catat makanan dan BAB Anda secara rutin selama 3 hari lagi untuk membuka peta matriks korelasi pencernaan otomatis.");
      list.push("💧 Hidrasi Pencernaan: Usahakan minum air minimal 8 gelas per hari untuk meredakan kram perut dan melunakkan struktur serat dalam sistem usus besar.");
    }

    return list;
  };

  const correlations = getCorrelations();

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 pt-4 space-y-6">
      
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold font-display text-slate-800">Analisis Pencernaan</h2>
        <p className="text-xs text-slate-400 mt-0.5">Analisis statistik mendalam pola usus berdasarkan catatan riwayat</p>
      </div>

      {/* Primary Analytics Summary Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <span className="text-[9px] uppercase font-bold text-slate-400">Total BAB</span>
          <p className="text-xl font-black text-teal-600 font-display mt-0.5">{poopLogs.length}x</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <span className="text-[9px] uppercase font-bold text-slate-400">Log Gejala</span>
          <p className="text-xl font-black text-amber-500 font-display mt-0.5">{symptomLogs.length}x</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
          <span className="text-[9px] uppercase font-bold text-slate-400">Tingkat Ideal</span>
          <p className="text-xl font-black text-emerald-500 font-display mt-0.5">
            {poopLogs.length > 0 
              ? `${Math.round((poopLogs.filter(p => p.bristolType === 4 || p.bristolType === 3 || p.bristolType === 5).length / poopLogs.length) * 100)}%` 
              : '0%'}
          </p>
        </div>
      </div>

      {/* Bristol Scale Stool Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
          <BarChart2 className="h-4.5 w-4.5 text-teal-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Distribusi Skala Feses Bristol</h3>
        </div>

        <div className="space-y-3.5">
          {bristolDist.map(item => {
            // Determine progress bar colors depending on healthy score
            let barColor = 'bg-teal-500';
            if (item.type === 4) barColor = 'bg-emerald-500';
            else if (item.type <= 2) barColor = 'bg-amber-600';
            else if (item.type >= 6) barColor = 'bg-orange-500';

            return (
              <div key={item.type} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center text-[11px]">
                      {item.type}
                    </span>
                    <span className="font-medium text-slate-500 text-[11px]">
                      {item.type === 1 && 'Sangat Keras (Lumps)'}
                      {item.type === 2 && 'Sosis Berbenjol'}
                      {item.type === 3 && 'Sosis Retak'}
                      {item.type === 4 && 'Sosis Lembut (Ideal)'}
                      {item.type === 5 && 'Gumpalan Lunak'}
                      {item.type === 6 && 'Lembek / Bubur'}
                      {item.type === 7 && 'Cair / Diare'}
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">{item.count} Kali ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-slate-100">
                  <div 
                    className={`${barColor} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Color Distribution Breakdown */}
      {colorDist.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
            <HeartPulse className="h-4.5 w-4.5 text-teal-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Breakdown Warna Feses</h3>
          </div>

          <div className="flex items-center gap-2.5 h-6 w-full rounded-full overflow-hidden bg-slate-100 p-1 border border-slate-200">
            {colorDist.map(item => (
              <div
                key={item.id}
                className={`${item.bg} h-full rounded-full cursor-pointer transition`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.percentage}%`}
              ></div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {colorDist.map(item => (
              <div key={item.id} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className={`w-3 h-3 rounded-full ${item.bg}`}></span>
                <span className="font-semibold text-[11px]">{item.label}</span>
                <span className="text-[10px] text-slate-400 font-medium">({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptom Recurrence statistics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
          <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Gejala Paling Sering Muncul</h3>
        </div>

        <div className="space-y-3">
          {symptomStats.filter(s => s.count > 0).length > 0 ? (
            symptomStats.filter(s => s.count > 0).map(item => {
              const totalSymptomLogs = symptomLogs.length || 1;
              const rate = Math.round((item.count / totalSymptomLogs) * 100);
              return (
                <div key={item.id} className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="font-medium text-slate-600 text-[11px]">{item.label}</span>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      {item.count} Kali
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{rate}% kejadian</span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-2">Belum ada rekaman gejala yang masuk.</p>
          )}
        </div>
      </div>

      {/* AI Gut Correlation Analytics */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b border-indigo-950 pb-2.5">
          <Sparkles className="h-4.5 w-4.5 text-indigo-300" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-200">Korelasi Gaya Hidup & Pencernaan</h3>
        </div>

        <div className="space-y-4">
          {correlations.map((correlation, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
              <div className="h-6 w-6 rounded-lg bg-indigo-950 flex items-center justify-center text-indigo-300 flex-shrink-0 mt-0.5 font-bold">
                {idx + 1}
              </div>
              <p className="text-indigo-50 font-medium">{correlation}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
