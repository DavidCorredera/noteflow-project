import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import { Platform, View } from 'react-native';
import { BlurView } from 'expo-blur';

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
        : <View style={{ flex: 1, backgroundColor: colors.surface }} />
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
  const screenOptions = useScreenOptions();
  const colors = getColors(isDarkMode);

  useEffect(() => { load(); }, []);

  if (!loaded) return null;

  return (
    <GluestackUIProvider config={config} colorMode={isDarkMode ? 'dark' : 'light'}>
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="nueva-nota"
          options={{
            presentation: 'modal',
            title: 'Nueva Entrada',
            headerTransparent: false,
            headerStyle: { backgroundColor: colors.surface },
            contentStyle: { backgroundColor: colors.background },
            ...detailScreenOptions,
          }}
        />
        <Stack.Screen name="notas/[id]" options={detailScreenOptions} />
        <Stack.Screen name="checklists/[id]" options={detailScreenOptions} />
        <Stack.Screen name="ideas/[id]" options={detailScreenOptions} />
        <Stack.Screen name="terminos" options={{ title: 'Terminos y condiciones', ...detailScreenOptions }} />
        <Stack.Screen name="privacidad" options={{ title: 'Privacidad', ...detailScreenOptions }} />
        <Stack.Screen name="feedback" options={{ title: 'Enviar feedback', ...detailScreenOptions }} />
      </Stack>
    </GluestackUIProvider>
  );
}
