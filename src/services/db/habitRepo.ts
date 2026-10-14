import { Platform } from 'react-native';
import { getDatabase, memoryStore, saveWebStore } from './database';
import { Habit } from './types';

function generateId(): string {
  return 'hb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

function getPastDates(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export const HabitRepo = {
  async getAllHabits(todayDateStr: string, profileId?: string): Promise<Habit[]> {
    const last7Days = getPastDates(7);

    if (Platform.OS === 'web') {
      return memoryStore.habits
        .filter((h) => {
          if (profileId && profileId !== 'all' && h.profileId && h.profileId !== profileId) {
            return false;
          }
          return true;
        })
        .map((h) => {
          const completedDates = memoryStore.habitLogs
            .filter((l) => l.habitId === h.id && last7Days.includes(l.date))
            .map((l) => l.date);

          // calculate streak
          let streak = 0;
          let checkDate = new Date(todayDateStr);
          while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            const hasLog = memoryStore.habitLogs.some((l) => l.habitId === h.id && l.date === dateStr);
            if (hasLog) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              if (dateStr === todayDateStr && streak === 0) {
                const yDate = new Date(todayDateStr);
                yDate.setDate(yDate.getDate() - 1);
                const yStr = yDate.toISOString().split('T')[0];
                const hasYesterday = memoryStore.habitLogs.some((l) => l.habitId === h.id && l.date === yStr);
                if (hasYesterday) {
                  checkDate = yDate;
                  continue;
                }
              }
              break;
            }
          }

          return {
            ...h,
            profileId: h.profileId || 'user',
            currentStreak: streak,
            completedToday: completedDates.includes(todayDateStr),
            weeklyCompletions: completedDates,
          };
        });
    }

    const db = await getDatabase();
    if (!db) return [];

    let query = `SELECT * FROM habits`;
    const params: any[] = [];
    if (profileId && profileId !== 'all') {
      query += ` WHERE profile_id = ?`;
      params.push(profileId);
    }
    query += ` ORDER BY created_at ASC`;

    const habits = await db.getAllAsync<any>(query, params);
    const logs = await db.getAllAsync<any>(
      `SELECT habit_id, date FROM habit_logs WHERE date >= ?`,
      [last7Days[last7Days.length - 1]]
    );

    return habits.map((h) => {
      const completedDates = logs
        .filter((l) => l.habit_id === h.id)
        .map((l) => l.date);

      let streak = 0;
      let checkDate = new Date(todayDateStr);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasLog = logs.some((l) => l.habit_id === h.id && l.date === dateStr);
        if (hasLog) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          if (dateStr === todayDateStr && streak === 0) {
            const yDate = new Date(todayDateStr);
            yDate.setDate(yDate.getDate() - 1);
            const yStr = yDate.toISOString().split('T')[0];
            const hasYesterday = logs.some((l) => l.habit_id === h.id && l.date === yStr);
            if (hasYesterday) {
              checkDate = yDate;
              continue;
            }
          }
          break;
        }
      }

      return {
        id: h.id,
        profileId: h.profile_id || 'self',
        name: h.name,
        targetDaysPerWeek: h.target_days_per_week,
        color: h.color,
        icon: h.icon,
        category: h.category,
        createdAt: h.created_at,
        currentStreak: streak,
        completedToday: completedDates.includes(todayDateStr),
        weeklyCompletions: completedDates,
      };
    });
  },

  async addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit> {
    const id = generateId();
    const newHabit: Habit = {
      ...habit,
      id,
      profileId: habit.profileId || 'user',
      createdAt: Date.now(),
      currentStreak: 0,
      completedToday: false,
      weeklyCompletions: [],
    };

    if (Platform.OS === 'web') {
      memoryStore.habits.push(newHabit);
      await saveWebStore();
      return newHabit;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        `INSERT INTO habits (id, profile_id, name, target_days_per_week, color, icon, category, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newHabit.id, newHabit.profileId || 'user', newHabit.name, newHabit.targetDaysPerWeek, newHabit.color, newHabit.icon, newHabit.category, newHabit.createdAt]
      );
    }
    return newHabit;
  },

  async toggleHabitLog(habitId: string, dateStr: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      const idx = memoryStore.habitLogs.findIndex(
        (l) => l.habitId === habitId && l.date === dateStr
      );
      if (idx >= 0) {
        memoryStore.habitLogs.splice(idx, 1);
        await saveWebStore();
        return false;
      } else {
        memoryStore.habitLogs.push({
          id: generateId(),
          habitId,
          date: dateStr,
          loggedAt: Date.now(),
          value: 1,
        });
        await saveWebStore();
        return true;
      }
    }

    const db = await getDatabase();
    if (!db) return false;

    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?`,
      [habitId, dateStr]
    );

    if (existing) {
      await db.runAsync(`DELETE FROM habit_logs WHERE id = ?`, [existing.id]);
      return false;
    } else {
      await db.runAsync(
        `INSERT INTO habit_logs (id, habit_id, date, logged_at, value) VALUES (?, ?, ?, ?, ?)`,
        [generateId(), habitId, dateStr, Date.now(), 1]
      );
      return true;
    }
  },

  async deleteHabit(id: string): Promise<void> {
    if (Platform.OS === 'web') {
      memoryStore.habits = memoryStore.habits.filter((h) => h.id !== id);
      memoryStore.habitLogs = memoryStore.habitLogs.filter((l) => l.habitId !== id);
      await saveWebStore();
      return;
    }

    const db = await getDatabase();
    if (db) {
      await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
      await db.runAsync(`DELETE FROM habit_logs WHERE habit_id = ?`, [id]);
    }
  },
};
