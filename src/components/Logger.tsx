/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smile, 
  Utensils, 
  HeartCrack, 
  GlassWater, 
  Dumbbell, 
  Calendar, 
  Clock, 
  Save, 
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import { 
  FiberLevel, 
  SpicyLevel, 
  StoolColor, 
  BowelDifficulty, 
  ActivityType 
} from '../types';
import { Language } from '../lib/translations';

interface LoggerProps {
  onAddPoopLog: (data: { poopTime: string, bristolType: number, color: StoolColor, difficulty: BowelDifficulty, duration: number, notes?: string }) => Promise<void>;
  onAddMealLog: (data: { mealTime: string, mealName: string, fiberLevel: FiberLevel, spicyLevel: SpicyLevel, beverages: string, notes?: string }) => Promise<void>;
  onAddSymptomLog: (data: { logDate: string, symptoms: string[], severity: number, notes?: string }) => Promise<void>;
  onAddWaterLog: (glasses: number) => Promise<void>;
  onAddActivityLog: (data: { activityTime: string, activityType: ActivityType, durationMinutes: number, notes?: string }) => Promise<void>;
  currentWaterCount: number;
  currentWaterTarget: number;
  initialTab?: 'poop' | 'meal' | 'symptom' | 'water' | 'activity';
  lang: Language;
  theme: 'light' | 'dark';
}

