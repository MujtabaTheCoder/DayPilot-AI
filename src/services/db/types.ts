export type TimeBlock = 'morning' | 'afternoon' | 'evening' | 'night';
export type RoutinePriority = 'low' | 'medium' | 'high';
export type AlarmType = 'wake' | 'bedtime' | 'routine' | 'medicine' | 'custom';
export type AlarmSoundMode = 'voice' | 'chime' | 'alarm';
export type SupportedLanguage = 'ur' | 'hi' | 'en';

export type VoiceGender = 'female' | 'male';
export type VoiceTone = 'warm' | 'energetic' | 'calm' | 'authoritative';

export interface UserProfile {
  id: string; // 'user'
  name: string; // Dynamic user configured name (e.g., "Aasif")
  preferredLanguage: SupportedLanguage;
  customVoiceGreeting?: string;
  avatar?: string;
  color?: string;
  voiceEnabled?: boolean;
  voiceGender?: VoiceGender;
  voiceTone?: VoiceTone;
  voicePitch?: number;
  voiceRate?: number;
  onboardingCompleted?: boolean;
  createdAt?: number;
  updatedAt?: number;
  // Backward compatibility fields
  role?: string;
  relationship?: string;
  isActiveProfile?: boolean;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user',
  name: 'Aasif',
  preferredLanguage: 'ur',
  avatar: 'person',
  color: '#00F2FE',
  customVoiceGreeting: 'Aasif, uthne ka waqt ho gaya hai, uth jaao!',
  voiceEnabled: true,
  voiceGender: 'female',
  voiceTone: 'warm',
  voicePitch: 1.05,
  voiceRate: 0.88,
  onboardingCompleted: false,
  createdAt: 1718000000000,
  updatedAt: 1718000000000,
  role: 'self',
  relationship: 'Self',
  isActiveProfile: true,
};

export type FamilyProfile = UserProfile;

export interface Routine {
  id: string;
  profileId?: string;
  title: string;
  description: string;
  timeBlock: TimeBlock;
  scheduledTime: string; // HH:mm format, e.g., "07:30"
  durationMinutes: number;
  priority: RoutinePriority;
  category: string;
  color: string;
  icon: string;
  daysOfWeek: number[]; // 0 = Sun, 1 = Mon ... 6 = Sat
  isActive: boolean;
  voiceReminderText?: string;
  createdAt: number;
  updatedAt: number;
  // Dynamic fields
  isCompletedToday?: boolean;
}

export interface RoutineCompletion {
  id: string;
  routineId: string;
  completedDate: string; // YYYY-MM-DD
  completedAt: number;
}

export interface AlarmItem {
  id: string;
  profileId?: string;
  title: string;
  alarmType: AlarmType;
  time: string; // HH:mm format, e.g., "06:30"
  soundName: string;
  soundMode: AlarmSoundMode; // 'voice' | 'chime' | 'alarm'
  voiceAnnouncementText: string;
  isEnabled: boolean;
  daysOfWeek: number[];
  vibrate: boolean;
  snoozeEnabled: boolean;
  notificationId?: string;
  createdAt: number;
}

export interface Habit {
  id: string;
  profileId?: string;
  name: string;
  targetDaysPerWeek: number;
  color: string;
  icon: string;
  category: string;
  createdAt: number;
  // Computed fields
  currentStreak?: number;
  completedToday?: boolean;
  weeklyCompletions?: string[]; // array of completed YYYY-MM-DD in the last 7 days
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  loggedAt: number;
  value: number;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  intent?: string;
  actionTaken?: string;
  profileId?: string;
  createdAt: number;
}

export interface ProSubscriptionInfo {
  isPro: boolean;
  tier: 'free' | 'pro_family';
  validUntil?: string;
  unlockedFeatures: string[];
}
