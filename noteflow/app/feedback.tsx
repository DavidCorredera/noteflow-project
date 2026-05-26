import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';

export default function FeedbackScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    Alert.alert('Enviado', 'Gracias por tu feedback. Nos ayuda a mejorar.', [{ text: 'OK', onPress: () => router.back() }]);
    setSent(true);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.title, { color: colors.text }]}>Enviar feedback</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Tus sugerencias, ideas o reportes de errores son bienvenidos.
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
        value={message}
        onChangeText={setMessage}
        placeholder="Escribe tu mensaje..."
        placeholderTextColor={colors.textSecondary}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={[styles.sendButton, { backgroundColor: colors.primary, opacity: message.trim() ? 1 : 0.5 }]}
        onPress={handleSend}
        disabled={!message.trim()}
      >
        <Text style={styles.sendButtonText}>Enviar feedback</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, minHeight: 180, marginBottom: 20,
  },
  sendButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  sendButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
