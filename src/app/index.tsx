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
  const isMobile = width < 600;
  const _isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  const [activeVoiceDemo, setActiveVoiceDemo] = useState<string | null>(null);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  // If user opens the standalone native mobile app, route directly into DayPilot OS
  useEffect(() => {
    if (Platform.OS !== 'web') {
      router.replace('/(tabs)');
      return;
    }

    if (typeof window !== 'undefined' && window.navigator) {
      const ua = (window.navigator.userAgent || '').toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDetectedPlatform('ios');
      } else if (/android/.test(ua)) {
        setDetectedPlatform('android');
      } else {
        setDetectedPlatform('desktop');
      }
    }
  }, [router]);

  const handleLaunchWebApp = () => {
    SoundService.triggerHapticSuccess();
    router.push('/(tabs)');
  };

  const localExpUrl = 'exp://192.168.18.37:8081';

  const handleOpenExpoGo = () => {
    SoundService.triggerHapticSuccess();
    Linking.openURL(localExpUrl).catch(() => {
      if (detectedPlatform === 'ios') {
        setShowIosModal(true);
      } else {
        setShowAndroidModal(true);
      }
    });
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
              <Text style={styles.editionText}>OFFLINE OS</Text>
            </View>
          </View>

          <View style={styles.navActions}>
            <Pressable
              onPress={() =>
                Linking.openURL('https://github.com/MujtabaTheCoder/DayPilot-AI')
              }
              style={styles.navGhostButton}>
              <Ionicons name="logo-github" size={17} color={Colors.dark.textSecondary} />
              {!isMobile && <Text style={styles.navGhostText}>GitHub</Text>}
            </Pressable>

            <Pressable
              onPress={handleLaunchWebApp}
              style={({ pressed }) => [
                styles.navCtaButton,
                pressed && styles.buttonPressed,
              ]}>
              <Text style={styles.navCtaText}>Open App</Text>
              <Ionicons name="arrow-forward" size={13} color="#070A12" />
            </Pressable>
          </View>
        </View>

        {/* HERO SECTION */}
        <View style={[styles.heroContainer, isDesktop && styles.heroContainerDesktop]}>
          <View style={styles.privacyBadge}>
            <Ionicons name="shield-checkmark" size={12} color={Palette.auroraCyan} />
            <Text style={styles.privacyBadgeText}>
              100% OFFLINE • PRIVACY-FIRST • ZERO PAID APIS
            </Text>
          </View>

          <Text
            style={[
              styles.heroHeadline,
              isMobile && styles.heroHeadlineMobile,
              isDesktop && styles.heroHeadlineDesktop,
            ]}>
            DayPilot AI
          </Text>

          <Text
            style={[
              styles.heroTagline,
              isMobile && styles.heroTaglineMobile,
              isDesktop && styles.heroTaglineDesktop,
            ]}>
            Offline Family OS & Unbreakable Voice Alarm
          </Text>

          <Text
            style={[
              styles.heroSubtext,
              isMobile && styles.heroSubtextMobile,
              isDesktop && styles.heroSubtextDesktop,
            ]}>
            The intelligent personal operating system that replaces harsh buzzer alarms
            with comforting, culturally natural synthesized Urdu, Hindi & English voice
            announcements. Master circadian sleep harmony and own your daily routines
            with 100% device privacy.
          </Text>

          {/* DYNAMIC PRIMARY CALL-TO-ACTION BUTTONS */}
          <View
            style={[
              styles.ctaButtonGroup,
              !isMobile && styles.ctaButtonGroupDesktop,
            ]}>
            {/* If iPhone / iOS Detected */}
            {detectedPlatform === 'ios' && (
              <>
                <Pressable
                  onPress={handleOpenExpoGo}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.apkBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="flash" size={22} color="#070A12" />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabel}>NATIVE MOBILE APP • 1-TAP</Text>
                    <Text style={styles.btnMainTitle}>Open in Expo Go</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#070A12" />
                </Pressable>

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
                    <Ionicons name="logo-apple" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabelIos}>IPHONE SETUP</Text>
                    <Text style={styles.btnMainTitleIos}>iPhone Native Instructions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={handleLaunchWebApp}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.webBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={[styles.btnIconCircle, styles.btnIconCircleWeb]}>
                    <Ionicons name="open-outline" size={20} color={Palette.auroraCyan} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabelWeb}>BROWSER VERSION</Text>
                    <Text style={styles.btnMainTitleWeb}>Open Web Preview</Text>
                  </View>
                </Pressable>
              </>
            )}

            {/* If Android Detected */}
            {detectedPlatform === 'android' && (
              <>
                <Pressable
                  onPress={handleOpenExpoGo}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.apkBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="flash" size={22} color="#070A12" />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabel}>NATIVE MOBILE APP • 1-TAP</Text>
                    <Text style={styles.btnMainTitle}>Open in Expo Go</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#070A12" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    SoundService.triggerHapticLight();
                    setShowAndroidModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.webBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={[styles.btnIconCircle, styles.btnIconCircleWeb]}>
                    <Ionicons name="logo-android" size={20} color={Palette.auroraCyan} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabelWeb}>STANDALONE APK & SETUP</Text>
                    <Text style={styles.btnMainTitleWeb}>Install Native APK</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Palette.auroraCyan} />
                </Pressable>

                <Pressable
                  onPress={handleLaunchWebApp}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.iosBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={[styles.btnIconCircle, styles.btnIconCircleIos]}>
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabelIos}>BROWSER VERSION</Text>
                    <Text style={styles.btnMainTitleIos}>Open Web Preview</Text>
                  </View>
                </Pressable>
              </>
            )}

            {/* If Desktop or Unspecified */}
            {detectedPlatform === 'desktop' && (
              <>
                <Pressable
                  onPress={handleLaunchWebApp}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.apkBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={styles.btnIconCircle}>
                    <Ionicons name="rocket-outline" size={22} color="#070A12" />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabel}>BROWSER PREVIEW</Text>
                    <Text style={styles.btnMainTitle}>Launch Web Version</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={18} color="#070A12" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    SoundService.triggerHapticLight();
                    setShowAndroidModal(true);
                  }}
                  style={({ pressed }) => [
                    styles.primaryCtaBtn,
                    styles.webBtn,
                    pressed && styles.buttonPressed,
                  ]}>
                  <View style={[styles.btnIconCircle, styles.btnIconCircleWeb]}>
                    <Ionicons name="logo-android" size={20} color={Palette.auroraCyan} />
                  </View>
                  <View style={styles.btnTextCol}>
                    <Text style={styles.btnTopLabelWeb}>ANDROID MOBILE APP</Text>
                    <Text style={styles.btnMainTitleWeb}>Android Setup & APK</Text>
                  </View>
                </Pressable>

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
                    <Text style={styles.btnTopLabelIos}>IPHONE MOBILE APP</Text>
                    <Text style={styles.btnMainTitleIos}>iPhone Native Setup</Text>
                  </View>
                </Pressable>
              </>
            )}
          </View>

          {/* Platform note for clarity */}
          <Text style={styles.platformNoticeText}>
            ⚡ Run as a 100% native mobile app with Expo Go on your phone (No browser URL bar, native SQLite, and offline voice alarms).
          </Text>
        </View>

        {/* INTERACTIVE VOICE DEMO SECTION */}
        <View
          style={[
            styles.voiceShowcaseSection,
            isDesktop && styles.voiceShowcaseDesktop,
          ]}>
          <View style={styles.sectionHeaderCol}>
            <View style={styles.pillTag}>
              <Ionicons name="volume-high" size={12} color={Palette.auroraCyan} />
              <Text style={styles.pillTagText}>LIVE VOICE AUDITION</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Hear DayPilot's Soft Natural Synthesis
            </Text>
            <Text style={styles.sectionSubtitle}>
              Tuned for authentic Roman Urdu & Hindi vowels (0.88 rate, 1.05 pitch).
              Tap any audio sample to listen:
            </Text>
          </View>

          <View
            style={[
              styles.voiceCardsGrid,
              !isMobile && styles.voiceCardsGridDesktop,
            ]}>
            {/* Demo 1: Wake Up */}
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
                  <Text style={styles.voiceCardTitle}>Morning Wake-Up</Text>
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

            {/* Demo 2: Bedtime */}
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
                  <Text style={styles.voiceCardTitle}>Bedtime Rest</Text>
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

            {/* Demo 3: Morning Briefing */}
            <Pressable
              onPress={() =>
                handleTestVoice(
                  'briefing',
                  'Shabaash Aasif! Uthne ka waqt khatam hua. Aaj aapke schedule mein 3 routines hain. Din shuru karein aur kamyab rahein!'
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
                "Shabaash Aasif! Uthne ka waqt khatam hua. Aaj aapke schedule mein..."
              </Text>
            </Pressable>
          </View>
        </View>

        {/* CORE FEATURES SHOWCASE */}
        <View style={[styles.featuresSection, isDesktop && styles.featuresDesktop]}>
          <View style={styles.sectionHeaderCol}>
            <View style={styles.pillTag}>
              <Ionicons name="flash" size={12} color={Palette.auroraCyan} />
              <Text style={styles.pillTagText}>KEY CAPABILITIES</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Built for Biology & Absolute Privacy
            </Text>
          </View>

          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="mic" size={20} color={Palette.auroraCyan} />
              </View>
              <Text style={styles.featureCardTitle}>Natural Urdu/Hindi TTS</Text>
              <Text style={styles.featureCardDesc}>
                Phonetic normalizer softens imperatives, creates natural pauses, and maps
                to native Indic device voices.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(139, 92, 246, 0.15)' },
                ]}>
                <Ionicons name="repeat" size={20} color={Palette.auroraPurple} />
              </View>
              <Text style={styles.featureCardTitle}>Unbreakable Voice Loop</Text>
              <Text style={styles.featureCardDesc}>
                Persistent wake-up voice alert with watchdog timer. Persists indefinitely
                until you tap "I'm Awake / Done".
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                ]}>
                <Ionicons name="moon" size={20} color={Palette.auroraAmber} />
              </View>
              <Text style={styles.featureCardTitle}>Circadian Sleep Engine</Text>
              <Text style={styles.featureCardDesc}>
                Calculates precise 90-minute sleep cycles between your bedtime and
                wake-up time to eliminate grogginess.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}>
                <Ionicons name="shield-checkmark" size={20} color={Palette.auroraEmerald} />
              </View>
              <Text style={styles.featureCardTitle}>100% Offline SQLite</Text>
              <Text style={styles.featureCardDesc}>
                Zero cloud dependencies. All alarms, routines, and habit streaks stay
                safely encrypted on your physical device.
              </Text>
            </View>
          </View>
        </View>

        {/* BOTTOM DOWNLOAD CENTER BANNER */}
        <View
          style={[
            styles.downloadCenterCard,
            isDesktop && styles.downloadCenterDesktop,
          ]}>
          <Text style={styles.downloadCardHeadline}>
            Ready to Experience DayPilot AI?
          </Text>
          <Text style={styles.downloadCardSub}>
            Installable on iPhone, Android, or launch directly in any modern browser.
          </Text>

          <View style={styles.downloadButtonsRow}>
            <Pressable
              onPress={() => setShowIosModal(true)}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerIosBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="logo-apple" size={17} color="#FFFFFF" />
              <Text style={styles.footerIosText}>Install on iPhone</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowAndroidModal(true)}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerApkBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="logo-android" size={17} color="#070A12" />
              <Text style={styles.footerApkText}>Install on Android</Text>
            </Pressable>

            <Pressable
              onPress={handleLaunchWebApp}
              style={({ pressed }) => [
                styles.footerActionBtn,
                styles.footerWebBtn,
                pressed && styles.buttonPressed,
              ]}>
              <Ionicons name="rocket-outline" size={17} color={Palette.auroraCyan} />
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

      {/* iOS NATIVE APP & SETUP MODAL */}
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
                <Text style={styles.modalTitle}>Run Native App on iPhone</Text>
                <Text style={styles.modalSubtitle}>
                  Zero browser bars • 100% Native iOS Mobile Engine
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
              {/* Method 1: Expo Go (Instant Native App) */}
              <View style={styles.androidOptionCard}>
                <View style={styles.optionTag}>
                  <Text style={styles.optionTagText}>RECOMMENDED • 100% NATIVE MOBILE APP</Text>
                </View>
                <Text style={styles.optionTitle}>Method 1: Instant Native App (Expo Go)</Text>
                <Text style={styles.optionDesc}>
                  Runs DayPilot AI directly on your iPhone with native hardware audio, offline SQLite, and zero browser chrome:
                </Text>

                <View style={{ gap: 6, marginTop: 6 }}>
                  <Text style={styles.instructionDesc}>
                    1. Install <Text style={styles.highlightText}>Expo Go</Text> from the Apple App Store:
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL('https://apps.apple.com/app/expo-go/id982107779')}
                    style={styles.gitReleasesBtn}>
                    <Ionicons name="logo-apple" size={14} color="#FFFFFF" />
                    <Text style={[styles.gitReleasesBtnText, { color: '#FFFFFF' }]}>Open in App Store</Text>
                    <Ionicons name="open-outline" size={12} color="#FFFFFF" />
                  </Pressable>

                  <Text style={styles.instructionDesc}>
                    2. Connect iPhone to the same Wi-Fi as your computer.
                  </Text>
                  <Text style={styles.instructionDesc}>
                    3. Open the iPhone <Text style={styles.highlightText}>Camera</Text>, aim at the terminal QR code, and tap <Text style={styles.highlightText}>"Open in Expo Go"</Text>!
                  </Text>
                </View>

                <Pressable
                  onPress={handleOpenExpoGo}
                  style={[styles.modalPrimaryBtn, { marginTop: Spacing.sm }]}>
                  <Ionicons name="flash" size={16} color="#070A12" />
                  <Text style={styles.modalPrimaryBtnText}>Launch in Expo Go</Text>
                </Pressable>
              </View>

              {/* Method 2: Safari Add to Home Screen */}
              <View style={[styles.androidOptionCard, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <View style={[styles.optionTag, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                  <Text style={[styles.optionTagText, { color: '#FFFFFF' }]}>ALTERNATIVE • NO APP STORE NEEDED</Text>
                </View>
                <Text style={styles.optionTitle}>Method 2: Add to iPhone Home Screen</Text>
                <Text style={styles.optionDesc}>
                  In Safari, tap <Ionicons name="share-outline" size={12} color={Palette.auroraCyan} /> Share $\rightarrow$ tap <Text style={styles.highlightText}>"Add to Home Screen"</Text>.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowIosModal(false);
                handleLaunchWebApp();
              }}
              style={[styles.modalPrimaryBtn, { backgroundColor: '#1E2333' }]}>
              <Text style={[styles.modalPrimaryBtnText, { color: '#FFFFFF' }]}>Open Web Preview</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ANDROID NATIVE APP & SETUP MODAL */}
      <Modal
        visible={showAndroidModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAndroidModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={[styles.appleIconCircle, { backgroundColor: 'rgba(0, 242, 254, 0.15)' }]}>
                <Ionicons name="logo-android" size={24} color={Palette.auroraCyan} />
              </View>
              <View style={styles.modalTitleCol}>
                <Text style={styles.modalTitle}>Run Native App on Android</Text>
                <Text style={styles.modalSubtitle}>
                  Zero browser bars • 100% Native Android Mobile Engine
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAndroidModal(false)}
                hitSlop={10}
                style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.instructionsList}>
              {/* Method 1: Expo Go (Instant Native App) */}
              <View style={styles.androidOptionCard}>
                <View style={styles.optionTag}>
                  <Text style={styles.optionTagText}>RECOMMENDED • 100% NATIVE MOBILE APP</Text>
                </View>
                <Text style={styles.optionTitle}>Method 1: Instant Native App (Expo Go)</Text>
                <Text style={styles.optionDesc}>
                  Runs DayPilot AI directly on your Android phone as a real native app outside Chrome:
                </Text>

                <View style={{ gap: 6, marginTop: 6 }}>
                  <Text style={styles.instructionDesc}>
                    1. Install <Text style={styles.highlightText}>Expo Go</Text> from Google Play:
                  </Text>
                  <Pressable
                    onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=host.exp.exponent')}
                    style={styles.gitReleasesBtn}>
                    <Ionicons name="logo-google-playstore" size={14} color={Palette.auroraCyan} />
                    <Text style={styles.gitReleasesBtnText}>Open in Google Play</Text>
                    <Ionicons name="open-outline" size={12} color={Palette.auroraCyan} />
                  </Pressable>

                  <Text style={styles.instructionDesc}>
                    2. Connect Android phone to the same Wi-Fi as your computer.
                  </Text>
                  <Text style={styles.instructionDesc}>
                    3. Open Expo Go $\rightarrow$ tap <Text style={styles.highlightText}>"Scan QR code"</Text> $\rightarrow$ scan terminal QR code!
                  </Text>
                </View>

                <Pressable
                  onPress={handleOpenExpoGo}
                  style={[styles.modalPrimaryBtn, { marginTop: Spacing.sm }]}>
                  <Ionicons name="flash" size={16} color="#070A12" />
                  <Text style={styles.modalPrimaryBtnText}>Launch in Expo Go</Text>
                </Pressable>
              </View>

              {/* Method 2: Standalone APK via EAS */}
              <View style={[styles.androidOptionCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                <View style={[styles.optionTag, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Text style={[styles.optionTagText, { color: Palette.auroraPurple }]}>STANDALONE APK (.apk installer)</Text>
                </View>
                <Text style={styles.optionTitle}>Method 2: Build Standalone APK Binary</Text>
                <Text style={styles.optionDesc}>
                  To install DayPilot AI as an independent app without Expo Go, compile a standalone `.apk` using Expo EAS:
                </Text>
                <View style={{ backgroundColor: '#070A12', padding: 8, borderRadius: 6, marginTop: 6, gap: 4 }}>
                  <Text style={{ fontFamily: 'monospace', fontSize: 11, color: Palette.auroraCyan }}>npx eas login</Text>
                  <Text style={{ fontFamily: 'monospace', fontSize: 11, color: Palette.auroraCyan }}>npx eas build -p android --profile preview</Text>
                </View>
                <Text style={[styles.instructionDesc, { marginTop: 6 }]}>
                  EAS builds the APK in the cloud and provides a direct download link to install the `.apk` on your phone with its own custom launcher icon!
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setShowAndroidModal(false);
                handleLaunchWebApp();
              }}
              style={[styles.modalPrimaryBtn, { backgroundColor: '#1E2333' }]}>
              <Text style={[styles.modalPrimaryBtnText, { color: '#FFFFFF' }]}>Open Web Preview</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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

  /* NAVBAR */
  navBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: 'rgba(5, 7, 13, 0.95)',
  },
  navBarDesktop: {
    paddingHorizontal: Spacing.xxl,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    borderBottomWidth: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Palette.auroraCyan,
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 1,
  },
  editionBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  editionText: {
    fontSize: 8,
    fontWeight: '800',
    color: Palette.auroraPurple,
    letterSpacing: 0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  navGhostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  navGhostText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  navCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.auroraCyan,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  navCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#070A12',
  },

  /* HERO */
  heroContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  heroContainerDesktop: {
    paddingTop: Spacing.xxl * 1.5,
    paddingBottom: Spacing.xxl,
    maxWidth: 900,
    alignSelf: 'center',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    marginBottom: Spacing.md,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.auroraCyan,
    letterSpacing: 0.6,
  },
  heroHeadline: {
    fontSize: 34,
    fontWeight: '900',
    color: Colors.dark.text,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  heroHeadlineMobile: {
    fontSize: 30,
  },
  heroHeadlineDesktop: {
    fontSize: 52,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.auroraCyan,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  heroTaglineMobile: {
    fontSize: 15,
  },
  heroTaglineDesktop: {
    fontSize: 24,
  },
  heroSubtext: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 640,
    marginBottom: Spacing.lg,
  },
  heroSubtextMobile: {
    fontSize: 13,
    lineHeight: 19,
  },
  heroSubtextDesktop: {
    fontSize: 16,
    lineHeight: 25,
  },

  /* CTA BUTTONS */
  ctaButtonGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  ctaButtonGroupDesktop: {
    flexDirection: 'row',
    maxWidth: 800,
    justifyContent: 'center',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    minHeight: 58,
    flex: 1,
  },
  apkBtn: {
    backgroundColor: Palette.auroraCyan,
    shadowColor: Palette.auroraCyan,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iosBtn: {
    backgroundColor: '#1E2333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  webBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.35)',
  },
  btnIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    letterSpacing: 0.6,
  },
  btnMainTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#070A12',
    marginTop: 1,
  },
  btnTopLabelIos: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dark.textSecondary,
    letterSpacing: 0.6,
  },
  btnMainTitleIos: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  btnTopLabelWeb: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.6,
  },
  btnMainTitleWeb: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.auroraCyan,
    marginTop: 1,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  platformNoticeText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    maxWidth: 500,
    lineHeight: 16,
  },

  /* VOICE AUDITION */
  voiceShowcaseSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  voiceShowcaseDesktop: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sectionHeaderCol: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraCyan,
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 500,
    lineHeight: 17,
  },
  voiceCardsGrid: {
    gap: Spacing.sm,
  },
  voiceCardsGridDesktop: {
    flexDirection: 'row',
  },
  voiceDemoCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flex: 1,
  },
  voiceDemoCardActive: {
    borderColor: Palette.auroraCyan,
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
  },
  voiceDemoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  voiceIconRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  voiceCardTarget: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
  },
  voiceDemoQuote: {
    fontSize: 12,
    color: Palette.auroraCyan,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
    backgroundColor: 'rgba(0, 242, 254, 0.04)',
    padding: Spacing.xs,
    borderRadius: Radius.xs,
    lineHeight: 16,
  },

  /* FEATURES */
  featuresSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  featuresDesktop: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    width: '100%',
    flexGrow: 1,
    flexBasis: 240,
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  featureCardDesc: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    lineHeight: 17,
  },

  /* DOWNLOAD BANNER */
  downloadCenterCard: {
    backgroundColor: '#0A0F1D',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
    alignItems: 'center',
  },
  downloadCenterDesktop: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: Spacing.xl,
  },
  downloadCardHeadline: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
  },
  downloadCardSub: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  downloadButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  footerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 44,
  },
  footerApkBtn: {
    backgroundColor: Palette.auroraCyan,
  },
  footerApkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#070A12',
  },
  footerIosBtn: {
    backgroundColor: '#1E2333',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerIosText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerWebBtn: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  footerWebText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },

  /* FOOTER */
  footerRow: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  /* MODALS */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 13, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  appleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  instructionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  stepNumPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  instructionTextCol: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  instructionDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
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
    gap: 6,
    backgroundColor: Palette.auroraCyan,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#070A12',
  },

  /* ANDROID OPTION CARDS */
  androidOptionCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    marginBottom: Spacing.xs,
  },
  optionTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
    marginBottom: 4,
  },
  optionTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: Palette.auroraCyan,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    lineHeight: 16,
  },
  gitReleasesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  gitReleasesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.auroraCyan,
  },
});
