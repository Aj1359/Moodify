import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { THEME } from '../../src/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={[styles.mainCard, isDesktop ? styles.desktopCard : styles.mobileCard]}>
          
          {/* Left Form Panel */}
          <View style={[styles.formPanel, isDesktop && styles.desktopFormPanel]}>
            {/* Mobile Header Logo (shown on mobile, or top of form) */}
            <View style={styles.logoContainer}>
              <View style={styles.logoOrb}>
                <Text style={styles.logoNote}>🎵</Text>
              </View>
              <Text style={styles.brandTitle}>Moodify</Text>
              <Text style={styles.brandTagline}>Feel it. Express it. Play it.</Text>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.welcomeTitle}>
                {isDesktop ? 'Hello there.' : 'Login to Your Account'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                {isDesktop ? 'Welcome back to your personalized soundscape.' : 'Enter your credentials to continue.'}
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {/* Email Field with Left Icon */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                placeholderTextColor={THEME.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setErrorMsg(null);
                }}
              />
            </View>

            {/* Password Field with Left Icon and Right Eye Toggle */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setErrorMsg(null);
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
              </Pressable>
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={styles.optionsRow}>
              <Pressable
                style={styles.rememberMeRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>

              <Pressable onPress={() => setErrorMsg('Password reset link will be sent to your email.')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Gradient Login CTA */}
            <Pressable
              style={[styles.gradientBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.gradientBtnText}>Log In</Text>
              )}
            </Pressable>

            {/* Footer with Sign Up link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerPrompt}>Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text style={styles.signupHighlight}>Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Right Visual Panel (Visible on Desktop like Image 2) */}
          {isDesktop && (
            <View style={styles.visualPanel}>
              <View style={styles.visualOrbGlow} />
              
              <View style={styles.visualBadge}>
                <Text style={styles.visualBadgeIcon}>🎧</Text>
              </View>

              <View style={styles.visualContent}>
                <Text style={styles.visualPretitle}>AI-POWERED RECOMMENDATIONS</Text>
                <Text style={styles.visualHeadline}>
                  Turn how you feel into music you love.
                </Text>
                <Text style={styles.visualDescription}>
                  Express your emotions in English, Hindi, or Hinglish. We analyze your vibe and curate the perfect tracks in seconds.
                </Text>
              </View>

              <Text style={styles.copyrightText}>
                © 2026 Moodify Inc. All Rights Reserved.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.bgDark,
  },
  scrollWrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  mainCard: {
    backgroundColor: THEME.colors.bgCard,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 8,
  },
  mobileCard: {
    width: '100%',
    maxWidth: 440,
    padding: 24,
    paddingVertical: 32,
  },
  desktopCard: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 960,
    minHeight: 580,
  },
  formPanel: {
    justifyContent: 'center',
  },
  desktopFormPanel: {
    flex: 1,
    padding: 44,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoOrb: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.colors.accentPink,
    marginBottom: 10,
    shadowColor: THEME.colors.accentPink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 6,
    ...(Platform.OS === 'web' && {
      backgroundImage: 'linear-gradient(135deg, #FF4B72 0%, #8B5CF6 100%)',
      boxShadow: '0 8px 24px rgba(255, 75, 114, 0.4)',
    } as any),
  },
  logoNote: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: '500',
    color: THEME.colors.accentPink,
    marginTop: 2,
  },
  formHeader: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: THEME.colors.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.errorBorder,
  },
  errorText: {
    color: THEME.colors.errorText,
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.bgInput,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: 18,
    height: 52,
    marginBottom: 14,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: THEME.colors.accentPink,
    borderColor: THEME.colors.accentPink,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  rememberText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  forgotText: {
    color: THEME.colors.accentPink,
    fontSize: 13,
    fontWeight: '600',
  },
  gradientBtn: {
    backgroundColor: THEME.colors.accentPink,
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.accentPink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 5,
    ...(Platform.OS === 'web' && {
      backgroundImage: 'linear-gradient(135deg, #FF4B72 0%, #8B5CF6 100%)',
      boxShadow: '0 8px 24px rgba(255, 75, 114, 0.35)',
      cursor: 'pointer',
      transition: 'transform 0.15s ease',
    } as any),
  },
  btnDisabled: {
    opacity: 0.6,
  },
  gradientBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  footerPrompt: {
    color: THEME.colors.textMuted,
    fontSize: 14,
  },
  signupHighlight: {
    color: THEME.colors.accentPink,
    fontSize: 14,
    fontWeight: '700',
  },

  // Desktop Visual Panel
  visualPanel: {
    flex: 1.1,
    backgroundColor: '#0F0B1E',
    borderLeftWidth: 1,
    borderLeftColor: THEME.colors.border,
    padding: 44,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  visualOrbGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255, 75, 114, 0.15)',
    ...(Platform.OS === 'web' && {
      filter: 'blur(80px)',
    } as any),
  },
  visualBadge: {
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  visualBadgeIcon: {
    fontSize: 22,
  },
  visualContent: {
    marginVertical: 'auto',
  },
  visualPretitle: {
    color: THEME.colors.accentPink,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  visualHeadline: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    lineHeight: 40,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  visualDescription: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 380,
  },
  copyrightText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
});
