/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { 
  UserProfile, 
  PoopLog, 
  MealLog, 
  SymptomLog, 
  WaterLog, 
  ActivityLog,
  FiberLevel,
  SpicyLevel,
  StoolColor,
  BowelDifficulty,
  ActivityType
} from './types';
import { Language, translations } from './lib/translations';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Logger from './components/Logger';
import CalendarView from './components/CalendarView';
import Analytics from './components/Analytics';
import Account from './components/Account';

// Bottom Navigation icons
import { 
  Home, 
  PencilRuler, 
  Calendar, 
  LineChart, 
  Settings,
  Sparkles,
  CheckCircle2,
  Check
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Language & Theme State
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('poopcycle_lang');
      return (saved === 'en' || saved === 'id') ? (saved as Language) : 'id';
    } catch (e) {
      return 'id';
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('poopcycle_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('poopcycle_lang', lang);
    } catch (e) {
      console.warn('localStorage is not accessible:', e);
    }
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem('poopcycle_theme', theme);
    } catch (e) {
      console.warn('localStorage is not accessible:', e);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // App navigation state
  const [activeTab, setActiveTab] = useState<'home' | 'log' | 'calendar' | 'analytics' | 'account'>('home');
  const [loggerSubTab, setLoggerSubTab] = useState<'poop' | 'meal' | 'symptom' | 'water' | 'activity'>('poop');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Logs States
  const [poopLogs, setPoopLogs] = useState<PoopLog[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // AI Analysis Cache State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState({
    healthStatus: 'Belum Ada Data',
    healthScore: 0,
    predictedTimeRange: '--:--',
    confidenceLevel: 0,
    explanation: 'Silakan catat data pencernaan pertama Anda.',
    insights: [],
    isFallback: true
  });

  // Track Auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserData(user);
      } else {
        setUserProfile(null);
        setPoopLogs([]);
        setMealLogs([]);
        setSymptomLogs([]);
        setWaterLogs([]);
        setActivityLogs([]);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all user logs from Firestore
  const loadUserData = async (user: User) => {
    setAuthLoading(true);
    try {
      // 1. Fetch profile
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);
      let profileData: UserProfile;

      if (profileSnap.exists()) {
        profileData = profileSnap.data() as UserProfile;
      } else {
        // Initialize default profile
        profileData = {
          uid: user.uid,
          email: user.email || 'demo@poopcycle.com',
          displayName: user.displayName || 'Pengguna PoopCycle',
          dailyWaterGoal: 8,
          notificationsEnabled: true,
          registeredAt: new Date().toISOString()
        };
        await setDoc(profileRef, profileData);
      }
      setUserProfile(profileData);

      // 2. Fetch Logs in parallel
      const qPoop = query(collection(db, 'poops'), where('userId', '==', user.uid));
      const qMeal = query(collection(db, 'meals'), where('userId', '==', user.uid));
      const qSymptom = query(collection(db, 'symptoms'), where('userId', '==', user.uid));
      const qWater = query(collection(db, 'waters'), where('userId', '==', user.uid));
      const qActivity = query(collection(db, 'activities'), where('userId', '==', user.uid));

      const [snapPoop, snapMeal, snapSymptom, snapWater, snapActivity] = await Promise.all([
        getDocs(qPoop),
        getDocs(qMeal),
        getDocs(qSymptom),
        getDocs(qWater),
        getDocs(qActivity)
      ]);

      const poops = snapPoop.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PoopLog[];
      const meals = snapMeal.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MealLog[];
      const symptoms = snapSymptom.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SymptomLog[];
      const waters = snapWater.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WaterLog[];
      const activities = snapActivity.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];

      setPoopLogs(poops);
      setMealLogs(meals);
      setSymptomLogs(symptoms);
      setWaterLogs(waters);
      setActivityLogs(activities);

      // 3. Trigger pattern analysis with loaded records
      await requestAIAnalysis({ poops, meals, symptoms, waters, activities });

    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Perform Gemini Pattern & Bowel prediction API request
  const requestAIAnalysis = async (currentData?: {
    poops: PoopLog[];
    meals: MealLog[];
    symptoms: SymptomLog[];
    waters: WaterLog[];
    activities: ActivityLog[];
  }) => {
    // Fallback to state if arguments are not provided
    const data = currentData || {
      poops: poopLogs,
      meals: mealLogs,
      symptoms: symptomLogs,
      waters: waterLogs,
      activities: activityLogs
    };

    if (!data.poops || data.poops.length === 0) {
      setAiAnalysis({
        healthStatus: 'Belum Ada Data',
        healthScore: 0,
        predictedTimeRange: '--:--',
        confidenceLevel: 0,
        explanation: 'Silakan catat data pencernaan pertama Anda.',
        insights: [],
        isFallback: true
      });
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poopLogs: data.poops,
          mealLogs: data.meals,
          symptomLogs: data.symptoms,
          waterLogs: data.waters,
          activityLogs: data.activities
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiAnalysis({
          healthStatus: result.healthStatus || 'Sehat',
          healthScore: result.healthScore || 75,
          predictedTimeRange: result.predictedTimeRange || '07:30 – 08:30',
          confidenceLevel: result.confidenceLevel || 70,
          explanation: result.explanation || 'Prediksi pola berdasarkan histori Anda.',
          insights: result.insights || [],
          isFallback: result.isFallback ?? false
        });
      }
    } catch (error) {
      console.error('Failed to query AI analysis endpoint:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Log Add Handlers (Saves to Firestore & syncs local state)
  const handleAddPoopLog = async (data: { poopTime: string, bristolType: number, color: StoolColor, difficulty: BowelDifficulty, duration: number, notes?: string }) => {
    if (!currentUser) return;
    const newLog = {
      userId: currentUser.uid,
      poopTime: data.poopTime,
      bristolType: data.bristolType,
      color: data.color,
      difficulty: data.difficulty,
      duration: data.duration,
      isHealthy: data.bristolType >= 3 && data.bristolType <= 5,
      notes: data.notes || ''
    };

    const docRef = await addDoc(collection(db, 'poops'), newLog);
    const logWithId: PoopLog = { id: docRef.id, ...newLog };
    
    const updated = [logWithId, ...poopLogs];
    setPoopLogs(updated);
    // Request instant AI recalculation
    requestAIAnalysis({ poops: updated, meals: mealLogs, symptoms: symptomLogs, waters: waterLogs, activities: activityLogs });
    
    // Redirect to dashboard & show success toast
    showToast('Catatan BAB baru berhasil disimpan! 🎉');
    setActiveTab('home');
  };

  const handleAddMealLog = async (data: { mealTime: string, mealName: string, fiberLevel: FiberLevel, spicyLevel: SpicyLevel, beverages: string, notes?: string }) => {
    if (!currentUser) return;
    const newLog = {
      userId: currentUser.uid,
      mealTime: data.mealTime,
      mealName: data.mealName,
      fiberLevel: data.fiberLevel,
      spicyLevel: data.spicyLevel,
      beverages: data.beverages,
      notes: data.notes || ''
    };

    const docRef = await addDoc(collection(db, 'meals'), newLog);
    const logWithId: MealLog = { id: docRef.id, ...newLog };

    const updated = [logWithId, ...mealLogs];
    setMealLogs(updated);
    requestAIAnalysis({ poops: poopLogs, meals: updated, symptoms: symptomLogs, waters: waterLogs, activities: activityLogs });
    
    // Redirect to dashboard & show success toast
    showToast('Catatan Makanan berhasil disimpan! 🍽️');
    setActiveTab('home');
  };

  const handleAddSymptomLog = async (data: { logDate: string, symptoms: string[], severity: number, notes?: string }) => {
    if (!currentUser) return;
    const newLog = {
      userId: currentUser.uid,
      logDate: data.logDate,
      symptoms: data.symptoms,
      severity: data.severity,
      notes: data.notes || ''
    };

    const docRef = await addDoc(collection(db, 'symptoms'), newLog);
    const logWithId: SymptomLog = { id: docRef.id, ...newLog };

    const updated = [logWithId, ...symptomLogs];
    setSymptomLogs(updated);
    requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: updated, waters: waterLogs, activities: activityLogs });
    
    // Redirect to dashboard & show success toast
    showToast('Catatan Gejala berhasil disimpan! 🩺');
    setActiveTab('home');
  };

  const handleAddWaterLog = async (glasses: number) => {
    if (!currentUser || !userProfile) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if water log already exists for today
    const existingIndex = waterLogs.findIndex(w => w.logDate === todayStr);
    
    if (existingIndex > -1) {
      const existingDoc = waterLogs[existingIndex];
      const docRef = doc(db, 'waters', existingDoc.id);
      await updateDoc(docRef, { glasses });
      
      const updated = [...waterLogs];
      updated[existingIndex].glasses = glasses;
      setWaterLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: symptomLogs, waters: updated, activities: activityLogs });
    } else {
      const newLog = {
        userId: currentUser.uid,
        logDate: todayStr,
        glasses,
        target: userProfile.dailyWaterGoal
      };
      const docRef = await addDoc(collection(db, 'waters'), newLog);
      const logWithId: WaterLog = { id: docRef.id, ...newLog };
      
      const updated = [logWithId, ...waterLogs];
      setWaterLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: symptomLogs, waters: updated, activities: activityLogs });
    }
    
    // Redirect to dashboard & show success toast
    showToast('Catatan Konsumsi Air berhasil diperbarui! 💧');
    setActiveTab('home');
  };

  const handleAddActivityLog = async (data: { activityTime: string, activityType: ActivityType, durationMinutes: number, notes?: string }) => {
    if (!currentUser) return;
    const newLog = {
      userId: currentUser.uid,
      activityTime: data.activityTime,
      activityType: data.activityType,
      durationMinutes: data.durationMinutes,
      notes: data.notes || ''
    };

    const docRef = await addDoc(collection(db, 'activities'), newLog);
    const logWithId: ActivityLog = { id: docRef.id, ...newLog };

    const updated = [logWithId, ...activityLogs];
    setActivityLogs(updated);
    requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: symptomLogs, waters: waterLogs, activities: updated });
    
    // Redirect to dashboard & show success toast
    showToast('Catatan Olahraga berhasil disimpan! 🏃‍♂️');
    setActiveTab('home');
  };

  // Delete Log handler (clears specific document)
  const handleDeleteLog = async (collectionName: string, id: string) => {
    if (!currentUser) return;
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    if (collectionName === 'poops') {
      const updated = poopLogs.filter(p => p.id !== id);
      setPoopLogs(updated);
      requestAIAnalysis({ poops: updated, meals: mealLogs, symptoms: symptomLogs, waters: waterLogs, activities: activityLogs });
    } else if (collectionName === 'meals') {
      const updated = mealLogs.filter(m => m.id !== id);
      setMealLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: updated, symptoms: symptomLogs, waters: waterLogs, activities: activityLogs });
    } else if (collectionName === 'symptoms') {
      const updated = symptomLogs.filter(s => s.id !== id);
      setSymptomLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: updated, waters: waterLogs, activities: activityLogs });
    } else if (collectionName === 'waters') {
      const updated = waterLogs.filter(w => w.id !== id);
      setWaterLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: symptomLogs, waters: updated, activities: activityLogs });
    } else if (collectionName === 'activities') {
      const updated = activityLogs.filter(a => a.id !== id);
      setActivityLogs(updated);
      requestAIAnalysis({ poops: poopLogs, meals: mealLogs, symptoms: symptomLogs, waters: waterLogs, activities: updated });
    }
  };

  // Account Settings updates
  const handleUpdateProfile = async (displayName: string) => {
    if (!currentUser || !userProfile) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { displayName });
    setUserProfile({ ...userProfile, displayName });
    showToast('Profil Anda berhasil diperbarui! ✨');
  };

  const handleUpdateWaterGoal = async (newGoal: number) => {
    if (!currentUser || !userProfile) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { dailyWaterGoal: newGoal });
    setUserProfile({ ...userProfile, dailyWaterGoal: newGoal });
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (!currentUser || !userProfile) return;
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { notificationsEnabled: enabled });
    setUserProfile({ ...userProfile, notificationsEnabled: enabled });
  };

  // DATABASE SANDBOX SEEDER UTILITY (Pristine 7 days of logs)
  const handleSeedDatabase = async () => {
    if (!currentUser) return;
    
    // Clear previous logs first for a neat seed
    await handleClearDatabase();

    const uid = currentUser.uid;
    const now = new Date();

    const seedPoops: PoopLog[] = [];
    const seedMeals: MealLog[] = [];
    const seedSymptoms: SymptomLog[] = [];
    const seedWaters: WaterLog[] = [];
    const seedActivities: ActivityLog[] = [];

    // Loop over the last 7 days and push formatted logs
    for (let i = 6; i >= 0; i--) {
      const targetDay = new Date(now);
      targetDay.setDate(now.getDate() - i);
      const dayISOStr = targetDay.toISOString();
      const dateOnlyStr = dayISOStr.split('T')[0];

      // 1. Water logs (seed varied water cups)
      const glassesCount = i === 0 ? 5 : i % 2 === 0 ? 8 : 6;
      const waterDoc = {
        userId: uid,
        logDate: dateOnlyStr,
        glasses: glassesCount,
        target: 8
      };
      const wRef = await addDoc(collection(db, 'waters'), waterDoc);
      seedWaters.push({ id: wRef.id, ...waterDoc });

      // 2. Poop logs (varied Bristol scales)
      // Sunday/Mng has high counts, other days vary
      let poopCount = 1;
      if (i === 0) poopCount = 2; // sunday
      else if (i === 4) poopCount = 0; // thursday skip

      for (let p = 0; p < poopCount; p++) {
        const poopTime = new Date(targetDay);
        poopTime.setHours(7 + p * 11, 30, 0, 0);

        const bristolTypeVal = i === 1 ? 2 : i === 6 ? 6 : 4; // varied
        const difficultyVal = bristolTypeVal === 2 ? 'Hard' : bristolTypeVal === 6 ? 'Normal' : 'Easy';
        const colorVal: StoolColor = bristolTypeVal === 6 ? 'Yellow' : 'Brown';

        const poopDoc = {
          userId: uid,
          poopTime: poopTime.toISOString(),
          bristolType: bristolTypeVal,
          color: colorVal,
          difficulty: difficultyVal as BowelDifficulty,
          duration: bristolTypeVal === 2 ? 15 : 5,
          isHealthy: bristolTypeVal >= 3 && bristolTypeVal <= 5,
          notes: bristolTypeVal === 2 ? 'Sulit mengejan, kurang berserat' : bristolTypeVal === 6 ? 'Makan pedas semalam' : 'Lancar sekali, badan bugar'
        };
        const pRef = await addDoc(collection(db, 'poops'), poopDoc);
        seedPoops.push({ id: pRef.id, ...poopDoc });
      }

      // 3. Meal Logs
      const breakfastTime = new Date(targetDay);
      breakfastTime.setHours(8, 0, 0, 0);
      const bMeal = {
        userId: uid,
        mealTime: breakfastTime.toISOString(),
        mealName: 'Oatmeal buah berry',
        fiberLevel: 'High' as FiberLevel,
        spicyLevel: 'None' as SpicyLevel,
        beverages: 'Air Putih',
        notes: 'Sarapan pagi sehat bugar'
      };
      const bmRef = await addDoc(collection(db, 'meals'), bMeal);
      seedMeals.push({ id: bmRef.id, ...bMeal });

      const dinnerTime = new Date(targetDay);
      dinnerTime.setHours(19, 30, 0, 0);
      const dMeal = {
        userId: uid,
        mealTime: dinnerTime.toISOString(),
        mealName: i === 1 ? 'Ramen pedas gurih level 5' : 'Sayur bening & nasi merah',
        fiberLevel: i === 1 ? 'Low' : ('High' as FiberLevel),
        spicyLevel: i === 1 ? ('Spicy' as SpicyLevel) : ('None' as SpicyLevel),
        beverages: 'Es Teh Manis',
        notes: ''
      };
      const dmRef = await addDoc(collection(db, 'meals'), dMeal);
      seedMeals.push({ id: dmRef.id, ...dMeal });

      // 4. Symptoms
      if (i === 1) { // Monday had cramps
        const symTime = new Date(targetDay);
        symTime.setHours(21, 0, 0, 0);
        const symptomDoc = {
          userId: uid,
          logDate: symTime.toISOString(),
          symptoms: ['Cramping', 'Bloating'],
          severity: 6,
          notes: 'Kram hebat setelah makan mi ramen ekstra pedas'
        };
        const sRef = await addDoc(collection(db, 'symptoms'), symptomDoc);
        seedSymptoms.push({ id: sRef.id, ...symptomDoc });
      }

      // 5. Activities
      const activeTime = new Date(targetDay);
      activeTime.setHours(6, 15, 0, 0);
      const actDoc = {
        userId: uid,
        activityTime: activeTime.toISOString(),
        activityType: 'Jogging' as ActivityType,
        durationMinutes: 30,
        notes: 'Jogging pagi keliling taman'
      };
      const aRef = await addDoc(collection(db, 'activities'), actDoc);
      seedActivities.push({ id: aRef.id, ...actDoc });
    }

    // Update state variables directly
    setPoopLogs(seedPoops);
    setMealLogs(seedMeals);
    setSymptomLogs(seedSymptoms);
    setWaterLogs(seedWaters);
    setActivityLogs(seedActivities);

    // Prompt immediate AI Analysis recalculation
    await requestAIAnalysis({
      poops: seedPoops,
      meals: seedMeals,
      symptoms: seedSymptoms,
      waters: seedWaters,
      activities: seedActivities
    });
  };

  // DATABASE RESET UTILITY
  const handleClearDatabase = async () => {
    if (!currentUser) return;
    
    // Delete documents in loops from current collection cache
    const deletions = [
      ...poopLogs.map(p => deleteDoc(doc(db, 'poops', p.id))),
      ...mealLogs.map(m => deleteDoc(doc(db, 'meals', m.id))),
      ...symptomLogs.map(s => deleteDoc(doc(db, 'symptoms', s.id))),
      ...waterLogs.map(w => deleteDoc(doc(db, 'waters', w.id))),
      ...activityLogs.map(a => deleteDoc(doc(db, 'activities', a.id)))
    ];

    await Promise.all(deletions);

    // Flush state variables
    setPoopLogs([]);
    setMealLogs([]);
    setSymptomLogs([]);
    setWaterLogs([]);
    setActivityLogs([]);

    // Clear AI analysis
    setAiAnalysis({
      healthStatus: 'Belum Ada Data',
      healthScore: 0,
      predictedTimeRange: '--:--',
      confidenceLevel: 0,
      explanation: 'Silakan catat data pencernaan pertama Anda.',
      insights: [],
      isFallback: true
    });
  };

  // Quick navigation router helper
  const navigateToLogCenter = (subTab: 'poop' | 'meal' | 'symptom' | 'water' | 'activity') => {
    setLoggerSubTab(subTab);
    setActiveTab('log');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans transition-colors duration-200">
        <div className="h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-4">{translations[lang].loadingData}</p>
      </div>
    );
  }

  // Show login/registration screen if unauthenticated
  if (!currentUser || !userProfile) {
    return <Auth onAuthSuccess={() => {}} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col relative font-sans transition-colors duration-200">
      
      {/* Scrollable Container Body */}
      <div className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <Dashboard
                displayName={userProfile.displayName}
                poopLogs={poopLogs}
                waterLogs={waterLogs}
                activityLogs={activityLogs}
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
                onRefreshAnalysis={() => requestAIAnalysis()}
                onNavigateToLog={navigateToLogCenter}
                lang={lang}
                theme={theme}
              />
            )}

            {activeTab === 'log' && (
              <Logger
                onAddPoopLog={handleAddPoopLog}
                onAddMealLog={handleAddMealLog}
                onAddSymptomLog={handleAddSymptomLog}
                onAddWaterLog={handleAddWaterLog}
                onAddActivityLog={handleAddActivityLog}
                currentWaterCount={(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const wLog = waterLogs.find(w => w.logDate === todayStr);
                  return wLog ? wLog.glasses : 0;
                })()}
                currentWaterTarget={userProfile.dailyWaterGoal}
                initialTab={loggerSubTab}
                lang={lang}
                theme={theme}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                poopLogs={poopLogs}
                mealLogs={mealLogs}
                symptomLogs={symptomLogs}
                waterLogs={waterLogs}
                activityLogs={activityLogs}
                onDeleteLog={handleDeleteLog}
                lang={lang}
                theme={theme}
              />
            )}

            {activeTab === 'analytics' && (
              <Analytics
                poopLogs={poopLogs}
                mealLogs={mealLogs}
                symptomLogs={symptomLogs}
                waterLogs={waterLogs}
                lang={lang}
                theme={theme}
              />
            )}

            {activeTab === 'account' && (
              <Account
                displayName={userProfile.displayName}
                email={userProfile.email}
                waterGoal={userProfile.dailyWaterGoal}
                notificationsEnabled={userProfile.notificationsEnabled}
                onUpdateProfile={handleUpdateProfile}
                onUpdateWaterGoal={handleUpdateWaterGoal}
                onToggleNotifications={handleToggleNotifications}
                onSeedDatabase={handleSeedDatabase}
                onClearDatabase={handleClearDatabase}
                lang={lang}
                setLang={setLang}
                theme={theme}
                setTheme={setTheme}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Sparkles indicator when running active AI Analysis */}
      {isAnalyzing && (
        <div className="fixed top-4 right-4 bg-violet-600 text-white py-1.5 px-3 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1.5 z-50 animate-pulse">
          <Sparkles className="h-3 w-3 text-violet-200 animate-spin" />
          {translations[lang].analyzingGut}
        </div>
      )}

      {/* Persistent Bottom Nav Bar (Styled precisely like mockup) */}
      <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-5 py-2.5 z-40 shadow-xl max-w-lg mx-auto rounded-t-2xl transition-colors duration-200">
        <button
          id="nav-tab-home"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${activeTab === 'home' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-tight">{translations[lang].tabHome}</span>
        </button>

        <button
          id="nav-tab-log"
          onClick={() => { setActiveTab('log'); setLoggerSubTab('poop'); }}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${activeTab === 'log' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <PencilRuler className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-tight">{translations[lang].tabLog}</span>
        </button>

        <button
          id="nav-tab-calendar"
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${activeTab === 'calendar' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-tight">{translations[lang].tabCalendar}</span>
        </button>

        <button
          id="nav-tab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${activeTab === 'analytics' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LineChart className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-tight">{translations[lang].tabAnalytics}</span>
        </button>

        <button
          id="nav-tab-account"
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center gap-1 transition cursor-pointer ${activeTab === 'account' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[9px] font-bold tracking-tight">{translations[lang].tabAccount}</span>
        </button>
      </div>

      {/* Elegant floating notification toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-slate-900/95 dark:bg-slate-800/95 text-white py-3 px-4 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700/50 dark:border-slate-700/80 backdrop-blur-md animate-bounce">
          <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center text-white flex-shrink-0">
            <Check className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold font-sans text-slate-100">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
