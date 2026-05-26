import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import NoteComposer from '../../components/notes/NoteComposer';
import { NoteSketch, parseNoteContent, serializeNoteContent } from '../../lib/noteContent';

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
  const [body, setBody] = useState('');
  const [sketches, setSketches] = useState<NoteSketch[]>([]);
  const hasChanges = useRef(false);
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const sketchesRef = useRef(sketches);

  useLayoutEffect(() => {
    if (note) {
      const parsedContent = parseNoteContent(note.content);
      setTitle(note.title);
      setBody(parsedContent.body);
      setSketches(parsedContent.sketches);
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
  }, [note, navigation, colors]);

  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
    sketchesRef.current = sketches;
  }, [title, body, sketches]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (hasChanges.current && note) {
        updateNote(note.id, {
          title: titleRef.current,
          content: serializeNoteContent({
            version: 1,
            body: bodyRef.current,
            sketches: sketchesRef.current,
          }),
        });
      }
    });
    return unsubscribe;
  }, [navigation, note]);

  const insets = useSafeAreaInsets();

  if (!note) return null;

  const handleDelete = () => {
    Alert.alert('Eliminar nota', 'Esta accion no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { deleteNote(note.id); router.back(); } },
    ]);
  };

  const dateStr = new Date(note.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(96, insets.bottom + 72) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.date, { color: colors.textTertiary }]}>{dateStr}</Text>
        <TextInput
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); hasChanges.current = true; }}
          placeholder="Titulo de la nota"
          placeholderTextColor={colors.textTertiary}
        />
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <NoteComposer
          body={body}
          colors={colors}
          onBodyChange={(nextBody) => {
            setBody(nextBody);
            hasChanges.current = true;
          }}
          onSketchesChange={(nextSketches) => {
            setSketches(nextSketches);
            hasChanges.current = true;
          }}
          sketches={sketches}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 24 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 12, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  titleInput: { fontSize: 26, fontWeight: '800', marginBottom: 16, paddingVertical: 4 },
  divider: { height: 1, marginBottom: 20 },
});
