import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const theme = {
    ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: isDarkMode ? Colors.dark.primary : Colors.light.primary,
      background: isDarkMode ? Colors.dark.background : Colors.light.background,
      surface: isDarkMode ? Colors.dark.surface : Colors.light.surface,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* NUEVO: Declaramos la pantalla nueva-nota como un modal */}
        <Stack.Screen 
          name="nueva-nota" 
          options={{ 
            presentation: 'modal', 
            title: 'Nueva Entrada',
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.onSurface
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}