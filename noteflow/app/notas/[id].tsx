import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, IconButton, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  
  const note = useNotesStore(state => state.notes.find(n => n.id === id));
  const deleteNote = useNotesStore(state => state.deleteNote);

  if (!note) return null;

  const handleDelete = () => {
    deleteNote(note.id);
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>{note.title}</Text>
        <IconButton icon="trash-can-outline" iconColor={theme.colors.error} onPress={handleDelete} />
      </View>
      <Text variant="bodyLarge" style={styles.content}>{note.content}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { flex: 1, fontWeight: 'bold' },
  content: { padding: 16, lineHeight: 24 }
});