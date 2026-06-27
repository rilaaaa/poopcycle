/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Sparkles, Activity, Key, Mail, User, ShieldAlert, ArrowRight, RotateCw, Leaf, Sun, Moon, Eye, EyeOff, Check } from 'lucide-react';
import { Language, translations } from '../lib/translations';

interface AuthProps {
  onAuthSuccess: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export default function Auth({ onAuthSuccess, lang, setLang, theme, setTheme }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isReset) {
        await sendPasswordResetEmail(auth, email);
        setMessage(t.authResetSuccess);
      } else if (isRegister) {
        if (!name.trim()) throw new Error(lang === 'en' ? 'Full name is required' : 'Nama lengkap wajib diisi');
        if (password.length < 6) throw new Error(lang === 'en' ? 'Password must be at least 6 characters' : 'Password minimal 6 karakter');
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Initialize user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          dailyWaterGoal: 8,
          notificationsEnabled: true,
          registeredAt: new Date().toISOString()
        });

        onAuthSuccess();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error(err);
      let localErr = err.message;
      if (err.code === 'auth/user-not-found') localErr = lang === 'en' ? 'Email not registered.' : 'Email tidak terdaftar.';
      if (err.code === 'auth/wrong-password') localErr = lang === 'en' ? 'Incorrect password.' : 'Password salah.';
      if (err.code === 'auth/invalid-credential') localErr = lang === 'en' ? 'Incorrect email or password.' : 'Email atau password salah.';
      if (err.code === 'auth/email-already-in-use') localErr = lang === 'en' ? 'Email is already in use.' : 'Email sudah digunakan.';
      if (err.code === 'auth/invalid-email') localErr = lang === 'en' ? 'Invalid email format.' : 'Format email tidak valid.';
      if (err.code === 'auth/weak-password') localErr = lang === 'en' ? 'Password is too weak.' : 'Password terlalu lemah.';
      if (err.code === 'auth/operation-not-allowed') {
        localErr = lang === 'en' 
          ? 'Email/Password registration is disabled. Please use Google sign-in instead.' 
          : 'Pendaftaran dengan Email/Password dinonaktifkan. Silakan gunakan Google sign-in instead.';
      }
      setError(localErr);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile already exists
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Pengguna Google',
          dailyWaterGoal: 8,
          notificationsEnabled: true,
          registeredAt: new Date().toISOString()
        });
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError(lang === 'en' ? 'Sign in canceled by user.' : 'Proses masuk dibatalkan oleh pengguna.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(t.authGoogleErrorUnauthorized + ` (Domain: ${window.location.hostname})`);
      } else {
        setError((lang === 'en' ? 'Failed to sign in with Google: ' : 'Gagal masuk with Google: ') + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200">
      
      {/* Left Pane - Brand Info Section (Hidden on mobile) */}
      <div className="hidden md:flex md:w-[40%] lg:w-[42%] bg-[#034427] flex-col justify-between p-10 lg:p-14 text-white relative overflow-hidden shrink-0">
        {/* Subtle glow circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl"></div>

        {/* Brand Logo with simple circle P */}
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-[#034427] font-extrabold text-xl font-display shadow-md">
            P
          </div>
          <span className="text-xl font-extrabold font-display tracking-tight text-white">PoopCycle</span>
        </div>

        {/* Core Marketing message */}
        <div className="relative my-auto space-y-7 max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold font-display tracking-tight leading-tight">
            {lang === 'id' ? 'Sehat Berawal dari Pencernaan yang Lancar.' : 'Health Starts with Smooth Digestion.'}
          </h1>
          <p className="text-sm lg:text-base text-emerald-100/90 leading-relaxed font-medium">
            {lang === 'id' 
              ? 'Gunakan tracker pintar untuk merekam kebiasaan makan, hidrasi air minum harian, serta tipe buang air besar Anda. Prediksi jadwal ideal BAB berikutnya dengan mudah.' 
              : 'Use our smart tracker to record meals, daily hydration, and your stool types. Predict your next ideal bowel movement schedule with ease.'}
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3.5">
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-emerald-50/95">
                {lang === 'id' ? 'Lacak 7 Tipe Bristol Stool Scale' : 'Track 7 Bristol Stool Scale Types'}
              </span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-emerald-50/95">
                {lang === 'id' ? 'Grafik Pola Frekuensi & Hidrasi' : 'Frequency & Hydration Patterns Charts'}
              </span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-semibold text-emerald-50/95">
                {lang === 'id' ? 'Prediksi Cerdas & Catatan Makanan' : 'Smart Predictions & Meal Logging'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative text-[11px] text-emerald-200/60 font-semibold uppercase tracking-wider">
          © 2026 PoopCycle. Medical AI Gut Wellness.
        </div>
      </div>

      {/* Right Pane - Centered Login Box */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative min-h-screen md:min-h-0">
        
        {/* Absolute top header language & theme toggles */}
        <div className="absolute top-4 right-4 flex items-center gap-2.5 z-10">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-0.5 rounded-xl shadow-sm">
            <button
              onClick={() => setLang('id')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${lang === 'id' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
              INA
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${lang === 'en' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'}`}
            >
              ENG
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 transition-all">
          
          {/* Header Logo */}
          <div className="text-center">
            <div className="relative mx-auto h-20 w-20 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4 overflow-hidden group">
              {/* Elegant shiny overlays and radial glows */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-emerald-400 to-teal-500 rounded-full blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-500" />
              
              {/* Nested icon combinations */}
              <div className="relative flex items-center justify-center w-full h-full">
                {/* Spinning cycle for the outer frame */}
                <RotateCw className="absolute h-12 w-12 text-emerald-100/40 animate-[spin_12s_linear_infinite]" />
                {/* Clean, large wellness leaf inside */}
                <Leaf className="h-8 w-8 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.7)] fill-white/20 transform -rotate-12 group-hover:scale-110 transition-transform duration-300" />
                {/* Glowing smart AI sparkle */}
                <Sparkles className="absolute h-4.5 w-4.5 text-amber-300 top-4 right-4 animate-pulse" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-slate-800 dark:text-slate-100">
              {t.appName}
            </h2>
            
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-normal">
              {isReset 
                ? t.authForgotPass 
                : isRegister 
                  ? t.authCreateAccount 
                  : t.authSlogan}
            </p>
          </div>

          {/* Info Box / Messages */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-700 dark:text-rose-300 leading-normal">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-normal">{message}</p>
            </div>
          )}

          {/* Main Form */}
          <form className="space-y-4" onSubmit={handleAuth}>
            {!isReset && (
              <div className="space-y-4">
                {isRegister && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      {t.authLabelName}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        id="name-input"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                        placeholder={t.authPlaceholderName}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {t.authLabelEmail}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      placeholder="anya.h@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {t.authLabelPassword}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 focus:outline-none cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {isReset && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  {t.authLabelEmail}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    id="reset-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    placeholder="anya.h@example.com"
                  />
                </div>
              </div>
            )}

            {!isReset && !isRegister && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => { setIsReset(true); setError(''); setMessage(''); }}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition cursor-pointer"
                >
                  {lang === 'id' ? 'Lupa sandi?' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                id="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isReset ? t.authSendReset : isRegister ? t.authRegister : t.authLogin}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Google Sign-In Option */}
          {!isReset && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-bold">{t.authOrContinue}</span>
              </div>
            </div>
          )}

          {!isReset && (
            <button
              id="google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition duration-200 flex items-center justify-center gap-3 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {t.authLoginGoogle}
            </button>
          )}

          {/* Footer Navigation */}
          <div className="text-center mt-6">
            {isReset ? (
              <button
                type="button"
                onClick={() => { setIsReset(false); setError(''); setMessage(''); }}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition cursor-pointer"
              >
                {t.authBackToLogin}
              </button>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRegister ? t.authHaveAccount : t.authNoAccount}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setError(''); setMessage(''); }}
                  className="font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition cursor-pointer"
                >
                  {isRegister ? t.authLogin : t.authRegister}
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
