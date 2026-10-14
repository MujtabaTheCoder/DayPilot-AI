import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { Routine, RoutinePriority, TimeBlock } from '@/services/db/types';
import { SoundService } from '@/services/audio/soundService';

import { ProfileRepo } from '@/services/db/profileRepo';

interface AddRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const TIME_BLOCKS: { label: string; value: TimeBlock; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Morning', value: 'morning', icon: 'sunny-outline' },
  { label: 'Afternoon', value: 'afternoon', icon: 'partly-sunny-outline' },
  { label: 'Evening', value: 'evening', icon: 'partly-sunny-outline' },
  { label: 'Night', value: 'night', icon: 'moon-outline' },
];

const DURATIONS = [15, 30, 45, 60, 90];
const PRIORITIES: RoutinePriority[] = ['low', 'medium', 'high'];
const COLORS = ['#00F2FE', '#8B5CF6', '#10B981', '#4FACFE', '#F59E0B', '#EC4899'];

export function AddRoutineModal({ visible, onClose, onAdd }: AddRoutineModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('Aasif');
  const [voiceReminder, setVoiceReminder] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timeBlock, setTimeBlock] = useState<TimeBlock>('morning');
  const [priority, setPriority] = useState<RoutinePriority>('medium');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  React.useEffect(() => {
    if (visible) {
      ProfileRepo.getUserName().then((name) => {
        setUserName(name || 'Aasif');
      });
    }
  }, [visible]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!voiceReminder || voiceReminder.includes(title)) {
      setVoiceReminder(`${userName}, aapka waqt ho gaya hai: ${newTitle}.`);
    }
  };

  const handleTestHearVoice = async () => {
    if (!voiceReminder.trim()) return;
    await SoundService.speakVoice(voiceReminder.trim(), 'ur');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    SoundService.triggerHapticSuccess();
    onAdd({
      profileId: 'user',
      title: title.trim(),
      description: description.trim(),
      scheduledTime: scheduledTime.trim() || '08:00',
      durationMinutes,
      timeBlock,
      priority,
      category: 'productivity',
      color: selectedColor,
      icon: 'sparkles-outline',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      isActive: true,
      voiceReminderText: voiceReminder.trim() || undefined,
    });

    setTitle('');
    setDescription('');
    setVoiceReminder('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>New Daily Routine</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Title Input */}
            <Text style={styles.fieldLabel}>Routine Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Deep Work, Hydration & Sunlight, Workout"
              placeholderTextColor={Colors.dark.textMuted}
              value={title}
              onChangeText={handleTitleChange}
            />

            {/* AI Voice Reminder Text */}
            <View style={styles.voiceSection}>
              <View style={styles.voiceHeaderRow}>
                <Text style={styles.fieldLabelNoMargin}>AI Voice Reminder Text</Text>
                {voiceReminder.trim().length > 0 && (
                  <Pressable onPress={handleTestHearVoice} style={styles.testVoiceMiniBtn}>
                    <Ionicons name="volume-high" size={13} color={Palette.auroraCyan} />
                    <Text style={styles.testVoiceMiniText}>Hear</Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={styles.voiceTextInput}
                placeholder={`e.g. ${userName}, aapka waqt ho gaya hai: ${title || 'Routine'}.`}
                placeholderTextColor={Colors.dark.textMuted}
                value={voiceReminder}
                onChangeText={setVoiceReminder}
              />
            </View>

            {/* Description Input */}
            <Text style={styles.fieldLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Key notes, location, or intention..."
              placeholderTextColor={Colors.dark.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            {/* Scheduled Time & Duration */}
            <View style={styles.row}>
              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Time (HH:mm)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="08:00"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={scheduledTime}
                  onChangeText={setScheduledTime}
                  maxLength={5}
                />
              </View>

              <View style={styles.flexOne}>
                <Text style={styles.fieldLabel}>Duration</Text>
                <View style={styles.chipsRow}>
                  {DURATIONS.map((dur) => (
                    <Pressable
                      key={dur}
                      onPress={() => setDurationMinutes(dur)}
                      style={[
                        styles.chip,
                        durationMinutes === dur && styles.chipActive,
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          durationMinutes === dur && styles.chipTextActive,
                        ]}>
                        {dur}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Time Block Selector */}
            <Text style={styles.fieldLabel}>Time Block</Text>
            <View style={styles.blockGrid}>
              {TIME_BLOCKS.map((tb) => (
                <Pressable
                  key={tb.value}
                  onPress={() => setTimeBlock(tb.value)}
                  style={[
                    styles.blockCard,
                    timeBlock === tb.value && styles.blockCardActive,
                  ]}>
                  <Ionicons
                    name={tb.icon}
                    size={16}
                    color={timeBlock === tb.value ? Palette.auroraCyan : Colors.dark.textSecondary}
                  />
                  <Text
                    style={[
                      styles.blockText,
                      timeBlock === tb.value && styles.blockTextActive,
                    ]}>
                    {tb.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Priority Selector */}
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityPill,
                    priority === p && styles.priorityPillActive,
                  ]}>
                  <Text
                    style={[
                      styles.priorityPillText,
                      priority === p && styles.priorityPillTextActive,
                    ]}>
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Color accent */}
            <Text style={styles.fieldLabel}>Color Accent</Text>
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

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim()}
              style={({ pressed }) => [
                styles.submitButton,
                !title.trim() && styles.submitButtonDisabled,
                pressed && styles.submitButtonPressed,
              ]}>
              <Ionicons name="add-circle-outline" size={20} color="#070A12" />
              <Text style={styles.submitButtonText}>Create Routine</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.dark.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: 18,
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
  scroll: {
    paddingBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldLabelNoMargin: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  memberChipActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  memberChipTextActive: {
    color: '#070A12',
  },
  textInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  textArea: {
    height: 55,
    textAlignVertical: 'top',
  },
  voiceSection: {
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(0, 242, 254, 0.04)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.15)',
  },
  voiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testVoiceMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  testVoiceMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
  voiceTextInput: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    color: Palette.auroraCyan,
    fontSize: 13,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flexOne: {
    flex: 1,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    borderColor: Palette.auroraCyan,
  },
  chipText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  blockGrid: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  blockCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  blockCardActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  blockText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  blockTextActive: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  priorityPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  priorityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  priorityPillTextActive: {
    color: Palette.auroraCyan,
  },
  colorsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
});
