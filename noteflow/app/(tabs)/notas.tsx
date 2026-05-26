import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Spinner } from '@gluestack-ui/themed';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import NoteCard from '../../components/items/NoteCard';

export default function NotasScreen() {
  const router = useRouter();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const sortBy = useThemeStore((s) => s.sortBy);
  const colors = getColors(isDarkMode);
  const notes = useNotesStore((s) => s.notes);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const isLoading = useNotesStore((s) => s.isLoading);
  const error = useNotesStore((s) => s.error);

  useEffect(() => { fetchNotes(); }, []);

  const sorted = useMemo(() => {
    const copy = [...notes];
    if (sortBy === 'oldest') return copy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    if (sortBy === 'alpha') return copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, sortBy]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.center}><Spinner color={colors.primary} size="large" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text></View>
      ) : sorted.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyIcon, { color: colors.textTertiary }]}>N</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin notas</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>Toca + para crear tu primera nota</Text>
        </View>
      ) : (
        <FlashList
          data={sorted}
          renderItem={({ item }) => <NoteCard note={item} onPress={() => router.push(`/notas/${item.id}` as any)} colors={colors} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => router.push('/nueva-nota?type=note' as any)} activeOpacity={0.8}>
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
  fab: {
    position: 'absolute', right: 24, bottom: Platform.OS === 'ios' ? 100 : 90, width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  fabIcon: { fontSize: 26, color: '#FFFFFF', fontWeight: '300', marginTop: -2 },
});
