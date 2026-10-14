import { Platform } from 'react-native';
import { getDatabase, memoryStore, saveWebStore } from './database';
import { AlarmItem, AlarmType, AlarmSoundMode } from './types';

function generateId(): string {
  return 'alm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export const AlarmRepo = {
  async getAllAlarms(profileId?: string): Promise<AlarmItem[]> {
    if (Platform.OS === 'web') {
      return [...memoryStore.alarms]
        .filter((a) => {
          if (profileId && profileId !== 'all' && a.profileId && a.profileId !== profileId) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.time.localeCompare(b.time));
    }

    const db = await getDatabase();
    if (!db) return [];

    let query = `SELECT * FROM alarms`;
    const params: any[] = [];
    if (profileId && profileId !== 'all') {
      query += ` WHERE profile_id = ?`;
      params.push(profileId);
    }
    query += ` ORDER BY time ASC`;

    const rows = await db.getAllAsync<any>(query, params);

    return rows.map((row) => ({
      id: row.id,
      profileId: row.profile_id || 'user',
      title: row.title,
      alarmType: row.alarm_type as AlarmType,
      time: row.time,
      soundName: row.sound_name || 'aurora_chime',
      soundMode: (row.sound_mode as AlarmSoundMode) || 'voice',
      voiceAnnouncementText: row.voice_announcement_text || '',
      isEnabled: Boolean(row.is_enabled),
      daysOfWeek: JSON.parse(row.days_of_week || '[0,1,2,3,4,5,6]'),
      vibrate: Boolean(row.vibrate),
      snoozeEnabled: Boolean(row.snooze_enabled),
      notificationId: row.notification_id ?? undefined,
      createdAt: row.created_at,
    }));
  },

  async addAlarm(alarm: Omit<AlarmItem, 'id' | 'createdAt'>): Promise<AlarmItem> {
    const id = generateId();
    const newAlarm: AlarmItem = {
      ...alarm,
      id,
      profileId: alarm.profileId || 'user',
      soundMode: alarm.soundMode || 'voice',
      voiceAnnouncementText: alarm.voiceAnnouncementText || `${alarm.title} ka waqt ho gaya hai!`,
      createdAt: Date.now(),
    };

    if (Platform.OS === 'web') {
      memoryStore.alarms.push(newAlarm);
      await saveWebStore();
      return newAlarm;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        `INSERT INTO alarms (id, profile_id, title, alarm_type, time, sound_name, sound_mode, voice_announcement_text, is_enabled, days_of_week, vibrate, snooze_enabled, notification_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newAlarm.id,
          newAlarm.profileId || 'user',
          newAlarm.title,
          newAlarm.alarmType,
          newAlarm.time,
          newAlarm.soundName,
          newAlarm.soundMode,
          newAlarm.voiceAnnouncementText,
          newAlarm.isEnabled ? 1 : 0,
          JSON.stringify(newAlarm.daysOfWeek),
          newAlarm.vibrate ? 1 : 0,
          newAlarm.snoozeEnabled ? 1 : 0,
          newAlarm.notificationId ?? null,
          newAlarm.createdAt,
        ]
      );
    }
    return newAlarm;
  },

  async toggleAlarm(id: string, isEnabled: boolean): Promise<void> {
    if (Platform.OS === 'web') {
      const idx = memoryStore.alarms.findIndex((a) => a.id === id);
      if (idx >= 0) {
        memoryStore.alarms[idx].isEnabled = isEnabled;
        await saveWebStore();
      }
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`UPDATE alarms SET is_enabled = ? WHERE id = ?`, [isEnabled ? 1 : 0, id]);
    }
  },

  async updateAlarmNotificationId(id: string, notificationId: string | null): Promise<void> {
    if (Platform.OS === 'web') {
      const idx = memoryStore.alarms.findIndex((a) => a.id === id);
      if (idx >= 0) {
        memoryStore.alarms[idx].notificationId = notificationId ?? undefined;
        await saveWebStore();
      }
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`UPDATE alarms SET notification_id = ? WHERE id = ?`, [notificationId, id]);
    }
  },

  async deleteAlarm(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore.alarms = memoryStore.alarms.filter((a) => a.id !== id);
      await saveWebStore();
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`DELETE FROM alarms WHERE id = ?`, [id]);
    }
  },
};
