import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../constants/theme';

interface Props {
  title: string;
  colors: AppColors;
}

export default function ScreenHeader({ title, colors }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={[styles.brand, { color: colors.text }]}>NoteFlow</Text>
      <Text style={[styles.title, { color: colors.textTertiary + 'B0' }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
});
