import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import LanguagePicker from '../../src/components/LanguagePicker';
import GenrePicker from '../../src/components/GenrePicker';

export default function OnboardingScreen() {
  const router = useRouter();
  const { savePreferences, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [name, setName] = useState('');
  const [preferredLanguages, setPreferredLanguages] = useState<('Hindi' | 'English')[]>(['Hindi', 'English']);
  const [genres, setGenres] = useState<string[]>(['Bollywood', 'Indie Pop', 'Lo-Fi']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your name or nickname.');
      return;
    }

    if (preferredLanguages.length === 0) {
      setErrorMsg('Please select at least one preferred language.');
      return;
    }

    if (genres.length === 0) {
      setErrorMsg('Please pick at least one favorite genre.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await savePreferences({
        name: name.trim(),
        preferredLanguages,
        genres,
      });
      // Navigation gate in _layout.tsx will see updated profile and transition to /(tabs)
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Ambient background glow orbs */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        {/* Top Navbar / Stepper Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandGroup}>
            <Text style={styles.brandIcon}>🎵</Text>
            <Text style={styles.brandTitle}>Moodify</Text>
          </View>

          {/* Stepper */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepDone}>
              <View style={styles.stepDoneBadge}>
                <Text style={styles.stepDoneCheck}>✓</Text>
              </View>
              <Text style={styles.stepDoneLabel}>Account</Text>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepActive}>
              <View style={styles.stepActiveBadge}>
                <Text style={styles.stepActiveNumber}>2</Text>
              </View>
              <Text style={styles.stepActiveLabel}>Your Taste</Text>
            </View>
          </View>
        </View>

        {/* Content Layout: Split on Desktop, Single Column on Mobile */}
        <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>
          
          {/* Left Decorative & Perks Panel (Desktop) */}
          {isDesktop && (
            <View style={styles.leftPerksPanel}>
              {/* Headphones Visual Graphic */}
              <View style={styles.headphoneGraphicWrapper}>
                <View style={styles.headphoneRingOuter}>
                  <View style={styles.headphoneRingInner}>
                    <Text style={styles.headphoneEmoji}>🎧</Text>
                  </View>
                </View>
                {/* Floating Equalizer Bars */}
                <View style={styles.equalizerBadge}>
                  <View style={[styles.eqBar, { height: 14 }]} />
                  <View style={[styles.eqBar, { height: 22 }]} />
                  <View style={[styles.eqBar, { height: 10 }]} />
                  <View style={[styles.eqBar, { height: 18 }]} />
                </View>
              </View>

              {/* Headline with Green Highlight */}
              <View style={styles.perksHeadlineWrapper}>
                <Text style={styles.perksHeadline}>
                  Make It <Text style={styles.perksHeadlineAccent}>Yours</Text>
                </Text>
                <View style={styles.headlineUnderline} />
              </View>

              {/* 3 Value Props */}
              <View style={styles.perksList}>
                <View style={styles.perkItem}>
                  <View style={styles.perkIconBox}>
                    <Text style={styles.perkIconText}>🎚️</Text>
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Personalized Picks</Text>
                    <Text style={styles.perkSubtitle}>Music that fits your mood & taste</Text>
                  </View>
                </View>

                <View style={styles.perkItem}>
                  <View style={styles.perkIconBox}>
                    <Text style={styles.perkIconText}>💚</Text>
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Learns Your Vibe</Text>
                    <Text style={styles.perkSubtitle}>Gets better with your likes & skips</Text>
                  </View>
                </View>

                <View style={styles.perkItem}>
                  <View style={styles.perkIconBox}>
                    <Text style={styles.perkIconText}>⚡</Text>
                  </View>
                  <View style={styles.perkTextBox}>
                    <Text style={styles.perkTitle}>Your Music, Your Way</Text>
                    <Text style={styles.perkSubtitle}>Hindi, English and more</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Right / Main Form Card */}
          <View style={[styles.formCard, isDesktop && styles.desktopFormCard]}>
            {/* Step 2 Subtitle */}
            <View style={styles.formHeader}>
              {!isDesktop && (
                <View style={styles.mobileHeadphoneCenter}>
                  <Text style={styles.mobileHeadphoneIcon}>🎧</Text>
                </View>
              )}
              <Text style={styles.stepOfStep}>STEP 2 OF 2</Text>
              <Text style={styles.cardTitle}>Tune Your Taste 🎧</Text>
              <Text style={styles.cardSubtitle}>
                Tell us how you like your music so Moodify can tailor recommendations to your vibe.
              </Text>
            </View>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}

            {/* Field: Name / Nickname */}
            <View style={styles.inputFieldGroup}>
              <Text style={styles.inputLabel}>Your Name / Nickname</Text>
              <View style={styles.nameInputContainer}>
                <Text style={styles.nameInputIcon}>👤</Text>
                <TextInput
                  style={styles.nameTextInput}
                  placeholder="e.g. Rahul, Tanya"
                  placeholderTextColor="#716B87"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    setErrorMsg(null);
                  }}
                />
              </View>
            </View>

            {/* Preferred Languages */}
            <LanguagePicker
              selectedLanguages={preferredLanguages}
              onChange={setPreferredLanguages}
            />

            {/* Favorite Genres */}
            <GenrePicker
              selectedGenres={genres}
              onChange={setGenres}
            />

            {/* Vibrant Emerald Pill CTA Button */}
            <Pressable
              style={[styles.ctaButton, loading && styles.ctaDisabled]}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0714" />
              ) : (
                <Text style={styles.ctaButtonText}>Get Started 🚀 →</Text>
              )}
            </Pressable>

            {/* Sign Out subaction */}
            <Pressable style={styles.signOutBtn} onPress={signOut}>
              <Text style={styles.signOutText}>Sign Out & Use Different Account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090712',
    position: 'relative',
  },
  glowTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    ...(Platform.OS === 'web' && {
      filter: 'blur(90px)',
      pointerEvents: 'none',
    } as any),
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(34, 197, 94, 0.09)',
    ...(Platform.OS === 'web' && {
      filter: 'blur(100px)',
      pointerEvents: 'none',
    } as any),
  },
  scrollWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: 1080,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDoneBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1E3E2B',
    borderWidth: 1.5,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepDoneCheck: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '900',
  },
  stepDoneLabel: {
    color: '#D4CEE8',
    fontSize: 13,
    fontWeight: '600',
  },
  stepDivider: {
    width: 32,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 10,
  },
  stepActive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActiveBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  stepActiveNumber: {
    color: '#0A0714',
    fontSize: 11,
    fontWeight: '900',
  },
  stepActiveLabel: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
  },
  mainLayout: {
    width: '100%',
    maxWidth: 1080,
  },
  desktopLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    marginTop: 8,
  },

  // Left Perks Panel (Desktop)
  leftPerksPanel: {
    flex: 0.95,
    paddingRight: 20,
  },
  headphoneGraphicWrapper: {
    position: 'relative',
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  headphoneRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headphoneRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#120F24',
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headphoneEmoji: {
    fontSize: 44,
  },
  equalizerBadge: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    backgroundColor: '#1C1536',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  eqBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#A78BFA',
  },
  perksHeadlineWrapper: {
    marginBottom: 28,
  },
  perksHeadline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  perksHeadlineAccent: {
    color: '#22C55E',
  },
  headlineUnderline: {
    width: 72,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22C55E',
    marginTop: 6,
  },
  perksList: {
    gap: 20,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#151128',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  perkIconText: {
    fontSize: 20,
  },
  perkTextBox: {
    flex: 1,
  },
  perkTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  perkSubtitle: {
    color: '#8E85A8',
    fontSize: 13,
    lineHeight: 18,
  },

  // Main Form Card (Glassmorphic)
  formCard: {
    width: '100%',
    backgroundColor: 'rgba(19, 15, 36, 0.85)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 6,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(34, 197, 94, 0.1)',
    } as any),
  },
  desktopFormCard: {
    flex: 1.05,
    padding: 34,
  },
  formHeader: {
    marginBottom: 16,
  },
  mobileHeadphoneCenter: {
    alignItems: 'center',
    marginBottom: 8,
  },
  mobileHeadphoneIcon: {
    fontSize: 32,
  },
  stepOfStep: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9E94B8',
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#3F1626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#991B1B',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '600',
  },
  inputFieldGroup: {
    marginVertical: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4CEE8',
    marginBottom: 8,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16132A',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2B2648',
    paddingHorizontal: 16,
    height: 48,
  },
  nameInputIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  nameTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  ctaButton: {
    backgroundColor: '#22C55E',
    borderRadius: 24,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 5,
    ...(Platform.OS === 'web' && {
      backgroundImage: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      boxShadow: '0 8px 24px rgba(34, 197, 94, 0.4)',
      cursor: 'pointer',
      transition: 'transform 0.15s ease',
    } as any),
  },
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#082512',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signOutBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 4,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    } as any),
  },
  signOutText: {
    color: '#7E7696',
    fontSize: 13,
    fontWeight: '500',
  },
});
