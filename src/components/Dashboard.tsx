/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { PoopLog, WaterLog, ActivityLog } from '../types';
import { Language } from '../lib/translations';
import { 
  Bell, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Droplet, 
  Flame, 
  Plus, 
  RotateCw,
  TrendingUp,
  BrainCircuit,
  Award,
  X,
  Check,
  Leaf
} from 'lucide-react';

interface DashboardProps {
  displayName: string;
  poopLogs: PoopLog[];
  waterLogs: WaterLog[];
  activityLogs: ActivityLog[];
  aiAnalysis: {
    healthStatus: string;
    healthScore: number;
    predictedTimeRange: string;
    confidenceLevel: number;
    explanation: string;
    insights: string[];
    isFallback: boolean;
  };
  isAnalyzing: boolean;
  onRefreshAnalysis: () => void;
  onNavigateToLog: (category: 'poop' | 'meal' | 'symptom' | 'water' | 'activity') => void;
  lang: Language;
  theme: 'light' | 'dark';
}

export default function Dashboard({
  displayName,
  poopLogs,
  waterLogs,
  activityLogs,
  aiAnalysis,
  isAnalyzing,
  onRefreshAnalysis,
  onNavigateToLog,
  lang,
  theme
}: DashboardProps) {

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Asupan Air Minum Rendah',
      body: 'Asupan air minum Anda hari ini masih kurang dari target. Minum 3 gelas lagi untuk pencernaan sehat.',
      time: '1 jam yang lalu',
      unread: true,
      category: 'water'
    },
    {
      id: 2,
      title: 'Rekomendasi Pola Serat',
      body: 'Makan malam kaya serat tinggi disarankan agar buang air besar besok pagi lancar.',
      time: '3 jam yang lalu',
      unread: true,
      category: 'diet'
    },
    {
      id: 3,
      title: 'Prediksi Waktu BAB',
      body: 'Berdasarkan histori Anda, AI memprediksi waktu BAB optimal Anda berikutnya adalah besok pagi pukul 06:30.',
      time: '6 jam yang lalu',
      unread: false,
      category: 'ai'
    },
    {
      id: 4,
      title: 'Aktivitas Duduk Terlalu Lama',
      body: 'Terpantau aktivitas fisik Anda hari ini masih minim. Lakukan jalan santai 10 menit agar melancarkan pencernaan.',
      time: '12 jam yang lalu',
      unread: false,
      category: 'activity'
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Format today's date in Indonesian
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('id-ID', options);
  };

  // Get last poop log details
  const getLastPoop = () => {
    if (poopLogs.length === 0) return null;
    const sorted = [...poopLogs].sort((a, b) => new Date(b.poopTime).getTime() - new Date(a.poopTime).getTime());
    const last = sorted[0];
    
    const diffMs = new Date().getTime() - new Date(last.poopTime).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let relativeTime = 'Baru saja';
    if (diffHours > 24) {
      relativeTime = `${Math.floor(diffHours / 24)} hari lalu`;
    } else if (diffHours > 0) {
      relativeTime = `${diffHours} jam lalu`;
    } else if (diffMins > 0) {
      relativeTime = `${diffMins} menit lalu`;
    }

    return {
      time: new Date(last.poopTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      type: `Type ${last.bristolType}`,
      difficulty: last.difficulty === 'Easy' ? 'Mudah' : last.difficulty === 'Normal' ? 'Normal' : last.difficulty === 'Hard' ? 'Sulit' : 'Sakit',
      relativeTime
    };
  };

  const lastPoop = getLastPoop();

  // Get current water progress
  const getWaterProgress = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const log = waterLogs.find(w => w.logDate === todayStr);
    const current = log ? log.glasses : 0;
    const target = log ? log.target : 8;
    const remaining = Math.max(0, target - current);
    const percentage = Math.min(100, (current / target) * 100);

    return { current, target, remaining, percentage };
  };

  const water = getWaterProgress();

  // Get latest activity
  const getLatestActivity = () => {
    if (activityLogs.length === 0) return null;
    const sorted = [...activityLogs].sort((a, b) => new Date(b.activityTime).getTime() - new Date(a.activityTime).getTime());
    return sorted[0];
  };

  const latestActivity = getLatestActivity();

  // Calculate weekly frequency metrics (Mon-Sun)
  const getWeeklyFrequencies = () => {
    const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Mng'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    // Get start of this week (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMon = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMon);
    monday.setHours(0, 0, 0, 0);

    poopLogs.forEach(log => {
      const logDate = new Date(log.poopTime);
      if (logDate >= monday) {
        let dayIndex = logDate.getDay(); // 0 is Sunday, 1 is Monday...
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // convert to index where Mon is 0 and Sun is 6
        if (dayIndex >= 0 && dayIndex < 7) {
          counts[dayIndex]++;
        }
      }
    });

    const totalPoopThisWeek = counts.reduce((a, b) => a + b, 0);
    const avgPerDay = (totalPoopThisWeek / 7).toFixed(1);

    return { days, counts, totalPoopThisWeek, avgPerDay };
  };

  const weeklyStats = getWeeklyFrequencies();

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24 px-4 pt-4">
      
      {/* Top Banner & Profile Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative h-11 w-11 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 overflow-hidden group">
            {/* Inner glow and orbit effects */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-emerald-400 to-teal-500 rounded-full blur-md opacity-35 group-hover:opacity-60 transition-opacity" />
            
            {/* Premium nested icon combination */}
            <div className="relative flex items-center justify-center w-full h-full">
              {/* Outer spinning cycle representing metabolism & cycle */}
              <RotateCw className="absolute h-7 w-7 text-emerald-100/40 animate-[spin_10s_linear_infinite]" />
              {/* Central hero Leaf representing fiber, gut health, and clean digestion */}
              <Leaf className="h-4.5 w-4.5 text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)] fill-white/20 transform -rotate-12 group-hover:scale-110 transition-transform duration-300" />
              {/* Sparkle for Smart/AI element */}
              <Sparkles className="absolute h-2.5 w-2.5 text-amber-300 top-2 right-2 animate-pulse" />
            </div>
          </div>
          <span className="text-xl font-bold text-slate-800 font-display tracking-tight">PoopCycle</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="bell-notification-btn"
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition focus:outline-none"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse scale-90">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="flex items-center gap-1 bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200">
            <User className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-semibold text-slate-700 max-w-[80px] truncate">{displayName}</span>
          </div>
        </div>
      </div>

      {/* Greeting and Date */}
      <div>
        <p className="text-xs text-slate-400 font-medium">Hai, {displayName}! 👋</p>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight font-display">{getFormattedDate()}</h2>
      </div>

      {/* Digestive Health Score Card */}
      <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-xl shadow-teal-100 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <Award className="h-40 w-40" />
        </div>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-widest text-teal-100">Status Pencernaan</p>
            <div className="flex items-center gap-2">
              {aiAnalysis.healthStatus === 'Belum Ada Data' ? (
                <AlertCircle className="h-6 w-6 text-teal-200" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-emerald-200 fill-teal-600" />
              )}
              <span className="text-2xl font-bold font-display">{aiAnalysis.healthStatus}</span>
            </div>
            <p className="text-xs text-teal-50 leading-relaxed max-w-[240px]">
              {aiAnalysis.healthStatus === 'Belum Ada Data'
                ? 'Catat buang air besar (BAB) pertama Anda untuk mengaktifkan skor kesehatan pencernaan.'
                : aiAnalysis.healthStatus === 'Sehat' || aiAnalysis.healthStatus === 'Optimal' 
                  ? 'Pola aktivitas & pencernaan Anda berada dalam kondisi prima!' 
                  : aiAnalysis.healthStatus === 'Konstipasi' 
                    ? 'Feses keras terpantau. Tingkatkan serat & konsumsi air segera.' 
                    : aiAnalysis.healthStatus === 'Diare' 
                      ? 'Feses cair terdeteksi. Batasi makanan pedas & pastikan hidrasi.' 
                      : 'Pencernaan terpantau sedikit melambat. Perhatikan pola makan.'}
            </p>
          </div>
          <div className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 text-center border border-white/20">
            <p className="text-[9px] uppercase font-bold tracking-wider text-teal-100">Skor Gut</p>
            <p className="text-3xl font-extrabold font-display leading-tight">
              {aiAnalysis.healthStatus === 'Belum Ada Data' ? '--' : aiAnalysis.healthScore}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Last Bowel & AI Predictions */}
      <div className="grid grid-cols-2 gap-3">
        {/* Last Bowel Card */}
        <div 
          onClick={() => onNavigateToLog('poop')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-2">
            <Clock className="h-4 w-4 text-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">BAB Terakhir</span>
          </div>
          {lastPoop ? (
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800 font-display">{lastPoop.time}</p>
              <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-md">
                {lastPoop.type}
              </span>
              <p className="text-[11px] text-slate-400 mt-2">{lastPoop.relativeTime} • {lastPoop.difficulty}</p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-xs font-semibold text-slate-500">Belum ada catatan BAB</p>
              <p className="text-[10px] text-slate-400 mt-1">Ketuk tombol plus di bawah untuk mencatat.</p>
            </div>
          )}
        </div>

        {/* AI Prediction Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Prediksi AI</span>
            </div>
            <button 
              id="refresh-ai-btn"
              onClick={(e) => { e.stopPropagation(); onRefreshAnalysis(); }}
              disabled={isAnalyzing || aiAnalysis.healthStatus === 'Belum Ada Data'}
              className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-45 transition"
              title="Refresh analisis AI"
            >
              <RotateCw className={`h-3 w-3 ${isAnalyzing ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-800 font-display">
              {aiAnalysis.healthStatus === 'Belum Ada Data' ? '--:--' : aiAnalysis.predictedTimeRange}
            </p>
            <span className="inline-block px-2 py-0.5 bg-violet-50 text-violet-700 text-[10px] font-bold rounded-md">
              {aiAnalysis.healthStatus === 'Belum Ada Data' ? '0% yakin' : `${aiAnalysis.confidenceLevel}% yakin`}
            </span>
            <p className="text-[11px] text-slate-400 mt-2 line-clamp-2" title={aiAnalysis.explanation}>
              {aiAnalysis.healthStatus === 'Belum Ada Data'
                ? 'Mulai isi log BAB pertama Anda untuk mengaktifkan prediksi bertenaga AI.'
                : aiAnalysis.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Water Progress & Quick Activity */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water Progress */}
        <div 
          onClick={() => onNavigateToLog('water')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-2">
            <Droplet className="h-4 w-4 text-sky-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Air Minum</span>
          </div>
          <p className="text-lg font-bold text-slate-800 font-display">{water.current} / {water.target} gelas</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 mb-1">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${water.percentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {water.remaining > 0 ? `Kurang ${water.remaining} gelas lagi` : 'Target harian tercapai! 🌟'}
          </p>
        </div>

        {/* Latest Activity */}
        <div 
          onClick={() => onNavigateToLog('activity')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition"
        >
          <div className="flex items-center gap-1 text-slate-400 mb-2">
            <Flame className="h-4 w-4 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Aktivitas</span>
          </div>
          {latestActivity ? (
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-800 font-display truncate">
                {latestActivity.activityType === 'Gym' ? 'Gym' : 
                 latestActivity.activityType === 'Jogging' ? 'Jogging' : 
                 latestActivity.activityType === 'Walking' ? 'Berjalan' : 
                 latestActivity.activityType === 'Yoga' ? 'Yoga' : 
                 latestActivity.activityType === 'Sitting' ? 'Duduk Lama' : 'Olahraga'}
              </p>
              <p className="text-xs text-slate-500 mt-2">{latestActivity.durationMinutes} menit</p>
              <p className="text-[10px] text-slate-400">
                {new Date(latestActivity.activityTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-xs font-semibold text-slate-500">Belum ada aktivitas</p>
              <p className="text-[10px] text-slate-400 mt-1">Catat aktivitas harian Anda untuk melacak pola usus.</p>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Bowel Frequency Chart */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Frekuensi BAB — 7 Hari</h3>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Minggu Ini</span>
        </div>
        
        {/* Dynamic bar graph mimicking mockup */}
        <div className="flex items-end justify-between gap-2 h-20 pt-2 mb-2">
          {weeklyStats.days.map((day, idx) => {
            const count = weeklyStats.counts[idx];
            // Max height is 3 counts in a day for this visualization
            const percentage = Math.min(100, (count / 3) * 100);
            const isToday = idx === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
            
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full group">
                <div className="w-full bg-slate-50 hover:bg-slate-100 rounded-t-lg flex-1 relative flex items-end overflow-hidden border border-slate-100">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ease-out ${isToday ? 'bg-sky-400' : 'bg-teal-500'}`}
                    style={{ height: `${Math.max(12, percentage)}%`, opacity: count === 0 ? 0.15 : 1 }}
                  >
                    {count > 0 && (
                      <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-bold text-white">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold ${isToday ? 'text-sky-500 font-bold' : 'text-slate-400'}`}>
                  {day}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          Rata-rata <span className="font-bold text-slate-700">{weeklyStats.avgPerDay}x</span> per hari • <span className="font-bold text-slate-700">{weeklyStats.totalPoopThisWeek} kali</span> minggu ini
        </p>
      </div>

      {/* Auto AI Insights Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2.5">
          <BrainCircuit className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Insight Otomatis</h3>
        </div>
        <div className="space-y-3">
          {isAnalyzing ? (
            <div className="space-y-2 py-2">
              <div className="h-3 bg-slate-100 rounded animate-pulse w-5/6"></div>
              <div className="h-3 bg-slate-100 rounded animate-pulse w-full"></div>
              <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5"></div>
            </div>
          ) : aiAnalysis.insights && aiAnalysis.insights.length > 0 ? (
            aiAnalysis.insights.map((insight, idx) => {
              // Highlight color depending on index / content
              let dotColor = 'bg-teal-500';
              if (insight.toLowerCase().includes('kurang') || insight.toLowerCase().includes('pedas') || insight.toLowerCase().includes('bawah')) {
                dotColor = 'bg-amber-400';
              } else if (idx === 1) {
                dotColor = 'bg-sky-400';
              }
              return (
                <div key={idx} className="flex items-start gap-3 text-xs text-slate-600 leading-relaxed border-b border-slate-50/50 pb-2.5 last:border-none last:pb-0">
                  <div className={`w-1.5 h-1.5 rounded-full ${dotColor} mt-1.5 flex-shrink-0`}></div>
                  <span className="font-medium">{insight}</span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada data yang cukup untuk memformulasikan insight otomatis harian. Masukkan beberapa catatan terlebih dahulu!</p>
          )}
        </div>
      </div>

      {/* Big call to action button */}
      <button 
        id="catat-bab-home-btn"
        onClick={() => onNavigateToLog('poop')}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-teal-100 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition"
      >
        <Plus className="h-5 w-5" />
        Catat BAB Sekarang
      </button>

      {/* Notifications Drawer/Modal Panel */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div 
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-teal-600 animate-bounce" />
                <h3 className="font-bold text-sm text-slate-800">Notifikasi Pencernaan</h3>
              </div>
              <button 
                id="close-notifications-btn"
                onClick={() => setShowNotifications(false)}
                className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Actions Bar */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-50 flex items-center justify-between bg-white text-[11px]">
                <span className="text-slate-400 font-semibold">{unreadCount} belum dibaca</span>
                <button 
                  id="mark-all-read-btn"
                  onClick={markAllAsRead}
                  className="text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                  Tandai semua dibaca
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition relative group flex gap-3 ${item.unread ? 'bg-teal-50/40 border-teal-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                  >
                    {/* Unread indicator dot */}
                    {item.unread && (
                      <span className="absolute top-3.5 right-3.5 h-2 w-2 bg-teal-500 rounded-full"></span>
                    )}

                    {/* Left Icon Category */}
                    <div className="flex-shrink-0">
                      {item.category === 'water' && (
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                          <Droplet className="h-4 w-4" />
                        </div>
                      )}
                      {item.category === 'diet' && (
                        <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                      {item.category === 'ai' && (
                        <div className="h-8 w-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                          <Sparkles className="h-4 w-4" />
                        </div>
                      )}
                      {item.category === 'activity' && (
                        <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                          <Flame className="h-4 w-4" />
                        </div>
                      )}
                    </div>

                    {/* Body content */}
                    <div className="space-y-0.5 pr-4 flex-1">
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{item.body}</p>
                      <p className="text-[9px] text-slate-400 font-semibold">{item.time}</p>
                    </div>

                    {/* Delete action */}
                    <button 
                      onClick={() => deleteNotification(item.id)}
                      className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition text-[10px] font-bold"
                      title="Hapus"
                    >
                      Hapus
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-xs font-bold text-slate-400">Tidak ada notifikasi baru</p>
                  <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto leading-normal">Tips kesehatan pencernaan Anda akan muncul di sini.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                id="close-notifications-footer-btn"
                onClick={() => setShowNotifications(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
