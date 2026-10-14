import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeDatabase } from '@/services/db/database';
import { NotificationService } from '@/services/notifications/notificationService';
import { ProfileRepo } from '@/services/db/profileRepo';
import {
  AlarmMonitorService,
  AlarmTriggerPayload,
} from '@/services/alarm/alarmMonitorService';
import { ActiveAlarmModal } from '@/components/ActiveAlarmModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Colors, Palette } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeAlert, setActiveAlert] = useState<AlarmTriggerPayload | null>(null);

  useEffect(() => {
    let unsubscribeAlarmListener: (() => void) | null = null;

    async function prepare() {
      try {
        await initializeDatabase();
        await NotificationService.requestPermissions();

        // Check if onboarding is completed
        const profile = await ProfileRepo.getUserProfile();
        if (!profile.onboardingCompleted) {
          setShowOnboarding(true);
        }

        // Start live background time monitoring
        AlarmMonitorService.startMonitoring();

        // Listen for alarm triggers across the entire application
        unsubscribeAlarmListener = AlarmMonitorService.addListener((payload) => {
          setActiveAlert(payload);
        });
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();

    return () => {
      unsubscribeAlarmListener?.();
      AlarmMonitorService.stopMonitoring();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashFallback}>
        <ActivityIndicator size="large" color={Palette.auroraCyan} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.dark.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      {/* Global Active Alarm Modal (Continuous Repeating Voice Loop & Snooze) */}
      {activeAlert && (
        <ActiveAlarmModal
          visible={!!activeAlert}
          alarmTitle={activeAlert.title}
          alarmTime={activeAlert.time}
          voiceText={activeAlert.voiceText}
          alarmType={activeAlert.alarmType}
          onClose={() => {
            AlarmMonitorService.dismissActiveAlert(activeAlert.id);
            setActiveAlert(null);
          }}
          onAwake={() => {
            AlarmMonitorService.dismissActiveAlert(activeAlert.id);
            setActiveAlert(null);
          }}
          onSnooze={(snoozeMinutes) => {
            AlarmMonitorService.snoozeActiveAlert(activeAlert, snoozeMinutes);
            setActiveAlert(null);
          }}
        />
      )}

      {/* Seamless 3-Step Onboarding Modal for First Time Experience */}
      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => {
          setShowOnboarding(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  splashFallback: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
