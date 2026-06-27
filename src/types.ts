/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  dailyWaterGoal: number; // in glasses, e.g. 8
  notificationsEnabled: boolean;
  registeredAt: string;
}

export type FiberLevel = 'Low' | 'Medium' | 'High';
export type SpicyLevel = 'None' | 'Mild' | 'Spicy' | 'Extreme';

export interface MealLog {
  id: string;
  userId: string;
  mealTime: string; // ISO String
  mealName: string;
  fiberLevel: FiberLevel;
  spicyLevel: SpicyLevel;
  beverages: string;
  notes?: string;
}

export type StoolColor = 'Brown' | 'Green' | 'Yellow' | 'Black' | 'Clay' | 'Red';
export type BowelDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Painful';

export interface PoopLog {
  id: string;
  userId: string;
  poopTime: string; // ISO String
  bristolType: number; // 1 to 7
  color: StoolColor;
  difficulty: BowelDifficulty;
  duration: number; // minutes
  isHealthy: boolean;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  userId: string;
  logDate: string; // ISO String
  symptoms: string[]; // e.g. ["Bloating", "Cramping", "Gas", "Acid Reflux", "Nausea"]
  severity: number; // 1 to 10
  notes?: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD
  glasses: number;
  target: number;
}

export type ActivityType = 'Jogging' | 'Walking' | 'Sitting' | 'Yoga' | 'Gym' | 'Other';

export interface ActivityLog {
  id: string;
  userId: string;
  activityTime: string; // ISO String
  activityType: ActivityType;
  durationMinutes: number;
  notes?: string;
}

export interface PredictionHistory {
  id: string;
  userId: string;
  predictedAt: string; // ISO String
  predictedTimeRange: string; // e.g. "06:30 – 08:00"
  confidenceLevel: number; // percentage, e.g. 82
  avgIntervalHours: number;
  explanation: string; // Explanation of the pattern detected
  nextPredictionMessage?: string;
}

export interface DailyHealthSummary {
  id: string;
  userId: string;
  summaryDate: string; // YYYY-MM-DD
  poopCount: number;
  avgBristolType: number;
  healthStatus: 'Sehat' | 'Kurang Sehat' | 'Konstipasi' | 'Diare' | 'Optimal';
  insights: string[];
}
