import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';

export default function PrivacidadScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'privacidad.p1')}
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t(locale, 'privacidad.h1')}</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'privacidad.p2')}
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t(locale, 'privacidad.h2')}</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'privacidad.p3')}
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t(locale, 'privacidad.h3')}</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'privacidad.p4')}
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>{t(locale, 'privacidad.h4')}</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        {t(locale, 'privacidad.p5')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, paddingTop: Platform.OS === 'ios' ? 10 : 32 },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});
