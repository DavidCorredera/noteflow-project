import { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, RefreshControl, TextInput } from 'react-native';
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
import { useFolderStore } from '../../store/folderStore';
import FolderBar from '../../components/FolderBar';
import FolderModal from '../../components/FolderModal';
import FolderPickerModal from '../../components/FolderPickerModal';

export default function ChecklistsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const sortBy = useThemeStore((s) => s.sortBy);
  const colors = getColors(isDarkMode);
  const checklists = useNotesStore((s) => s.checklists);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const archiveNote = useNotesStore((s) => s.archiveNote);
  const restoreNote = useNotesStore((s) => s.restoreNote);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const moveToFolder = useNotesStore((s) => s.moveToFolder);
  const isLoading = useNotesStore((s) => s.isLoading);
  const error = useNotesStore((s) => s.error);
  const locale = useLocaleStore((s) => s.locale);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderPickerItemId, setFolderPickerItemId] = useState<string | null>(null);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const folders = useFolderStore((s) => s.foldersByType.checklist);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);

  useEffect(() => { fetchFolders('checklist'); }, []);

  const folderColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    folders.forEach((f) => { map[f.id] = f.color; });
    return map;
  }, [folders]);

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

  const matchSearch = useCallback((n: any, q: string) => {
    if (n.title?.toLowerCase().includes(q)) return true;
    if (n.items) {
      return n.items.some((item: any) => item.text?.toLowerCase().includes(q));
    }
    return false;
  }, []);

  const filteredSource = useMemo(() => {
    let result = source;
    if (selectedFolderId) result = result.filter((n: any) => n.folderId === selectedFolderId);
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((n) => matchSearch(n, q));
  }, [source, searchQuery, matchSearch, selectedFolderId]);

  const archivedMatched = useMemo(() => {
    let result = archived;
    if (selectedFolderId) result = result.filter((n: any) => n.folderId === selectedFolderId);
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return result.filter((n) => matchSearch(n, q));
  }, [archived, searchQuery, matchSearch, selectedFolderId]);

  const isEmpty = filteredSource.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t(locale, 'tabs.checklists')} colors={colors} icon="checkbox" />
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <TextInput style={[styles.searchInput, { color: colors.text }]} placeholder={t(locale, 'common.search')} placeholderTextColor={colors.textTertiary} value={searchQuery} onChangeText={setSearchQuery} autoCapitalize="none" autoCorrect={false} />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
      <FolderBar folders={folders} selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} onManage={() => setFolderModalVisible(true)} colors={colors} />
      <FolderModal visible={folderModalVisible} onClose={() => setFolderModalVisible(false)} folders={folders} colors={colors} type="checklist" />
      {showArchived && (
        <TouchableOpacity style={styles.backBar} onPress={() => setShowArchived(false)} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
      )}

      {!showArchived && archived.length > 0 && (!searchQuery.trim() || archivedMatched.length > 0) && (
        <TouchableOpacity style={[styles.archivedBar, { backgroundColor: colors.surface, marginHorizontal: 16 }]} onPress={() => setShowArchived(true)} activeOpacity={0.7}>
          <Ionicons name="archive-outline" size={20} color={colors.primary} />
          <Text style={[styles.archivedBarText, { color: colors.text }]}>{t(locale, 'checklistsList.archived')}</Text>
          <View style={[styles.archivedBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.archivedBadgeText}>{archivedMatched.length || archived.length}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
          data={filteredSource}
          renderItem={({ item: checklist }) => (
            <Animated.View entering={FadeInDown} style={{ marginBottom: 10 }}>
              <SwipeableRow
                variant="icons-horizontal"
                archived={!!checklist.archived}
                onArchive={() => archiveNote(checklist.id)}
                onRestore={() => restoreNote(checklist.id)}
                onDelete={() => deleteNote(checklist.id)}
                onEdit={() => router.push(`/checklists/${checklist.id}` as any)}
                onFolder={() => setFolderPickerItemId(checklist.id)}
                colors={colors}
              >
                <ChecklistCard note={checklist} onPress={() => router.push(`/checklists/${checklist.id}` as any)} colors={colors} mode="full" folderColor={checklist.folderId ? folderColorMap[checklist.folderId] : undefined} />
              </SwipeableRow>
            </Animated.View>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 16 : 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        />
      )}
      <FolderPickerModal
        visible={folderPickerItemId !== null}
        onClose={() => setFolderPickerItemId(null)}
        folders={folders}
        colors={colors}
        locale={locale}
        onSelect={(folderId) => {
          if (folderPickerItemId) moveToFolder(folderPickerItemId, folderId, 'checklist');
          setFolderPickerItemId(null);
        }}
      />
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
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 20, marginBottom: 12, paddingHorizontal: 12, height: 40, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  backBar: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.15)' },
  archivedBar: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 0, paddingVertical: 14, paddingHorizontal: 16, gap: 10, borderRadius: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  archivedBarText: { fontSize: 14, fontWeight: '600', flex: 1 },
  archivedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  archivedBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  fab: {
    position: 'absolute', right: 24, bottom: Platform.OS === 'ios' ? 100 : 90, width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', fontWeight: '300', marginTop: -2 },
});
