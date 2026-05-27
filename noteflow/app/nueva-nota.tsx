import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { useNotesStore } from '../store/notesStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';
import { ItemPriority } from '../types';
import NoteComposer from '../components/notes/NoteComposer';
import { NoteImage, NoteSketch, serializeNoteContent } from '../lib/noteContent';
import { useLocaleStore } from '../store/localeStore';
import { t } from '../i18n';

const PRIORITY_CYCLES: ItemPriority[] = ['none', 'low', 'medium', 'high'];
const PRIORITY_ICONS: Record<ItemPriority, keyof typeof Ionicons.glyphMap> = {
  none: 'remove-outline',
  low: 'arrow-down-outline',
  medium: 'remove-outline',
  high: 'arrow-up-outline',
};
const PRIORITY_COLORS: Record<ItemPriority, string> = {
  none: '#9ca3af',
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

function nextPriority(p: ItemPriority): ItemPriority {
  return PRIORITY_CYCLES[(PRIORITY_CYCLES.indexOf(p) + 1) % PRIORITY_CYCLES.length];
}

const TYPE_OPTIONS: { value: string }[] = [
  { value: 'note' },
  { value: 'checklist' },
  { value: 'idea' },
];

export default function NuevaNotaScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { type: initialType } = useLocalSearchParams();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
  const colors = getColors(isDarkMode);
  const addNote = useNotesStore(s => s.addNote);
  const addChecklist = useNotesStore(s => s.addChecklist);
  const addIdea = useNotesStore(s => s.addIdea);
  const [type, setType] = useState((initialType as string) || 'note');
  const [title, setTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteImages, setNoteImages] = useState<NoteImage[]>([]);
  const [noteSketches, setNoteSketches] = useState<NoteSketch[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [ideaBody, setIdeaBody] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; priority: ItemPriority }[]>([{ text: '', priority: 'none' }]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={[styles.headerCancel, { color: colors.textSecondary }]}>{t(locale, 'common.cancel')}</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.headerSaveBtn, { backgroundColor: title.trim().length >= 3 && !isSaving ? colors.primary : colors.border }]}
        >
          <Text style={[styles.headerSaveText, { color: title.trim().length >= 3 && !isSaving ? '#FFFFFF' : colors.textTertiary }]}>
            {isSaving ? t(locale, 'common.saving') : t(locale, 'common.save')}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, title, type, noteBody, noteImages, noteSketches, tagsInput, ideaBody, checklistItems, isSaving]);

  const handleSave = async () => {
    if (title.trim().length < 3) { setError(t(locale, 'nuevaNota.titleError')); return; }
    if (isSaving) return;

    try {
      setIsSaving(true);
      if (type === 'note') {
        if (!noteBody.trim() && noteSketches.length === 0) { setError(t(locale, 'nuevaNota.bodyError')); return; }
        await addNote({
          title: title.trim(),
          content: serializeNoteContent({
            version: 1,
            body: noteBody.trim(),
            sketches: noteSketches,
            images: noteImages,
          }),
        });
      } else if (type === 'checklist') {
        const items = checklistItems.filter((item) => item.text.trim());
        await addChecklist({ title: title.trim(), items });
      } else if (type === 'idea') {
        const tagsArray = Array.from(new Set(tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean)));
        await addIdea({ title: title.trim(), tags: tagsArray, content: ideaBody.trim() || undefined });
      }

      router.back();
    } catch (saveError: any) {
      setError(saveError?.message || t(locale, 'nuevaNota.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const updateChecklistItem = (index: number, text: string) => {
    const items = [...checklistItems];
    items[index] = { ...items[index], text };
    if (text.trim() && index === items.length - 1) {
      items.push({ text: '', priority: 'none' });
    }
    if (!text.trim() && index < items.length - 1) {
      items.splice(index, 1);
    }
    setChecklistItems(items);
  };

  const cycleItemPriority = (index: number) => {
    const items = [...checklistItems];
    items[index] = { ...items[index], priority: nextPriority(items[index].priority) };
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
              <Text style={[styles.typeChipText, { color: type === opt.value ? '#FFFFFF' : colors.textSecondary }]}>{opt.value === 'note' ? t(locale, 'nuevaNota.note') : opt.value === 'checklist' ? t(locale, 'nuevaNota.checklist') : t(locale, 'nuevaNota.idea')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput autoCapitalize="none" autoCorrect={false}
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); setError(''); }}
          placeholder={t(locale, 'nuevaNota.titlePlaceholder')}
          placeholderTextColor={colors.textTertiary}
        />

        {type === 'note' && (
          <NoteComposer
            body={noteBody}
            colors={colors}
            images={noteImages}
            sketches={noteSketches}
            onBodyChange={(nextBody) => { setNoteBody(nextBody); setError(''); }}
            onSketchesChange={(nextSketches) => { setNoteSketches(nextSketches); setError(''); }}
            onImagesChange={(nextImages) => { setNoteImages(nextImages); setError(''); }}
          />
        )}

        {type === 'checklist' && (
          <View style={styles.checklistContainer}>
            {checklistItems.map((item, idx) => {
              const p = item.priority;
              const pColor = PRIORITY_COLORS[p];
              return (
                <View key={idx} style={styles.checklistRow}>
                  <View style={[styles.checklistBullet, { borderColor: colors.textTertiary }]} />
                  <TextInput autoCapitalize="none" autoCorrect={false}
                    style={[styles.checklistInput, { color: colors.text }]}
                    value={item.text}
                    onChangeText={(t) => updateChecklistItem(idx, t)}
                    placeholder={idx === checklistItems.length - 1 ? t(locale, 'nuevaNota.newTask') : ''}
                    placeholderTextColor={colors.textTertiary}
                  />
                  <TouchableOpacity
                    onPress={() => cycleItemPriority(idx)}
                    style={[styles.prioBtn, { backgroundColor: pColor + '18' }]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name={PRIORITY_ICONS[p]} size={14} color={pColor} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {type === 'idea' && (
          <View>
            <TextInput autoCapitalize="none" autoCorrect={false}
              style={[styles.ideaBodyInput, { color: colors.text }]}
              value={ideaBody}
              onChangeText={(t) => { setIdeaBody(t); setError(''); }}
              placeholder={t(locale, 'idea.write')}
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
            {ideaBody.trim() ? (
              <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{ideaBody.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'common.characters')}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{ideaBody.trim() ? ideaBody.trim().split(/\s+/).length : 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'common.words')}</Text>
                </View>
              </View>
            ) : null}
            <TextInput autoCapitalize="none" autoCorrect={false}
              style={[styles.tagInput, { color: colors.text }]}
              value={tagsInput}
              onChangeText={(t) => { setTagsInput(t); setError(''); }}
              placeholder={t(locale, 'idea.tagsPlaceholder')}
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
  checklistRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  checklistBullet: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, marginRight: 14 },
  checklistInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  prioBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ideaBodyInput: { fontSize: 16, lineHeight: 24, minHeight: 100, paddingVertical: 4, marginBottom: 8 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  tagInput: { fontSize: 16, paddingVertical: 4, marginBottom: 12 },
  tagPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  tagChipText: { fontSize: 13, fontWeight: '600' },
});
