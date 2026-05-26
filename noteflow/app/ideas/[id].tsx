import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagText, setEditingTagText] = useState('');
  const hasChanges = useRef(false);
  const titleRef = useRef(title);
  const tagsRef = useRef(tags);

  useLayoutEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setTags(idea.tags || []);
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
  }, [idea, navigation, colors]);

  useEffect(() => { titleRef.current = title; tagsRef.current = tags; }, [title, tags]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (hasChanges.current && idea) {
        updateIdea(idea.id, { title: titleRef.current, tags: tagsRef.current });
      }
    });
    return unsubscribe;
  }, [navigation, idea]);

  if (!idea) return null;

  const handleDelete = () => {
    Alert.alert('Eliminar idea', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteNote(idea.id); router.back(); } },
    ]);
  };

  const saveTags = (newTags: string[]) => {
    setTags(newTags);
    hasChanges.current = true;
    if (idea) updateIdea(idea.id, { tags: newTags });
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      saveTags([...tags, newTag]);
      setTagInput('');
    }
  };
  const handleRemoveTag = (tag: string) => {
    saveTags(tags.filter(t => t !== tag));
  };
  const handleStartEditTag = (idx: number) => {
    setEditingTagIdx(idx);
    setEditingTagText(tags[idx]);
  };
  const handleFinishEditTag = () => {
    if (editingTagIdx !== null && editingTagText.trim()) {
      const newText = editingTagText.trim();
      if (newText !== tags[editingTagIdx]) {
        const updated = [...tags];
        updated[editingTagIdx] = newText;
        saveTags(updated);
      }
    }
    setEditingTagIdx(null);
    setEditingTagText('');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <TextInput
        style={[styles.titleInput, { color: colors.text }]}
        value={title}
        onChangeText={(t) => { setTitle(t); hasChanges.current = true; }}
        placeholderTextColor={colors.textTertiary}
      />
      <View style={styles.tagsSection}>
        <View style={styles.tagsHeader}>
          <Text style={[styles.tagsLabel, { color: colors.textTertiary }]}>Etiquetas</Text>
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={[styles.tag, { backgroundColor: colors.ideaColors[idx % colors.ideaColors.length] }]}>
              {editingTagIdx === idx ? (
                <TextInput
                  style={[styles.tagEditInput, { color: colors.text }]}
                  value={editingTagText}
                  onChangeText={setEditingTagText}
                  onBlur={handleFinishEditTag}
                  onSubmitEditing={handleFinishEditTag}
                  returnKeyType="done"
                />
              ) : (
                <TouchableOpacity onPress={() => handleStartEditTag(idx)} style={styles.tagTextButton} activeOpacity={0.75}>
                  <Text style={[styles.tagText, { color: colors.text }]}>{tag}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => handleRemoveTag(tag)}
                style={[styles.tagRemoveBtn, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)' }]}
                activeOpacity={0.8}
              >
                <Text style={styles.tagRemove}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <View style={styles.addTagRow}>
          <TextInput
            style={[styles.tagInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            placeholder="Nueva etiqueta..."
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity
            onPress={handleAddTag}
            disabled={!tagInput.trim()}
            style={[styles.addTagBtn, { backgroundColor: colors.primary, opacity: tagInput.trim() ? 1 : 0.45 }]}
            activeOpacity={0.85}
          >
            <Text style={styles.addTagBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 80, paddingBottom: 60 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  titleInput: { fontSize: 26, fontWeight: '800', marginBottom: 28, paddingVertical: 4 },
  tagsSection: {},
  tagsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  tag: {
    borderRadius: 14,
    minHeight: 46,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagTextButton: { paddingVertical: 8, paddingRight: 8 },
  tagText: { fontSize: 15, fontWeight: '600' },
  tagEditInput: { fontSize: 15, fontWeight: '600', paddingVertical: 8, minWidth: 72, paddingRight: 8 },
  tagRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  tagRemove: { fontSize: 16, lineHeight: 16, color: '#ef4444', fontWeight: '800' },
  addTagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagInput: { flex: 1, fontSize: 16, paddingVertical: 12, borderBottomWidth: 1, minHeight: 48 },
  addTagBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnText: { fontSize: 26, color: '#FFFFFF', fontWeight: '400', marginTop: -1 },
});
