import { View, StyleSheet } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import NoteCard from '../../components/items/NoteCard';

export default function NotasScreen() {
  const theme = useTheme();
  const router = useRouter();
  const notes = useNotesStore((state) => state.notes);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {notes.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
            No tienes notas. ¡Crea la primera!
          </Text>
        </View>
      ) : (
        <FlashList
          data={notes}
          renderItem={({ item }) => (
            <NoteCard note={item} onPress={() => router.push(`/notas/${item.id}` as any)} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={() => router.push('/nueva-nota?type=note' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});