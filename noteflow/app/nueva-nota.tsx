import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useNotesStore } from '../store/notesStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import NoteComposer from '../components/notes/NoteComposer';
import { NoteSketch, serializeNoteContent } from '../lib/noteContent';

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'note', label: 'Nota' },
  { value: 'checklist', label: 'Tarea' },
  { value: 'idea', label: 'Idea' },
];

export default function NuevaNotaScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { type: initialType } = useLocalSearchParams();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const addNote = useNotesStore(s => s.addNote);
  const addChecklist = useNotesStore(s => s.addChecklist);
  const addIdea = useNotesStore(s => s.addIdea);
  const [type, setType] = useState((initialType as string) || 'note');
  const [title, setTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteSketches, setNoteSketches] = useState<NoteSketch[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={[styles.headerCancel, { color: colors.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.headerSaveBtn, { backgroundColor: title.trim().length >= 3 && !isSaving ? colors.primary : colors.border }]}
        >
          <Text style={[styles.headerSaveText, { color: title.trim().length >= 3 && !isSaving ? '#FFFFFF' : colors.textTertiary }]}>
            {isSaving ? 'Guardando' : 'Guardar'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, title, type, noteBody, noteSketches, tagsInput, checklistItems, isSaving]);

  const handleSave = async () => {
    if (title.trim().length < 3) { setError('El titulo debe tener al menos 3 caracteres'); return; }
    if (isSaving) return;

    try {
      setIsSaving(true);
      if (type === 'note') {
        if (!noteBody.trim() && noteSketches.length === 0) { setError('La nota necesita texto o al menos un lienzo'); return; }
        await addNote({
          title: title.trim(),
          content: serializeNoteContent({
            version: 1,
            body: noteBody.trim(),
            sketches: noteSketches,
          }),
        });
      } else if (type === 'checklist') {
        const items = checklistItems.map((item) => item.trim()).filter(Boolean);
        await addChecklist({ title: title.trim(), items });
      } else if (type === 'idea') {
        const tagsArray = Array.from(new Set(tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean)));
        await addIdea({ title: title.trim(), tags: tagsArray });
      }

      router.back();
    } catch (saveError: any) {
      setError(saveError?.message || 'No se pudo guardar la entrada');
    } finally {
      setIsSaving(false);
    }
  };

  const updateChecklistItem = (index: number, text: string) => {
    const items = [...checklistItems];
    items[index] = text;
    if (text.trim() && index === items.length - 1) {
      items.push('');
    }
    if (!text.trim() && index < items.length - 1) {
      items.splice(index, 1);
    }
    setChecklistItems(items);
  };

  const bottomSpacing = Math.max(32, insets.bottom + 24);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomSpacing }]}
    >
        {error ? (
          <View style={[styles.errorBox, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', borderColor: colors.error + '40' }]}>
            <Text style={{ color: colors.error, fontSize: 13, fontWeight: '500' }}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.typeSelector}>
          {TYPE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => { setType(opt.value); setError(''); }}
              style={[styles.typeChip, { backgroundColor: type === opt.value ? colors.primary : colors.surface, borderColor: type === opt.value ? colors.primary : colors.border }]}
            >
              <Text style={[styles.typeChipText, { color: type === opt.value ? '#FFFFFF' : colors.textSecondary }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); setError(''); }}
          placeholder="Titulo"
          placeholderTextColor={colors.textTertiary}
        />

        {type === 'note' && (
          <NoteComposer
            body={noteBody}
            colors={colors}
            onBodyChange={(nextBody) => { setNoteBody(nextBody); setError(''); }}
            onSketchesChange={(nextSketches) => { setNoteSketches(nextSketches); setError(''); }}
            sketches={noteSketches}
          />
        )}

        {type === 'checklist' && (
          <View style={styles.checklistContainer}>
            {checklistItems.map((item, idx) => (
              <View key={idx} style={styles.checklistRow}>
                <View style={[styles.checklistBullet, { borderColor: colors.textTertiary }]} />
                <TextInput
                  style={[styles.checklistInput, { color: colors.text }]}
                  value={item}
                  onChangeText={(t) => updateChecklistItem(idx, t)}
                  placeholder={idx === checklistItems.length - 1 ? 'Nueva tarea...' : ''}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            ))}
          </View>
        )}

        {type === 'idea' && (
          <View>
            <TextInput
              style={[styles.tagInput, { color: colors.text }]}
              value={tagsInput}
              onChangeText={(t) => { setTagsInput(t); setError(''); }}
              placeholder="etiqueta1, etiqueta2, etiqueta3"
              placeholderTextColor={colors.textTertiary}
            />
            {tagsInput.trim() ? (
              <View style={styles.tagPreview}>
                {tagsInput.split(',').map((t, i) => {
                  const tag = t.trim();
                  return tag ? (
                    <View key={i} style={[styles.tagChip, { backgroundColor: colors.ideaColors[i % colors.ideaColors.length], borderColor: colors.border }]}>
                      <Text style={[styles.tagChipText, { color: colors.text }]}>{tag}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            ) : null}
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24 },
  headerCancel: { fontSize: 16, fontWeight: '500' },
  headerSaveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  headerSaveText: { fontSize: 14, fontWeight: '700' },
  errorBox: { borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontWeight: '600' },
  titleInput: { fontSize: 28, fontWeight: '800', marginBottom: 20, paddingVertical: 4 },
  checklistContainer: { gap: 4 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checklistBullet: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, marginRight: 14 },
  checklistInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  tagInput: { fontSize: 16, paddingVertical: 4, marginBottom: 12 },
  tagPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  tagChipText: { fontSize: 13, fontWeight: '600' },
});
