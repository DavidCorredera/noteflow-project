import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '../gluestack-ui.config';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';

export default function RootLayout() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const load = useThemeStore((s) => s.load);
  const loaded = useThemeStore((s) => s.loaded);
  const colors = getColors(isDarkMode);

  useEffect(() => { load(); }, []);

  if (!loaded) return null;

  return (
    <GluestackUIProvider config={config} colorMode={isDarkMode ? 'dark' : 'light'}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="nueva-nota"
          options={{
            presentation: 'modal',
            title: 'Nueva Entrada',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
      </Stack>
    </GluestackUIProvider>
  );
}
