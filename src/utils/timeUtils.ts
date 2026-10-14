/**
 * Time Utilities for DayPilot AI
 * Robust 12-hour AM/PM vs 24-hour conversions, zero morning/night mix-ups,
 * and circadian sleep cycle calculations.
 */

export interface FormattedTime12 {
  display: string; // e.g. "04:00 AM" or "10:00 PM"
  timeOnly: string; // e.g. "4:00"
  period: 'AM' | 'PM';
  hour24: number;
  minute: number;
}

/**
 * Formats a 24-hour "HH:mm" string into 12-hour AM/PM format.
 * E.g., "04:00" -> { display: "04:00 AM", period: "AM", timeOnly: "4:00" }
 *       "22:00" -> { display: "10:00 PM", period: "PM", timeOnly: "10:00" }
 */
export function formatTo12Hour(time24: string): FormattedTime12 {
  if (!time24 || !time24.includes(':')) {
    return {
      display: '06:30 AM',
      timeOnly: '6:30',
      period: 'AM',
      hour24: 6,
      minute: 30,
    };
  }

  const [hStr, mStr] = time24.split(':');
  const hour24 = parseInt(hStr, 10) || 0;
  const minute = parseInt(mStr, 10) || 0;

  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;

  const minutePadded = String(minute).padStart(2, '0');
  const hourPadded = String(hour12).padStart(2, '0');

  return {
    display: `${hourPadded}:${minutePadded} ${period}`,
    timeOnly: `${hour12}:${minutePadded}`,
    period,
    hour24,
    minute,
  };
}

/**
 * Converts a 12-hour specification into a normalized 24-hour "HH:mm" string.
 * E.g., hour12=10, minute=0, period="PM" -> "22:00"
 *       hour12=4, minute=0, period="AM" -> "04:00"
 *       hour12=12, minute=0, period="AM" -> "00:00"
 *       hour12=12, minute=0, period="PM" -> "12:00"
 */
export function formatTo24Hour(
  hour12: number,
  minute: number,
  period: 'AM' | 'PM'
): string {
  let h = hour12 % 12;
  if (period === 'PM') {
    h += 12;
  }
  const hourPadded = String(h).padStart(2, '0');
  const minutePadded = String(minute).padStart(2, '0');
  return `${hourPadded}:${minutePadded}`;
}

/**
 * Gets the current device local time in 24-hour "HH:mm" format.
 */
export function getCurrentHHmm(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Gets the current date string in "YYYY-MM-DD" format.
 */
export function getCurrentDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates sleep duration and sleep cycles between bedtime and wake time.
 * Correctly handles crossing midnight (e.g., bedtime 22:00 (10 PM) and wake 04:00 (4 AM) or 07:00 (7 AM)).
 */
export function computeSleepDuration(
  bedtimeHHmm: string,
  wakeHHmm: string
): { durationHours: number; cycles: number; formatted: string } {
  try {
    const [bH, bM] = bedtimeHHmm.split(':').map(Number);
    const [wH, wM] = wakeHHmm.split(':').map(Number);

    let diffMinutes = wH * 60 + wM - (bH * 60 + bM);
    if (diffMinutes <= 0) {
      diffMinutes += 24 * 60; // Crosses midnight
    }

    const durationHours = Math.round((diffMinutes / 60) * 10) / 10;
    const cycles = Math.round((durationHours / 1.5) * 10) / 10;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;

    const formatted = mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;

    return { durationHours, cycles, formatted };
  } catch {
    return { durationHours: 8, cycles: 5.3, formatted: '8 hours' };
  }
}

/**
 * Distinguishes morning wake-up from evening/night sleep with zero mix-up.
 * Morning: 03:00 to 11:59
 * Afternoon: 12:00 to 16:59
 * Evening: 17:00 to 20:59
 * Night/Bedtime: 21:00 to 02:59
 */
export function classifyTimeBlock(
  timeHHmm: string
): 'morning' | 'afternoon' | 'evening' | 'night' {
  const [h] = timeHHmm.split(':').map(Number);
  if (h >= 3 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

/**
 * Generates an accurate, culturally natural Urdu/Hindi/English prompt
 * guaranteed to never mix up wake-up and sleep prompts.
 */
export function generateAccurateAlarmAnnouncement(
  userName: string,
  alarmType: 'wake' | 'bedtime' | 'medicine' | 'routine' | 'custom',
  timeHHmm: string,
  customTitle?: string
): string {
  const name = userName?.trim() || 'Aasif';
  const block = classifyTimeBlock(timeHHmm);

  if (alarmType === 'wake' || (alarmType === 'custom' && block === 'morning')) {
    return `${name}, uthne ka waqt ho gaya hai, uth jaao!`;
  }

  if (alarmType === 'bedtime' || (alarmType === 'custom' && block === 'night')) {
    return `${name}, sone aur aaraam karne ka waqt ho gaya hai, shab bakhair.`;
  }

  if (alarmType === 'medicine') {
    return `${name}, aapki medicine lene ka waqt ho gaya hai, dawai le lein.`;
  }

  if (customTitle) {
    return `${name}, aapka waqt ho gaya hai: ${customTitle}.`;
  }

  return `${name}, aapka scheduled DayPilot alarm active hai.`;
}
