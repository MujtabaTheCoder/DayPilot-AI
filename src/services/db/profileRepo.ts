import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, memoryStore, saveWebStore } from './database';
import { UserProfile, SupportedLanguage, DEFAULT_USER_PROFILE } from './types';

export { DEFAULT_USER_PROFILE };

const USER_PROFILE_KEY = 'daypilot_user_profile_v2';

export const ProfileRepo = {
  /**
   * Retrieves the dynamic user profile from SQLite or local storage.
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const storedJson = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (storedJson) {
        const parsed = JSON.parse(storedJson);
        if (parsed && parsed.name) {
          return {
            ...DEFAULT_USER_PROFILE,
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.warn('Error reading user profile from AsyncStorage:', e);
    }

    if (Platform.OS === 'web') {
      if (memoryStore.profiles && memoryStore.profiles.length > 0) {
        return memoryStore.profiles[0];
      }
      return DEFAULT_USER_PROFILE;
    }

    const db = await getDatabase();
    if (!db) return DEFAULT_USER_PROFILE;

    try {
      const row = await db.getFirstAsync<any>(`SELECT * FROM user_profile LIMIT 1`);
      if (row && row.name) {
        const profile: UserProfile = {
          id: row.id || 'user',
          name: row.name,
          preferredLanguage: (row.preferred_language as SupportedLanguage) || 'ur',
          customVoiceGreeting:
            row.custom_voice_greeting || `${row.name}, ab tumhara uthne ka waqt ho gaya hai, uth jao!`,
          avatar: row.avatar || 'person',
          color: row.color || '#00F2FE',
          voiceEnabled: row.voice_enabled !== 0,
          voiceGender: row.voice_gender || 'female',
          voiceTone: row.voice_tone || 'warm',
          voicePitch: row.voice_pitch ?? 1.15,
          voiceRate: row.voice_rate ?? 0.92,
          onboardingCompleted: row.onboarding_completed === 1,
          createdAt: row.created_at || Date.now(),
          updatedAt: row.updated_at || Date.now(),
          role: 'self',
          relationship: 'Self',
          isActiveProfile: true,
        };
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
        return profile;
      }
    } catch {
      // Table may be migrating or empty
    }

    return DEFAULT_USER_PROFILE;
  },

  /**
   * Get the current user's name dynamically.
   */
  async getUserName(): Promise<string> {
    const profile = await this.getUserProfile();
    return profile.name || 'Aasif';
  },

  /**
   * Update the user profile with custom name, language, or voice settings.
   */
  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getUserProfile();
    const updatedName = updates.name !== undefined ? updates.name.trim() : current.name;
    const fallbackGreeting = `${updatedName}, ab tumhara uthne ka waqt ho gaya hai, uth jao!`;

    const updatedProfile: UserProfile = {
      ...current,
      ...updates,
      name: updatedName || 'Aasif',
      customVoiceGreeting:
        updates.customVoiceGreeting !== undefined
          ? updates.customVoiceGreeting
          : updates.name && updates.name !== current.name
          ? fallbackGreeting
          : current.customVoiceGreeting || fallbackGreeting,
      updatedAt: Date.now(),
      isActiveProfile: true,
    };

    // Save to AsyncStorage
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));

    // Save to web memoryStore if on web
    if (Platform.OS === 'web') {
      memoryStore.profiles = [updatedProfile];
      await saveWebStore();
      return updatedProfile;
    }

    // Save to SQLite
    const db = await getDatabase();
    if (db) {
      try {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_profile (id, name, preferred_language, custom_voice_greeting, avatar, color, voice_enabled, voice_gender, voice_tone, voice_pitch, voice_rate, onboarding_completed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            updatedProfile.id,
            updatedProfile.name,
            updatedProfile.preferredLanguage,
            updatedProfile.customVoiceGreeting ?? null,
            updatedProfile.avatar || 'person',
            updatedProfile.color || '#00F2FE',
            updatedProfile.voiceEnabled ? 1 : 0,
            updatedProfile.voiceGender || 'female',
            updatedProfile.voiceTone || 'warm',
            updatedProfile.voicePitch ?? 1.15,
            updatedProfile.voiceRate ?? 0.92,
            updatedProfile.onboardingCompleted ? 1 : 0,
            updatedProfile.createdAt || Date.now(),
            updatedProfile.updatedAt || Date.now(),
          ]
        );
      } catch (err) {
        console.warn('Error saving user profile to SQLite:', err);
      }
    }

    return updatedProfile;
  },

  /**
   * Quick helper to update user name
   */
  async setUserName(name: string): Promise<UserProfile> {
    return this.updateUserProfile({ name: name.trim() });
  },

  /**
   * Backward compatibility helpers
   */
  async getActiveProfile(): Promise<UserProfile> {
    return this.getUserProfile();
  },

  async getAllProfiles(): Promise<UserProfile[]> {
    const profile = await this.getUserProfile();
    return [profile];
  },

  async setActiveProfile(_id: string): Promise<void> {
    // Single user setup - active profile is always the user
  },

  async addProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    return this.updateUserProfile(profile);
  },
};
