import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Palette, Spacing, Radius } from '@/constants/theme';
import { SoundService } from '@/services/audio/soundService';
import { SpeechService } from '@/services/voice/speechService';

export default function LandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 840;
  const isTablet = width >= 600 && width < 840;

  const [activeVoiceDemo, setActiveVoiceDemo] = useState<string | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  // If user opens the standalone native mobile app (Android APK or iOS build),
  // seamlessly route them directly into the full DayPilot OS.
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(tabs)');
    }
  }, [router]);

  const handleLaunchWebApp = () => {
    SoundService.triggerHapticSuccess();
    router.push('/(tabs)');
  };

  const handleDownloadApk = () => {
    SoundService.triggerHapticSuccess();
    setDownloadStarted(true);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = '/daypilot-ai-release.apk';
      link.download = 'DayPilot-AI-v1.0.0.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Linking.openURL('https://github.com/MujtabaTheCoder/DayPilot-AI/releases');
    }

    setTimeout(() => {
      setDownloadStarted(false);
    }, 4000);
  };

  const handleTestVoice = async (demoId: string, text: string) => {
    SoundService.triggerHapticLight();
    setActiveVoiceDemo(demoId);
    await SpeechService.speak(text, {
      language: 'ur',
      voiceGender: 'female',
      voiceTone: 'warm',
      rate: 0.88,
      pitch: 1.05,
      onDone: () => setActiveVoiceDemo(null),
    });
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Navigation Bar */}
        <View style={[styles.navBar, isDesktop && styles.navBarDesktop]}>
          <View style={styles.brandRow}>
            <View style={styles.glowDot} />
            <Text style={styles.brandTitle}>DAYPILOT AI</Text>
            <View style={styles.editionBadge}>
              <Text style={styles.editionText}>FAMILY OS</Text>
            </View>
          </View>

          <View style={styles.navActions}>
            <Pressable
              onPress={() =>
                Linking.openURL('https://github.com/MujtabaTheCoder/DayPilot-AI')
              }
              style={styles.navGhostButton}>
              <Ionicons name="logo-github" size={18} color={Colors.dark.textSecondary} />
              <Text style={styles.navGhostText}>GitHub</Text>
            </Pressable>

            <Pressable
              onPress={handleLaunchWebApp}
              style={({ pressed }) => [
                styles.navCtaButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.navCtaText}>Launch Web App</Text>
              <Ionicons name="arrow-forward" size={14} color="#070A12" />
            </Pressable>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={[styles.heroContainer, isDesktop && styles.heroContainerDesktop]}>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={13} color={Palette.auroraCyan} />
            <Text style={styles.privacyBadgeText}>
              100% OFFLINE • LOCAL PRIVACY • ZERO PAID CLOUD APIS
            </Text>
          </View>

          <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
            DayPilot AI
          </Text>

          <Text style={[styles.heroTagline, isDesktop && styles.heroTaglineDesktop]}>
            Offline Family OS & Unbreakable Voice Alarm
          </Text>

          <Text style={[styles.heroSubtext, isDesktop && styles.heroSubtextDesktop]}>
            The intelligent personal operating system that replaces blaring buzzer
            alarms with comforting, culturally natural synthesized Urdu, Hindi &
            English voice reminders. Optimize circadian sleep cycles, conquer your
            daily flight plan, and own your routines with complete data privacy.
          </Text>

          {/* PRIMARY CALL-TO-ACTION BUTTONS */}
          <View
            style={[
              styles.ctaButtonGroup,
              (isDesktop || isTablet) && styles.ctaButtonGroupDesktop,
            ]}>
            {/* 1. Android APK Download */}
            <Pressable
              onPress={handleDownloadApk}
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                styles.apkBtn,
                pressed && styles.buttonPressed,
              ]}>
              <View style={styles.btnIconCircle}>
                <Ionicons name="logo-android" size={22} color="#070A12" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTopLabel}>DIRECT MOBILE INSTALL</Text>
                <Text style={styles.btnMainTitle}>
                  {downloadStarted ? 'Downloading APK...' : 'Download Android APK'}
                </Text>
              </View>
              <Ionicons name="download-outline" size={18} color="#070A12" />
            </Pressable>

            {/* 2. iOS PWA Install */}
            <Pressable
              onPress={() => {
                SoundService.triggerHapticLight();
                setShowIosModal(true);
              }}
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                styles.iosBtn,
                pressed && styles.buttonPressed,
              ]}>
              <View style={[styles.btnIconCircle, styles.btnIconCircleIos]}>
                <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTopLabelIos}>IPHONE & IPAD</Text>
                <Text style={styles.btnMainTitleIos}>Install on iOS (PWA)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </Pressable>

            {/* 3. Launch Web App */}
            <Pressable
              onPress={handleLaunchWebApp}
              style={({ pressed }) => [
                styles.primaryCtaBtn,
                styles.webBtn,
                pressed && styles.buttonPressed,
              ]}>
              <View style={[styles.btnIconCircle, styles.btnIconCircleWeb]}>
                <Ionicons name="globe-outline" size={20} color={Palette.auroraCyan} />
              </View>
              <View style={styles.btnTextCol}>
                <Text style={styles.btnTopLabelWeb}>BROWSER VERSION</Text>
                <Text style={styles.btnMainTitleWeb}>Launch Web Version</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={Palette.auroraCyan} />
            </Pressable>
          </View>
        </View>

        {/* INTERACTIVE VOICE SYNTHESIS AUDITION */}
        <View
          style={[
            styles.voiceShowcaseSection,
            isDesktop && styles.voiceShowcaseDesktop,
          ]}>
          <View style={styles.sectionHeaderCol}>
            <View style={styles.pillTag}>
              <Ionicons name="volume-high" size={12} color={Palette.auroraCyan} />
              <Text style={styles.pillTagText}>LIVE VOICE DEMO</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Hear DayPilot's Natural Synthesis in Action
            </Text>
            <Text style={styles.sectionSubtitle}>
              Experience our soft, comforting tone ($0.88$ rate, $1.05$ pitch) with
              phonetic Roman Urdu adjustments. Tap any sample to preview:
            </Text>
          </View>

          <View style={styles.voiceCardsGrid}>
            {/* Demo 1: Morning Wake-Up */}
            <Pressable
              onPress={() =>
                handleTestVoice(
                  'wake',
                  'Aasif, uthne ka waqt ho gaya hai, uth jaao!'
                )
              }
              style={[
                styles.voiceDemoCard,
                activeVoiceDemo === 'wake' && styles.voiceDemoCardActive,
              ]}>
              <View style={styles.voiceDemoHeader}>
                <View style={styles.voiceIconRing}>
                  <Ionicons name="sunny" size={18} color={Palette.auroraCyan} />
                </View>
                <View style={styles.voiceCardMeta}>
                  <Text style={styles.voiceCardTitle}>Morning Wake-Up Loop</Text>
                  <Text style={styles.voiceCardTarget}>4:00 AM / 6:30 AM</Text>
                </View>
                <Ionicons
                  name={activeVoiceDemo === 'wake' ? 'pause-circle' : 'play-circle'}
                  size={26}
                  color={Palette.auroraCyan}
                />
              </View>
              <Text style={styles.voiceDemoQuote}>
                "Aasif, uthne ka waqt ho gaya hai, uth jaao!"
              </Text>
            </Pressable>

            {/* Demo 2: Bedtime Rest */}
            <Pressable
              onPress={() =>
                handleTestVoice(
                  'bed',
                  'Aasif, sone aur aaraam karne ka waqt ho gaya hai, shab ba-khair.'
                )
              }
              style={[
                styles.voiceDemoCard,
                activeVoiceDemo === 'bed' && styles.voiceDemoCardActive,
              ]}>
              <View style={styles.voiceDemoHeader}>
                <View style={[styles.voiceIconRing, styles.voiceIconRingPurple]}>
                  <Ionicons name="moon" size={18} color={Palette.auroraPurple} />
                </View>
                <View style={styles.voiceCardMeta}>
                  <Text style={styles.voiceCardTitle}>Bedtime Rest Loop</Text>
                  <Text style={styles.voiceCardTarget}>10:00 PM</Text>
                </View>
                <Ionicons
                  name={activeVoiceDemo === 'bed' ? 'pause-circle' : 'play-circle'}
                  size={26}
                  color={Palette.auroraPurple}
                />
              </View>
              <Text style={styles.voiceDemoQuote}>
                "Aasif, sone aur aaraam karne ka waqt ho gaya hai, shab ba-khair."
              </Text>
            </Pressable>

            {/* Demo 3: Morning Audio Briefing */}
            <Pressable
              onPress={() =>
                handleTestVoice(
                  'briefing',
                  'Shabaash Aasif! Uthne ka waqt khatam hua. Aaj aapke schedule mein deep work aur exercise hain. Din shuru karein aur kamyab rahein!'
                )
              }
              style={[
                styles.voiceDemoCard,
                activeVoiceDemo === 'briefing' && styles.voiceDemoCardActive,
              ]}>
              <View style={styles.voiceDemoHeader}>
                <View style={[styles.voiceIconRing, styles.voiceIconRingEmerald]}>
                  <Ionicons name="sparkles" size={18} color={Palette.auroraEmerald} />
                </View>
                <View style={styles.voiceCardMeta}>
                  <Text style={styles.voiceCardTitle}>Morning Audio Briefing</Text>
                  <Text style={styles.voiceCardTarget}>Spoken on Wake-Up</Text>
                </View>
                <Ionicons
                  name={
                    activeVoiceDemo === 'briefing'
                      ? 'pause-circle'
                      : 'play-circle'
                  }
                  size={26}
                  color={Palette.auroraEmerald}
                />
              </View>
              <Text style={styles.voiceDemoQuote}>
                "Shabaash Aasif! Uthne ka waqt khatam hua. Aaj aapke schedule mein deep work..."
              </Text>
            </Pressable>
          </View>
        </View>

        {/* PILLARS / CORE FEATURES SHOWCASE */}
        <View style={[styles.featuresSection, isDesktop && styles.featuresDesktop]}>
          <View style={styles.sectionHeaderCol}>
            <View style={styles.pillTag}>
              <Ionicons name="flash" size={12} color={Palette.auroraCyan} />
              <Text style={styles.pillTagText}>PRODUCT CAPABILITIES</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Designed for Human Biology & Absolute Privacy
            </Text>
          </View>

          <View style={styles.featuresGrid}>
            {/* Feature 1 */}
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="mic" size={22} color={Palette.auroraCyan} />
              </View>
              <Text style={styles.featureCardTitle}>Natural Voice Synthesis</Text>
              <Text style={styles.featureCardDesc}>
                Soft, comforting pronunciation tuned specifically for Roman Urdu,
                Hindi, and English. Automatically maps to native platform voices with
                distinct male/female profiles.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(139, 92, 246, 0.15)' },
                ]}>
                <Ionicons name="repeat" size={22} color={Palette.auroraPurple} />
              </View>
              <Text style={styles.featureCardTitle}>
                Unbreakable Wake & Sleep Loops
              </Text>
              <Text style={styles.featureCardDesc}>
                Voice reminders continuously repeat alongside haptics until you
                explicitly tap "I'm Awake / Done". Backed by an 8.5-second watchdog
                failsafe timer.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                ]}>
                <Ionicons name="moon" size={22} color={Palette.auroraAmber} />
              </View>
              <Text style={styles.featureCardTitle}>
                Circadian Sleep Cycle Engine
              </Text>
              <Text style={styles.featureCardDesc}>
                Calculates precise 90-minute sleep cycles between your bedtime and
                wake-up time to eliminate morning brain fog and maximize restorative
                rest.
              </Text>
            </View>

            {/* Feature 4 */}
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}>
                <Ionicons name="lock-closed" size={22} color={Palette.auroraEmerald} />
              </View>
              <Text style={styles.featureCardTitle}>100% Offline & Private</Text>
              <Text style={styles.featureCardDesc}>
                All profiles, routines, habit streaks, and voice alarms are stored
                exclusively on your physical device via SQLite. Zero telemetry, zero
                cloud snooping.
              </Text>
            </View>

            {/* Feature 5 */}
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(0, 242, 254, 0.15)' },
                ]}>
                <Ionicons name="flame" size={22} color={Palette.auroraCyan} />
              </View>
              <Text style={styles.featureCardTitle}>Habit Streaks & Logging</Text>
              <Text style={styles.featureCardDesc}>
                Track daily water intake, workouts, and focus hours. Visualize your
                consistency with 7-day micro-dots and motivating completion scores.
              </Text>
            </View>

            {/* Feature 6 */}
            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(236, 72, 153, 0.15)' },
                ]}>
                <Ionicons name="chatbubbles" size={22} color="#EC4899" />
              </View>
              <Text style={styles.featureCardTitle}>Pilot Voice Assistant</Text>
              <Text style={styles.featureCardDesc}>
                Dictate routines by voice: "Set workout at 7 AM and lunch at 2 PM".
                Pilot parses your intent locally and structures your day instantly.
              </Text>
            </View>
          </View>
        </View>

        {/* 3-STEP WORKFLOW SHOWCASE */}
        <View style={[styles.stepsSection, isDesktop && styles.stepsDesktop]}>
          <View style={styles.sectionHeaderCol}>
            <Text style={styles.sectionTitle}>Get Up & Running in 60 Seconds</Text>
            <Text style={styles.sectionSubtitle}>
              Clean canvas onboarding that adapts completely to your life:
            </Text>
          </View>

          <View style={styles.stepsRow}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Enter Your Name</Text>
              <Text style={styles.stepDesc}>
                Set your personal name so the AI addresses you respectfully in every
                spoken alert.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Configure Sleep & Wake</Text>
              <Text style={styles.stepDesc}>
                Select bedtime (e.g. 10:00 PM) and wake time (e.g. 6:30 AM). Your
                circadian cycles calibrate instantly.
              </Text>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Pick Voice Persona</Text>
              <Text style={styles.stepDesc}>
                Choose between warm female or male voices, preview the greeting, and
                take flight.
              </Text>
            </View>
          </View>
        </View>

        {/* DOWNLOAD CENTER FOOTER BANNER */}
        <View
          style={[
            styles.downloadCenterCard,
            isDesktop && styles.downloadCenterDesktop,
          ]}>
          <Text style={styles.downloadCardHeadline}>
            Ready to Take Flight with DayPilot AI?
          </Text>
          <Text style={styles.downloadCardSub}>
            Available for direct Android installation, iOS PWA, or instant web access.
          </Text>

          <View style={styles.downloadButtonsRow}>
            <Pressable
              onPress={handleDownloadApk}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerApkBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="logo-android" size={18} color="#070A12" />
              <Text style={styles.footerApkText}>Download APK (.apk)</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowIosModal(true)}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerIosBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="logo-apple" size={18} color="#FFFFFF" />
              <Text style={styles.footerIosText}>Install on iOS</Text>
            </Pressable>

            <Pressable
              onPress={handleLaunchWebApp}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerWebBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="rocket-outline" size={18} color={Palette.auroraCyan} />
              <Text style={styles.footerWebText}>Launch Web Version</Text>
            </Pressable>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            DayPilot AI • Privacy-First Offline Life OS • Built with React Native & Expo
          </Text>
        </View>
      </ScrollView>

      {/* iOS PWA INSTALLATION MODAL */}
      <Modal
        visible={showIosModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.appleIconCircle}>
                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.modalTitleCol}>
                <Text style={styles.modalTitle}>Install on iPhone / iPad</Text>
                <Text style={styles.modalSubtitle}>
                  Add DayPilot AI to your Home Screen in 3 taps
                </Text>
              </View>
              <Pressable
                onPress={() => setShowIosModal(false)}
                hitSlop={10}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.instructionsList}>
              <View style={styles.instructionRow}>
                <View style={styles.stepNumPill}>
                  <Text style={styles.stepNumPillText}>1</Text>
                </View>
                <View style={styles.instructionTextCol}>
                  <Text style={styles.instructionTitle}>
                    Open in Safari & Tap Share
                  </Text>
                  <Text style={styles.instructionDesc}>
                    Tap the Safari Share button at the bottom of the screen (the square
                    icon with an upward arrow <Ionicons name="share-outline" size={14} color={Palette.auroraCyan} />).
                  </Text>
                </View>
              </View>

              <View style={styles.instructionRow}>
                <View style={styles.stepNumPill}>
                  <Text style={styles.stepNumPillText}>2</Text>
                </View>
                <View style={styles.instructionTextCol}>
                  <Text style={styles.instructionTitle}>
                    Select "Add to Home Screen"
                  </Text>
                  <Text style={styles.instructionDesc}>
                    Scroll down the share sheet and tap{' '}
                    <Text style={styles.highlightText}>"Add to Home Screen"</Text> (icon
                    with a plus sign).
                  </Text>
                </View>
              </View>

              <View style={styles.instructionRow}>
                <View style={styles.stepNumPill}>
                  <Text style={styles.stepNumPillText}>3</Text>
                </View>
                <View style={styles.instructionTextCol}>
                  <Text style={styles.instructionTitle}>Tap "Add" & Enjoy Standalone</Text>
                  <Text style={styles.instructionDesc}>
                    Tap <Text style={styles.highlightText}>"Add"</Text> in the
                    top-right corner. DayPilot will install as a standalone app with
                    full offline capabilities!
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowIosModal(false);
                handleLaunchWebApp();
              }}
              style={styles.modalPrimaryBtn}>
              <Text style={styles.modalPrimaryBtnText}>Launch Web App Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#070A12" />
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl * 2,
  },
  navBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: 'rgba(5, 7, 13, 0.85)',
  },
  navBarDesktop: {
    paddingHorizontal: Spacing.xxl,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    borderBottomWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  glowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.auroraCyan,
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 1.2,
  },
  editionBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  editionText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraPurple,
    letterSpacing: 0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  navGhostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  navGhostText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  navCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.auroraCyan,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  navCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#070A12',
  },

  /* HERO */
  heroContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  heroContainerDesktop: {
    paddingTop: Spacing.xxl * 1.5,
    paddingBottom: Spacing.xxl,
    maxWidth: 960,
    alignSelf: 'center',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    marginBottom: Spacing.lg,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  heroHeadline: {
    fontSize: 38,
    fontWeight: '900',
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -1,
  },
  heroHeadlineDesktop: {
    fontSize: 56,
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.auroraCyan,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    letterSpacing: -0.2,
  },
  heroTaglineDesktop: {
    fontSize: 26,
  },
  heroSubtext: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 680,
    marginBottom: Spacing.xxl,
  },
  heroSubtextDesktop: {
    fontSize: 17,
    lineHeight: 27,
  },

  /* CTA GROUP */
  ctaButtonGroup: {
    width: '100%',
    gap: Spacing.md,
    maxWidth: 500,
  },
  ctaButtonGroupDesktop: {
    flexDirection: 'row',
    maxWidth: 900,
    justifyContent: 'center',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    minHeight: 64,
  },
  apkBtn: {
    backgroundColor: Palette.auroraCyan,
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    flex: 1,
  },
  iosBtn: {
    backgroundColor: '#1E2333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
  },
  webBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.35)',
    flex: 1,
  },
  btnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7, 10, 18, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIconCircleIos: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  btnIconCircleWeb: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  btnTextCol: {
    flex: 1,
  },
  btnTopLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#070A12',
    letterSpacing: 0.8,
  },
  btnMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070A12',
    marginTop: 1,
  },
  btnTopLabelIos: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.8,
  },
  btnMainTitleIos: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  btnTopLabelWeb: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  btnMainTitleWeb: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.auroraCyan,
    marginTop: 1,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  /* VOICE AUDITION SHOWCASE */
  voiceShowcaseSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  voiceShowcaseDesktop: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  sectionHeaderCol: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  pillTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 600,
  },
  voiceCardsGrid: {
    gap: Spacing.md,
  },
  voiceDemoCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  voiceDemoCardActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
  },
  voiceDemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  voiceIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceIconRingPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  voiceIconRingEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  voiceCardMeta: {
    flex: 1,
  },
  voiceCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  voiceCardTarget: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  voiceDemoQuote: {
    fontSize: 13,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
    backgroundColor: 'rgba(0, 242, 254, 0.04)',
    padding: Spacing.sm,
    borderRadius: Radius.md,
  },

  /* FEATURES */
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  featuresDesktop: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flex: 1,
    minWidth: 260,
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  featureCardDesc: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },

  /* STEPS */
  stepsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  stepsDesktop: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  stepItem: {
    flex: 1,
    minWidth: 220,
    backgroundColor: Colors.dark.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    textAlign: 'center',
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.auroraCyan,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  stepNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#070A12',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },

  /* DOWNLOAD CENTER BANNER */
  downloadCenterCard: {
    backgroundColor: '#0A0F1D',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    alignItems: 'center',
    textAlign: 'center',
  },
  downloadCenterDesktop: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing.xxl,
  },
  downloadCardHeadline: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  downloadCardSub: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 6,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  downloadButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
  },
  footerApkBtn: {
    backgroundColor: Palette.auroraCyan,
  },
  footerApkText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#070A12',
  },
  footerIosBtn: {
    backgroundColor: '#1E2333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  footerIosText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerWebBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  footerWebText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },

  /* FOOTER */
  footerRow: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: 'center',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 520,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  appleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  instructionsList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  stepNumPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  instructionTextCol: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  instructionDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  highlightText: {
    color: Palette.auroraCyan,
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.auroraCyan,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
  },
});
