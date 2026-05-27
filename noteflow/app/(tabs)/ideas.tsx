import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spinner } from '@gluestack-ui/themed';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import { IdeaNote } from '../../types';
import IdeaCard from '../../components/items/IdeaCard';
import SwipeableRow from '../../components/SwipeableRow';
import ScreenHeader from '../../components/ScreenHeader';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';

const CARD_GAP = 12;

export default function IdeasScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const sortBy = useThemeStore((s) => s.sortBy);
  const colors = getColors(isDarkMode);
  const ideas = useNotesStore((s) => s.ideas);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const error = useNotesStore((s) => s.error);
  const locale = useLocaleStore((s) => s.locale);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotes();
    setRefreshing(false);
  }, [fetchNotes]);

  function sortIdeas(list: IdeaNote[]): IdeaNote[] {
    const sorted = [...list];
    if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    else if (sortBy === 'alpha') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }

  const active = useMemo(() => sortIdeas(ideas.filter((n) => !n.archived)), [ideas, sortBy]);
  const archived = useMemo(() => sortIdeas(ideas.filter((n) => n.archived)), [ideas, sortBy]);

  const source = showArchived ? archived : active;

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < source.length; i += 2) {
      r.push(source.slice(i, i + 2));
    }
    return r;
  }, [source]);

  const isEmpty = source.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t(locale, 'tabs.ideas')} colors={colors} />
      {showArchived && (
        <TouchableOpacity style={styles.backBar} onPress={() => setShowArchived(false)} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>{'←'}</Text>
          <Text style={[styles.backText, { color: colors.primary }]}>{t(locale, 'ideasList.noArchived')}</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.center}><Spinner color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text></View>
      ) : isEmpty && showArchived ? (
        <View style={styles.center}>
          <View style={styles.emptyContent}>
            <Ionicons name="bulb-outline" size={50} color={colors.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(locale, 'ideasList.noArchived')}</Text>
          </View>
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <View style={styles.emptyContent}>
            <Ionicons name="bulb-outline" size={50} color={colors.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(locale, 'ideasList.empty')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{t(locale, 'ideasList.emptyDesc')}</Text>
          </View>
        </View>
      ) : (
        <FlashList
          data={rows}
          renderItem={({ item: row }) => (
            <View style={styles.gridRow}>
              {row.map((idea) => (
                <View key={idea.id} style={styles.gridCell}>
                  <SwipeableRow
                    variant="icons"
                    archived={!!idea.archived}
                    onArchive={() => archiveNote(idea.id)}
                    onRestore={() => restoreNote(idea.id)}
                    onDelete={() => deleteNote(idea.id)}
                    onEdit={() => router.push(`/ideas/${idea.id}` as any)}
                    colors={colors}
                  >
                    <IdeaCard note={idea} onPress={() => router.push(`/ideas/${idea.id}` as any)} colors={colors} />
                  </SwipeableRow>
                </View>
              ))}
              {row.length === 1 && <View style={styles.gridCell} />}
            </View>
          )}
          keyExtractor={(row) => row.map((n) => n.id).join('-')}
          ListHeaderComponent={
            !showArchived && archived.length > 0 ? (
              <TouchableOpacity style={styles.archivedBar} onPress={() => setShowArchived(true)} activeOpacity={0.7}>
                <Text style={[styles.archivedBarText, { color: colors.primary }]}>{t(locale, 'ideasList.noArchived')}</Text>
                <View style={[styles.archivedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.archivedBadgeText}>{archived.length}</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 16 : 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        />
      )}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => router.push('/nueva-nota?type=idea' as any)} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 15, textAlign: 'center' },
  emptyIcon: { fontSize: 44, fontWeight: '800', marginBottom: 16, opacity: 0.25 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', opacity: 0.7 },
  emptyContent: { alignItems: 'center', transform: [{ translateY: -40 }] },
  backBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  backArrow: { fontSize: 22, fontWeight: '600' },
  backText: { fontSize: 15, fontWeight: '600' },
  archivedBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, gap: 8 },
  archivedBarText: { fontSize: 14, fontWeight: '600' },
  archivedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  archivedBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  gridRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
  gridCell: { flex: 1 },
  fab: {
    position: 'absolute', right: 24, bottom: Platform.OS === 'ios' ? 100 : 90, width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', fontWeight: '300', marginTop: -2 },
});
