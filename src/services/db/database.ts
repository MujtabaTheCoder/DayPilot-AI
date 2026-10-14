import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, AlarmItem, Habit, HabitLog, AssistantMessage, UserProfile, DEFAULT_USER_PROFILE } from './types';
import { getNativeDatabase, NativeDatabase } from './sqliteNative';

const DB_NAME = 'daypilot_ai_v2.db';

// Fallback in-memory state for web when native SQLite is unavailable
interface FallbackStore {
  profiles: UserProfile[];
  routines: Routine[];
  completions: { id: string; routineId: string; completedDate: string; completedAt: number }[];
  alarms: AlarmItem[];
  habits: Habit[];
  habitLogs: HabitLog[];
  assistantMessages: AssistantMessage[];
}

// 100% CLEAN CANVAS MODE: No demo mock routines, alarms, or habits

const SEED_ASSISTANT: AssistantMessage[] = [
  {
    id: 'seed-msg-1',
    sender: 'assistant',
    content:
      'Assalam-o-Alaikum! Welcome to DayPilot AI.\n\nAll your routines, alarms, and vocal reminders are stored 100% locally on your device with complete privacy.\n\nTry speaking or typing:\n• "Set alarm for 6:30 AM with Urdu voice"\n• "Set workout at 7 AM and lunch at 2 PM"\n• "Log habit water"\n• "What is my plan for today?"',
    intent: 'welcome',
    createdAt: Date.now(),
  },
];

const memoryStore: FallbackStore = {
  profiles: [DEFAULT_USER_PROFILE],
  routines: [],
  completions: [],
  alarms: [],
  habits: [],
  habitLogs: [],
  assistantMessages: [...SEED_ASSISTANT],
};

export async function getDatabase(): Promise<NativeDatabase | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  return getNativeDatabase(DB_NAME);
}

