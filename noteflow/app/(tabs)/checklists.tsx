import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Spinner } from '@gluestack-ui/themed';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import ChecklistCard from '../../components/items/ChecklistCard';
import SwipeableRow from '../../components/SwipeableRow';
import ScreenHeader from '../../components/ScreenHeader';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';

export default function ChecklistsScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const sortBy = useThemeStore((s) => s.sortBy);
  const colors = getColors(isDarkMode);
  const checklists = useNotesStore((s) => s.checklists);
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

  const active = useMemo(() => {
    const filtered = checklists.filter((n) => !n.archived);
    if (sortBy === 'oldest') return [...filtered].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    if (sortBy === 'alpha') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [checklists, sortBy]);

  const archived = useMemo(() => {
    const filtered = checklists.filter((n) => n.archived);
    if (sortBy === 'oldest') return [...filtered].sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    if (sortBy === 'alpha') return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return [...filtered].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [checklists, sortBy]);

  const source = showArchived ? archived : active;
  const isEmpty = source.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t(locale, 'tabs.checklists')} colors={colors} />
      {showArchived && (
        <TouchableOpacity style={styles.backBar} onPress={() => setShowArchived(false)} activeOpacity={0.7}>
          <Text style={[styles.backArrow, { color: colors.primary }]}>{'←'}</Text>
          <Text style={[styles.backText, { color: colors.primary }]}>{t(locale, 'checklistsList.noArchived')}</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.center}><Spinner color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text></View>
      ) : isEmpty && showArchived ? (
        <View style={styles.center}>
          <View style={styles.emptyContent}>
            <Ionicons name="checkbox-outline" size={50} color={colors.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(locale, 'checklistsList.noArchived')}</Text>
          </View>
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <View style={styles.emptyContent}>
            <Ionicons name="checkbox-outline" size={50} color={colors.textTertiary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t(locale, 'checklistsList.empty')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{t(locale, 'checklistsList.emptyDesc')}</Text>
          </View>
        </View>
      ) : (
        <FlashList
          data={source}
          renderItem={({ item: checklist }) => (
            <Animated.View entering={FadeInDown} style={{ marginHorizontal: 20, marginBottom: 10 }}>
              <SwipeableRow
                variant="icons-horizontal"
                archived={!!checklist.archived}
                onArchive={() => archiveNote(checklist.id)}
                onRestore={() => restoreNote(checklist.id)}
                onDelete={() => deleteNote(checklist.id)}
                onEdit={() => router.push(`/checklists/${checklist.id}` as any)}
                colors={colors}
              >
                <ChecklistCard note={checklist} onPress={() => router.push(`/checklists/${checklist.id}` as any)} colors={colors} mode="full" />
              </SwipeableRow>
            </Animated.View>
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            !showArchived && archived.length > 0 ? (
              <TouchableOpacity style={styles.archivedBar} onPress={() => setShowArchived(true)} activeOpacity={0.7}>
                <Text style={[styles.archivedBarText, { color: colors.primary }]}>{t(locale, 'checklistsList.noArchived')}</Text>
                <View style={[styles.archivedBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.archivedBadgeText}>{archived.length}</Text>
                </View>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 16 : 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        />
      )}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => router.push('/nueva-nota?type=checklist' as any)} activeOpacity={0.8}>
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
  fab: {
    position: 'absolute', right: 24, bottom: Platform.OS === 'ios' ? 100 : 90, width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', fontWeight: '300', marginTop: -2 },
});
