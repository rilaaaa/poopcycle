/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { PoopLog, MealLog, SymptomLog, WaterLog, ActivityLog } from '../types';
import { Language } from '../lib/translations';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Smile, 
  Utensils, 
  HeartCrack, 
  GlassWater, 
  Dumbbell,
  CalendarDays
} from 'lucide-react';

interface CalendarViewProps {
  poopLogs: PoopLog[];
  mealLogs: MealLog[];
  symptomLogs: SymptomLog[];
  waterLogs: WaterLog[];
  activityLogs: ActivityLog[];
  onDeleteLog: (collectionName: string, docId: string) => Promise<void>;
  lang: Language;
  theme: 'light' | 'dark';
}

export default function CalendarView({
  poopLogs,
  mealLogs,
  symptomLogs,
  waterLogs,
  activityLogs,
  onDeleteLog,
  lang,
  theme
}: CalendarViewProps) {
  // Navigation for month
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Mng'];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    // Adjust so Monday is 0 and Sunday is 6
    return day === 0 ? 6 : day - 1;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Navigate month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Check logs on a specific date (local date comparison YYYY-MM-DD)
  const getLogsForDateStr = (dateStr: string) => {
    const poop = poopLogs.filter(p => p.poopTime.startsWith(dateStr));
    const meal = mealLogs.filter(m => m.mealTime.startsWith(dateStr));
    const symptom = symptomLogs.filter(s => s.logDate.startsWith(dateStr));
    const water = waterLogs.filter(w => w.logDate === dateStr);
    const activity = activityLogs.filter(a => a.activityTime.startsWith(dateStr));

    return { poop, meal, symptom, water, activity };
  };

  // Handle selected date details
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const dayLogs = getLogsForDateStr(selectedDateStr);

  const handleDelete = async (collection: string, id: string) => {
    setDeletingId(id);
    try {
      await onDeleteLog(collection, id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 pt-4 space-y-6">
      
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold font-display text-slate-800">Kalender Interaktif</h2>
        <p className="text-xs text-slate-400 mt-0.5">Pantau ringkasan kejadian pencernaan dan riwayat log</p>
      </div>

      {/* Month Header Controller */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <button 
          id="prev-month-btn"
          onClick={prevMonth}
          className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer text-slate-500"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-bold text-sm text-slate-800 font-display">
          {months[month]} {year}
        </span>
        <button 
          id="next-month-btn"
          onClick={nextMonth}
          className="p-2 hover:bg-slate-50 border border-slate-100 rounded-xl transition cursor-pointer text-slate-500"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {daysOfWeek.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Fill empty leading space */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square"></div>
          ))}

          {/* Render actual days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const thisDay = new Date(year, month, dayNum);
            const dateStr = thisDay.toISOString().split('T')[0];
            const hasLogs = getLogsForDateStr(dateStr);
            const isSelected = selectedDate.getDate() === dayNum && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            const isToday = new Date().getDate() === dayNum && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDate(thisDay)}
                className={`aspect-square flex flex-col justify-between p-1.5 rounded-xl border text-center transition cursor-pointer relative ${
                  isSelected 
                    ? 'bg-teal-600 text-white border-transparent shadow-sm' 
                    : isToday 
                      ? 'bg-slate-100 text-slate-800 border-teal-300 font-bold' 
                      : 'bg-slate-50/50 hover:bg-slate-50 text-slate-700 border-slate-100'
                }`}
              >
                {/* Day Number */}
                <span className="text-[11px] font-bold self-start">{dayNum}</span>

                {/* Log indicators dot grid */}
                <div className="flex gap-0.5 justify-center w-full mt-auto">
                  {hasLogs.poop.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-600'}`}></span>
                  )}
                  {hasLogs.meal.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></span>
                  )}
                  {hasLogs.symptom.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-400'}`}></span>
                  )}
                  {hasLogs.water.length > 0 && hasLogs.water[0].glasses > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-400'}`}></span>
                  )}
                  {hasLogs.activity.length > 0 && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-400'}`}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date detail list */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 px-1">
          <CalendarDays className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Detail Log: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        <div className="space-y-2">
          {/* POOP LOGS */}
          {dayLogs.poop.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-teal-200 transition">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 flex-shrink-0">
                  <Smile className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">BAB - Bristol Tipe {log.bristolType}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      {new Date(log.poopTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Warna: {log.color === 'Brown' ? 'Cokelat' : log.color === 'Green' ? 'Hijau' : log.color === 'Yellow' ? 'Kuning' : log.color === 'Black' ? 'Hitam' : log.color === 'Clay' ? 'Pucat/Clay' : 'Merah'} • 
                    Kesulitan: {log.difficulty === 'Easy' ? 'Mudah' : log.difficulty === 'Normal' ? 'Normal' : log.difficulty === 'Hard' ? 'Mengejan' : 'Sakit'} • 
                    {log.duration} menit
                  </p>
                  {log.notes && (
                    <p className="text-[10px] text-slate-500 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                      " {log.notes} "
                    </p>
                  )}
                </div>
              </div>
              <button
                id={`delete-poop-${log.id}`}
                onClick={() => handleDelete('poops', log.id)}
                disabled={deletingId === log.id}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition flex-shrink-0 cursor-pointer disabled:opacity-40"
                title="Hapus log"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* MEAL LOGS */}
          {dayLogs.meal.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-emerald-200 transition">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">{log.mealName}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      {new Date(log.mealTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Serat: {log.fiberLevel === 'High' ? 'Tinggi' : log.fiberLevel === 'Medium' ? 'Sedang' : 'Rendah'} • 
                    Kepedasan: {log.spicyLevel === 'None' ? 'Tidak Pedas' : log.spicyLevel === 'Mild' ? 'Sedang' : log.spicyLevel === 'Spicy' ? 'Sangat Pedas' : 'Ekstrim 🌶️'} • 
                    Minum: {log.beverages}
                  </p>
                  {log.notes && (
                    <p className="text-[10px] text-slate-500 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                      " {log.notes} "
                    </p>
                  )}
                </div>
              </div>
              <button
                id={`delete-meal-${log.id}`}
                onClick={() => handleDelete('meals', log.id)}
                disabled={deletingId === log.id}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition flex-shrink-0 cursor-pointer disabled:opacity-40"
                title="Hapus log"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* SYMPTOM LOGS */}
          {dayLogs.symptom.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-amber-200 transition">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                  <HeartCrack className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">Gejala (Severity: {log.severity}/10)</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      {new Date(log.logDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {log.symptoms.map(s => (
                      <span key={s} className="text-[9px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                        {s === 'Bloating' ? 'Kembung' : s === 'Cramping' ? 'Kram Perut' : s === 'Gas' ? 'Buang Angin' : s === 'Acid Reflux' ? 'Asam Lambung' : s === 'Nausea' ? 'Mual' : s === 'Diarrhea' ? 'Diare' : 'Sembelit'}
                      </span>
                    ))}
                  </div>
                  {log.notes && (
                    <p className="text-[10px] text-slate-500 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                      " {log.notes} "
                    </p>
                  )}
                </div>
              </div>
              <button
                id={`delete-symptom-${log.id}`}
                onClick={() => handleDelete('symptoms', log.id)}
                disabled={deletingId === log.id}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition flex-shrink-0 cursor-pointer disabled:opacity-40"
                title="Hapus log"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* WATER LOG */}
          {dayLogs.water.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-sky-200 transition">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-sky-50 rounded-lg flex items-center justify-center text-sky-600 flex-shrink-0">
                  <GlassWater className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Air Minum</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Asupan total harian: <span className="font-bold text-slate-700">{log.glasses}</span> dari target <span className="font-bold text-slate-700">{log.target}</span> gelas.
                  </p>
                </div>
              </div>
              <button
                id={`delete-water-${log.id}`}
                onClick={() => handleDelete('waters', log.id)}
                disabled={deletingId === log.id}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition flex-shrink-0 cursor-pointer disabled:opacity-40"
                title="Hapus log"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* ACTIVITY LOG */}
          {dayLogs.activity.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-3 hover:border-rose-200 transition">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 bg-rose-50 rounded-lg flex items-center justify-center text-rose-600 flex-shrink-0">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">
                      {log.activityType === 'Jogging' ? 'Lari / Jogging' : log.activityType === 'Walking' ? 'Berjalan' : log.activityType === 'Gym' ? 'Gym/Beban' : log.activityType === 'Yoga' ? 'Yoga' : log.activityType === 'Sitting' ? 'Duduk Lama' : 'Aktivitas'}
                    </p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                      {new Date(log.activityTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                    Durasi: {log.durationMinutes} menit
                  </p>
                  {log.notes && (
                    <p className="text-[10px] text-slate-500 mt-1.5 italic bg-slate-50 p-1.5 rounded">
                      " {log.notes} "
                    </p>
                  )}
                </div>
              </div>
              <button
                id={`delete-activity-${log.id}`}
                onClick={() => handleDelete('activities', log.id)}
                disabled={deletingId === log.id}
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition flex-shrink-0 cursor-pointer disabled:opacity-40"
                title="Hapus log"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Empty state details */}
          {dayLogs.poop.length === 0 && dayLogs.meal.length === 0 && dayLogs.symptom.length === 0 && dayLogs.water.length === 0 && dayLogs.activity.length === 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm text-center">
              <p className="text-xs text-slate-400 italic">Tidak ada catatan kesehatan yang terekam pada tanggal ini.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
