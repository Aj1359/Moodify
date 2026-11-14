import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function NavigationGate() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[1] === 'onboarding';

    if (!session) {
      // 1. No session -> Landing page is LOGIN ONLY.
      // Without login, no one can access onboarding or main tabs.
      if (segments[1] === 'signup') {
        return;
      }
      if (segments[1] !== 'login') {
        router.replace('/(auth)/login');
      }
    } else if (!profile) {
      // 2. Has session but hasn't completed onboarding -> redirect to onboarding
      if (!isOnboarding) {
        router.replace('/(auth)/onboarding');
      }
    } else {
      // 3. Authenticated & onboarded -> redirect to main tabs if in auth group
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4B72" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="(auth)">
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recommendations"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationGate />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0714',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
