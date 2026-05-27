import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';
import { getColors } from '../../constants/theme';
import { getNotePlainTextPreview } from '../../lib/noteContent';
import ScreenHeader from '../../components/ScreenHeader';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function StatCard({ icon, title, value, accent, onPress, colors: c }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.statIconWrap, { backgroundColor: accent + '18' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textTertiary }]}>{title}</Text>
    </TouchableOpacity>
  );
}

function QuickAction({ icon, label, onPress, colors: c }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.quickAction, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.quickIconWrap, { backgroundColor: c.primary + '15' }]}>
        <Ionicons name={icon} size={22} color={c.primary} />
      </View>
      <Text style={[styles.quickLabel, { color: c.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RecentItem({ item, type, onPress, locale, colors: c }: any) {
  const now = new Date();
  const updated = new Date(item.updatedAt);
  const diffDays = Math.floor((now.getTime() - updated.getTime()) / 86400000);
  const dateStr = diffDays === 0 ? t(locale, 'dashboard.today') : diffDays === 1 ? t(locale, 'dashboard.yesterday') : `${updated.getDate()} ${MONTHS[updated.getMonth()]}`;

  const meta: Record<string, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
    note: { icon: 'document-text-outline', label: t(locale, 'nuevaNota.note'), color: c.primary },
    checklist: { icon: 'checkbox-outline', label: t(locale, 'nuevaNota.checklist'), color: c.success },
    idea: { icon: 'bulb-outline', label: t(locale, 'nuevaNota.idea'), color: c.warning },
  };
  const m = meta[type] || meta.note;

  let preview = '';
  if (type === 'note' && item.content) {
    preview = getNotePlainTextPreview(item.content);
  } else if (type === 'checklist' && item.items) {
    const done = item.items.filter((i: any) => i.isCompleted).length;
    const total = item.items.length;
    preview = `${done}/${total} ${t(locale, 'checklist.done').toLowerCase()}`;
  } else if (type === 'idea' && item.tags?.length) {
    preview = item.tags.slice(0, 3).join(', ');
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.recentRow, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={[styles.recentDot, { backgroundColor: m.color }]} />
      <View style={styles.recentBody}>
        <View style={styles.recentTop}>
          <Text style={[styles.recentType, { color: m.color }]}>{m.label}</Text>
          <Text style={[styles.recentDate, { color: c.textTertiary }]}>{dateStr}</Text>
        </View>
        <Text style={[styles.recentTitle, { color: c.text }]} numberOfLines={1}>{item.title || t(locale, 'dashboard.untitled')}</Text>
        {preview ? <Text style={[styles.recentPreview, { color: c.textTertiary }]} numberOfLines={1}>{preview}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textTertiary} style={{ opacity: 0.5 }} />
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
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
    ...notes.map(n => ({ ...n, _type: 'note' as const })),
    ...checklists.map(c => ({ ...c, _type: 'checklist' as const })),
    ...ideas.map(i => ({ ...i, _type: 'idea' as const })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 100 : 120 }}>
      <ScreenHeader title={t(locale, 'dashboard.title')} colors={colors} />

      <View style={styles.quickRow}>
        <QuickAction icon="document-text-outline" label={t(locale, 'dashboard.newNote')} onPress={() => router.push('/nueva-nota?type=note' as any)} colors={colors} />
        <QuickAction icon="checkbox-outline" label={t(locale, 'dashboard.newTask')} onPress={() => router.push('/nueva-nota?type=checklist' as any)} colors={colors} />
        <QuickAction icon="bulb-outline" label={t(locale, 'dashboard.newIdea')} onPress={() => router.push('/nueva-nota?type=idea' as any)} colors={colors} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(locale, 'dashboard.summary')}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="document-text-outline" title={t(locale, 'settings.notes')} value={notes.length} accent={colors.primary} onPress={() => router.push('/notas')} colors={colors} />
          <StatCard icon="checkbox-outline" title={t(locale, 'settings.checklists')} value={checklists.length} accent={colors.success} onPress={() => router.push('/checklists')} colors={colors} />
          <StatCard icon="bulb-outline" title={t(locale, 'settings.ideas')} value={ideas.length} accent={colors.warning} onPress={() => router.push('/ideas')} colors={colors} />
          <StatCard icon="layers-outline" title={t(locale, 'dashboard.total')} value={totalItems} accent={colors.info} onPress={() => {}} colors={colors} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(locale, 'dashboard.recent')}</Text>
        {isLoading ? (
          <View style={styles.center}>
            <Text style={[styles.statusText, { color: colors.textTertiary }]}>{t(locale, 'common.loading')}</Text>
          </View>
        ) : allRecent.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <Text style={[styles.statusText, { color: colors.textTertiary }]}>{t(locale, 'dashboard.noActivity')}</Text>
            <Text style={[styles.statusSub, { color: colors.textTertiary }]}>{t(locale, 'dashboard.noActivityDesc')}</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {allRecent.map((item: any) => (
              <RecentItem key={item.id} item={item} type={item._type} onPress={() => router.push(`/${item._type === 'checklist' ? 'checklists' : item._type === 'idea' ? 'ideas' : 'notas'}/${item.id}` as any)} colors={colors} locale={locale} />
            ))}
          </View>
        )}
      </View>

      {totalTasks > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t(locale, 'dashboard.taskProgress')}</Text>
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>{t(locale, 'dashboard.completed')}</Text>
              <Text style={[styles.progressCount, { color: colors.success }]}>{completedTasks}/{totalTasks}</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.success, width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }]} />
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', paddingVertical: 40 },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, letterSpacing: 0.2 },

  quickRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 10 },
  quickAction: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', gap: 8 },
  quickIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%', borderRadius: 14, borderWidth: 1, padding: 16,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  recentRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  recentDot: { width: 4, height: 40, borderRadius: 2 },
  recentBody: { flex: 1 },
  recentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  recentType: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  recentDate: { fontSize: 11, fontWeight: '500' },
  recentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recentPreview: { fontSize: 12, fontWeight: '400', opacity: 0.7 },

  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: 'center' },
  statusText: { fontSize: 14, textAlign: 'center', fontWeight: '600' },
  statusSub: { fontSize: 12, textAlign: 'center', marginTop: 4, opacity: 0.6 },

  progressCard: { borderRadius: 14, borderWidth: 1, padding: 18 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressLabel: { fontSize: 13, fontWeight: '600' },
  progressCount: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
