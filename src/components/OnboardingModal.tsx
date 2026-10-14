import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { ProfileRepo } from '@/services/db/profileRepo';
import { AlarmRepo } from '@/services/db/alarmRepo';
import { RoutineRepo } from '@/services/db/routineRepo';
import { SoundService } from '@/services/audio/soundService';
import { SpeechService, VOICE_PROFILES } from '@/services/voice/speechService';
import {
  SupportedLanguage,
  VoiceGender,
  VoiceTone,
  TimeBlock,
} from '@/services/db/types';
import {
  formatTo12Hour,
  computeSleepDuration,
  generateAccurateAlarmAnnouncement,
} from '@/utils/timeUtils';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

const BEDTIME_PRESETS = [
  { time: '21:30', label: '9:30 PM (Early)' },
  { time: '22:00', label: '10:00 PM (Standard)' },
  { time: '22:30', label: '10:30 PM (Moderate)' },
  { time: '23:00', label: '11:00 PM (Night)' },
];

const WAKE_PRESETS = [
  { time: '04:00', label: '4:00 AM (Tahajjud / Early Bird)' },
  { time: '05:30', label: '5:30 AM (Sunrise)' },
  { time: '06:30', label: '6:30 AM (Classic)' },
  { time: '07:00', label: '7:00 AM (Balanced)' },
  { time: '08:00', label: '8:00 AM (Relaxed)' },
];

