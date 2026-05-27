import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';

export default function TerminosScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'terminos.p1')}
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'terminos.p2')}
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'terminos.p3')}
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'terminos.p4')}
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'terminos.p5')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, paddingTop: Platform.OS === 'ios' ? 10 : 92 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});
