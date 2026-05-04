import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Combinamos el tema base de Paper con nuestros colores personalizados
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
        {/* Aquí le decimos a Expo Router que la ruta (tabs) no debe mostrar el header por defecto */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Más adelante añadiremos aquí las modales, como la de nueva nota */}
      </Stack>
    </PaperProvider>
  );
}