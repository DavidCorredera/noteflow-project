import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, FAB, ActivityIndicator, useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import NoteCard from '../../components/items/NoteCard';

export default function NotasScreen() {
  const theme = useTheme();
  const router = useRouter();
  
  // Extraemos las nuevas funciones y estados del store
  const notes = useNotesStore((state) => state.notes);
  const fetchNotes = useNotesStore((state) => state.fetchNotes);
  const isLoading = useNotesStore((state) => state.isLoading);
  const error = useNotesStore((state) => state.error);

  // Llamamos a la API nada más abrir la pantalla
  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* 1. Mostramos la carga */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        </View>
      ) : 
      /* 2. Mostramos errores si los hay */
      error ? (
        <View style={styles.center}>
          <Text style={{ color: theme.colors.error }}>No pudimos cargar las notas: {error}</Text>
        </View>
      ) : 
      /* 3. Mostramos mensaje de vacío si no hay notas */
      notes.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>
            No tienes notas. ¡Crea la primera!
          </Text>
        </View>
      ) : 
      /* 4. Mostramos la lista real */
      (
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
  // He renombrado 'empty' a 'center' porque nos sirve para la carga, el error y la lista vacía
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, 
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});