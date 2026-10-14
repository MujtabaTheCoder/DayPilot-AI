import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Habit } from '@/services/db/types';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';

interface HabitCardProps {
  habit: Habit;
  onToggleToday: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
}

export function HabitCard({ habit, onToggleToday, onDelete }: HabitCardProps) {
  const isCompletedToday = Boolean(habit.completedToday);
  const streak = habit.currentStreak ?? 0;

  const handleToggle = () => {
    SoundService.playChime();
    onToggleToday(habit.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconCircle, { backgroundColor: `${habit.color || Palette.auroraCyan}20` }]}>
            <Ionicons
              name={(habit.icon as any) || 'star'}
              size={18}
              color={habit.color || Palette.auroraCyan}
            />
          </View>
          <View style={styles.titleColumn}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.targetLabel}>{habit.targetDaysPerWeek} days / week goal</Text>
          </View>
        </View>

        <View style={styles.topRight}>
          <View style={styles.streakPill}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakCount}>{streak}d</Text>
          </View>

          {onDelete && (
            <Pressable onPress={() => onDelete(habit.id)} hitSlop={8} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={14} color={Colors.dark.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Bottom row: 7-day mini consistency circles and check button */}
      <View style={styles.bottomRow}>
        <View style={styles.historyRow}>
          <Text style={styles.historyLabel}>Recent:</Text>
          <View style={styles.dotsContainer}>
            {Array.from({ length: 7 }).map((_, i) => {
              // Show last 7 days status
              const hasLog = habit.weeklyCompletions && habit.weeklyCompletions.length > i;
              return (
                <View
                  key={i}
                  style={[
                    styles.miniDot,
                    hasLog && { backgroundColor: habit.color || Palette.auroraEmerald },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Big Today Toggle */}
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [
            styles.logButton,
            isCompletedToday && styles.logButtonActive,
            pressed && styles.logButtonPressed,
          ]}>
          <Ionicons
            name={isCompletedToday ? 'checkmark-circle' : 'add-circle-outline'}
            size={18}
            color={isCompletedToday ? '#070A12' : Palette.auroraCyan}
          />
          <Text
            style={[
              styles.logButtonText,
              isCompletedToday && styles.logButtonTextActive,
            ]}>
            {isCompletedToday ? 'Done Today' : 'Log Habit'}
          </Text>
        </Pressable>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  targetLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 3,
  },
  streakFlame: {
    fontSize: 12,
  },
  streakCount: {
    fontSize: 12,
    fontWeight: '800',
    color: Palette.auroraAmber,
  },
  deleteButton: {
    padding: 2,
    marginLeft: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  miniDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  logButtonActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  logButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  logButtonTextActive: {
    color: '#070A12',
  },
});
