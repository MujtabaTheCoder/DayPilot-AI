import { Platform } from 'react-native';
import { getDatabase, memoryStore, saveWebStore } from './database';
import { Routine, RoutinePriority, TimeBlock } from './types';

function generateId(): string {
  return 'rt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

export const RoutineRepo = {
  async getAllRoutines(
    dateStr: string,
    profileId?: string,
    includeInactive: boolean = true
  ): Promise<Routine[]> {
    if (Platform.OS === 'web') {
      const dayOfWeek = new Date(dateStr).getDay();
      const completions = new Set(
        memoryStore.completions
          .filter((c) => c.completedDate === dateStr)
          .map((c) => c.routineId)
      );

      return memoryStore.routines
        .filter((r) => {
          if (!includeInactive && !r.isActive) return false;
          if (!r.daysOfWeek.includes(dayOfWeek)) return false;
          if (profileId && profileId !== 'all' && r.profileId && r.profileId !== profileId) {
            return false;
          }
          return true;
        })
        .map((r) => ({
          ...r,
          isCompletedToday: completions.has(r.id),
        }))
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    }

    const db = await getDatabase();
    if (!db) return [];

    const dayOfWeek = new Date(dateStr).getDay();
    let query = `
      SELECT r.*,
        (SELECT COUNT(*) FROM routine_completions rc WHERE rc.routine_id = r.id AND rc.completed_date = ?) as is_completed
      FROM routines r
      WHERE 1=1
    `;
    const params: any[] = [dateStr];

    if (!includeInactive) {
      query += ` AND r.is_active = 1`;
    }

    if (profileId && profileId !== 'all') {
      query += ` AND r.profile_id = ?`;
      params.push(profileId);
    }
    query += ` ORDER BY r.scheduled_time ASC`;

    const rows = await db.getAllAsync<any>(query, params);

    return rows
      .filter((row) => {
        try {
          const days: number[] = JSON.parse(row.days_of_week);
          return days.includes(dayOfWeek);
        } catch {
          return true;
        }
      })
      .map((row) => ({
        id: row.id,
        profileId: row.profile_id || 'self',
        title: row.title,
        description: row.description ?? '',
        timeBlock: row.time_block as TimeBlock,
        scheduledTime: row.scheduled_time,
        durationMinutes: row.duration_minutes,
        priority: row.priority as RoutinePriority,
        category: row.category,
        color: row.color,
        icon: row.icon,
        daysOfWeek: JSON.parse(row.days_of_week || '[0,1,2,3,4,5,6]'),
        isActive: Boolean(row.is_active),
        voiceReminderText: row.voice_reminder_text ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        isCompletedToday: row.is_completed > 0,
      }));
  },

  async addRoutine(routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<Routine> {
    const id = generateId();
    const now = Date.now();
    const newRoutine: Routine = {
      ...routine,
      id,
      profileId: routine.profileId || 'user',
      createdAt: now,
      updatedAt: now,
      isCompletedToday: false,
    };

    if (Platform.OS === 'web') {
      memoryStore.routines.push(newRoutine);
      await saveWebStore();
      return newRoutine;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        `INSERT INTO routines (id, profile_id, title, description, time_block, scheduled_time, duration_minutes, priority, category, color, icon, days_of_week, is_active, voice_reminder_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newRoutine.id,
          newRoutine.profileId || 'user',
          newRoutine.title,
          newRoutine.description,
          newRoutine.timeBlock,
          newRoutine.scheduledTime,
          newRoutine.durationMinutes,
          newRoutine.priority,
          newRoutine.category,
          newRoutine.color,
          newRoutine.icon,
          JSON.stringify(newRoutine.daysOfWeek),
          newRoutine.isActive ? 1 : 0,
          newRoutine.voiceReminderText ?? null,
          newRoutine.createdAt,
          newRoutine.updatedAt,
        ]
      );
    }
    return newRoutine;
  },

  async toggleRoutineCompletion(routineId: string, dateStr: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      const idx = memoryStore.completions.findIndex(
        (c) => c.routineId === routineId && c.completedDate === dateStr
      );
      if (idx >= 0) {
        memoryStore.completions.splice(idx, 1);
        await saveWebStore();
        return false;
      } else {
        memoryStore.completions.push({
          id: generateId(),
          routineId,
          completedDate: dateStr,
          completedAt: Date.now(),
        });
        await saveWebStore();
        return true;
      }
    }

    const db = await getDatabase();
    if (!db) return false;

    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM routine_completions WHERE routine_id = ? AND completed_date = ?`,
      [routineId, dateStr]
    );

    if (existing) {
      await db.runAsync(
        `DELETE FROM routine_completions WHERE routine_id = ? AND completed_date = ?`,
        [routineId, dateStr]
      );
      return false;
    } else {
      const completionId = generateId();
      await db.runAsync(
        `INSERT INTO routine_completions (id, routine_id, completed_date, completed_at) VALUES (?, ?, ?, ?)`,
        [completionId, routineId, dateStr, Date.now()]
      );
      return true;
    }
  },

  async toggleRoutineActive(id: string, isActive: boolean): Promise<void> {
    if (Platform.OS === 'web') {
      const target = memoryStore.routines.find((r) => r.id === id);
      if (target) {
        target.isActive = isActive;
        await saveWebStore();
      }
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`UPDATE routines SET is_active = ? WHERE id = ?`, [isActive ? 1 : 0, id]);
    }
  },

  async deleteRoutine(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore.routines = memoryStore.routines.filter((r) => r.id !== id);
      memoryStore.completions = memoryStore.completions.filter((c) => c.routineId !== id);
      await saveWebStore();
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`DELETE FROM routines WHERE id = ?`, [id]);
      await db.runAsync(`DELETE FROM routine_completions WHERE routine_id = ?`, [id]);
    }
  },
};
