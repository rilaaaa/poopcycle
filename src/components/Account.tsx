/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LogOut, 
  Database, 
  Trash2, 
  Sliders, 
  BellRing, 
  User,
  Plus, 
  Minus,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Languages,
  Sun,
  Moon
} from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface AccountProps {
  displayName: string;
  email: string;
  waterGoal: number;
  notificationsEnabled: boolean;
  onUpdateProfile: (displayName: string) => Promise<void>;
  onUpdateWaterGoal: (newGoal: number) => Promise<void>;
  onToggleNotifications: (enabled: boolean) => Promise<void>;
  onSeedDatabase: () => Promise<void>;
  onClearDatabase: () => Promise<void>;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export default function Account({
  displayName,
  email,
  waterGoal,
  notificationsEnabled,
  onUpdateProfile,
  onUpdateWaterGoal,
  onToggleNotifications,
  onSeedDatabase,
  onClearDatabase,
  lang,
  setLang,
  theme,
  setTheme
}: AccountProps) {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(displayName);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Custom Confirmation Dialog state
  const [confirmAction, setConfirmAction] = useState<'logout' | 'seed' | 'clear' | null>(null);

  const t = translations[lang];

  const handleLogout = () => {
    setConfirmAction('logout');
  };

  const handleWaterGoalChange = async (diff: number) => {
    const newGoal = Math.max(4, Math.min(16, waterGoal + diff));
    try {
      await onUpdateWaterGoal(newGoal);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerSeed = () => {
    setConfirmAction('seed');
  };

  const triggerClear = () => {
    setConfirmAction('clear');
  };

  const executeConfirmedAction = async () => {
    const action = confirmAction;
    setConfirmAction(null);

    if (action === 'logout') {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Error signing out:', err);
      }
    } else if (action === 'seed') {
      setSeeding(true);
      setSeedSuccess(false);
      try {
        await onSeedDatabase();
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setSeeding(false);
      }
    } else if (action === 'clear') {
      setClearing(true);
      setClearSuccess(false);
      try {
        await onClearDatabase();
        setClearSuccess(true);
        setTimeout(() => setClearSuccess(false), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-24 px-4 pt-4 space-y-6">
      
      {/* Title */}
      <div className="text-center">
        <h2 className="text-xl font-bold font-display text-slate-800 dark:text-slate-100">{t.accTitle}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t.accSubtitle}</p>
      </div>

      {/* Profile Card Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200 transition-colors">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-teal-50 dark:bg-slate-800 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 truncate flex-1">
            {!isEditingProfile ? (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={displayName}>{displayName}</h3>
                <button
                  id="start-edit-profile-btn"
                  onClick={() => { setEditedName(displayName); setIsEditingProfile(true); }}
                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-extrabold underline cursor-pointer shrink-0"
                >
                  {t.accEditName}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  id="edit-display-name-input"
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="block w-full border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  placeholder={t.accLabelName}
                  required
                />
                <div className="flex gap-2">
                  <button
                    id="save-profile-btn"
                    onClick={async () => {
                      if (!editedName.trim()) return;
                      setUpdatingProfile(true);
                      try {
                        await onUpdateProfile(editedName.trim());
                        setIsEditingProfile(false);
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUpdatingProfile(false);
                      }
                    }}
                    disabled={updatingProfile || !editedName.trim()}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-bold rounded-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {updatingProfile ? t.accSaving : t.accSave}
                  </button>
                  <button
                    id="cancel-edit-profile-btn"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition cursor-pointer"
                  >
                    {t.accCancel}
                  </button>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate font-medium">{email || t.accGuest}</p>
            <span className="inline-flex items-center gap-1 text-[9px] bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 text-teal-800 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              {t.accSecured}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications, Language, Theme, and Water Goal Config */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/50 pb-2.5">
          <Sliders className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.accConfigTitle}</h3>
        </div>

        {/* Water Goal Selector */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accWaterGoal}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{t.accWaterDesc}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="dec-water-target-btn"
              onClick={() => handleWaterGoalChange(-1)}
              disabled={waterGoal <= 4}
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-35 cursor-pointer"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display w-16 text-center">
              {waterGoal} {t.dashGlasses}
            </span>
            <button
              id="inc-water-target-btn"
              onClick={() => handleWaterGoalChange(1)}
              disabled={waterGoal >= 16}
              className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 disabled:opacity-35 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mock Notifications Alert Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accNotifTitle}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{t.accNotifDesc}</p>
          </div>
          <button
            id="notification-toggle-btn"
            onClick={() => onToggleNotifications(!notificationsEnabled)}
            className={`w-12 h-6.5 rounded-full p-1 transition duration-200 cursor-pointer ${notificationsEnabled ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div className={`w-4.5 h-4.5 rounded-full bg-white transition duration-200 ${notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* LANGUAGE SWITCHER */}
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accLanguage}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{t.accLanguageDesc}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              id="switch-lang-id"
              onClick={() => setLang('id')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${lang === 'id' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
              INA
            </button>
            <button
              id="switch-lang-en"
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${lang === 'en' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
              ENG
            </button>
          </div>
        </div>

        {/* THEME TOGGLE */}
        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-4">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accTheme}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{t.accThemeDesc}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              id="switch-theme-light"
              onClick={() => setTheme('light')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <Sun className="h-3 w-3" />
              <span>{t.accThemeLight}</span>
            </button>
            <button
              id="switch-theme-dark"
              onClick={() => setTheme('dark')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <Moon className="h-3 w-3" />
              <span>{t.accThemeDark}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sandbox Seeding and Reset section */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors">
        <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/50 pb-2.5">
          <Database className="h-4.5 w-4.5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.accDbTool}</h3>
        </div>

        {/* Sandbox Success Feedback */}
        {seedSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/35 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 p-3 rounded-xl flex items-center gap-2 animate-pulse">
            <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-bold">{t.accSeedSuccess}</span>
          </div>
        )}

        {clearSuccess && (
          <div className="bg-rose-50 dark:bg-rose-950/35 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 p-3 rounded-xl flex items-center gap-2 animate-pulse">
            <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <span className="text-[11px] font-bold">{t.accClearSuccess}</span>
          </div>
        )}

        {/* Seed button */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.accSeedTitle}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">
              {t.accSeedDesc}
            </p>
          </div>
          <button
            id="seed-db-btn"
            onClick={triggerSeed}
            disabled={seeding}
            className="px-3 py-2 bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 border border-teal-200 dark:border-slate-700 text-teal-700 dark:text-teal-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shrink-0"
          >
            {seeding ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-teal-500 dark:text-teal-400" />
            )}
            {t.accSeedBtn}
          </button>
        </div>

        {/* Clear/Reset button */}
        <div className="flex items-start justify-between gap-4 pt-1">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{t.accClearTitle}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-normal">
              {t.accClearDesc}
            </p>
          </div>
          <button
            id="clear-db-btn"
            onClick={triggerClear}
            disabled={clearing}
            className="px-3 py-2 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 text-rose-700 dark:text-rose-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shrink-0"
          >
            {clearing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
            )}
            {t.accClearBtn}
          </button>
        </div>
      </div>

      {/* Logout button */}
      <button
        id="logout-btn"
        onClick={handleLogout}
        className="w-full py-3.5 px-4 bg-rose-50 dark:bg-slate-900/60 hover:bg-rose-100 dark:hover:bg-slate-800 text-rose-700 dark:text-rose-400 text-sm font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer"
      >
        <LogOut className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        {t.accLogoutBtn}
      </button>

      {/* Elegant React Modal for Confirmation (Alternative to iframe-blocked window.confirm) */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                confirmAction === 'seed' 
                  ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400' 
                  : 'bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400'
              }`}>
                {confirmAction === 'logout' && <LogOut className="h-5 w-5" />}
                {confirmAction === 'seed' && <Sparkles className="h-5 w-5" />}
                {confirmAction === 'clear' && <Trash2 className="h-5 w-5" />}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  {confirmAction === 'logout' && t.confTitleLogout}
                  {confirmAction === 'seed' && t.confTitleSeed}
                  {confirmAction === 'clear' && t.confTitleClear}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Confirm Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {confirmAction === 'logout' && t.confDescLogout}
              {confirmAction === 'seed' && t.confDescSeed}
              {confirmAction === 'clear' && t.confDescClear}
            </p>

            <div className="flex gap-2.5 mt-2">
              <button
                id="modal-confirm-action-btn"
                onClick={executeConfirmedAction}
                className={`flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition cursor-pointer ${
                  confirmAction === 'seed'
                    ? 'bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-100 dark:shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-100 dark:shadow-none'
                }`}
              >
                {t.confConfirm}
              </button>
              <button
                id="modal-cancel-action-btn"
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer text-center"
              >
                {t.confCancel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
