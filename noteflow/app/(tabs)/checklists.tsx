import { View, StyleSheet } from 'react-native';
import { Text, FAB, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import ChecklistCard from '../../components/items/ChecklistCard';

export default function ChecklistsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const checklists = useNotesStore((state) => state.checklists);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {checklists.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
            No hay tareas pendientes.
          </Text>
        </View>
      ) : (
        <FlashList
          data={checklists}
          renderItem={({ item }) => (
            <ChecklistCard note={item} onPress={() => router.push(`/checklists/${item.id}` as any)} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={() => router.push('/nueva-nota?type=checklist' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});