import { useEffect, useRef, useState } from 'react';
import { Stack, router } from 'expo-router';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';
import { useThemeStore } from '../store/themeStore';
import { useNotesStore } from '../store/notesStore';
import { useLocaleStore } from '../store/localeStore';
import { useAuthStore } from '../store/authStore';
import { useAccountStore } from '../store/accountStore';
import { getColors } from '../constants/theme';
import { t } from '../i18n';
import { Platform, View, ActivityIndicator, Animated, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { auth } from '../lib/firebase';
import { useToastStore } from '../store/toastStore';
import '../lib/notifications';

function useScreenOptions() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  return {
    headerTransparent: true,
    headerStyle: { backgroundColor: 'transparent' },
    headerTintColor: colors.primary,
    headerTitleStyle: { fontWeight: '700' as const },
    headerBackground: () => (
      Platform.OS === 'ios'
        ? <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={{ flex: 1 }} />
        : <View style={{ flex: 1, backgroundColor: 'transparent' }} />
    ),
  };
}

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 100, left: 20, right: 20,
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    alignItems: 'center', zIndex: 9999,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

const detailScreenOptions = Platform.select({
  ios: {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerBackTitle: ' ',
  },
  default: {},
});

export default function RootLayout() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const load = useThemeStore((s) => s.load);
  const loaded = useThemeStore((s) => s.loaded);
  const toastMsg = useToastStore((s) => s.message);
  const clearToast = useToastStore((s) => s.clearToast);
  const [visibleToast, setVisibleToast] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toastMsg) {
      setVisibleToast(toastMsg);
      clearToast();
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisibleToast(''));
    }
  }, [toastMsg]);
  const loadLocale = useLocaleStore((s) => s.load);
  const localeLoaded = useLocaleStore((s) => s.loaded);
  const locale = useLocaleStore((s) => s.locale);
  const screenOptions = useScreenOptions();
  const colors = getColors(isDarkMode);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const authInitialized = useAuthStore((s) => s.initialized);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const setLoading = useAuthStore((s) => s.setLoading);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const loadAccounts = useAccountStore((s) => s.loadAccounts);
  const accountsLoadedRef = useRef(false);

  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  useEffect(() => { load(); loadLocale(); }, []);

  useEffect(() => {
    if (loaded && localeLoaded) fetchNotes();
  }, [loaded, localeLoaded]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await loadProfile(fbUser.uid);
      }
      setLoading(false);
      if (!accountsLoadedRef.current) {
        accountsLoadedRef.current = true;
        setInitialized(true);
        loadAccounts();
      }
    });
    return unsubscribe;
  }, []);

  const signedOutRedirected = useRef(false);

  useEffect(() => {
    if (!user && authInitialized && !signedOutRedirected.current) {
      signedOutRedirected.current = true;
      const id = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(id);
    }
    if (user) {
      signedOutRedirected.current = false;
    }
  }, [user, authInitialized]);

  if (!loaded || !localeLoaded || !authInitialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider config={config} colorMode={isDarkMode ? 'dark' : 'light'}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="nueva-nota"
            options={{
              presentation: 'modal',
              title: t(locale, 'nuevaNota.title'),
              headerTransparent: false,
              headerStyle: { backgroundColor: colors.surface },
              contentStyle: { backgroundColor: colors.background },
              ...detailScreenOptions,
            }}
          />
          <Stack.Screen name="notas/[id]" options={detailScreenOptions} />
          <Stack.Screen name="checklists/[id]" options={detailScreenOptions} />
          <Stack.Screen name="ideas/[id]" options={detailScreenOptions} />
          <Stack.Screen name="terminos" options={{ title: t(locale, 'terminos.title'), headerTransparent: false, headerStyle: { backgroundColor: colors.background }, ...detailScreenOptions }} />
          <Stack.Screen name="privacidad" options={{ title: t(locale, 'privacidad.title'), headerTransparent: false, headerStyle: { backgroundColor: colors.background }, ...detailScreenOptions }} />
          <Stack.Screen name="feedback" options={{ title: t(locale, 'feedback.title'), headerTransparent: false, headerStyle: { backgroundColor: colors.background }, ...detailScreenOptions }} />
        </Stack>
      </GluestackUIProvider>
      {visibleToast !== '' && (
        <Animated.View style={[toastStyles.toast, { opacity: toastOpacity, backgroundColor: colors.primary }]}>
          <Text style={toastStyles.toastText}>{visibleToast}</Text>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}
