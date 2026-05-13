import { useState, useLayoutEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const idea = useNotesStore(s => s.ideas.find(i => i.id === id));
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateIdea = useNotesStore(s => s.updateIdea);

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagText, setEditingTagText] = useState('');
  const editInputRef = useRef<TextInput>(null);

  useLayoutEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setTags(idea.tags || []);
      navigation.setOptions({
        title: idea.title,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
      });
    }
  }, [idea, navigation, colors]);

  if (!idea) return null;

  const handleDelete = () => { deleteNote(idea.id); router.back(); };
  const handleSave = () => {
    if (!title.trim()) return;
    updateIdea(idea.id, { title, tags });
    setDirty(false);
  };
  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput('');
      setDirty(true);
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
    setDirty(true);
  };
  const handleStartEditTag = (idx: number) => {
    setEditingTagIdx(idx);
    setEditingTagText(tags[idx]);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };
  const handleFinishEditTag = () => {
    if (editingTagIdx !== null && editingTagText.trim()) {
      const newText = editingTagText.trim();
      if (newText !== tags[editingTagIdx]) {
        const updated = [...tags];
        updated[editingTagIdx] = newText;
        setTags(updated);
        setDirty(true);
      }
    }
    setEditingTagIdx(null);
    setEditingTagText('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <TextInput
            style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={title}
            onChangeText={(t) => { setTitle(t); setDirty(true); }}
            placeholderTextColor={colors.textSecondary}
          />
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

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Etiquetas</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={[styles.tag, { backgroundColor: colors.ideaColors[idx % colors.ideaColors.length], borderColor: colors.border }]}>
              {editingTagIdx === idx ? (
                <TextInput
                  ref={editInputRef}
                  style={[styles.tagEditInput, { color: colors.text }]}
                  value={editingTagText}
                  onChangeText={setEditingTagText}
                  onBlur={handleFinishEditTag}
                  onSubmitEditing={handleFinishEditTag}
                  returnKeyType="done"
                />
              ) : (
                <TouchableOpacity onPress={() => handleStartEditTag(idx)} style={styles.tagTextTouchable}>
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleRemoveTag(tag)} style={styles.tagRemoveTouchable}>
                <Text style={styles.tagRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.addTagRow}>
          <TextInput
            style={[styles.tagInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            placeholder="Añadir etiqueta..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAddTag} style={[styles.addTagButton, { backgroundColor: colors.primary }]}>
            <Text style={styles.addTagButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  titleInput: { fontSize: 24, fontWeight: '800', flex: 1, marginRight: 12, borderBottomWidth: 1, paddingVertical: 4 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  deleteButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { borderRadius: 10, paddingLeft: 14, paddingVertical: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  tagTextTouchable: { paddingVertical: 2 },
  tagText: { fontSize: 13, fontWeight: '600' },
  tagEditInput: { fontSize: 13, fontWeight: '600', paddingVertical: 2, minWidth: 40 },
  tagRemoveTouchable: { paddingHorizontal: 10, paddingVertical: 2 },
  tagRemove: { fontSize: 13, color: '#ef4444', fontWeight: '700' },
  addTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  addTagButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addTagButtonText: { fontSize: 22, color: '#FFFFFF', fontWeight: '300' },
});
