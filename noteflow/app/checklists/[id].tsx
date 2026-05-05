import { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, IconButton, Checkbox, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const router = useRouter();

  const checklist = useNotesStore(state => state.checklists.find(c => c.id === id));
  const toggleItem = useNotesStore(state => state.toggleChecklistItem);
  const addItem = useNotesStore(state => state.addChecklistItem);
  // Extraemos la función de borrar
  const deleteNote = useNotesStore(state => state.deleteNote);

  const [newItemText, setNewItemText] = useState('');

  if (!checklist) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text variant="titleMedium">No se encontró la tarea.</Text>
      </View>
    );
  }

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    
    addItem(checklist.id, {
      id: Date.now().toString(),
      text: newItemText,
      isCompleted: false
    });
    setNewItemText('');
  };

  const handleDelete = () => {
    deleteNote(checklist.id);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Cabecera con Título y Botón de Borrar */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>{checklist.title}</Text>
        <IconButton 
          icon="trash-can-outline" 
          iconColor={theme.colors.error} 
          onPress={handleDelete} 
        />
      </View>

      <FlatList
        data={checklist.items}
        keyExtractor={item => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Checkbox
              status={item.isCompleted ? 'checked' : 'unchecked'}
              onPress={() => toggleItem(checklist.id, item.id)}
              color={theme.colors.primary}
            />
            <Text 
              variant="bodyLarge" 
              style={{ 
                flex: 1, 
                textDecorationLine: item.isCompleted ? 'line-through' : 'none',
                color: item.isCompleted ? theme.colors.outline : theme.colors.onBackground
              }}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceVariant }]}>
        <TextInput
          mode="flat"
          placeholder="Añadir subtarea..."
          value={newItemText}
          onChangeText={setNewItemText}
          style={styles.input}
          onSubmitEditing={handleAddItem}
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
        <IconButton 
          icon="plus-circle" 
          size={32} 
          iconColor={theme.colors.primary} 
          onPress={handleAddItem} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingRight: 8 
  },
  title: { padding: 16, fontWeight: 'bold', flex: 1 },
  list: { flex: 1, paddingHorizontal: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4,
    margin: 16,
    borderRadius: 28
  },
  input: { flex: 1, backgroundColor: 'transparent', height: 48 }
});