const STARTER_ROUTINES = [
  {
    id: 'starter-water',
    title: 'Morning Hydration',
    time: '07:00',
    block: 'morning' as TimeBlock,
    icon: 'water-outline',
    color: '#00F2FE',
  },
  {
    id: 'starter-workout',
    title: 'Morning Stretch & Workout',
    time: '07:30',
    block: 'morning' as TimeBlock,
    icon: 'fitness-outline',
    color: '#10B981',
  },
  {
    id: 'starter-work',
    title: 'Daily Deep Work & Focus',
    time: '09:00',
    block: 'morning' as TimeBlock,
    icon: 'briefcase-outline',
    color: '#8B5CF6',
  },
  {
    id: 'starter-sleep',
    title: 'Night Reflection & Sleep',
    time: '22:00',
    block: 'night' as TimeBlock,
    icon: 'moon-outline',
    color: '#EC4899',
  },
];

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Profile & Name
  const [name, setName] = useState('Aasif');
  const [language, setLanguage] = useState<SupportedLanguage>('ur');
  const [avatar, setAvatar] = useState('person');
  const [themeColor, setThemeColor] = useState('#00F2FE');

  // Step 2: Sleep & Wake
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [selectedRoutines, setSelectedRoutines] = useState<string[]>([
    'starter-water',
    'starter-workout',
    'starter-work',
  ]);

  // Step 3: Voice Gender & Tone
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female');
  const [voiceTone, setVoiceTone] = useState<VoiceTone>('warm');
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Circadian sleep computation
  const sleepStats = computeSleepDuration(bedtime, wakeTime);

  const handleNext = () => {
    SoundService.triggerHapticLight();
    if (step === 1) {
      if (!name.trim()) {
        setName('Aasif');
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    SoundService.triggerHapticLight();
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const toggleRoutine = (routineId: string) => {
    SoundService.triggerHapticLight();
    if (selectedRoutines.includes(routineId)) {
      setSelectedRoutines(selectedRoutines.filter((id) => id !== routineId));
    } else {
      setSelectedRoutines([...selectedRoutines, routineId]);
    }
  };

  const handleTestVoicePreview = async () => {
    SoundService.triggerHapticSuccess();
    setIsPreviewSpeaking(true);

    const userNameClean = name.trim() || 'Aasif';
    const previewText = generateAccurateAlarmAnnouncement(
      userNameClean,
      'wake',
      wakeTime
    );

    const preset = VOICE_PROFILES[voiceGender][voiceTone];

    await SpeechService.speak(previewText, {
      language,
      voiceGender,
      voiceTone,
      pitch: preset.pitch,
      rate: preset.rate,
      onDone: () => setIsPreviewSpeaking(false),
    });
  };

  const handleCompleteSetup = async () => {
    if (isSaving) return;
    setIsSaving(true);
    SoundService.triggerHapticSuccess();

    try {
      const userNameClean = name.trim() || 'Aasif';
      const preset = VOICE_PROFILES[voiceGender][voiceTone];

      // 1. Save configured profile
      await ProfileRepo.updateUserProfile({
        name: userNameClean,
        preferredLanguage: language,
        avatar,
        color: themeColor,
        voiceGender,
        voiceTone,
        voicePitch: preset.pitch,
        voiceRate: preset.rate,
        onboardingCompleted: true,
      });

      // 2. Create Wake-Up Voice Alarm
      const wakeVoiceText = generateAccurateAlarmAnnouncement(
        userNameClean,
        'wake',
        wakeTime
      );
      await AlarmRepo.addAlarm({
        title: 'Morning Wake-Up',
        alarmType: 'wake',
        time: wakeTime,
        soundName: 'aurora_chime',
        soundMode: 'voice',
        voiceAnnouncementText: wakeVoiceText,
        isEnabled: true,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        vibrate: true,
        snoozeEnabled: true,
      });

      // 3. Create Bedtime Voice Alarm
      const bedtimeVoiceText = generateAccurateAlarmAnnouncement(
        userNameClean,
        'bedtime',
        bedtime
      );
      await AlarmRepo.addAlarm({
        title: 'Night Bedtime',
        alarmType: 'bedtime',
        time: bedtime,
        soundName: 'aurora_chime',
        soundMode: 'voice',
        voiceAnnouncementText: bedtimeVoiceText,
        isEnabled: true,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        vibrate: true,
        snoozeEnabled: true,
      });

      // 4. Create selected starter routines
      for (const starter of STARTER_ROUTINES) {
        if (selectedRoutines.includes(starter.id)) {
          await RoutineRepo.addRoutine({
            title: starter.title,
            description: `Configured during onboarding for ${userNameClean}`,
            timeBlock: starter.block,
            scheduledTime: starter.time,
            durationMinutes: 20,
            priority: 'medium',
            category: 'health',
            color: starter.color,
            icon: starter.icon,
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            isActive: true,
            voiceReminderText: `${userNameClean}, aapka waqt ho gaya hai: ${starter.title}.`,
          });
        }
      }

      onComplete();
    } catch (err) {
      console.warn('Error completing onboarding:', err);
      onComplete();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header & Step Progress Bar */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {step > 1 ? (
              <Pressable onPress={handleBack} style={styles.backButton} hitSlop={10}>
                <Ionicons name="arrow-back" size={20} color={Palette.auroraCyan} />
              </Pressable>
            ) : (
              <View style={styles.logoPill}>
                <Ionicons name="compass" size={16} color={Palette.auroraCyan} />
                <Text style={styles.logoText}>DayPilot AI</Text>
              </View>
            )}

            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>STEP {step} OF 3</Text>
            </View>
          </View>

          {/* Progress track */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' },
              ]}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}>
          {/* STEP 1: Profile & Name Setup */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.welcomeBanner}>
                <View style={styles.iconCircle}>
                  <Ionicons name="sparkles" size={28} color={Palette.auroraCyan} />
                </View>
                <Text style={styles.title}>Welcome to DayPilot AI</Text>
                <Text style={styles.subtitle}>
                  Your 100% private, offline family & personal OS. Enter your name
                  to personalize all AI vocal reminders.
                </Text>
              </View>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WHAT SHOULD THE AI CALL YOU?</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person" size={20} color={Palette.auroraCyan} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name (e.g. Aasif, Mujtaba)"
                    placeholderTextColor={Colors.dark.textMuted}
                    autoFocus
                  />
                </View>
                <Text style={styles.inputHint}>
                  Spoken in all voice alarms: "{name || 'Aasif'}, ab uthne ka waqt ho gaya hai!"
                </Text>
              </View>

              {/* Language Selector */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>PREFERRED VOICE LANGUAGE</Text>
                <View style={styles.pillRow}>
                  {[
                    { code: 'ur' as SupportedLanguage, label: '🇵🇰 Urdu (اردو)' },
                    { code: 'hi' as SupportedLanguage, label: '🇮🇳 Hindi (हिंदी)' },
                    { code: 'en' as SupportedLanguage, label: '🇬🇧 English' },
                  ].map((l) => (
                    <Pressable
                      key={l.code}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setLanguage(l.code);
                      }}
                      style={[
                        styles.langPill,
                        language === l.code && styles.langPillActive,
                      ]}>
                      <Text
                        style={[
                          styles.langPillText,
                          language === l.code && styles.langPillTextActive,
                        ]}>
                        {l.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Avatar Selector */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>CHOOSE YOUR PROFILE AVATAR</Text>
                <View style={styles.avatarRow}>
                  {['person', 'fitness', 'briefcase', 'heart', 'star', 'moon'].map((iconName) => (
                    <Pressable
                      key={iconName}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setAvatar(iconName);
                      }}
                      style={[
                        styles.avatarBubble,
                        avatar === iconName && styles.avatarBubbleActive,
                      ]}>
                      <Ionicons
                        name={iconName as any}
                        size={22}
                        color={avatar === iconName ? Palette.auroraCyan : Colors.dark.textSecondary}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Accent Color Selector */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>CHOOSE THEME COLOR</Text>
                <View style={styles.colorRow}>
                  {['#00F2FE', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'].map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setThemeColor(c);
                      }}
                      style={[
                        styles.colorBubble,
                        { backgroundColor: c },
                        themeColor === c && styles.colorBubbleActive,
                      ]}>
                      {themeColor === c && (
                        <Ionicons name="checkmark" size={16} color="#070A12" />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Sleep & Wake Circadian Setup */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.welcomeBanner}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="moon" size={28} color={Palette.auroraPurple} />
                </View>
                <Text style={styles.title}>Circadian Sleep & Wake</Text>
                <Text style={styles.subtitle}>
                  Align your biological clock. DayPilot AI sounds repeating voice alerts
                  at your target wake-up and sleep times.
                </Text>
              </View>

              {/* Circadian Calculation Pill */}
              <View style={styles.circadianStatCard}>
                <View style={styles.circadianTopRow}>
                  <Ionicons name="pulse" size={20} color={Palette.auroraCyan} />
                  <Text style={styles.circadianStatTitle}>Target Circadian Rhythm</Text>
                </View>
                <Text style={styles.circadianStatValue}>
                  {sleepStats.formatted} ({sleepStats.cycles} Sleep Cycles)
                </Text>
                <Text style={styles.circadianStatSub}>
                  Bedtime: {formatTo12Hour(bedtime).display} → Wake: {formatTo12Hour(wakeTime).display}
                </Text>
              </View>

              {/* Bedtime Setting */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>BEDTIME SLEEP ALARM (10 PM DEFAULT)</Text>
                <View style={styles.presetGrid}>
                  {BEDTIME_PRESETS.map((p) => (
                    <Pressable
                      key={p.time}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setBedtime(p.time);
                      }}
                      style={[
                        styles.presetCard,
                        bedtime === p.time && styles.presetCardActiveBedtime,
                      ]}>
                      <Ionicons
                        name="moon"
                        size={16}
                        color={bedtime === p.time ? Palette.auroraPurple : Colors.dark.textMuted}
                      />
                      <Text
                        style={[
                          styles.presetTimeText,
                          bedtime === p.time && styles.presetTextActivePurple,
                        ]}>
                        {formatTo12Hour(p.time).display}
                      </Text>
                      <Text style={styles.presetSubText}>{p.label.split('(')[1]?.replace(')', '') || ''}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Wake-Up Setting */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>MORNING WAKE-UP ALARM (4 AM / 6:30 AM / 7 AM)</Text>
                <View style={styles.presetGrid}>
                  {WAKE_PRESETS.map((p) => (
                    <Pressable
                      key={p.time}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setWakeTime(p.time);
                      }}
                      style={[
                        styles.presetCard,
                        wakeTime === p.time && styles.presetCardActiveWake,
                      ]}>
                      <Ionicons
                        name="sunny"
                        size={16}
                        color={wakeTime === p.time ? Palette.auroraCyan : Colors.dark.textMuted}
                      />
                      <Text
                        style={[
                          styles.presetTimeText,
                          wakeTime === p.time && styles.presetTextActiveCyan,
                        ]}>
                        {formatTo12Hour(p.time).display}
                      </Text>
                      <Text style={styles.presetSubText}>{p.label.split('(')[1]?.replace(')', '') || ''}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Starter Daily Routines */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>INCLUDE INITIAL STARTER ROUTINES</Text>
                {STARTER_ROUTINES.map((routine) => {
                  const isChecked = selectedRoutines.includes(routine.id);
                  return (
                    <Pressable
                      key={routine.id}
                      onPress={() => toggleRoutine(routine.id)}
                      style={[styles.routineCheckItem, isChecked && styles.routineCheckItemActive]}>
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? Palette.auroraCyan : Colors.dark.textMuted}
                      />
                      <View style={styles.routineCheckTextCol}>
                        <Text style={styles.routineCheckTitle}>{routine.title}</Text>
                        <Text style={styles.routineCheckTime}>
                          {formatTo12Hour(routine.time).display} • {routine.block.toUpperCase()}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Voice Gender & Tone Selection */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.welcomeBanner}>
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
                  <Ionicons name="mic" size={28} color={Palette.auroraCyan} />
                </View>
                <Text style={styles.title}>Voice Gender & Tone</Text>
                <Text style={styles.subtitle}>
                  Choose the synthesized voice style that rings in repeating continuous
                  loops for your alarms and morning schedule briefings.
                </Text>
              </View>

              {/* Voice Gender Selection */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>VOICE GENDER</Text>
                <View style={styles.genderRow}>
                  {[
                    { id: 'female' as VoiceGender, label: '👩 Female Voice', icon: 'woman' },
                    { id: 'male' as VoiceGender, label: '👨 Male Voice', icon: 'man' },
                  ].map((g) => (
                    <Pressable
                      key={g.id}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setVoiceGender(g.id);
                      }}
                      style={[
                        styles.genderCard,
                        voiceGender === g.id && styles.genderCardActive,
                      ]}>
                      <Ionicons
                        name={g.icon as any}
                        size={24}
                        color={voiceGender === g.id ? Palette.auroraCyan : Colors.dark.textSecondary}
                      />
                      <Text
                        style={[
                          styles.genderCardText,
                          voiceGender === g.id && styles.genderCardTextActive,
                        ]}>
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Voice Tone Selection */}
              <View style={styles.sectionGroup}>
                <Text style={styles.inputLabel}>VOICE TONE & CADENCE</Text>
                <View style={styles.toneList}>
                  {(
                    [
                      {
                        tone: 'warm' as VoiceTone,
                        title: '🌸 Warm & Caring',
                        desc: 'Comforting, gentle wake-up guidance',
                      },
                      {
                        tone: 'energetic' as VoiceTone,
                        title: '⚡ Energetic & Bright',
                        desc: 'Spirited, high-drive morning motivation',
                      },
                      {
                        tone: 'calm' as VoiceTone,
                        title: '🌙 Calm & Peaceful',
                        desc: 'Serene, meditative tone ideal for early mornings',
                      },
                      {
                        tone: 'authoritative' as VoiceTone,
                        title: '🛡️ Clear & Disciplined',
                        desc: 'Crisp, resolute alert that ensures you rise on time',
                      },
                    ]
                  ).map((t) => (
                    <Pressable
                      key={t.tone}
                      onPress={() => {
                        SoundService.triggerHapticLight();
                        setVoiceTone(t.tone);
                      }}
                      style={[
                        styles.toneCard,
                        voiceTone === t.tone && styles.toneCardActive,
                      ]}>
                      <View style={styles.toneRadio}>
                        {voiceTone === t.tone && <View style={styles.toneRadioInner} />}
                      </View>
                      <View style={styles.toneTextCol}>
                        <Text style={styles.toneTitle}>{t.title}</Text>
                        <Text style={styles.toneDesc}>{t.desc}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Live Voice Preview Card */}
              <View style={styles.previewCard}>
                <View style={styles.previewHeader}>
                  <Ionicons name="volume-high" size={18} color={Palette.auroraCyan} />
                  <Text style={styles.previewHeading}>LIVE VOICE ANNOUNCEMENT TEST</Text>
                </View>
                <Text style={styles.previewQuote}>
                  "{name || 'Aasif'}, ab tumhara uthne ka waqt ho gaya hai, uth jao!"
                </Text>
                <Pressable
                  onPress={handleTestVoicePreview}
                  style={({ pressed }) => [
                    styles.previewButton,
                    isPreviewSpeaking && styles.previewButtonSpeaking,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Ionicons
                    name={isPreviewSpeaking ? 'radio' : 'play'}
                    size={18}
                    color="#070A12"
                  />
                  <Text style={styles.previewButtonText}>
                    {isPreviewSpeaking ? 'Speaking...' : 'Test Voice Audio'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.footer}>
          {step < 3 ? (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [styles.continueButton, pressed && { opacity: 0.85 }]}>
              <Text style={styles.continueButtonText}>
                {step === 1 ? 'Configure Sleep & Wake Schedule →' : 'Select Voice Persona & Tone →'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCompleteSetup}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.launchButton,
                pressed && { opacity: 0.85 },
                isSaving && { opacity: 0.6 },
              ]}>
              <Ionicons name="rocket" size={20} color="#070A12" />
              <Text style={styles.launchButtonText}>
                {isSaving ? 'Saving Configuration...' : 'Launch DayPilot AI'}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark.text,
    letterSpacing: 0.5,
  },
  stepBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Palette.auroraCyan,
    borderRadius: Radius.full,
  },
  scroll: {
    padding: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  stepContainer: {
    gap: Spacing.lg,
  },
  welcomeBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
    paddingVertical: 4,
  },
  inputHint: {
    fontSize: 11,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
    marginTop: 2,
  },
  sectionGroup: {
    gap: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  langPill: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  langPillActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  langPillTextActive: {
    color: Palette.auroraCyan,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  avatarBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatarBubbleActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  colorBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorBubbleActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  circadianStatCard: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  circadianTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  circadianStatTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  circadianStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark.text,
    marginVertical: 4,
  },
  circadianStatSub: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  presetGrid: {
    gap: Spacing.xs,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  presetCardActiveBedtime: {
    borderColor: Palette.auroraPurple,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  presetCardActiveWake: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  presetTimeText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  presetTextActivePurple: {
    color: Palette.auroraPurple,
  },
  presetTextActiveCyan: {
    color: Palette.auroraCyan,
  },
  presetSubText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginLeft: 'auto',
  },
  routineCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.xs,
  },
  routineCheckItemActive: {
    borderColor: 'rgba(0, 242, 254, 0.3)',
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
  },
  routineCheckTextCol: {
    flex: 1,
  },
  routineCheckTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  routineCheckTime: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dark.surface,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  genderCardActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  genderCardText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.textSecondary,
  },
  genderCardTextActive: {
    color: Colors.dark.text,
  },
  toneList: {
    gap: Spacing.xs,
  },
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  toneCardActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
  },
  toneRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toneRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.auroraCyan,
  },
  toneTextCol: {
    flex: 1,
  },
  toneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  toneDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  previewCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    gap: Spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  previewQuote: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Palette.auroraCyan,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  previewButtonSpeaking: {
    backgroundColor: Palette.auroraEmerald,
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#070A12',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  continueButton: {
    backgroundColor: Palette.auroraCyan,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070A12',
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.auroraEmerald,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  launchButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#070A12',
  },
});
