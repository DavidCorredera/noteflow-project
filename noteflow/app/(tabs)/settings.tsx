import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useNotesStore } from '../../store/notesStore';
import { getColors, AppColors } from '../../constants/theme';

function SettingsItem({ icon, title, subtitle, onPress, danger, right, colors }: { icon: string; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode; colors: AppColors }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.settingsItem} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.settingsItemLeft}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <View>
          <Text style={[danger ? { color: '#f87171' } : { color: colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingsSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      {right || (onPress ? <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text> : null)}
    </TouchableOpacity>
  );
}

const SORT_LABELS: Record<string, string> = {
  recent: 'Más reciente',
  oldest: 'Más antiguo',
  alpha: 'A-Z',
};

export default function SettingsScreen() {
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

  const handleDeleteAll = () => {
    Alert.alert('Eliminar todos los datos', 'Esta acción no se puede deshacer. Se borrarán todas tus notas, tareas e ideas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar todo', style: 'destructive', onPress: () => { [...notes, ...checklists, ...ideas].forEach((n) => deleteNote(n.id)); } },
    ]);
  };

  const cycleSort = () => {
    const order: Array<'recent' | 'oldest' | 'alpha'> = ['recent', 'oldest', 'alpha'];
    const idx = order.indexOf(sortBy);
    setSortBy(order[(idx + 1) % order.length]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.profileSection}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>NF</Text>
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>NoteFlow</Text>
        <Text style={[styles.appVersion, { color: colors.textSecondary }]}>Versión 1.0.0</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCIAS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon={isDarkMode ? '🌙' : '☀️'} title="Tema oscuro" subtitle={isDarkMode ? 'Activado' : 'Desactivado'} right={<Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={isDarkMode ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="🔔" title="Notificaciones" subtitle={notifications ? 'Activadas' : 'Desactivadas'} right={<Switch value={notifications} onValueChange={toggleNotifications} trackColor={{ false: colors.border, true: colors.primary + '60' }} thumbColor={notifications ? colors.primary : '#f4f3f4'} />} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="🗂️" title="Ordenar por" subtitle={SORT_LABELS[sortBy]} onPress={cycleSort} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>DATOS</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon="📝" title="Notas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{notes.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="✅" title="Tareas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{checklists.length}</Text>} colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="💡" title="Ideas" right={<Text style={[styles.countValue, { color: colors.textSecondary }]}>{ideas.length}</Text>} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACERCA DE</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <SettingsItem icon="📄" title="Términos y condiciones" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="🔒" title="Privacidad" colors={colors} />
          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
          <SettingsItem icon="💬" title="Enviar feedback" colors={colors} />
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginHorizontal: 20 }]}>
        <SettingsItem icon="🗑️" title="Eliminar todos los datos" danger onPress={handleDeleteAll} colors={colors} />
      </View>

      <View style={{ height: 40 }} />
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
  settingsItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingsIcon: { fontSize: 20, marginRight: 14 },
  settingsSubtitle: { fontSize: 12, marginTop: 1 },
  chevron: { fontSize: 22 },
  countValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginLeft: 54 },
});
