import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';
import { useThemeStore } from '../store/themeStore';
import { useNotesStore } from '../store/notesStore';
import { useLocaleStore } from '../store/localeStore';
import { getColors } from '../constants/theme';
import { t } from '../i18n';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const loadLocale = useLocaleStore((s) => s.load);
  const localeLoaded = useLocaleStore((s) => s.loaded);
  const locale = useLocaleStore((s) => s.locale);
  const screenOptions = useScreenOptions();
  const colors = getColors(isDarkMode);

  const fetchNotes = useNotesStore((s) => s.fetchNotes);

  useEffect(() => { load(); loadLocale(); }, []);

  useEffect(() => {
    if (loaded && localeLoaded) fetchNotes();
  }, [loaded, localeLoaded]);

  if (!loaded || !localeLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider config={config} colorMode={isDarkMode ? 'dark' : 'light'}>
        <Stack screenOptions={screenOptions}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
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
    </GestureHandlerRootView>
  );
}
