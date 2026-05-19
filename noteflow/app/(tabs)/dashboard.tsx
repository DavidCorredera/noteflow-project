import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

function StatCard({ title, value, color, icon, onPress, colors: c }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.borderLight, shadowColor: c.cardShadow }]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: c.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function RecentItem({ item, type, onPress, colors: c }: any) {
  const dateStr = new Date(item.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return (
    <TouchableOpacity onPress={onPress} style={[styles.recentItem, { backgroundColor: c.surface, borderColor: c.borderLight }]}>
      <View style={[styles.recentDot, { backgroundColor: type === 'note' ? c.primary : type === 'checklist' ? c.success : c.warning }]} />
      <View style={styles.recentContent}>
        <Text style={[styles.recentTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.recentMeta, { color: c.textSecondary }]}>{type === 'note' ? 'Nota' : type === 'checklist' ? 'Tarea' : 'Idea'} · {dateStr}</Text>
      </View>
      <Text style={[styles.recentArrow, { color: c.border }]}>›</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const notes = useNotesStore((s) => s.notes);
  const checklists = useNotesStore((s) => s.checklists);
  const ideas = useNotesStore((s) => s.ideas);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const isLoading = useNotesStore((s) => s.isLoading);

  useEffect(() => { fetchNotes(); }, []);

  const totalItems = notes.length + checklists.length + ideas.length;
  const completedTasks = checklists.reduce((acc, c) => acc + c.items.filter(i => i.isCompleted).length, 0);
  const totalTasks = checklists.reduce((acc, c) => acc + c.items.length, 0);
  const allRecent = [
    ...notes.slice(0, 3).map(n => ({ ...n, _type: 'note' as const })),
    ...checklists.slice(0, 3).map(c => ({ ...c, _type: 'checklist' as const })),
    ...ideas.slice(0, 3).map(i => ({ ...i, _type: 'idea' as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <Text style={[styles.greeting, { color: colors.text }]}>¡Bienvenido de nuevo!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Resumen de tu espacio de trabajo</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Notas" value={notes.length} color={colors.primary} icon="📝" onPress={() => router.push('/notas')} colors={colors} />
        <StatCard title="Tareas" value={checklists.length} color={colors.success} icon="✅" onPress={() => router.push('/checklists')} colors={colors} />
        <StatCard title="Ideas" value={ideas.length} color={colors.warning} icon="💡" onPress={() => router.push('/ideas')} colors={colors} />
        <StatCard title="Total" value={totalItems} color={colors.info} icon="📦" onPress={() => { }} colors={colors} />
      </View>

      {totalTasks > 0 && (
        <View style={[styles.progressSection, { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.cardShadow }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Progreso de tareas</Text>
            <Text style={[styles.progressText, { color: colors.primary }]}>{completedTasks}/{totalTasks}</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${(completedTasks / totalTasks) * 100}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.recentSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Actividad reciente</Text>
        {isLoading ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Cargando...</Text>
        ) : allRecent.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aún no hay actividad. ¡Empieza a crear!</Text>
        ) : (
          allRecent.map((item: any) => (
            <RecentItem key={item.id} item={item} type={item._type} onPress={() => router.push(`/${item._type === 'checklist' ? 'checklists' : item._type === 'idea' ? 'ideas' : 'notas'}/${item.id}` as any)} colors={colors} />
          ))
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  greeting: { fontSize: 26, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 15 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 16, gap: 8 },
  statCard: {
    width: '47%', borderRadius: 16, padding: 16, marginBottom: 8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1,
  },
  statIconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statTitle: { fontSize: 14, fontWeight: '500' },
  progressSection: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 16, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  progressText: { fontSize: 15, fontWeight: '700' },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  recentSection: { marginHorizontal: 20, marginTop: 24 },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1,
  },
  recentDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  recentContent: { flex: 1 },
  recentTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  recentMeta: { fontSize: 12 },
  recentArrow: { fontSize: 20, marginLeft: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
});
