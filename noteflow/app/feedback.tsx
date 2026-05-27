import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';

export default function FeedbackScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    Alert.alert(t(locale, 'feedback.sentTitle'), t(locale, 'feedback.sentMsg'), [{ text: t(locale, 'feedback.ok'), onPress: () => router.back() }]);
    setSent(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t(locale, 'feedback.subtitle')}
      </Text>
      <TextInput autoCapitalize="none" autoCorrect={false}
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={message}
        onChangeText={setMessage}
        placeholder={t(locale, 'feedback.placeholder')}
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: colors.primary, opacity: message.trim() ? 1 : 0.5 }]}
        onPress={handleSend}
        disabled={!message.trim()}
      >
        <Text style={styles.sendButtonText}>{t(locale, 'feedback.send')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, paddingTop: 32 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, minHeight: 180, marginBottom: 20,
  },
  sendButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  sendButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
