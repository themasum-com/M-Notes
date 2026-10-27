import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandLogo } from './BrandLogo';
import { AppTheme } from '../constants/theme';
import { securityService } from '../services/SecurityService';

interface LockScreenProps {
  theme: AppTheme;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ theme, onUnlock }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const attemptUnlock = useCallback(async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const result = await securityService.authenticate('Unlock M Notes');
      if (result.success) {
        onUnlock();
      } else {
        setErrorMessage(result.error || 'Authentication required to access notes.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [isAuthenticating, onUnlock]);

  useEffect(() => {
    // Attempt biometric prompt automatically on display
    const timer = setTimeout(() => {
      attemptUnlock();
    }, 250);
    return () => clearTimeout(timer);
  }, [attemptUnlock]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Logo & Glow Container */}
        <View style={styles.logoWrapper}>
          <View style={[styles.glowRing, { backgroundColor: theme.colors.lockGlow }]}>
            <BrandLogo size="xl" />
          </View>
        </View>

        {/* Brand Title */}
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>M Notes</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Private • Offline • AES-256-GCM
        </Text>

        {/* Security Feature Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSubtle }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.brandOrange} />
            <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
              Sandboxed Storage
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceSubtle }]}>
            <Ionicons name="key-outline" size={14} color={theme.colors.brandOrange} />
            <Text style={[styles.badgeText, { color: theme.colors.textSecondary }]}>
              Hardware Keystore
            </Text>
          </View>
        </View>

        {/* Error Feedback */}
        {errorMessage ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.colors.dangerLight }]}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.unlockButton, { backgroundColor: theme.colors.textPrimary }]}
          onPress={attemptUnlock}
          activeOpacity={0.85}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color={theme.isDark ? '#191919' : '#FFFFFF'} />
          ) : (
            <>
              <Ionicons
                name="finger-print-outline"
                size={20}
                color={theme.isDark ? '#191919' : '#FFFFFF'}
                style={styles.buttonIcon}
              />
              <Text
                style={[
                  styles.buttonText,
                  { color: theme.isDark ? '#191919' : '#FFFFFF' },
                ]}
              >
                Tap to Unlock
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.footerNote, { color: theme.colors.textMuted }]}>
          Protected by Biometric or Device Passcode
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 4 : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  glowRing: {
    padding: 16,
    borderRadius: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 20,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    minWidth: 200,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default LockScreen;
