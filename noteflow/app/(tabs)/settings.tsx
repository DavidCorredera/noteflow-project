import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import { useNotesStore } from '../../store/notesStore';
import { getColors, AppColors } from '../../constants/theme';

const SORT_OPTIONS: { value: 'recent' | 'oldest' | 'alpha'; label: string }[] = [
  { value: 'recent', label: 'Mas reciente' },
  { value: 'oldest', label: 'Mas antiguo' },
  { value: 'alpha', label: 'A-Z' },
];

function SettingsItem({ title, subtitle, onPress, danger, right, colors }: { title: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode; colors: AppColors }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingsItem} activeOpacity={onPress ? 0.7 : 1}>
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
  const colors = getColors(isDarkMode);

  const [sortModalVisible, setSortModalVisible] = useState(false);

  const handleDeleteAll = () => {
    Alert.alert('Eliminar todos los datos', 'Esta accion no se puede deshacer. Se borraran todas tus notas, tareas e ideas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: () => { [...notes, ...checklists, ...ideas].forEach((n) => deleteNote(n.id)); } },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>NF</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>NoteFlow</Text>
        <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Version 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCIAS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem title="Tema oscuro" subtitle={isDarkMode ? 'Activado' : 'Desactivado'} right={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={isDarkMode ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Notificaciones" subtitle={notifications ? 'Activadas' : 'Desactivadas'} right={<Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={notifications ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Ordenar por" subtitle={SORT_OPTIONS.find(o => o.value === sortBy)?.label} onPress={() => setSortModalVisible(true)} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DATOS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem title="Notas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{notes.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Tareas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{checklists.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Ideas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{ideas.length}</Text>} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACERCA DE</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem title="Terminos y condiciones" onPress={() => router.push('/terminos' as any)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Privacidad" onPress={() => router.push('/privacidad' as any)} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem title="Enviar feedback" onPress={() => router.push('/feedback' as any)} colors={colors} />
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginHorizontal: 20 }]}>
        <SettingsItem title="Eliminar todos los datos" danger onPress={handleDeleteAll} colors={colors} />
      </View>

      <View style={{ height: (Platform.OS === 'ios' ? 100 : 90) + insets.bottom }} />

      <Modal visible={sortModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Ordenar por</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  appName: { fontSize: 22, fontWeight: '800' },
  appVersion: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
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
