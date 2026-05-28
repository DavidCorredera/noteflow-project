import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../lib/firebase';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { getColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const login = useAuthStore((s) => s.login);
  const locale = useLocaleStore((s) => s.locale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t(locale, 'common.error'), t(locale, 'common.fillFields'));
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      await useAccountStore.getState().saveCurrentAccountCredentials(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      const code = e?.code || '';
      const errorMap: Record<string, string> = {
        'auth/invalid-credential': 'auth.invalidCredential',
        'auth/wrong-password': 'auth.invalidPassword',
        'auth/user-not-found': 'auth.userNotFound',
        'auth/invalid-email': 'auth.invalidEmail',
        'auth/too-many-requests': 'auth.tooManyRequests',
      };
      Alert.alert(t(locale, 'common.error'), t(locale, errorMap[code] || 'auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t(locale, 'common.error'), t(locale, 'auth.enterEmail'));
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email.trim());
      Alert.alert(t(locale, 'auth.emailSent'), t(locale, 'auth.emailSentMsg'));
    } catch (e: any) {
      Alert.alert(t(locale, 'common.error'), e.message || t(locale, 'auth.sendEmailError'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 60 }]}>
        <Ionicons name="document-text" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.text }]}>NoteFlow</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t(locale, 'auth.loginSubtitle')}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder={t(locale, 'common.email')}
          placeholderTextColor={colors.textTertiary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder={t(locale, 'common.password')}
          placeholderTextColor={colors.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
          <Text style={[styles.forgotText, { color: colors.primary }]}>{t(locale, 'auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t(locale, 'auth.loginButton')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/register')} style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>{t(locale, 'auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, alignItems: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 32 },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  forgotLink: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 8 },
  forgotText: { fontSize: 13, fontWeight: '500' },
  link: { marginTop: 20 },
  linkText: { fontSize: 14 },
});
