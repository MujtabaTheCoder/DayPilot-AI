import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';
import { RoutineRepo } from '@/services/db/routineRepo';
import { ProfileRepo } from '@/services/db/profileRepo';
import { SupportedLanguage, AlarmType, VoiceGender, VoiceTone } from '@/services/db/types';
import { formatTo12Hour } from '@/utils/timeUtils';

interface ActiveAlarmModalProps {
  visible: boolean;
  alarmTitle: string;
  alarmTime: string;
  voiceText: string;
  alarmType?: AlarmType;
  onClose: () => void;
  onAwake?: () => void;
  onSnooze?: (snoozeMinutes: number) => void;
}

export function ActiveAlarmModal({
  visible,
  alarmTitle,
  alarmTime,
  voiceText,
  alarmType = 'wake',
  onClose,
  onAwake,
  onSnooze,
}: ActiveAlarmModalProps) {
  const [cycleCount, setCycleCount] = useState(1);
  const [includeBriefing, setIncludeBriefing] = useState(true);
  const [userName, setUserName] = useState('Aasif');
  const [userLang, setUserLang] = useState<SupportedLanguage>('ur');
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>('warm');
  const [snoozeNotice, setSnoozeNotice] = useState<string | null>(null);

  const isBedtime =
    alarmType === 'bedtime' ||
    alarmTitle.toLowerCase().includes('sleep') ||
    alarmTitle.toLowerCase().includes('bed');

  // Pulsing animation for the active voice visualizer
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [glowAnim] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    if (visible) {
      setCycleCount(1);
      setSnoozeNotice(null);

      ProfileRepo.getUserProfile().then((profile) => {
        setUserName(profile.name || 'Aasif');
        setUserLang(profile.preferredLanguage || 'ur');
        setVoiceGender(profile.voiceGender || 'female');
        setVoiceTone(profile.voiceTone || 'warm');

        // Start continuous repeating voice loop with user's selected voice persona!
        SoundService.startVoiceAlarmLoop(
          voiceText,
          profile.preferredLanguage || 'ur',
          (c) => {
            setCycleCount(c);
          },
          {
            voiceGender: profile.voiceGender || 'female',
            voiceTone: profile.voiceTone || 'warm',
            pitch: profile.voicePitch,
            rate: profile.voiceRate,
          }
        );
      });

      // Start looping animation
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 0.9,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.4,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      SoundService.stopVoiceAlarmLoop();
    }

    return () => {
      SoundService.stopVoiceAlarmLoop();
    };
  }, [visible, voiceText, pulseAnim, glowAnim]);

  const handleAwakeDone = async () => {
    SoundService.stopVoiceAlarmLoop();
    SoundService.triggerHapticSuccess();

    const voiceOpts = { voiceGender, voiceTone };

    if (isBedtime) {
      await SoundService.speakBedtimeAcknowledgment(userName, userLang, voiceOpts);
    } else if (includeBriefing) {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysRoutines = await RoutineRepo.getAllRoutines(todayStr);
      await SoundService.speakMorningBriefing(userName, todaysRoutines, userLang, voiceOpts);
    }

    onAwake?.();
    onClose();
  };

  const handleSnooze = async () => {
    SoundService.stopVoiceAlarmLoop();
    SoundService.triggerHapticMedium();

    const snoozeMsg = 'Snooze 5 minutes active. Alarms will repeat soon.';
    setSnoozeNotice(snoozeMsg);
    await SoundService.speakVoice(
      `${userName}, alarm 5 minute ke liye snooze ho gaya hai.`,
      userLang,
      { voiceGender, voiceTone }
    );

    setTimeout(() => {
      onSnooze?.(5);
      onClose();
    }, 1500);
  };

  const time12 = formatTo12Hour(alarmTime);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Top urgency tag */}
          <View style={styles.urgencyTag}>
            <View style={styles.redDot} />
            <Text style={styles.urgencyText}>VOICE ALARM ACTIVE</Text>
          </View>

          {/* Time Display */}
          <Text style={styles.timeText}>{time12.display}</Text>
          <Text style={styles.time24Sub}>({alarmTime} 24h clock)</Text>
          <Text style={styles.titleText}>{alarmTitle || (isBedtime ? 'Night Bedtime' : 'Morning Wake-Up')}</Text>

          {/* Pulsing Visualizer Circle */}
          <View style={styles.visualizerContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                isBedtime && styles.pulseRingBedtime,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: glowAnim,
                },
              ]}
            />
            <View style={[styles.speakerCore, isBedtime && styles.speakerCoreBedtime]}>
              <Ionicons name={isBedtime ? 'moon' : 'volume-high'} size={44} color="#070A12" />
            </View>
          </View>

          {/* Spoken Voice Announcement Preview Card */}
          <View style={styles.quoteCard}>
            <Text style={styles.loopBadge}>
              🗣️ REPEATING VOICE LOOP • CYCLE #{cycleCount}
            </Text>
            <Text style={styles.quoteText}>"{voiceText}"</Text>
          </View>

          {snoozeNotice ? (
            <View style={styles.snoozeNoticeBox}>
              <Ionicons name="time" size={16} color={Palette.auroraAmber} />
              <Text style={styles.snoozeNoticeText}>{snoozeNotice}</Text>
            </View>
          ) : null}

          {/* Morning Audio Briefing Toggle (only for wake/day alarms) */}
          {!isBedtime ? (
            <Pressable
              onPress={() => {
                SoundService.triggerHapticLight();
                setIncludeBriefing(!includeBriefing);
              }}
              style={styles.briefingToggle}>
              <Ionicons
                name={includeBriefing ? 'checkbox' : 'square-outline'}
                size={20}
                color={includeBriefing ? Palette.auroraCyan : Colors.dark.textMuted}
              />
              <View style={styles.briefingTextCol}>
                <Text style={styles.briefingTitle}>Morning Audio Briefing</Text>
                <Text style={styles.briefingSubtitle}>
                  Read today's scheduled routines aloud after waking up
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.bedtimeNote}>
              <Ionicons name="moon-outline" size={16} color={Palette.auroraPurple} />
              <Text style={styles.bedtimeNoteText}>
                Bedtime Mode • Goodnight audio will confirm your rest
              </Text>
            </View>
          )}

          {/* Large Interactive Buttons */}
          <View style={styles.actionsContainer}>
            {/* 1. I'm Awake / Done Button */}
            <Pressable
              onPress={handleAwakeDone}
              style={({ pressed }) => [
                styles.awakeButton,
                isBedtime && styles.bedtimeButton,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name={isBedtime ? 'moon' : 'sunny'} size={24} color="#070A12" />
              <Text style={styles.awakeButtonText}>
                {isBedtime ? 'Going to Sleep / Done' : "I'm Awake / Done"}
              </Text>
            </Pressable>

            {/* 2. Snooze 5 Mins Button */}
            <Pressable
              onPress={handleSnooze}
              style={({ pressed }) => [styles.snoozeButton, pressed && styles.buttonPressed]}>
              <Ionicons name="alarm-outline" size={20} color={Palette.auroraAmber} />
              <Text style={styles.snoozeButtonText}>Snooze 5 Mins</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  urgencyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    marginBottom: Spacing.md,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.auroraCoral,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.auroraCoral,
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.dark.text,
    letterSpacing: -1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  visualizerContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    borderWidth: 2,
    borderColor: Palette.auroraCyan,
  },
  speakerCore: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 8,
  },
  quoteCard: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
  },
  loopBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  snoozeNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  snoozeNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraAmber,
  },
  briefingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  briefingTextCol: {
    flex: 1,
  },
  briefingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  briefingSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  actionsContainer: {
    width: '100%',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  awakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.auroraEmerald,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    shadowColor: Palette.auroraEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  awakeButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#070A12',
    letterSpacing: 0.5,
  },
  snoozeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  snoozeButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.auroraAmber,
  },
  time24Sub: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.textMuted,
    marginTop: -4,
    marginBottom: 4,
  },
  pulseRingBedtime: {
    borderColor: Palette.auroraPurple,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  speakerCoreBedtime: {
    backgroundColor: Palette.auroraPurple,
  },
  bedtimeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  bedtimeNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraPurple,
    flex: 1,
  },
  bedtimeButton: {
    backgroundColor: Palette.auroraPurple,
    shadowColor: Palette.auroraPurple,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
