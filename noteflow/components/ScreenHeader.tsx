import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../constants/theme';

interface Props {
  title: string;
  colors: AppColors;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function ScreenHeader({ title, colors, icon }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        {icon && <Ionicons name={icon} size={26} color={colors.text} style={styles.icon} />}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    marginBottom: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
