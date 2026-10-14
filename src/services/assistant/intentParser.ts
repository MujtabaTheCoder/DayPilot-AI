import { RoutineRepo } from '../db/routineRepo';
import { AlarmRepo } from '../db/alarmRepo';
import { HabitRepo } from '../db/habitRepo';
import { ProfileRepo } from '../db/profileRepo';
import { SpeechService } from '../voice/speechService';
import { SoundService } from '../audio/soundService';
import { NotificationService } from '../notifications/notificationService';
import { RoutinePriority, TimeBlock, AlarmType } from '../db/types';

export interface CommandExecutionResult {
  reply: string;
  intent?: string;
  actionTaken?: string;
  data?: any;
}

// Convert "7 AM", "08:30", "6 baje", "19:00" into normalized HH:mm format
function parseTimeFromText(text: string): { time: string; timeBlock: TimeBlock } | null {
  const lower = text.toLowerCase();

  // Match Urdu / Hindi: "6 baje", "7:30 baje"
  const bajeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*baje/i);
  if (bajeMatch) {
    let hour = parseInt(bajeMatch[1], 10);
    const minute = bajeMatch[2] ? parseInt(bajeMatch[2], 10) : 0;
    if (lower.includes('sham') || lower.includes('shaam') || lower.includes('raat') || lower.includes('dopahar')) {
      if (hour < 12) hour += 12;
    }
    const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    let block: TimeBlock = 'morning';
    if (hour >= 12 && hour < 17) block = 'afternoon';
    else if (hour >= 17 && hour < 21) block = 'evening';
    else if (hour >= 21 || hour < 5) block = 'night';
    return { time: formatted, timeBlock: block };
  }

  // Match English 12h or 24h: "7:00 AM", "6:30pm", "14:00"
  const regex = /(\b\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const match = lower.match(regex);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const minute = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] ? match[3].toLowerCase() : null;

  if (period === 'pm' && hour < 12) {
    hour += 12;
  } else if (period === 'am' && hour === 12) {
    hour = 0;
  }

  const formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

  let block: TimeBlock = 'morning';
  if (hour >= 12 && hour < 17) block = 'afternoon';
  else if (hour >= 17 && hour < 21) block = 'evening';
  else if (hour >= 21 || hour < 5) block = 'night';

  return { time: formatted, timeBlock: block };
}

function parseDurationMinutes(text: string): number {
  const matchMin = text.match(/(\d+)\s*(?:min|mins|minutes|m\b)/i);
  if (matchMin) return parseInt(matchMin[1], 10);

  const matchHour = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hr|hrs|h\b)/i);
  if (matchHour) return Math.round(parseFloat(matchHour[1]) * 60);

  return 30;
}