export async function initializeDatabase(): Promise<void> {
  if (Platform.OS === 'web') {
    await initWebStorage();
    return;
  }

  try {
    const db = await getDatabase();
    if (!db) return;

    db.execSync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'ur',
        custom_voice_greeting TEXT,
        avatar TEXT DEFAULT 'person',
        color TEXT DEFAULT '#00F2FE',
        voice_enabled INTEGER DEFAULT 1,
        voice_gender TEXT DEFAULT 'female',
        voice_tone TEXT DEFAULT 'warm',
        voice_pitch REAL DEFAULT 1.15,
        voice_rate REAL DEFAULT 0.92,
        onboarding_completed INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        profile_id TEXT DEFAULT 'user',
        title TEXT NOT NULL,
        description TEXT,
        time_block TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 15,
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'general',
        color TEXT DEFAULT '#00F2FE',
        icon TEXT DEFAULT 'checkbox-outline',
        days_of_week TEXT DEFAULT '[0,1,2,3,4,5,6]',
        is_active INTEGER DEFAULT 1,
        voice_reminder_text TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS routine_completions (
        id TEXT PRIMARY KEY,
        routine_id TEXT NOT NULL,
        completed_date TEXT NOT NULL,
        completed_at INTEGER NOT NULL,
        FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS alarms (
        id TEXT PRIMARY KEY,
        profile_id TEXT DEFAULT 'user',
        title TEXT NOT NULL,
        alarm_type TEXT NOT NULL,
        time TEXT NOT NULL,
        sound_name TEXT DEFAULT 'aurora_chime',
        sound_mode TEXT DEFAULT 'voice',
        voice_announcement_text TEXT,
        is_enabled INTEGER DEFAULT 1,
        days_of_week TEXT DEFAULT '[0,1,2,3,4,5,6]',
        vibrate INTEGER DEFAULT 1,
        snooze_enabled INTEGER DEFAULT 1,
        notification_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        profile_id TEXT DEFAULT 'user',
        name TEXT NOT NULL,
        target_days_per_week INTEGER DEFAULT 7,
        color TEXT DEFAULT '#10B981',
        icon TEXT DEFAULT 'star-outline',
        category TEXT DEFAULT 'general',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        logged_at INTEGER NOT NULL,
        value INTEGER DEFAULT 1,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS assistant_messages (
        id TEXT PRIMARY KEY,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        intent TEXT,
        action_taken TEXT,
        profile_id TEXT DEFAULT 'user',
        created_at INTEGER NOT NULL
      );
    `);

    // Clean canvas purge: remove any existing demo seed data
    try {
      db.execSync(`
        DELETE FROM routines WHERE id LIKE 'seed-%';
        DELETE FROM alarms WHERE id LIKE 'seed-%';
        DELETE FROM habits WHERE id LIKE 'seed-%';
      `);
    } catch {}

    // Check if initial user profile exists
    const checkRow = db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM user_profile');
    const existing = await checkRow;
    if (!existing || existing.count === 0) {
      await seedNativeDatabase(db);
    }
  } catch (err) {
    console.error('Error initializing SQLite database:', err);
  }
}

async function seedNativeDatabase(db: NativeDatabase) {
  // Seed single dynamic user profile
  db.runSync(
    `INSERT OR REPLACE INTO user_profile (id, name, preferred_language, custom_voice_greeting, avatar, color, voice_enabled, voice_gender, voice_tone, voice_pitch, voice_rate, onboarding_completed, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      DEFAULT_USER_PROFILE.id,
      DEFAULT_USER_PROFILE.name,
      DEFAULT_USER_PROFILE.preferredLanguage,
      DEFAULT_USER_PROFILE.customVoiceGreeting ?? null,
      DEFAULT_USER_PROFILE.avatar || 'person',
      DEFAULT_USER_PROFILE.color || '#00F2FE',
      1,
      DEFAULT_USER_PROFILE.voiceGender || 'female',
      DEFAULT_USER_PROFILE.voiceTone || 'warm',
      DEFAULT_USER_PROFILE.voicePitch ?? 1.15,
      DEFAULT_USER_PROFILE.voiceRate ?? 0.92,
      DEFAULT_USER_PROFILE.onboardingCompleted ? 1 : 0,
      DEFAULT_USER_PROFILE.createdAt ?? Date.now(),
      DEFAULT_USER_PROFILE.updatedAt ?? Date.now(),
    ]
  );

  for (const m of SEED_ASSISTANT) {
    db.runSync(
      `INSERT INTO assistant_messages (id, sender, content, intent, action_taken, profile_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m.id, m.sender, m.content, m.intent ?? null, m.actionTaken ?? null, m.profileId ?? 'user', m.createdAt]
    );
  }
}

async function initWebStorage() {
  const cached = await AsyncStorage.getItem('daypilot_clean_canvas_v3_initialized');
  if (!cached) {
    memoryStore.profiles = [DEFAULT_USER_PROFILE];
    memoryStore.routines = [];
    memoryStore.alarms = [];
    memoryStore.habits = [];
    memoryStore.assistantMessages = [...SEED_ASSISTANT];
    await saveWebStore();
    await AsyncStorage.setItem('daypilot_clean_canvas_v3_initialized', 'true');
  } else {
    await loadWebStore();
    // Guarantee no demo data remains in existing storage
    memoryStore.routines = memoryStore.routines.filter((r) => !r.id.startsWith('seed-'));
    memoryStore.alarms = memoryStore.alarms.filter((a) => !a.id.startsWith('seed-'));
    memoryStore.habits = memoryStore.habits.filter((h) => !h.id.startsWith('seed-'));
    await saveWebStore();
  }
}

export async function saveWebStore() {
  if (Platform.OS !== 'web') return;
  await AsyncStorage.setItem('daypilot_web_store_v2', JSON.stringify(memoryStore));
}

export async function loadWebStore() {
  if (Platform.OS !== 'web') return;
  const raw = await AsyncStorage.getItem('daypilot_web_store_v2');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      Object.assign(memoryStore, parsed);
    } catch {
      // ignore JSON parse error
    }
  }
}

export { memoryStore };