export default function Logger({
  onAddPoopLog,
  onAddMealLog,
  onAddSymptomLog,
  onAddWaterLog,
  onAddActivityLog,
  currentWaterCount,
  currentWaterTarget,
  initialTab = 'poop',
  lang,
  theme
}: LoggerProps) {
  const [activeTab, setActiveTab] = useState<'poop' | 'meal' | 'symptom' | 'water' | 'activity'>(initialTab);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Common Date-Time states
  const getLocalDateTimeString = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, -1);
    return localISOTime.slice(0, 16); // YYYY-MM-DDTHH:MM
  };

  const [logTime, setLogTime] = useState(getLocalDateTimeString());

  // Reset success feedback after 2 seconds
  const triggerSuccessFeedback = () => {
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // 1. POOP STATES
  const [bristolType, setBristolType] = useState<number>(4);
  const [stoolColor, setStoolColor] = useState<StoolColor>('Brown');
  const [difficulty, setDifficulty] = useState<BowelDifficulty>('Normal');
  const [poopDuration, setPoopDuration] = useState<number>(5);
  const [poopNotes, setPoopNotes] = useState('');

  const handlePoopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAddPoopLog({
        poopTime: new Date(logTime).toISOString(),
        bristolType,
        color: stoolColor,
        difficulty,
        duration: poopDuration,
        notes: poopNotes
      });
      setPoopNotes('');
      setBristolType(4);
      setStoolColor('Brown');
      setDifficulty('Normal');
      setPoopDuration(5);
      triggerSuccessFeedback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 2. MEAL STATES
  const [mealName, setMealName] = useState('');
  const [fiberLevel, setFiberLevel] = useState<FiberLevel>('Medium');
  const [spicyLevel, setSpicyLevel] = useState<SpicyLevel>('None');
  const [beverages, setBeverages] = useState('');
  const [mealNotes, setMealNotes] = useState('');

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;
    setSaving(true);
    try {
      await onAddMealLog({
        mealTime: new Date(logTime).toISOString(),
        mealName,
        fiberLevel,
        spicyLevel,
        beverages: beverages || 'Air Putih',
        notes: mealNotes
      });
      setMealName('');
      setBeverages('');
      setMealNotes('');
      triggerSuccessFeedback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 3. SYMPTOM STATES
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState<number>(3);
  const [symptomNotes, setSymptomNotes] = useState('');

  const symptomOptions = [
    { id: 'Bloating', label: 'Kembung (Bloating)' },
    { id: 'Cramping', label: 'Kram Perut (Cramping)' },
    { id: 'Gas', label: 'Buang Angin Berlebih (Gas)' },
    { id: 'Acid Reflux', label: 'Asam Lambung Naik' },
    { id: 'Nausea', label: 'Mual (Nausea)' },
    { id: 'Diarrhea', label: 'Gejala Diare' },
    { id: 'Constipation', label: 'Sembelit / Sulit BAB' },
  ];

  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };

  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSymptoms.length === 0) return;
    setSaving(true);
    try {
      await onAddSymptomLog({
        logDate: new Date(logTime).toISOString(),
        symptoms: selectedSymptoms,
        severity: symptomSeverity,
        notes: symptomNotes
      });
      setSelectedSymptoms([]);
      setSymptomSeverity(3);
      setSymptomNotes('');
      triggerSuccessFeedback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 4. WATER STATES
  const handleWaterChange = async (diff: number) => {
    setSaving(true);
    try {
      const targetCount = Math.max(0, currentWaterCount + diff);
      await onAddWaterLog(targetCount);
      triggerSuccessFeedback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // 5. ACTIVITY STATES
  const [activityType, setActivityType] = useState<ActivityType>('Walking');
  const [activityDuration, setActivityDuration] = useState<number>(30);
  const [activityNotes, setActivityNotes] = useState('');

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onAddActivityLog({
        activityTime: new Date(logTime).toISOString(),
        activityType,
        durationMinutes: activityDuration,
        notes: activityNotes
      });
      setActivityNotes('');
      triggerSuccessFeedback();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 pt-4 space-y-6">
      
      {/* Visual Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold font-display text-slate-800">Catat Harian</h2>
        <p className="text-xs text-slate-400 mt-0.5">Pilih jenis aktivitas harian untuk dicatat ke database</p>
      </div>

      {/* Save Success Banner */}
      {savedSuccess && (
        <div className="bg-emerald-500 text-white p-3.5 rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 animate-bounce">
          <CheckCircle className="h-5 w-5" />
          <span className="text-xs font-bold font-sans">Catatan berhasil disimpan ke database!</span>
        </div>
      )}

      {/* Pill Tabs */}
      <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
        <button 
          id="log-tab-poop"
          onClick={() => { setActiveTab('poop'); setLogTime(getLocalDateTimeString()); }}
          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition ${activeTab === 'poop' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Smile className="h-5 w-5" />
          <span className="text-[9px] font-bold">BAB</span>
        </button>

        <button 
          id="log-tab-meal"
          onClick={() => { setActiveTab('meal'); setLogTime(getLocalDateTimeString()); }}
          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition ${activeTab === 'meal' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Utensils className="h-5 w-5" />
          <span className="text-[9px] font-bold">Makan</span>
        </button>

        <button 
          id="log-tab-symptom"
          onClick={() => { setActiveTab('symptom'); setLogTime(getLocalDateTimeString()); }}
          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition ${activeTab === 'symptom' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <HeartCrack className="h-5 w-5" />
          <span className="text-[9px] font-bold">Gejala</span>
        </button>

        <button 
          id="log-tab-water"
          onClick={() => { setActiveTab('water'); setLogTime(getLocalDateTimeString()); }}
          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition ${activeTab === 'water' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <GlassWater className="h-5 w-5" />
          <span className="text-[9px] font-bold">Air</span>
        </button>

        <button 
          id="log-tab-activity"
          onClick={() => { setActiveTab('activity'); setLogTime(getLocalDateTimeString()); }}
          className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition ${activeTab === 'activity' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Dumbbell className="h-5 w-5" />
          <span className="text-[9px] font-bold">Olahraga</span>
        </button>
      </div>

      {/* Datetime Selection Field (For non-water tabs) */}
      {activeTab !== 'water' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Tanggal & Waktu
            </label>
            <input 
              id="log-time-input"
              type="datetime-local"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="block w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Metode Pencatatan</span>
            <span className="text-xs text-slate-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-teal-500" />
              Sesuai Histori Kejadian
            </span>
          </div>
        </div>
      )}

      {/* FORM BODY FOR ACTIVE CATEGORY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* ================= 1. POOP FORM ================= */}
        {activeTab === 'poop' && (
          <form onSubmit={handlePoopSubmit} className="space-y-5">
            {/* Bristol Scale Visual Radio Grid */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Skala Feses Bristol Stool (Tipe 1 - 7)
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((type) => {
                  let badgeColor = "bg-slate-50 border-slate-200 text-slate-600";
                  if (bristolType === type) {
                    if (type === 4) badgeColor = "bg-emerald-500 text-white border-transparent ring-2 ring-emerald-300";
                    else if (type <= 2) badgeColor = "bg-amber-600 text-white border-transparent ring-2 ring-amber-300"; // constipation
                    else if (type >= 6) badgeColor = "bg-orange-500 text-white border-transparent ring-2 ring-orange-300"; // diarrhea
                    else badgeColor = "bg-teal-600 text-white border-transparent ring-2 ring-teal-300";
                  }
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBristolType(type)}
                      className={`h-11 rounded-xl text-sm font-extrabold flex items-center justify-center border cursor-pointer transition ${badgeColor}`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              
              {/* Bristol details description */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Deskripsi Tipe {bristolType}:</p>
                <p className="text-xs text-slate-600 leading-normal">
                  {bristolType === 1 && "⚠️ Tipe 1: Gumpalan keras terpisah seperti kacang (sangat konstipasi / sulit dikeluarkan)."}
                  {bristolType === 2 && "⚠️ Tipe 2: Berbentuk sosis tapi berbenjol-benjol lumpy (indikasi sembelit ringan)."}
                  {bristolType === 3 && "🟢 Tipe 3: Seperti sosis dengan retakan di permukaan (kondisi normal namun cenderung padat)."}
                  {bristolType === 4 && "⭐ Tipe 4: Seperti sosis atau ular, mulus dan lembut (kondisi pencernaan ideal dan sehat!)."}
                  {bristolType === 5 && "🟢 Tipe 5: Gumpalan lembut dengan tepi potongan yang jelas (normal dan mudah dikeluarkan)."}
                  {bristolType === 6 && "⚠️ Tipe 6: Potongan-potongan halus, lembek, dan bubur (kondisi diare ringan atau radang usus)."}
                  {bristolType === 7 && "⚠️ Tipe 7: Seluruhnya cair dan berair tanpa bagian padat (kondisi diare akut/dehidrasi)."}
                </p>
              </div>
            </div>

            {/* Stool Color Dots */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Warna Feses
              </label>
              <div className="flex gap-3">
                {[
                  { id: 'Brown', color: 'bg-amber-800', label: 'Cokelat' },
                  { id: 'Green', color: 'bg-emerald-800', label: 'Hijau' },
                  { id: 'Yellow', color: 'bg-yellow-500', label: 'Kuning' },
                  { id: 'Black', color: 'bg-zinc-900', label: 'Hitam' },
                  { id: 'Clay', color: 'bg-stone-300', label: 'Pucat/Clay' },
                  { id: 'Red', color: 'bg-rose-600', label: 'Merah' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStoolColor(item.id as StoolColor)}
                    className={`h-9 w-9 rounded-full flex items-center justify-center relative cursor-pointer border-2 transition ${item.color} ${stoolColor === item.id ? 'ring-2 ring-teal-500 border-white scale-110' : 'border-transparent opacity-85 hover:opacity-100'}`}
                    title={item.label}
                  >
                    {stoolColor === item.id && (
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                Terpilih: {stoolColor === 'Brown' ? 'Cokelat (Normal)' : stoolColor === 'Green' ? 'Hijau (Pengaruh sayuran/diet)' : stoolColor === 'Yellow' ? 'Kuning (Tinggi lemak/transit cepat)' : stoolColor === 'Black' ? 'Hitam (Perlu waspada zat besi/perdarahan)' : stoolColor === 'Clay' ? 'Pucat/Abu-abu (Kurang cairan empedu)' : 'Merah (Segera periksakan dokter!)'}
              </p>
            </div>

            {/* Difficulty Rating */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Kesulitan Saat Mengeluarkan
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'Easy', label: 'Mudah' },
                  { id: 'Normal', label: 'Normal' },
                  { id: 'Hard', label: 'Mengejan' },
                  { id: 'Painful', label: 'Sakit' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDifficulty(item.id as BowelDifficulty)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border cursor-pointer text-center transition ${difficulty === item.id ? 'bg-teal-500 text-white border-transparent shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Durasi di Toilet
                </label>
                <span className="text-xs font-bold text-teal-600">{poopDuration} Menit</span>
              </div>
              <input
                id="poop-duration-input"
                type="range"
                min="1"
                max="30"
                value={poopDuration}
                onChange={(e) => setPoopDuration(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                <span>Cepat (&lt; 2 menit)</span>
                <span>Lama (&gt; 15 menit)</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Catatan Opsional (Tekstur, Gejala Tambahan)
              </label>
              <textarea
                id="poop-notes-input"
                value={poopNotes}
                onChange={(e) => setPoopNotes(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Misal: minum susu pagi tadi, feses terasa sangat lunak..."
                rows={2}
              ></textarea>
            </div>

            {/* Submit Button */}
            <button
              id="save-poop-btn"
              type="submit"
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Log BAB
            </button>
          </form>
        )}

        {/* ================= 2. MEAL FORM ================= */}
        {activeTab === 'meal' && (
          <form onSubmit={handleMealSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Nama Makanan / Hidangan
              </label>
              <input
                id="meal-name-input"
                type="text"
                required
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                placeholder="Contoh: Pecel Lele, Salad Buah, Oatmeal..."
              />
            </div>

            {/* Fiber Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Kandungan Serat (Fiber)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Low', label: 'Rendah (Daging, junkfood)' },
                  { id: 'Medium', label: 'Sedang (Nasi, sup)' },
                  { id: 'High', label: 'Tinggi (Buah, oatmeal)' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFiberLevel(item.id as FiberLevel)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border cursor-pointer text-center transition ${fiberLevel === item.id ? 'bg-teal-500 text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spicy Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Tingkat Kepedasan (Spicy Level)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'None', label: 'Tidak Pedas' },
                  { id: 'Mild', label: 'Sedang' },
                  { id: 'Spicy', label: 'Sangat Pedas' },
                  { id: 'Extreme', label: 'Ekstrim 🌶️' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSpicyLevel(item.id as SpicyLevel)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border cursor-pointer text-center transition ${spicyLevel === item.id ? 'bg-rose-500 text-white border-transparent' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Minuman Pendamping
              </label>
              <input
                id="meal-beverages-input"
                type="text"
                value={beverages}
                onChange={(e) => setBeverages(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                placeholder="Contoh: Es Teh Manis, Kopi Hitam, Air Putih..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Catatan Opsional
              </label>
              <textarea
                id="meal-notes-input"
                value={mealNotes}
                onChange={(e) => setMealNotes(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Catat jika porsi besar, atau makan terlalu cepat..."
                rows={2}
              ></textarea>
            </div>

            <button
              id="save-meal-btn"
              type="submit"
              disabled={saving || !mealName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Log Makanan
            </button>
          </form>
        )}

        {/* ================= 3. SYMPTOM FORM ================= */}
        {activeTab === 'symptom' && (
          <form onSubmit={handleSymptomSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Gejala Pencernaan Yang Dirasakan
              </label>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {symptomOptions.map((option) => {
                  const isChecked = selectedSymptoms.includes(option.id);
                  return (
                    <div 
                      key={option.id}
                      onClick={() => toggleSymptom(option.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${isChecked ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div click
                        className="rounded border-slate-300 text-amber-500 accent-amber-500"
                      />
                      <span>{option.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Severity slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Keparahan Gejala (Severity)
                </label>
                <span className="text-xs font-bold text-amber-600">{symptomSeverity} / 10</span>
              </div>
              <input
                id="symptom-severity-input"
                type="range"
                min="1"
                max="10"
                value={symptomSeverity}
                onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                <span>Sangat Ringan (1)</span>
                <span>Sangat Parah (10)</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Catatan Gejala
              </label>
              <textarea
                id="symptom-notes-input"
                value={symptomNotes}
                onChange={(e) => setSymptomNotes(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Misal: kembung terasa hebat setelah makan kol kubis..."
                rows={2}
              ></textarea>
            </div>

            <button
              id="save-symptom-btn"
              type="submit"
              disabled={saving || selectedSymptoms.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Log Gejala
            </button>
          </form>
        )}

        {/* ================= 4. WATER FORM ================= */}
        {activeTab === 'water' && (
          <div className="space-y-6 text-center py-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Asupan Hari Ini</p>
              <p className="text-4xl font-extrabold text-slate-800 font-display mt-1">{currentWaterCount} / {currentWaterTarget} Gelas</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Satuan standard gelas: 250ml</p>
            </div>

            {/* Animated Glass Indicators */}
            <div className="flex justify-center flex-wrap gap-2.5 max-w-[280px] mx-auto py-3">
              {Array.from({ length: Math.max(8, currentWaterCount) }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-9 h-12 border-2 rounded-b-lg rounded-t-sm relative overflow-hidden transition-all duration-300 ${idx < currentWaterCount ? 'border-sky-500 bg-sky-50' : 'border-slate-200 bg-transparent'}`}
                >
                  {idx < currentWaterCount && (
                    <div className="absolute inset-x-0 bottom-0 bg-sky-400 h-4/5 animate-pulse rounded-b-sm"></div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-sky-800/60">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Fast counter actions */}
            <div className="flex items-center justify-center gap-5">
              <button
                id="minus-water-btn"
                onClick={() => handleWaterChange(-1)}
                disabled={saving || currentWaterCount === 0}
                className="h-14 w-14 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full flex items-center justify-center cursor-pointer transition active:scale-95 disabled:opacity-40"
              >
                <Minus className="h-6 w-6" />
              </button>
              
              <button
                id="plus-water-btn"
                onClick={() => handleWaterChange(1)}
                disabled={saving}
                className="h-16 w-16 bg-sky-500 hover:bg-sky-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-100 cursor-pointer transition active:scale-95"
              >
                <Plus className="h-8 w-8" />
              </button>
            </div>

            <p className="text-xs font-semibold text-slate-500 leading-normal">
              {currentWaterCount >= currentWaterTarget 
                ? 'Luar biasa! Target hidrasi pencernaan harian Anda telah tercapai! 🎉' 
                : `Kurang ${currentWaterTarget - currentWaterCount} gelas untuk mencapai target hidrasi ${currentWaterTarget} gelas.`}
            </p>
          </div>
        )}

        {/* ================= 5. ACTIVITY FORM ================= */}
        {activeTab === 'activity' && (
          <form onSubmit={handleActivitySubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Jenis Olahraga / Aktivitas Fisik
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Jogging', label: 'Lari / Jogging' },
                  { id: 'Walking', label: 'Berjalan Santai' },
                  { id: 'Gym', label: 'Gym / Angkat Beban' },
                  { id: 'Yoga', label: 'Yoga / Peregangan' },
                  { id: 'Sitting', label: 'Duduk Lama' },
                  { id: 'Other', label: 'Aktivitas Lain' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivityType(item.id as ActivityType)}
                    className={`py-2.5 px-1 rounded-xl text-xs font-bold border cursor-pointer text-center transition ${activityType === item.id ? 'bg-teal-500 text-white border-transparent shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Durasi Aktivitas (Menit)
                </label>
                <span className="text-xs font-bold text-teal-600">{activityDuration} Menit</span>
              </div>
              <input
                id="activity-duration-input"
                type="range"
                min="5"
                max="180"
                step="5"
                value={activityDuration}
                onChange={(e) => setActivityDuration(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                <span>Ringan (5 Menit)</span>
                <span>Intens (3 Jam)</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Catatan Opsional
              </label>
              <textarea
                id="activity-notes-input"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                className="block w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Misal: berkeringat banyak, merasa sangat bugar..."
                rows={2}
              ></textarea>
            </div>

            <button
              id="save-activity-btn"
              type="submit"
              disabled={saving}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Simpan Log Aktivitas
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
