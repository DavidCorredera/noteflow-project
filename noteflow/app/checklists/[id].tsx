import { useState, useLayoutEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const checklist = useNotesStore(s => s.checklists.find(c => c.id === id));
  const toggleItem = useNotesStore(s => s.toggleChecklistItem);
  const addItem = useNotesStore(s => s.addChecklistItem);
  const deleteItem = useNotesStore(s => s.deleteChecklistItem);
  const updateItem = useNotesStore(s => s.updateChecklistItem);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateChecklist = useNotesStore(s => s.updateChecklist);
  const [newItemText, setNewItemText] = useState('');
  const [title, setTitle] = useState('');
  const [dirty, setDirty] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const editInputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    if (checklist) {
      setTitle(checklist.title);
      navigation.setOptions({
        title: checklist.title,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
      });
    }
  }, [checklist, navigation, colors]);

  if (!checklist) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textSecondary }]}>No se encontró la tarea.</Text>
      </View>
    );
  }

  const handleAddItem = () => {
    if (!newItemText.trim()) return;
    addItem(checklist.id, newItemText);
    setNewItemText('');
  };

  const handleDelete = () => { deleteNote(checklist.id); router.back(); };
  const handleSaveTitle = () => {
    if (!title.trim()) return;
    updateChecklist(checklist.id, { title });
    setDirty(false);
  };
  const handleStartEditItem = (itemId: string, currentText: string) => {
    setEditingItemId(itemId);
    setEditingItemText(currentText);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };
  const handleFinishEditItem = () => {
    if (editingItemId && editingItemText.trim()) {
      updateItem(checklist.id, editingItemId, editingItemText.trim());
    }
    setEditingItemId(null);
    setEditingItemText('');
  };

  const totalItems = checklist.items.length;
  const completedItems = checklist.items.filter(i => i.isCompleted).length;
  const progress = totalItems === 0 ? 0 : completedItems / totalItems;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
              value={title}
              onChangeText={(t) => { setTitle(t); setDirty(true); }}
              placeholderTextColor={colors.textSecondary}
            />
            {dirty && (
              <TouchableOpacity onPress={handleSaveTitle} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            )}
          </View>
          {totalItems > 0 && <Text style={[styles.progressText, { color: colors.textSecondary }]}>{completedItems} de {totalItems} completadas</Text>}
        </View>
        <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { backgroundColor: colors.deleteBg }]}>
          <Text>🗑️</Text>
        </TouchableOpacity>
      </View>
      {totalItems > 0 && (
        <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
      )}
      <FlatList
        data={checklist.items}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Añade subtareas para empezar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => toggleItem(checklist.id, item.id, item.isCompleted)} activeOpacity={0.7} style={styles.checkboxTouchable}>
              <View style={[styles.checkbox, { borderColor: item.isCompleted ? colors.primary : colors.textSecondary }, item.isCompleted && { backgroundColor: colors.primary }]}>
                {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
            {editingItemId === item.id ? (
              <TextInput
                ref={editInputRef}
                style={[styles.itemEditInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={editingItemText}
                onChangeText={setEditingItemText}
                onBlur={handleFinishEditItem}
                onSubmitEditing={handleFinishEditItem}
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity onPress={() => handleStartEditItem(item.id, item.text)} style={styles.itemTextTouchable}>
                <Text style={[styles.itemText, { color: item.isCompleted ? colors.textSecondary : colors.text }, item.isCompleted && { textDecorationLine: 'line-through' }]}>{item.text}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteItem(checklist.id, item.id)} style={styles.removeItem}>
              <Text style={styles.removeItemText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
          placeholder="Añadir subtarea..."
          placeholderTextColor={colors.textSecondary}
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={handleAddItem} style={[styles.addButton, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleInput: { fontSize: 22, fontWeight: '800', marginBottom: 4, borderBottomWidth: 1, paddingVertical: 2, flex: 1 },
  saveButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  saveButtonText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  progressText: { fontSize: 13 },
  deleteButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, borderRadius: 3, marginHorizontal: 20, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyList: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1 },
  checkboxTouchable: { paddingRight: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  itemTextTouchable: { flex: 1, paddingVertical: 4 },
  itemText: { fontSize: 15 },
  itemEditInput: { flex: 1, fontSize: 15, paddingVertical: 4, borderBottomWidth: 1, marginRight: 8 },
  removeItem: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeItemText: { fontSize: 14, color: '#ef4444', fontWeight: '700' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, marginRight: 10,
  },
  addButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 22, color: '#FFFFFF', fontWeight: '300' },
});