export const IntentParser = {
  async processCommand(rawInput: string, _currentProfileId?: string): Promise<CommandExecutionResult> {
    const input = rawInput.trim();
    const lower = input.toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    const userName = await ProfileRepo.getUserName();

    // Check for multi-clause commands: e.g. "Set workout at 7 AM and lunch at 2 PM"
    if (lower.includes(' and ') || lower.includes(' aur ')) {
      const parts = input.split(/\s+and\s+|\s+aur\s+/i);
      if (parts.length >= 2) {
        const results: string[] = [];
        for (const part of parts) {
          const res = await this.processSingleCommand(part.trim(), userName, todayStr);
          results.push(res.reply);
        }
        const combined = results.join('\n\n');
        return {
          reply: combined,
          intent: 'multi_command',
          actionTaken: 'multi_routines_created',
        };
      }
    }

    return this.processSingleCommand(input, userName, todayStr);
  },

  async processSingleCommand(
    input: string,
    userName: string,
    todayStr: string
  ): Promise<CommandExecutionResult> {
    const lower = input.toLowerCase();

    // 1. Alarm intents
    if (
      lower.includes('alarm') ||
      lower.includes('wake up at') ||
      lower.includes('wake at') ||
      lower.includes('bedtime at') ||
      lower.includes('uth jao') ||
      lower.includes('subah uthna')
    ) {
      const parsedTime = parseTimeFromText(input);
      if (parsedTime) {
        const isBedtime =
          lower.includes('bedtime') || lower.includes('sleep') || lower.includes('sone') || parsedTime.timeBlock === 'night';
        const isMedicine = lower.includes('medicine') || lower.includes('dawa') || lower.includes('tablet');
        const alarmType: AlarmType = isMedicine ? 'medicine' : isBedtime ? 'bedtime' : 'wake';

        const voiceAnnouncement = SpeechService.generateVoicePrompt(
          userName,
          isMedicine ? 'medicine' : isBedtime ? 'bedtime' : 'wake'
        );

        const title = isMedicine
          ? `Medicine Alert`
          : isBedtime
          ? `Bedtime Rest Alert`
          : `Morning Wake-Up Alarm`;

        const newAlarm = await AlarmRepo.addAlarm({
          profileId: 'user',
          title,
          alarmType,
          time: parsedTime.time,
          soundName: 'aurora_gentle',
          soundMode: 'voice',
          voiceAnnouncementText: voiceAnnouncement,
          isEnabled: true,
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          vibrate: true,
          snoozeEnabled: true,
        });

        const notifId = await NotificationService.scheduleAlarmNotification(newAlarm);
        if (notifId) {
          await AlarmRepo.updateAlarmNotificationId(newAlarm.id, notifId);
        }

        await SoundService.triggerHapticSuccess();

        const reply = `🗣️ Voice Alarm set for **${userName}** at **${parsedTime.time}**!\nAI will announce: *"\"${voiceAnnouncement}\""*`;
        return { reply, intent: 'create_alarm', actionTaken: 'alarm_created', data: newAlarm };
      }
    }

    // 2. Routine creation intents (English, Urdu, Hindi)
    if (
      lower.includes('add routine') ||
      lower.includes('new routine') ||
      lower.includes('schedule') ||
      lower.includes('routine') ||
      lower.includes('workout at') ||
      lower.includes('lunch at') ||
      lower.includes('dinner at') ||
      lower.includes('study at') ||
      lower.includes('medicine at') ||
      lower.includes('baje')
    ) {
      const parsedTime = parseTimeFromText(input) ?? { time: '08:00', timeBlock: 'morning' as TimeBlock };
      const duration = parseDurationMinutes(input);

      // Clean title
      let title = input
        .replace(
          /add routine|new routine|schedule routine|add task|schedule|at \d{1,2}(?::\d{2})?\s*(am|pm)?|for \d+\s*(mins|minutes|hours|hr|m)|\d{1,2}\s*baje/gi,
          ''
        )
        .trim();

      if (!title || title.length < 2) {
        if (lower.includes('workout') || lower.includes('gym')) title = 'Workout & Movement';
        else if (lower.includes('lunch')) title = 'Healthy Lunch Break';
        else if (lower.includes('dinner')) title = 'Evening Dinner';
        else if (lower.includes('medicine') || lower.includes('dawa')) title = 'Daily Medicine';
        else title = `Focused Routine`;
      }
      title = title.charAt(0).toUpperCase() + title.slice(1);

      let context: 'wake' | 'bedtime' | 'medicine' | 'lunch' | 'water' | 'workout' | 'generic' = 'generic';
      if (lower.includes('medicine') || lower.includes('dawa')) context = 'medicine';
      else if (lower.includes('lunch')) context = 'lunch';
      else if (lower.includes('water') || lower.includes('pani')) context = 'water';
      else if (lower.includes('workout') || lower.includes('gym')) context = 'workout';

      const voiceReminder = SpeechService.generateVoicePrompt(userName, context, title);

      let priority: RoutinePriority = 'medium';
      if (
        lower.includes('high') ||
        lower.includes('urgent') ||
        lower.includes('important') ||
        lower.includes('zaroori')
      ) {
        priority = 'high';
      }

      const colors = ['#00F2FE', '#8B5CF6', '#10B981', '#4FACFE', '#F59E0B', '#EC4899'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const newRoutine = await RoutineRepo.addRoutine({
        profileId: 'user',
        title,
        description: `Voice scheduled routine`,
        timeBlock: parsedTime.timeBlock,
        scheduledTime: parsedTime.time,
        durationMinutes: duration,
        priority,
        category: 'productivity',
        color,
        icon: 'flash-outline',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isActive: true,
        voiceReminderText: voiceReminder,
      });

      await SoundService.triggerHapticSuccess();
      const reply = `🎯 Added routine for **${userName}**: **"${title}"** at **${parsedTime.time}** (${duration} mins).\n🎙️ Voice Reminder: *"\"${voiceReminder}\""*`;
      return { reply, intent: 'create_routine', actionTaken: 'routine_created', data: newRoutine };
    }

    // 3. Habit logging intents
    if (
      lower.includes('log habit') ||
      lower.includes('completed habit') ||
      lower.includes('habit done') ||
      lower.includes('drank water') ||
      lower.includes('pani pi') ||
      lower.includes('workout done') ||
      lower.includes('medicine le li')
    ) {
      const habits = await HabitRepo.getAllHabits(todayStr, 'user');
      let matchedHabit = habits.find((h) => lower.includes(h.name.toLowerCase()));

      if (!matchedHabit) {
        if (lower.includes('water') || lower.includes('hydrate') || lower.includes('pani')) {
          matchedHabit = habits.find((h) => h.name.toLowerCase().includes('water') || h.name.toLowerCase().includes('hydrate'));
        } else if (lower.includes('exercise') || lower.includes('workout') || lower.includes('walk')) {
          matchedHabit = habits.find(
            (h) =>
              h.name.toLowerCase().includes('exercise') ||
              h.name.toLowerCase().includes('walk') ||
              h.name.toLowerCase().includes('workout')
          );
        }
      }

      if (matchedHabit) {
        await HabitRepo.toggleHabitLog(matchedHabit.id, todayStr);
        await SoundService.playChime();
        const reply = `🔥 Shabaash! Logged habit for **${userName}**: **${matchedHabit.name}**! Streak updated.`;
        return { reply, intent: 'log_habit', actionTaken: 'habit_logged', data: matchedHabit };
      } else {
        const reply = `Could not match a specific habit for ${userName}. Try saying "Pani pi liya" or check Habits tab!`;
        return { reply, intent: 'log_habit_unknown' };
      }
    }

    // 4. Query Schedule & Daily Progress
    if (
      lower.includes('today') ||
      lower.includes('schedule') ||
      lower.includes('plan') ||
      lower.includes('routines') ||
      lower.includes('progress') ||
      lower.includes('aaj ka din')
    ) {
      const routines = await RoutineRepo.getAllRoutines(todayStr, 'user');
      const habits = await HabitRepo.getAllHabits(todayStr, 'user');

      const completedRoutines = routines.filter((r) => r.isCompletedToday).length;
      const completedHabits = habits.filter((h) => h.completedToday).length;

      const totalItems = routines.length + habits.length;
      const completedTotal = completedRoutines + completedHabits;
      const score = totalItems > 0 ? Math.round((completedTotal / totalItems) * 100) : 0;

      let summary = `📊 **${userName}'s Daily Progress: ${score}%**\n\n`;
      summary += `• Routines completed: **${completedRoutines}/${routines.length}**\n`;
      summary += `• Habits completed: **${completedHabits}/${habits.length}**\n\n`;

      const pending = routines.filter((r) => !r.isCompletedToday);
      if (pending.length > 0) {
        summary += `**Next scheduled routine:**\n👉 ${pending[0].title} at ${pending[0].scheduledTime}`;
      } else {
        summary += `🎉 Great job ${userName}! All scheduled routines are completed!`;
      }

      return { reply: summary, intent: 'query_daily_plan' };
    }

    // Default friendly multilingual help
    const fallback =
      `Assalam-o-Alaikum, ${userName}! I am your DayPilot AI Co-Pilot.\n\n` +
      `Commands you can speak or type:\n` +
      `• **"Set alarm for 6:30 AM with Urdu voice"**\n` +
      `• **"Set workout at 7 AM and lunch at 2 PM"**\n` +
      `• **"Add deep work routine at 9:00 AM"**\n` +
      `• **"Pani pi liya habit log karo"**\n` +
      `• **"Aaj ka kya plan hai?"**`;

    return { reply: fallback, intent: 'general_help' };
  },
};
