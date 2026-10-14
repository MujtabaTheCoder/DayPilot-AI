import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlarmItem } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';
import { formatTo12Hour } from '@/utils/timeUtils';

interface AlarmCardProps {
  alarm: AlarmItem;
  onToggle: (id: string, isEnabled: boolean) => void;
  onTestSound: (alarm: AlarmItem) => void;
  onDelete?: (id: string) => void;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmCard({ alarm, onToggle, onTestSound, onDelete }: AlarmCardProps) {
  const isEnabled = alarm.isEnabled;
  const time12 = formatTo12Hour(alarm.time);

  const handleToggle = (val: boolean) => {
    SoundService.triggerHapticMedium();
    onToggle(alarm.id, val);
  };

  const handleTest = () => {
    SoundService.triggerHapticSuccess();
    onTestSound(alarm);
  };

  const handleSpeakVoice = () => {
    SoundService.speakVoice(alarm.voiceAnnouncementText || `${alarm.title} ka waqt ho gaya hai!`, 'ur');
  };

  const isWake = alarm.alarmType === 'wake';
  const isBedtime = alarm.alarmType === 'bedtime';
  const isMedicine = alarm.alarmType === 'medicine';

  const accentColor = isWake
    ? Palette.auroraCyan
    : isMedicine
    ? Palette.auroraEmerald
    : isBedtime
    ? Palette.auroraPurple
    : Palette.auroraAmber;

  const soundModeLabel =
    alarm.soundMode === 'voice'
      ? '🗣️ Voice Announcement'
      : alarm.soundMode === 'chime'
      ? '🔔 Gentle Chime'
      : '⏰ Ringtone';

  return (
    <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={styles.typeBadge}>
            <Ionicons
              name={isWake ? 'sunny' : isMedicine ? 'medkit' : isBedtime ? 'moon' : 'alarm'}
              size={13}
              color={accentColor}
            />
            <Text style={[styles.typeText, { color: accentColor }]}>
              {alarm.title.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable onPress={handleTest} style={styles.soundButton} hitSlop={8}>
            <Ionicons name="volume-medium-outline" size={15} color={Palette.auroraCyan} />
            <Text style={styles.soundText}>Test</Text>
          </Pressable>

          {onDelete && (
            <Pressable onPress={() => onDelete(alarm.id)} style={styles.deleteButton} hitSlop={8}>
              <Ionicons name="trash-outline" size={15} color={Colors.dark.textMuted} />
            </Pressable>
          )}

          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 242, 254, 0.4)' }}
            thumbColor={isEnabled ? Palette.auroraCyan : '#888'}
          />
        </View>
      </View>

      {/* Digital Clock Display */}
      <View style={styles.clockRow}>
        <View style={styles.timeDisplayGroup}>
          <Text style={[styles.digitalTime, !isEnabled && styles.digitalTimeDisabled]}>
            {time12.display}
          </Text>
          <Text style={styles.digitalTime24Sub}>({alarm.time} 24h clock)</Text>
        </View>
        <View style={styles.modePill}>
          <Text style={styles.soundNameLabel}>{soundModeLabel}</Text>
        </View>
      </View>

      {/* Voice Announcement Phrasing Display */}
      {alarm.voiceAnnouncementText ? (
        <Pressable onPress={handleSpeakVoice} style={styles.voiceQuoteCard}>
          <Ionicons name="mic-outline" size={14} color={Palette.auroraCyan} />
          <Text style={styles.voiceQuoteText} numberOfLines={2}>
            "{alarm.voiceAnnouncementText}"
          </Text>
          <Ionicons name="volume-high" size={13} color={Palette.auroraCyan} style={styles.quoteSpeaker} />
        </Pressable>
      ) : null}

      {/* Days of week selector pills */}
      <View style={styles.daysRow}>
        {DAY_LABELS.map((dayLabel, index) => {
          const isActiveDay = alarm.daysOfWeek.includes(index);
          return (
            <View
              key={index}
              style={[
                styles.dayBubble,
                isActiveDay && { backgroundColor: 'rgba(0, 242, 254, 0.15)', borderColor: Palette.auroraCyan },
                !isEnabled && { opacity: 0.5 },
              ]}>
              <Text
                style={[
                  styles.dayText,
                  isActiveDay && { color: Palette.auroraCyan, fontWeight: '700' },
                ]}>
                {dayLabel}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.xs,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  profileBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  profileBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraPurple,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  soundText: {
    fontSize: 11,
    color: Palette.auroraCyan,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 2,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginVertical: Spacing.xs,
  },
  timeDisplayGroup: {
    gap: 2,
  },
  digitalTime: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  digitalTimeDisabled: {
    color: Colors.dark.textMuted,
  },
  digitalTime24Sub: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textMuted,
  },
  modePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  soundNameLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  voiceQuoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.06)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.2)',
    gap: 6,
  },
  voiceQuoteText: {
    flex: 1,
    fontSize: 12,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
  },
  quoteSpeaker: {
    marginLeft: 'auto',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: Spacing.xs,
  },
  dayBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  dayText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
});
