import { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const note = useNotesStore(s => s.notes.find(n => n.id === id));
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateNote = useNotesStore(s => s.updateNote);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dirty, setDirty] = useState(false);

  useLayoutEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      navigation.setOptions({
        title: note.title,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
      });
    }
  }, [note, navigation, colors]);

  if (!note) return null;

  const handleDelete = () => { deleteNote(note.id); router.back(); };
  const handleSave = () => {
    if (!title.trim()) return;
    updateNote(note.id, { title, content });
    setDirty(false);
  };
  const dateStr = new Date(note.updatedAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={title}
            onChangeText={(t) => { setTitle(t); setDirty(true); }}
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={[styles.date, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>
        <View style={styles.headerActions}>
          {dirty && (
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={[styles.deleteButton, { backgroundColor: colors.deleteBg }]}>
            <Text>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
      <TextInput
        style={[styles.contentInput, { color: colors.text }]}
        value={content}
        onChangeText={(t) => { setContent(t); setDirty(true); }}
        multiline
        textAlignVertical="top"
        placeholderTextColor={colors.textSecondary}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  headerLeft: { flex: 1, marginRight: 12 },
  titleInput: { fontSize: 24, fontWeight: '800', marginBottom: 6, borderBottomWidth: 1, paddingVertical: 4 },
  date: { fontSize: 13 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginHorizontal: 20 },
  contentInput: { padding: 20, fontSize: 16, lineHeight: 26, minHeight: 200 },
});
