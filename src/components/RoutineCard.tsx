import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Routine } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';
import { formatTo12Hour } from '@/utils/timeUtils';

interface RoutineCardProps {
  routine: Routine;
  onToggleComplete: (routineId: string) => void;
  onToggleActive?: (routineId: string, isActive: boolean) => void;
  onDelete?: (routineId: string) => void;
}

export function RoutineCard({
  routine,
  onToggleComplete,
  onToggleActive,
  onDelete,
}: RoutineCardProps) {
  const isCompleted = Boolean(routine.isCompletedToday);
  const isPaused = routine.isActive === false;
  const time12 = formatTo12Hour(routine.scheduledTime);

  const handleToggle = () => {
    SoundService.triggerHapticSuccess();
    onToggleComplete(routine.id);
  };

  const handleSpeakReminder = () => {
    SoundService.speakVoice(routine.voiceReminderText || `${routine.title} ka waqt ho gaya hai!`, 'ur');
  };

  const priorityColor =
    routine.priority === 'high'
      ? Palette.auroraCoral
      : routine.priority === 'medium'
      ? Palette.auroraAmber
      : Palette.auroraEmerald;

  return (
    <View
      style={[
        styles.container,
        isCompleted && styles.containerCompleted,
        isPaused && styles.containerInactive,
      ]}>
      {/* Category color strip */}
      <View style={[styles.colorStrip, { backgroundColor: routine.color || Palette.auroraCyan }]} />

      <View style={styles.content}>
        {/* Top meta row */}
        <View style={styles.metaRow}>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color={Palette.auroraCyan} />
            <Text style={styles.timeText}>{time12.display}</Text>
          </View>

          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{routine.durationMinutes}m</Text>
          </View>

          <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {routine.priority.toUpperCase()}
            </Text>
          </View>

          {routine.voiceReminderText ? (
            <Pressable onPress={handleSpeakReminder} style={styles.voiceMiniBtn} hitSlop={6}>
              <Ionicons name="volume-medium" size={14} color={Palette.auroraCyan} />
            </Pressable>
          ) : null}

          {onToggleActive && (
            <Switch
              value={!isPaused}
              onValueChange={(val) => onToggleActive(routine.id, val)}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 242, 254, 0.4)' }}
              thumbColor={!isPaused ? Palette.auroraCyan : '#888'}
              style={styles.switchControl}
            />
          )}

          {onDelete && (
            <Pressable
              onPress={() => onDelete(routine.id)}
              hitSlop={10}
              style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={14} color={Colors.dark.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Title & Description */}
        <Text style={[styles.title, isCompleted && styles.titleCompleted]}>
          {routine.title}
        </Text>
        {routine.description ? (
          <Text
            style={[styles.description, isCompleted && styles.descriptionCompleted]}
            numberOfLines={2}>
            {routine.description}
          </Text>
        ) : null}

        {/* Voice reminder preview quote */}
        {routine.voiceReminderText && !isCompleted ? (
          <Pressable onPress={handleSpeakReminder} style={styles.voiceQuoteRow}>
            <Ionicons name="mic-outline" size={11} color={Palette.auroraCyan} />
            <Text style={styles.voiceQuoteText} numberOfLines={1}>
              "{routine.voiceReminderText}"
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Completion Action Checkbox */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.checkButton,
          isCompleted && styles.checkButtonActive,
          pressed && styles.checkButtonPressed,
        ]}>
        <Ionicons
          name={isCompleted ? 'checkmark' : 'ellipse-outline'}
          size={isCompleted ? 18 : 20}
          color={isCompleted ? '#070A12' : Colors.dark.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  containerCompleted: {
    opacity: 0.65,
    backgroundColor: 'rgba(14, 21, 38, 0.5)',
  },
  containerInactive: {
    opacity: 0.5,
    backgroundColor: 'rgba(10, 15, 29, 0.4)',
    borderStyle: 'dashed',
  },
  colorStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flex: 1,
    paddingLeft: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  switchControl: {
    transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
    marginHorizontal: -4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  durationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  durationText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profileBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  profileBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: Palette.auroraPurple,
  },
  voiceMiniBtn: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderRadius: Radius.xs,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.dark.textMuted,
  },
  description: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  descriptionCompleted: {
    color: Colors.dark.textMuted,
  },
  voiceQuoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  voiceQuoteText: {
    fontSize: 11,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  checkButtonActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  checkButtonPressed: {
    transform: [{ scale: 0.92 }],
  },
});
