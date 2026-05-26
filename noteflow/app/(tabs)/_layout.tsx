import { Tabs } from 'expo-router';
import { View, Text, Platform, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

const TAB_ICONS: Record<string, { focused: string; unfocused: string }> = {
  dashboard: { focused: 'home', unfocused: 'home-outline' },
  notas: { focused: 'document-text', unfocused: 'document-text-outline' },
  checklists: { focused: 'checkbox', unfocused: 'checkbox-outline' },
  ideas: { focused: 'bulb', unfocused: 'bulb-outline' },
  settings: { focused: 'settings', unfocused: 'settings-outline' },
};

function TabIcon({ name, focused, color, bgColor }: { name: string; focused: boolean; color: string; bgColor: string }) {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const iconName = focused ? TAB_ICONS[name].focused : TAB_ICONS[name].unfocused;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0.85,
      friction: 5,
      tension: 180,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 44, height: 40 }}>
      {focused ? (
        <Animated.View style={{ position: 'absolute', width: 34, height: 28, borderRadius: 14, backgroundColor: bgColor + '20', transform: [{ scale }] }} />
      ) : null}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={iconName as any} size={focused ? 24 : 22} color={color} />
      </Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 16,
          left: Platform.OS === 'ios' ? 16 : 12,
          right: Platform.OS === 'ios' ? 16 : 12,
          borderRadius: 28,
          height: Platform.OS === 'ios' ? 60 : 56,
          paddingBottom: Platform.OS === 'ios' ? 4 : 8,
          paddingTop: 4,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          borderTopWidth: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={75} tint={isDarkMode ? 'dark' : 'light'} style={{ flex: 1, borderRadius: 28 }} />
            : <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 28 }} />
        ),
        tabBarLabelStyle: { fontSize: Platform.OS === 'ios' ? 10 : 11, fontWeight: '600', letterSpacing: 0.25, marginTop: -2 },
        tabBarShowLabel: true,
        tabBarIconStyle: { marginBottom: -1 },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Inicio', tabBarIcon: ({ focused, color }) => <TabIcon name="dashboard" focused={focused} color={color} bgColor={colors.primary} /> }} />
      <Tabs.Screen name="notas" options={{ title: 'Notas', tabBarIcon: ({ focused, color }) => <TabIcon name="notas" focused={focused} color={color} bgColor={colors.primary} /> }} />
      <Tabs.Screen name="checklists" options={{ title: 'Tareas', tabBarIcon: ({ focused, color }) => <TabIcon name="checklists" focused={focused} color={color} bgColor={colors.primary} /> }} />
      <Tabs.Screen name="ideas" options={{ title: 'Ideas', tabBarIcon: ({ focused, color }) => <TabIcon name="ideas" focused={focused} color={color} bgColor={colors.primary} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: ({ focused, color }) => <TabIcon name="settings" focused={focused} color={color} bgColor={colors.primary} /> }} />
    </Tabs>
  );
}
