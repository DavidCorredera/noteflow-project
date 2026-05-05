import { View, StyleSheet } from 'react-native';
import { Text, Chip, IconButton, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();
  
  const idea = useNotesStore(state => state.ideas.find(i => i.id === id));
  const deleteNote = useNotesStore(state => state.deleteNote);

  if (!idea) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>{idea.title}</Text>
        <IconButton 
          icon="trash-can-outline" 
          iconColor={theme.colors.error} 
          onPress={() => { deleteNote(idea.id); router.back(); }} 
        />
      </View>
      
      <View style={styles.tagsContainer}>
        {idea.tags.map(tag => (
          <Chip key={tag} style={styles.chip}>{tag}</Chip>
        ))}
      </View>
      
      <Text variant="bodyMedium" style={styles.hint}>
        Las ideas son capturas rápidas. ¡No las dejes escapar!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { flex: 1, fontWeight: 'bold' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { marginBottom: 8 },
  hint: { marginTop: 40, textAlign: 'center', opacity: 0.5 }
});