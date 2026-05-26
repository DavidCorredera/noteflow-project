import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

function GlassCard({ children, intensity, style, colors: c, accentColor }: any) {
  const Card = Platform.OS === 'ios' ? BlurView : View;
  return (
    <Card intensity={intensity || 70} tint="light" style={[styles.glassCard, { borderColor: c.border, shadowColor: accentColor || c.cardShadow }, style]}>
      {accentColor ? <View style={[styles.cardAccent, { backgroundColor: accentColor }]} /> : null}
      {children}
    </Card>
  );
}

function StatCard({ title, value, accent, onPress, colors: c }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.statWrapper}>
      <GlassCard intensity={75} colors={c} accentColor={accent}>
        <View style={styles.statBody}>
          <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
          <Text style={[styles.statTitle, { color: c.textTertiary }]}>{title}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function RecentItem({ item, type, onPress, colors: c }: any) {
  const dateStr = new Date(item.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const typeColors: Record<string, string> = { note: c.primary, checklist: c.success, idea: c.warning };
  const typeLabels: Record<string, string> = { note: 'Nota', checklist: 'Tarea', idea: 'Idea' };
  const ac = typeColors[type] || c.primary;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.recentWrapper}>
      <GlassCard intensity={60} colors={c} style={styles.recentCard} accentColor={ac}>
        <View style={styles.recentContent}>
          <Text style={[styles.recentType, { color: ac }]}>{typeLabels[type] || type}</Text>
          <Text style={[styles.recentTitle, { color: c.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.recentMeta, { color: c.textTertiary }]}>{dateStr}</Text>
        </View>
      </GlassCard>
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.headerSection}>
        <Text style={[styles.greeting, { color: colors.text }]}>NoteFlow</Text>
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Resumen de tu espacio de trabajo</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Notas" value={notes.length} accent={colors.primary} onPress={() => router.push('/notas')} colors={colors} />
        <StatCard title="Tareas" value={checklists.length} accent={colors.success} onPress={() => router.push('/checklists')} colors={colors} />
        <StatCard title="Ideas" value={ideas.length} accent={colors.warning} onPress={() => router.push('/ideas')} colors={colors} />
        <StatCard title="Total" value={totalItems} accent={colors.info} onPress={() => { }} colors={colors} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Actividad reciente</Text>
        {isLoading ? (
          <View style={styles.center}><Text style={[styles.statusText, { color: colors.textTertiary }]}>Cargando...</Text></View>
        ) : allRecent.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyIcon, { color: colors.textTertiary }]}>{'\u2610'}</Text>
            <Text style={[styles.statusText, { color: colors.textTertiary }]}>Aun no hay actividad</Text>
          </View>
        ) : (
          allRecent.map((item: any) => (
            <RecentItem key={item.id} item={item} type={item._type} onPress={() => router.push(`/${item._type === 'checklist' ? 'checklists' : item._type === 'idea' ? 'ideas' : 'notas'}/${item.id}` as any)} colors={colors} />
          ))
        )}
      </View>

      {totalTasks > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Progreso de tareas</Text>
          <GlassCard intensity={75} colors={colors} accentColor={colors.success}>
            <View style={styles.progressBody}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Completado</Text>
                <Text style={[styles.progressCount, { color: colors.success }]}>{completedTasks}/{totalTasks}</Text>
              </View>
              <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${(completedTasks / totalTasks) * 100}%` }]} />
              </View>
            </View>
          </GlassCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', paddingVertical: 40 },
  headerSection: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 4 },
  greeting: { fontSize: 30, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, letterSpacing: 0.2 },
  section: { marginTop: 32, paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14, letterSpacing: 0.3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 24, gap: 12 },
  statWrapper: { width: '47%' },
  glassCard: {
    borderRadius: 14, padding: 18, borderWidth: 1, overflow: 'hidden', position: 'relative',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  statBody: { alignItems: 'flex-start' },
  statValue: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statTitle: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  recentWrapper: { marginBottom: 8 },
  recentCard: { padding: 0 },
  recentContent: { paddingHorizontal: 16, paddingVertical: 14, marginTop: 3 },
  recentType: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  recentTitle: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  recentMeta: { fontSize: 12 },
  emptyIcon: { fontSize: 36, marginBottom: 12, opacity: 0.3 },
  statusText: { fontSize: 14, textAlign: 'center' },
  progressBody: { paddingVertical: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressCount: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
