import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';
import NoteComposer from '../../components/notes/NoteComposer';
import { NoteImage, NoteSketch, parseNoteContent, serializeNoteContent } from '../../lib/noteContent';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
  const colors = getColors(isDarkMode);
  const note = useNotesStore(s => s.notes.find(n => n.id === id));
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateNote = useNotesStore(s => s.updateNote);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sketches, setSketches] = useState<NoteSketch[]>([]);
  const [images, setImages] = useState<NoteImage[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const hasChanges = useRef(false);
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const sketchesRef = useRef(sketches);
  const imagesRef = useRef(images);

  useLayoutEffect(() => {
    if (note) {
      const parsedContent = parseNoteContent(note.content);
      setTitle(note.title);
      setBody(parsedContent.body);
      setSketches(parsedContent.sketches);
      setImages(parsedContent.images);
      navigation.setOptions({
        title: '',
        headerTransparent: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerRight: () => (
          <TouchableOpacity onPress={handleDelete} style={{ paddingHorizontal: 12 }}>
            <Text style={[styles.headerAction, { color: colors.error }]}>{t(locale, 'common.delete')}</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [note, navigation, colors]);

  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
    sketchesRef.current = sketches;
    imagesRef.current = images;
  }, [title, body, sketches, images]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (hasChanges.current && note) {
        updateNote(note.id, {
          title: titleRef.current,
          content: serializeNoteContent({
            version: 1,
            body: bodyRef.current,
            sketches: sketchesRef.current,
            images: imagesRef.current,
          }),
        });
      }
    });
    return unsubscribe;
  }, [navigation, note]);

  const insets = useSafeAreaInsets();

  if (!note) return null;

  const handleDelete = () => {
    Alert.alert(t(locale, 'common.delete') + ' nota', t(locale, 'common.confirmDelete'), [
      { text: t(locale, 'common.cancel'), style: 'cancel' },
      { text: t(locale, 'common.delete'), style: 'destructive', onPress: () => { deleteNote(note.id); router.back(); } },
    ]);
  };

  const dateLocale = locale === 'es' ? 'es-ES' : 'en-US';
  const dateStr = new Date(note.updatedAt).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior='padding'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
    >
      <ScrollView
        style={styles.container}
        scrollEnabled={!isDrawing}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(96, insets.bottom + 72) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.date, { color: colors.textTertiary }]}>{dateStr}</Text>
        <TextInput autoCapitalize="none" autoCorrect={false}
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); hasChanges.current = true; }}
          placeholder={t(locale, 'note.placeholder')}
          placeholderTextColor={colors.textTertiary}
        />
        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
        <NoteComposer
          body={body}
          colors={colors}
          images={images}
          onBodyChange={(nextBody) => {
            setBody(nextBody);
            hasChanges.current = true;
          }}
          onSketchesChange={(nextSketches) => {
            setSketches(nextSketches);
            hasChanges.current = true;
          }}
          onImagesChange={(nextImages) => {
            setImages(nextImages);
            hasChanges.current = true;
          }}
          onDrawStart={() => setIsDrawing(true)}
          onDrawEnd={() => setIsDrawing(false)}
          sketches={sketches}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: Platform.OS === 'ios' ? 16 : 52 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 12, fontWeight: '500', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  titleInput: { fontSize: 26, fontWeight: '800', marginBottom: 16, paddingVertical: 4 },
  divider: { height: 1, marginBottom: 20 },
});
