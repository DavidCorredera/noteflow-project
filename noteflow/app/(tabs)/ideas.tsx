import { View, StyleSheet } from 'react-native';
import { Text, FAB, ActivityIndicator, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import IdeaCard from '../../components/items/IdeaCard';

export default function IdeasScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  const ideas = useNotesStore((state) => state.ideas);
  const isLoading = useNotesStore((state) => state.isLoading);
  const error = useNotesStore((state) => state.error);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.error }}>Error: {error}</Text>
        </View>
      ) : ideas.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
            Captura tu primera idea rápida.
          </Text>
        </View>
      ) : (
        <FlashList
          data={ideas}
          renderItem={({ item }) => (
            <IdeaCard note={item} onPress={() => router.push(`/ideas/${item.id}` as any)} />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={100}
          contentContainerStyle={{ paddingVertical: 16 }}
        />
      )}
      
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        onPress={() => router.push('/nueva-nota?type=idea' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});