import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const editInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const hasTitleChanges = useRef(false);
  const titleRef = useRef(title);

  useLayoutEffect(() => {
    if (checklist) {
      setTitle(checklist.title);
      navigation.setOptions({
        title: '',
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete} style={{ paddingHorizontal: 12 }}>
            <Text style={[styles.headerAction, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [checklist, navigation, colors]);

  useEffect(() => { titleRef.current = title; }, [title]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (hasTitleChanges.current && checklist) {
        updateChecklist(checklist.id, { title: titleRef.current });
      }
    });
    return unsubscribe;
  }, [navigation, checklist]);

  const insets = useSafeAreaInsets();

  if (!checklist) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textTertiary }]}>No se encontro la tarea.</Text>
      </View>
    );
  }

  const handleAddItem = async () => {
    const trimmedText = newItemText.trim();
    if (!trimmedText) return;

    setNewItemText('');
    await addItem(checklist.id, trimmedText);

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleDelete = () => {
    Alert.alert('Eliminar tarea', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteNote(checklist.id); router.back(); } },
    ]);
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
  const bottomInset = Math.max(12, insets.bottom);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior='padding'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <TextInput
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); hasTitleChanges.current = true; }}
          placeholderTextColor={colors.textTertiary}
        />
        {totalItems > 0 && <Text style={[styles.progressText, { color: colors.textTertiary }]}>{completedItems} de {totalItems}</Text>}
      </View>
      {totalItems > 0 && (
        <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
      )}

      <FlatList
        ref={listRef}
        data={checklist.items}
        keyExtractor={item => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Anade subtareas para empezar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { borderBottomColor: colors.borderLight }]}>
            <TouchableOpacity onPress={() => toggleItem(checklist.id, item.id, item.isCompleted)} activeOpacity={0.7} style={styles.checkboxTouchable}>
              <View style={[styles.checkbox, { borderColor: item.isCompleted ? colors.primary : colors.textTertiary }, item.isCompleted && { backgroundColor: colors.primary }]}>
                {item.isCompleted && <Text style={styles.checkmark}>v</Text>}
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
                <Text style={[styles.itemText, { color: item.isCompleted ? colors.textTertiary : colors.text }, item.isCompleted && { textDecorationLine: 'line-through' }]}>{item.text}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => deleteItem(checklist.id, item.id)} style={styles.removeItem}>
              <Text style={styles.removeItemText}>x</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight, paddingBottom: bottomInset + 6 }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
          placeholder="Nueva subtarea..."
          placeholderTextColor={colors.textTertiary}
          value={newItemText}
          onChangeText={setNewItemText}
          onSubmitEditing={handleAddItem}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={handleAddItem} style={[styles.addButton, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  header: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 8 },
  titleInput: { fontSize: 22, fontWeight: '800', marginBottom: 4, paddingVertical: 2 },
  progressText: { fontSize: 12, marginTop: 2 },
  progressBg: { height: 4, borderRadius: 2, marginHorizontal: 24, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  list: { flex: 1, paddingHorizontal: 20 },
  emptyList: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1 },
  checkboxTouchable: { paddingRight: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
  itemTextTouchable: { flex: 1, paddingVertical: 4 },
  itemText: { fontSize: 15 },
  itemEditInput: { flex: 1, fontSize: 15, paddingVertical: 4, borderBottomWidth: 1, marginRight: 8 },
  removeItem: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  removeItemText: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginRight: 10,
  },
  addButton: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 20, color: '#FFFFFF', fontWeight: '300' },
});
