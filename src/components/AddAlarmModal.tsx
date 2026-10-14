import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { AlarmItem, AlarmType, AlarmSoundMode } from '@/services/db/types';
import { SoundService } from '@/services/audio/soundService';
import { SpeechService } from '@/services/voice/speechService';
import { ProfileRepo } from '@/services/db/profileRepo';

interface AddAlarmModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (alarm: Omit<AlarmItem, 'id' | 'createdAt'>) => void;
}

const ALARM_TYPES: { label: string; value: AlarmType; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Wake-Up', value: 'wake', icon: 'sunny-outline' },
  { label: 'Medicine', value: 'medicine', icon: 'medkit-outline' },
  { label: 'Bedtime', value: 'bedtime', icon: 'moon-outline' },
  { label: 'Routine', value: 'routine', icon: 'flash-outline' },
];

const SOUND_MODES: { label: string; value: AlarmSoundMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'AI Voice', value: 'voice', icon: 'mic-outline' },
  { label: 'Chime', value: 'chime', icon: 'notifications-outline' },
  { label: 'Classic', value: 'alarm', icon: 'alarm-outline' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AddAlarmModal({ visible, onClose, onAdd }: AddAlarmModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('06:45');
  const [alarmType, setAlarmType] = useState<AlarmType>('wake');
  const [soundMode, setSoundMode] = useState<AlarmSoundMode>('voice');
  const [userName, setUserName] = useState('Aasif');
  const [voiceText, setVoiceText] = useState('Aasif, ab tumhara uthne ka waqt ho gaya hai, uth jao!');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [vibrate, setVibrate] = useState(true);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);

  React.useEffect(() => {
    if (visible) {
      ProfileRepo.getUserName().then((name) => {
        const uName = name || 'Aasif';
        setUserName(uName);
        setVoiceText(
          SpeechService.generateVoicePrompt(
            uName,
            alarmType === 'medicine' ? 'medicine' : alarmType === 'bedtime' ? 'bedtime' : 'wake'
          )
        );
      });
    }
  }, [visible, alarmType]);

  const toggleDay = (idx: number) => {
    SoundService.triggerHapticLight();
    if (selectedDays.includes(idx)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== idx));
      }
    } else {
      setSelectedDays([...selectedDays, idx].sort());
    }
  };

  const handleTypeChange = (newType: AlarmType) => {
    setAlarmType(newType);
    setVoiceText(
      SpeechService.generateVoicePrompt(
        userName,
        newType === 'medicine' ? 'medicine' : newType === 'bedtime' ? 'bedtime' : 'wake'
      )
    );
  };

  const handleTestHearVoice = async () => {
    if (!voiceText.trim()) return;
    await SoundService.speakVoice(voiceText.trim(), 'ur');
  };

  const handleSubmit = () => {
    SoundService.triggerHapticSuccess();

    const finalTitle =
      title.trim() ||
      (alarmType === 'medicine'
        ? `Daily Medicine Alert`
        : alarmType === 'wake'
        ? `Morning Wake-Up Alarm`
        : `Bedtime Rest Reminder`);

    onAdd({
      profileId: 'user',
      title: finalTitle,
      time: time.trim() || '07:00',
      alarmType,
      soundName: 'aurora_gentle',
      soundMode,
      voiceAnnouncementText: voiceText.trim() || `${finalTitle} active`,
      daysOfWeek: selectedDays,
      isEnabled: true,
      vibrate,
      snoozeEnabled,
    });

    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>New Smart Family Alarm</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Time Input */}
            <Text style={styles.fieldLabel}>Alarm Time (24h format)</Text>
            <View style={styles.timeInputContainer}>
              <Ionicons name="time" size={28} color={Palette.auroraCyan} />
              <TextInput
                style={styles.timeInput}
                value={time}
                onChangeText={setTime}
                placeholder="06:45"
                placeholderTextColor={Colors.dark.textMuted}
                maxLength={5}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            {/* Sound Mode: AI Voice Announcement vs Chime vs Ringtone */}
            <Text style={styles.fieldLabel}>Sound Mode</Text>
            <View style={styles.chipsRow}>
              {SOUND_MODES.map((sm) => (
                <Pressable
                  key={sm.value}
                  onPress={() => {
                    SoundService.triggerHapticLight();
                    setSoundMode(sm.value);
                  }}
                  style={[
                    styles.soundModePill,
                    soundMode === sm.value && styles.soundModePillActive,
                  ]}>
                  <Ionicons
                    name={sm.icon}
                    size={14}
                    color={soundMode === sm.value ? '#070A12' : Palette.auroraCyan}
                  />
                  <Text
                    style={[
                      styles.soundModeText,
                      soundMode === sm.value && styles.soundModeTextActive,
                    ]}>
                    {sm.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* AI Voice Announcement Phrasing (if voice mode active) */}
            {soundMode === 'voice' && (
              <View style={styles.voiceSection}>
                <View style={styles.voiceHeaderRow}>
                  <Text style={styles.fieldLabelNoMargin}>Spoken Voice Announcement (Urdu/English)</Text>
                  <Pressable onPress={handleTestHearVoice} style={styles.testVoiceMiniBtn}>
                    <Ionicons name="volume-high" size={13} color={Palette.auroraCyan} />
                    <Text style={styles.testVoiceMiniText}>Hear</Text>
                  </Pressable>
                </View>
                <TextInput
                  style={styles.voiceTextInput}
                  value={voiceText}
                  onChangeText={setVoiceText}
                  multiline
                  numberOfLines={2}
                  placeholder="e.g. Papa, aapki medicine ka time ho gaya hai, medicine le lein."
                  placeholderTextColor={Colors.dark.textMuted}
                />
              </View>
            )}

            {/* Alarm Focus Type */}
            <Text style={styles.fieldLabel}>Alarm Focus</Text>
            <View style={styles.typeRow}>
              {ALARM_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => {
                    handleTypeChange(t.value);
                  }}
                  style={[
                    styles.typePill,
                    alarmType === t.value && styles.typePillActive,
                  ]}>
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={alarmType === t.value ? Palette.auroraCyan : Colors.dark.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeText,
                      alarmType === t.value && styles.typeTextActive,
                    ]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Repeat Days */}
            <Text style={styles.fieldLabel}>Repeat Days</Text>
            <View style={styles.daysRow}>
              {DAY_LABELS.map((dayLabel, idx) => {
                const isSelected = selectedDays.includes(idx);
                return (
                  <Pressable
                    key={idx}
                    onPress={() => toggleDay(idx)}
                    style={[
                      styles.dayCircle,
                      isSelected && styles.dayCircleActive,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextActive,
                      ]}>
                      {dayLabel}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Toggles */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Tactile Vibration</Text>
              <Switch
                value={vibrate}
                onValueChange={setVibrate}
                thumbColor={vibrate ? Palette.auroraCyan : '#888'}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 242, 254, 0.4)' }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow 9-Min Snooze</Text>
              <Switch
                value={snoozeEnabled}
                onValueChange={setSnoozeEnabled}
                thumbColor={snoozeEnabled ? Palette.auroraCyan : '#888'}
                trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 242, 254, 0.4)' }}
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
              <Ionicons name="alarm" size={20} color="#070A12" />
              <Text style={styles.submitButtonText}>Set Family Alarm</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
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
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  timeInput: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 2,
    width: 140,
    textAlign: 'center',
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
  soundModePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  soundModePillActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  soundModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  soundModeTextActive: {
    color: '#070A12',
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
    minHeight: 50,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  typePillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: Palette.auroraCyan,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  typeTextActive: {
    color: Palette.auroraCyan,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayCircleActive: {
    backgroundColor: Palette.auroraCyan,
    borderColor: Palette.auroraCyan,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  dayTextActive: {
    color: '#070A12',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  switchLabel: {
    fontSize: 13,
    color: Colors.dark.text,
    fontWeight: '600',
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
