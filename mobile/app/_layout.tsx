import 'react-native-gesture-handler';
import '../global.css';

import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast from 'react-native-toast-message';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { ThemeProvider } from '@components/theme';
import { QuickAddTransaction } from '@components/QuickAddTransaction';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { useAuthStore } from '@/shared/store/authStore';
import { getProfile } from '@/shared/lib/profile';
import { supabase } from '@/shared/lib/supabase';

/**
 * Drives the imperative redirect logic that keeps the visible route in sync with
 * auth + onboarding state. Lives inside the navigator so it can use the router
 * hooks; renders the `Stack` (and nothing else) once auth has initialized.
 *
 * Rules (from the agreed gating spec):
 *  - `!initialized`                          → render nothing (no flash of the wrong route)
 *  - `!user` & not in (auth)                 → send to /login
 *  - `user` & !onboarded & not on onboarding → send to /onboarding
 *  - `user` & onboarded & in (auth)          → send to / (the app)
 */
function RootNavigation() {
  const initialized = useAuthStore((s) => s.initialized);
  const user = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router = useRouter();

  // `(auth)` is a pathless group, so it is the first segment for /login,
  // /register and /onboarding. `onboarding` is the leaf within that group.
  const inAuthGroup = segments[0] === '(auth)';
  // `segments` is a typed-routes union under `experiments.typedRoutes`, so a bare
  // `.includes('onboarding')` is rejected (literal not in the element union).
  // Widen to string[] for the membership check.
  const onOnboarding = (segments as string[]).includes('onboarding');
  const onboarded = getProfile(user).onboarded;

  React.useEffect(() => {
    if (!initialized) return;

    if (!user) {
      // Signed out: the auth group is the only place we allow.
      if (!inAuthGroup) router.replace('/login');
      return;
    }

    // Signed in but profile setup is unfinished → force onboarding.
    if (!onboarded) {
      if (!onOnboarding) router.replace('/onboarding');
      return;
    }

    // Fully set up: bounce out of any auth screen into the app.
    if (inAuthGroup) router.replace('/');
  }, [initialized, user, onboarded, inAuthGroup, onOnboarding, router]);

  // Hold the first paint until we know who the user is, so the navigator never
  // mounts the wrong group first and then visibly redirects.
  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  React.useEffect(() => {
    // Hydrate the auth session and attach the onAuthStateChange listener.
    void useAuthStore.getState().initialize();

    // Supabase token auto-refresh is tied to foreground state on native: refresh
    // while the app is active, pause in the background to save work/battery.
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    // Apply the correct state immediately — AppState.currentState is synchronous.
    onAppStateChange(AppState.currentState);
    const sub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      sub.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  // Gate on fonts so no text paints in a fallback face before Kumbh Sans loads.
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <RootNavigation />
            {/* Global overlays — siblings above the navigator so they float over
                every route. Toast is mounted last to stay on the top layer. */}
            <QuickAddTransaction />
            <ConfirmDialog />
            <Toast />
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
