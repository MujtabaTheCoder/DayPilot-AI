import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { Habit } from '@/services/db/types';
import { SoundService } from '@/services/audio/soundService';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  defaultProfileId?: string;
}

const ICONS = ['water-outline', 'fitness-outline', 'book-outline', 'barbell-outline', 'heart-outline', 'flash-outline'];
const COLORS = ['#00F2FE', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#4FACFE'];
const TARGET_DAYS = [3, 4, 5, 6, 7];

export function AddHabitModal({ visible, onClose, onAdd }: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [targetDays, setTargetDays] = useState(7);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = () => {
    if (!name.trim()) return;

    SoundService.triggerHapticSuccess();
    onAdd({
      name: name.trim(),
      profileId: 'user',
      targetDaysPerWeek: targetDays,
      icon: selectedIcon,
      color: selectedColor,
      category: 'wellness',
    });

    setName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>New Habit Tracker</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          {/* Habit Name */}
          <Text style={styles.fieldLabel}>Habit Title *</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Read 20 mins, Cold Shower, No Sugar"
            placeholderTextColor={Colors.dark.textMuted}
          />

          {/* Target Frequency */}
          <Text style={styles.fieldLabel}>Target Frequency (Days / Week)</Text>
          <View style={styles.daysRow}>
            {TARGET_DAYS.map((days) => (
              <Pressable
                key={days}
                onPress={() => setTargetDays(days)}
                style={[
                  styles.dayPill,
                  targetDays === days && styles.dayPillActive,
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    targetDays === days && styles.dayTextActive,
                  ]}>
                  {days}d
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Icon Selector */}
          <Text style={styles.fieldLabel}>Habit Icon</Text>
          <View style={styles.iconsRow}>
            {ICONS.map((iconName) => (
              <Pressable
                key={iconName}
                onPress={() => setSelectedIcon(iconName)}
                style={[
                  styles.iconButton,
                  selectedIcon === iconName && styles.iconButtonActive,
                ]}>
                <Ionicons
                  name={iconName as any}
                  size={20}
                  color={selectedIcon === iconName ? Palette.auroraCyan : Colors.dark.textSecondary}
                />
              </Pressable>
            ))}
          </View>

          {/* Color Selector */}
          <Text style={styles.fieldLabel}>Color Glow</Text>
          <View style={styles.colorsRow}>
            {COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotActive,
                ]}
              />
            ))}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!name.trim()}
            style={({ pressed }) => [
              styles.submitButton,
              !name.trim() && styles.submitButtonDisabled,
              pressed && styles.submitButtonPressed,
            ]}>
            <Ionicons name="sparkles" size={18} color="#070A12" />
            <Text style={styles.submitButtonText}>Commit Habit</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dayPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  dayTextActive: {
    color: Palette.auroraCyan,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  iconButtonActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070A12',
  },
  profileRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  profilePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  profilePillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  profilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  profilePillTextActive: {
    color: Palette.auroraCyan,
  },
});
