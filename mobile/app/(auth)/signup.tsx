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

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await signUp(email.trim(), password);
      // Auto login so onboarding opens
      await signIn(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        <View style={[styles.mainCard, isDesktop ? styles.desktopCard : styles.mobileCard]}>
          
          {/* Form Panel */}
          <View style={[styles.formPanel, isDesktop && styles.desktopFormPanel]}>
            {/* Header Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoOrb}>
                <Text style={styles.logoNote}>🎵</Text>
              </View>
              <Text style={styles.brandTitle}>Moodify</Text>
              <Text style={styles.brandTagline}>Feel it. Express it. Play it.</Text>
            </View>

            <View style={styles.formHeader}>
              <Text style={styles.welcomeTitle}>
                {isDesktop ? 'Create your account.' : 'Join Moodify'}
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Unlock personalized playlists curated from how you feel.
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {/* Email Field */}
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

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Create password (min 6 characters)"
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

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputIcon}>🛡️</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm your password"
                placeholderTextColor={THEME.colors.textMuted}
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setErrorMsg(null);
                }}
              />
            </View>

            {/* Terms Agreement Checkbox */}
            <View style={styles.termsRow}>
              <Pressable
                style={styles.checkboxWrapper}
                onPress={() => setAgreeTerms(!agreeTerms)}
              >
                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                  {agreeTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the Terms of Service & Privacy Policy
                </Text>
              </Pressable>
            </View>

            {/* Gradient CTA */}
            <Pressable
              style={[styles.gradientBtn, loading && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.gradientBtnText}>Create Account</Text>
              )}
            </Pressable>

            {/* Footer with Login link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerPrompt}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.signupHighlight}>Log In</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Right Visual Panel (Visible on Desktop) */}
          {isDesktop && (
            <View style={styles.visualPanel}>
              <View style={styles.visualOrbGlow} />
              
              <View style={styles.visualBadge}>
                <Text style={styles.visualBadgeIcon}>✨</Text>
              </View>

              <View style={styles.visualContent}>
                <Text style={styles.visualPretitle}>DISCOVER YOUR SOUND</Text>
                <Text style={styles.visualHeadline}>
                  No menus. No playlists.<br />Just how you feel.
                </Text>
                <Text style={styles.visualDescription}>
                  Whether you are stressed before an exam, buzzing from an achievement, or taking a late-night drive, Moodify finds the songs that speak your vibe.
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
    minHeight: 600,
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
    marginBottom: 22,
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
    marginBottom: 12,
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
  termsRow: {
    marginVertical: 10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  checkboxWrapper: {
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
  termsText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    flex: 1,
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
    marginTop: 20,
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
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
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
    color: THEME.colors.accentPurple,
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
    marginBottom: 20,
    maxWidth: 380,
  },
  copyrightText: {
    fontSize: 12,
    color: THEME.colors.textMuted,
  },
});
