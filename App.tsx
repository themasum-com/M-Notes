import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  useColorScheme,
  AppState,
  AppStateStatus,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ScreenCapture from 'expo-screen-capture';
import { LightTheme, DarkTheme } from './src/constants/theme';
import { LockScreen } from './src/components/LockScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';

export default function App() {
  const systemColorScheme = useColorScheme();
  const theme = systemColorScheme === 'dark' ? DarkTheme : LightTheme;

  // Security Lock State: Starts locked on app open
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [hasUnlockedOnce, setHasUnlockedOnce] = useState<boolean>(false);

  // Navigation State: 'home' | 'editor'
  const [currentScreen, setCurrentScreen] = useState<'home' | 'editor'>('home');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [initialFolderId, setInitialFolderId] = useState<string>('general');

  const appStateRef = useRef<AppStateStatus>((AppState.currentState as AppStateStatus) || 'active');

  useEffect(() => {
    // Enable Android FLAG_SECURE window privacy protection immediately
    ScreenCapture.preventScreenCaptureAsync().catch(() => {});

    // Listen for app backgrounding/resuming to lock immediately
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is being minimized or switched away: lock immediately to prevent task switcher leaks!
        setIsLocked(true);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleOpenNote = (noteId: string | null, folderId: string = 'general') => {
    setActiveNoteId(noteId);
    setInitialFolderId(folderId);
    setCurrentScreen('editor');
  };

  const handleBackToHome = () => {
    setActiveNoteId(null);
    setCurrentScreen('home');
  };

  const handleLockNow = () => {
    setIsLocked(true);
  };

  const handleUnlock = () => {
    setHasUnlockedOnce(true);
    setIsLocked(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Main App Screens - only rendered once unlocked to ensure notes are not decrypted prematurely */}
      {hasUnlockedOnce ? (
        currentScreen === 'home' ? (
          <HomeScreen
            theme={theme}
            onOpenNote={handleOpenNote}
            onLockApp={handleLockNow}
          />
        ) : (
          <EditorScreen
            noteId={activeNoteId}
            initialFolderId={initialFolderId}
            theme={theme}
            onBack={handleBackToHome}
          />
        )
      ) : null}

      {/* Privacy Shield & Biometric Lock Overlay */}
      {isLocked ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen theme={theme} onUnlock={handleUnlock} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
