import { useState } from 'react';
import { View, Text, TextInput, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useNotesStore } from '../../store/notesStore';
import { useLocaleStore } from '../../store/localeStore';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { t } from '../../i18n';
import { getColors, AppColors } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../../lib/upload';

function SettingsItem({ icon, title, subtitle, onPress, danger, right, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode; colors: AppColors }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingsItem} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.settingsItemIcon}>
        <Ionicons name={icon} size={20} color={danger ? '#f87171' : colors.primary} />
      </View>
      <View style={styles.settingsItemLeft}>
        <Text style={[danger ? { color: '#f87171' } : { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right || (onPress ? <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text> : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const sortBy = useThemeStore((s) => s.sortBy);
  const notifications = useThemeStore((s) => s.notifications);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setSortBy = useThemeStore((s) => s.setSortBy);
  const toggleNotifications = useThemeStore((s) => s.toggleNotifications);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const notes = useNotesStore((s) => s.notes);
  const checklists = useNotesStore((s) => s.checklists);
  const ideas = useNotesStore((s) => s.ideas);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const accounts = useAccountStore((s) => s.accounts);
  const activeEmail = useAccountStore((s) => s.activeEmail);
  const switchToAccount = useAccountStore((s) => s.switchToAccount);
  const addAccount = useAccountStore((s) => s.addAccount);
  const removeAccount = useAccountStore((s) => s.removeAccount);
  const updateAccountProfile = useAccountStore((s) => s.updateAccountProfile);
  const colors = getColors(isDarkMode);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [addAccountVisible, setAddAccountVisible] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);


  const handleAvatarPress = () => {
    Alert.alert(t(locale, 'settings.changePhoto'), '', [
      {
        text: t(locale, 'common.gallery'),
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled && result.assets[0]) {
            const url = await uploadImage(result.assets[0].uri);
            await updateProfile({ avatarUrl: url });
            if (user?.email) await updateAccountProfile(user.email, { avatarUrl: url });
          }
        },
      },
      {
        text: t(locale, 'common.camera'),
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert(t(locale, 'common.cameraPermission')); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
          if (!result.canceled && result.assets[0]) {
            const url = await uploadImage(result.assets[0].uri);
            await updateProfile({ avatarUrl: url });
            if (user?.email) await updateAccountProfile(user.email, { avatarUrl: url });
          }
        },
      },
      { text: t(locale, 'common.cancel'), style: 'cancel' },
    ]);
  };

  const handleAddAccount = async () => {
    if (!addEmail.trim() || !addPassword.trim()) {
      Alert.alert(t(locale, 'common.error'), t(locale, 'common.fillFields'));
      return;
    }
    setAddLoading(true);
    try {
      await addAccount(addEmail.trim(), addPassword);
      setAddAccountVisible(false);
      setAddEmail('');
      setAddPassword('');
      setAccountModalVisible(false);
    } catch (e: any) {
      const knownErrors: Record<string, string> = {
        'Máximo de 5 cuentas permitidas': 'settings.maxAccounts',
        'Esta cuenta ya está añadida': 'settings.accountAlreadyAdded',
        'Esta cuenta ya existe. Verifica la contraseña.': 'settings.accountExists',
        'Maximum of 5 accounts allowed': 'settings.maxAccounts',
        'This account is already added': 'settings.accountAlreadyAdded',
        'This account already exists. Check the password.': 'settings.accountExists',
      };
      Alert.alert(t(locale, 'common.error'), knownErrors[e.message] ? t(locale, knownErrors[e.message]) : (e.message || t(locale, 'settings.addError')));
    } finally {
      setAddLoading(false);
    }
  };

  const translateError = (msg: string) => {
    const map: Record<string, string> = {
      'Cuenta no encontrada': 'settings.accountNotFound',
      'Esta cuenta no tiene contraseña guardada': 'settings.noPasswordSaved',
      'Account not found': 'settings.accountNotFound',
      'This account has no saved password': 'settings.noPasswordSaved',
    };
    return map[msg] ? t(locale, map[msg]) : msg;
  };

  const SORT_OPTIONS: { value: 'recent' | 'oldest' | 'alpha'; label: string }[] = [
    { value: 'recent', label: t(locale, 'settings.sortRecent') },
    { value: 'oldest', label: t(locale, 'settings.sortOldest') },
    { value: 'alpha', label: t(locale, 'settings.sortAlpha') },
  ];

  const handleDeleteAll = () => {
    Alert.alert(t(locale, 'settings.deleteAll'), t(locale, 'common.confirmDeleteAll'), [
      { text: t(locale, 'common.cancel'), style: 'cancel' },
      { text: t(locale, 'common.deleteAll'), style: 'destructive', onPress: () => { [...notes, ...checklists, ...ideas].forEach((n) => deleteNote(n.id)); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <ScreenHeader title={t(locale, 'settings.title')} colors={colors} />

      <View style={[styles.section, { marginTop: 16 }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t(locale, 'settings.account')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => setAccountModalVisible(true)} activeOpacity={0.7} style={styles.avatarRow}>
            <TouchableOpacity onPress={handleAvatarPress} style={styles.avatarContainer} activeOpacity={0.7}>
              <View style={[styles.avatarBorder, { borderColor: colors.textSecondary }]}>
                {profile?.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={22} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={10} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.avatarText}>
              <Text style={[{ color: colors.text, fontWeight: '600', fontSize: 16 }]}>{profile?.name || user?.email || t(locale, 'settings.userFallback')}</Text>
              {user?.email ? <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>{user.email}</Text> : null}
            </View>
            <View style={styles.chevronBtn}>
              <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="log-out-outline" title={t(locale, 'settings.logout')} danger onPress={() => { Alert.alert(t(locale, 'settings.logoutTitle'), t(locale, 'settings.logoutMsg'), [{ text: t(locale, 'common.cancel'), style: 'cancel' }, { text: t(locale, 'settings.logoutConfirm'), style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } }]); }} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t(locale, 'settings.preferences')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon={isDarkMode ? 'moon' : 'sunny'} title={t(locale, 'settings.darkMode')} subtitle={isDarkMode ? t(locale, 'settings.darkModeOn') : t(locale, 'settings.darkModeOff')} right={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={isDarkMode ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="notifications-outline" title={t(locale, 'settings.notifications')} subtitle={notifications ? t(locale, 'settings.notifOn') : t(locale, 'settings.notifOff')} right={<Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={notifications ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="funnel-outline" title={t(locale, 'settings.sortBy')} subtitle={SORT_OPTIONS.find(o => o.value === sortBy)?.label} onPress={() => setSortModalVisible(true)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="language-outline" title={t(locale, 'settings.language')} subtitle={locale === 'es' ? t(locale, 'settings.languageEs') : t(locale, 'settings.languageEn')} onPress={() => setLangModalVisible(true)} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t(locale, 'settings.data')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon="document-text-outline" title={t(locale, 'settings.notes')} right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{notes.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="checkbox-outline" title={t(locale, 'settings.checklists')} right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{checklists.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="bulb-outline" title={t(locale, 'settings.ideas')} right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{ideas.length}</Text>} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t(locale, 'settings.about')}</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon="document-text-outline" title={t(locale, 'settings.terms')} onPress={() => router.push('/terminos' as any)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="shield-checkmark-outline" title={t(locale, 'settings.privacy')} onPress={() => router.push('/privacidad' as any)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="chatbubble-ellipses-outline" title={t(locale, 'settings.feedback')} onPress={() => router.push('/feedback' as any)} colors={colors} />
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginHorizontal: 20 }]}>
        <SettingsItem icon="trash-outline" title={t(locale, 'settings.deleteAll')} danger onPress={handleDeleteAll} colors={colors} />
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 24, paddingBottom: (Platform.OS === 'ios' ? 100 : 90) + insets.bottom }}>
        <Text style={[styles.footerVersion, { color: colors.textTertiary }]}>{t(locale, 'settings.version')}</Text>
      </View>

      <Modal visible={accountModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => { setAccountModalVisible(false); setAddAccountVisible(false); }}>
          <Pressable style={[styles.accountModal, { backgroundColor: colors.surface }]} onPress={() => {}}>
            {addAccountVisible ? (
              <>
                <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 16 }]}>{t(locale, 'settings.addAccount')}</Text>
                <TextInput autoCapitalize="none" autoCorrect={false}
                  style={[styles.addInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder={t(locale, 'common.email')}
                  placeholderTextColor={colors.textTertiary}
                  value={addEmail}
                  onChangeText={setAddEmail}
                  keyboardType="email-address"
                />
                <TextInput autoCapitalize="none" autoCorrect={false}
                  style={[styles.addInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
                  placeholder={t(locale, 'common.password')}
                  placeholderTextColor={colors.textTertiary}
                  value={addPassword}
                  onChangeText={setAddPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.addAccountConfirmBtn, { backgroundColor: colors.primary, opacity: addLoading ? 0.7 : 1 }]}
                  onPress={handleAddAccount}
                  disabled={addLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addAccountConfirmText}>{addLoading ? t(locale, 'settings.adding') : t(locale, 'settings.addAndLogin')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addAccountBackBtn, { borderColor: colors.border }]}
                  onPress={() => { setAddAccountVisible(false); setAddEmail(''); setAddPassword(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={[{ color: colors.textSecondary, fontSize: 14 }]}>{t(locale, 'common.cancel')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t(locale, 'settings.accountCenter')}</Text>
                {accounts.length === 0 ? (
                  <Text style={[{ color: colors.textSecondary, textAlign: 'center', marginVertical: 20 }]}>{t(locale, 'settings.noAccounts')}</Text>
                ) : (
                  accounts.map((acc) => {
                    const isActive = acc.email === activeEmail;
                    return (
                      <TouchableOpacity
                        key={acc.email}
                        style={[styles.accountItem, { backgroundColor: isActive ? colors.primary + '12' : 'transparent', borderColor: isActive ? colors.primary + '30' : colors.border }]}
                        onPress={async () => {
                          if (isActive) return;
                          setAccountModalVisible(false);
                          try {
                            await switchToAccount(acc.email);
                          } catch (e: any) {
                            Alert.alert(t(locale, 'common.error'), translateError(e.message));
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.accountAvatar, { backgroundColor: acc.avatarUrl ? 'transparent' : colors.primary + '20' }]}>
                          {acc.avatarUrl ? (
                            <Image source={{ uri: acc.avatarUrl }} style={styles.accountAvatarImg} />
                          ) : (
                            <Ionicons name="person" size={16} color={colors.primary} />
                          )}
                        </View>
                        <View style={styles.accountInfo}>
                          <Text style={[styles.accountName, { color: colors.text }]}>{acc.name || acc.email}</Text>
                          <Text style={[styles.accountEmail, { color: colors.textTertiary }]}>{acc.email}</Text>
                        </View>
                        {isActive ? (
                          <View style={[styles.accountActiveBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        ) : null}
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(t(locale, 'settings.removeAccount'), t(locale, 'settings.removeAccountConfirm', { email: acc.email }), [
                              { text: t(locale, 'common.cancel'), style: 'cancel' },
                              { text: t(locale, 'settings.remove'), style: 'destructive', onPress: () => removeAccount(acc.email) },
                            ]);
                          }}
                          style={styles.accountRemoveBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-outline" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
                {accounts.length < 5 && (
                  <TouchableOpacity
                    style={[styles.addAccountBtn, { borderColor: colors.primary }]}
                    onPress={() => { setAddAccountVisible(true); setAddEmail(''); setAddPassword(''); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.addAccountText, { color: colors.primary }]}>{t(locale, 'settings.addAccount')}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t(locale, 'settings.sortTitle')}</Text>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.modalOption}
                onPress={() => { setSortBy(opt.value); setSortModalVisible(false); }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{opt.label}</Text>
                <View style={[styles.radio, { borderColor: colors.primary }, sortBy === opt.value && { backgroundColor: colors.primary }]}>
                  {sortBy === opt.value && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={langModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t(locale, 'settings.languageTitle')}</Text>
            {(['es', 'en'] as const).map((l) => (
              <TouchableOpacity
                key={l}
                style={styles.modalOption}
                onPress={() => { setLocale(l); setLangModalVisible(false); }}
              >
                <Text style={[styles.modalOptionText, { color: colors.text }]}>{l === 'es' ? t(locale, 'settings.languageEs') : t(locale, 'settings.languageEn')}</Text>
                <View style={[styles.radio, { borderColor: colors.primary }, locale === l && { backgroundColor: colors.primary }]}>
                  {locale === l && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footerVersion: { fontSize: 12, fontWeight: '500', opacity: 0.5 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingsItemIcon: { width: 28, alignItems: 'center', marginRight: 10 },
  settingsItemLeft: { flex: 1 },
  settingsSubtitle: { fontSize: 12, marginTop: 1 },
  chevron: { fontSize: 22 },
  countValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginLeft: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  modalOptionText: { fontSize: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  avatarContainer: { marginRight: 12, position: 'relative' },
  avatarBorder: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: {
    position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { flex: 1 },
  chevronBtn: { padding: 8 },
  accountModal: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  accountItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  accountAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  accountAvatarImg: { width: 36, height: 36, borderRadius: 18 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 14, fontWeight: '600' },
  accountEmail: { fontSize: 12, marginTop: 1 },
  accountActiveBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  accountRemoveBtn: { padding: 4 },
  addAccountBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    paddingVertical: 12, marginTop: 4,
  },
  addAccountText: { fontSize: 14, fontWeight: '600' },
  addInput: { width: '100%', height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15, marginBottom: 10 },
  addAccountConfirmBtn: { width: '100%', height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addAccountConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  addAccountBackBtn: { width: '100%', height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
});
