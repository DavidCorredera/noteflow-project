import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

function TabIcon({ name }: { name: string; color: string; focused: boolean }) {
  const icons: Record<string, string> = {
    dashboard: '📊',
    notas: '📝',
    checklists: '✅',
    ideas: '💡',
    settings: '⚙️',
  };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22 }}>{icons[name] || '📄'}</Text>
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
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon name="dashboard" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notas"
        options={{
          title: 'Notas',
          tabBarIcon: ({ color, focused }) => <TabIcon name="notas" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: 'Tareas',
          tabBarIcon: ({ color, focused }) => <TabIcon name="checklists" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ideas"
        options={{
          title: 'Ideas',
          tabBarIcon: ({ color, focused }) => <TabIcon name="ideas" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => <TabIcon name="settings" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
