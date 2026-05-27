import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useNotesStore } from '../../store/notesStore';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';
import { getColors, AppColors } from '../../constants/theme';
import ScreenHeader from '../../components/ScreenHeader';

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
  const colors = getColors(isDarkMode);

  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

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

      <View style={[styles.section, { marginTop: 8 }]}>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  modalOptionText: { fontSize: 16 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
});
