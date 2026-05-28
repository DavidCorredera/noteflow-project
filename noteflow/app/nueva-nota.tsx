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
import { scheduleReminder } from '../lib/notifications';
import { getCurrentLocation } from '../lib/location';

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

const IDEA_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

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
  const [ideaBody, setIdeaBody] = useState('');
  const [ideaColor, setIdeaColor] = useState(IDEA_COLORS[0]);
  const [pinned, setPinned] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagText, setEditingTagText] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; priority: ItemPriority }[]>([{ text: '', priority: 'none' }]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; name: string | null } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
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
    }, [navigation, colors, title, type, noteBody, noteImages, noteSketches, tags, ideaBody, checklistItems, isSaving]);

  const handleSave = async () => {
    if (title.trim().length < 3) { setError(t(locale, 'nuevaNota.titleError')); return; }
    if (isSaving) return;

    try {
      setIsSaving(true);
      const reminderDateStr = reminderDate?.toISOString();
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
          reminderDate: reminderDateStr,
          latitude: locationData?.latitude,
          longitude: locationData?.longitude,
        });
      } else if (type === 'checklist') {
        const items = checklistItems.filter((item) => item.text.trim());
        await addChecklist({ title: title.trim(), items, reminderDate: reminderDateStr, latitude: locationData?.latitude, longitude: locationData?.longitude });
      } else if (type === 'idea') {
        await addIdea({ title: title.trim(), tags, content: ideaBody.trim() || undefined, color: ideaColor, pinned, reminderDate: reminderDateStr, latitude: locationData?.latitude, longitude: locationData?.longitude });
      }

      if (reminderDate) {
        await scheduleReminder(title.trim(), reminderDate);
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

        {type !== 'idea' && <TextInput autoCapitalize="none" autoCorrect={false}
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); setError(''); }}
          placeholder={t(locale, 'nuevaNota.titlePlaceholder')}
          placeholderTextColor={colors.textTertiary}
        />}

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
            <View style={[styles.ideaAccentBar, { backgroundColor: ideaColor }]} />

            <View style={styles.ideaTitleRow}>
              <TextInput autoCapitalize="none" autoCorrect={false}
                style={[styles.ideaTitleInput, { color: colors.text }]}
                value={title}
                onChangeText={(t) => { setTitle(t); setError(''); }}
                placeholder={t(locale, 'nuevaNota.titlePlaceholder')}
                placeholderTextColor={colors.textTertiary}
              />
              <TouchableOpacity onPress={() => setPinned(!pinned)} style={[styles.ideaPinBtn, { backgroundColor: pinned ? ideaColor + '20' : colors.surface }]} activeOpacity={0.7}>
                <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={18} color={pinned ? ideaColor : colors.textTertiary} />
              </TouchableOpacity>
            </View>

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

            <View style={styles.ideaTagsSection}>
              <View style={styles.ideaTagsHeader}>
                <Text style={[styles.ideaTagsLabel, { color: colors.textTertiary }]}>{t(locale, 'common.tags')}</Text>
              </View>
              <View style={styles.ideaTagsContainer}>
                {tags.map((tag, idx) => (
                  <View key={`${tag}-${idx}`} style={[styles.ideaTag, { backgroundColor: colors.ideaColors[idx % colors.ideaColors.length] }]}>
                    {editingTagIdx === idx ? (
                      <TextInput autoCapitalize="none" autoCorrect={false}
                        style={[styles.ideaTagEditInput, { color: colors.text }]}
                        value={editingTagText}
                        onChangeText={setEditingTagText}
                        onBlur={() => { if (editingTagText.trim()) { const updated = [...tags]; updated[editingTagIdx] = editingTagText.trim(); setTags(updated); } setEditingTagIdx(null); setEditingTagText(''); }}
                        onSubmitEditing={() => { if (editingTagText.trim()) { const updated = [...tags]; updated[editingTagIdx] = editingTagText.trim(); setTags(updated); } setEditingTagIdx(null); setEditingTagText(''); }}
                        returnKeyType="done"
                      />
                    ) : (
                      <TouchableOpacity onPress={() => { setEditingTagIdx(idx); setEditingTagText(tag); }} style={styles.ideaTagTextButton} activeOpacity={0.75}>
                        <Text style={[styles.ideaTagText, { color: colors.text }]}>{tag}</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => setTags(tags.filter((_, i) => i !== idx))}
                      style={[styles.ideaTagRemoveBtn, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.12)' }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.ideaTagRemove}>x</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <View style={styles.ideaAddTagRow}>
                <TextInput autoCapitalize="none" autoCorrect={false}
                  style={[styles.ideaTagInput, { color: colors.text, borderBottomColor: colors.border }]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => { const newTag = tagInput.trim(); if (newTag && !tags.includes(newTag)) { setTags([...tags, newTag]); setTagInput(''); } }}
                  placeholder={t(locale, 'idea.newTag')}
                  placeholderTextColor={colors.textTertiary}
                />
                <TouchableOpacity
                  onPress={() => { const newTag = tagInput.trim(); if (newTag && !tags.includes(newTag)) { setTags([...tags, newTag]); setTagInput(''); } }}
                  disabled={!tagInput.trim()}
                  style={[styles.ideaAddTagBtn, { backgroundColor: ideaColor, opacity: tagInput.trim() ? 1 : 0.45 }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.ideaAddTagBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ideaColorSection}>
              <Text style={[styles.ideaColorLabel, { color: colors.textTertiary }]}>{t(locale, 'common.color')}</Text>
              <View style={styles.ideaColorRow}>
                {IDEA_COLORS.map((c) => (
                  <TouchableOpacity key={c} onPress={() => setIdeaColor(c)} style={[styles.ideaColorSwatch, { backgroundColor: c }, ideaColor === c && styles.ideaColorSwatchActive, ideaColor === c && { borderColor: c }]} activeOpacity={0.7}>
                    {ideaColor === c && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Reminder section */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t(locale, 'nuevaNota.reminder')}</Text>
          <View style={styles.reminderRow}>
            {[
              { label: '1h', getDate: () => new Date(Date.now() + 3600000) },
              { label: '3h', getDate: () => new Date(Date.now() + 10800000) },
              { label: t(locale, 'nuevaNota.tomorrow'), getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d; } },
              { label: t(locale, 'nuevaNota.nextWeek'), getDate: () => { const d = new Date(); d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); return d; } },
            ].map((opt) => {
              const optDate = opt.getDate();
              const isActive = reminderDate && Math.abs(reminderDate.getTime() - optDate.getTime()) < 60000;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => setReminderDate(isActive ? null : optDate)}
                  style={[styles.reminderChip, { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reminderChipText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
            {reminderDate && (
              <TouchableOpacity onPress={() => setReminderDate(null)} style={styles.reminderClear} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
          {reminderDate && (
            <Text style={[styles.reminderDateText, { color: colors.primary }]}>
              {t(locale, 'nuevaNota.reminderSet')}: {reminderDate.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>

        {/* Location section */}
        <View style={[styles.section, { marginTop: 16 }]}>
          <TouchableOpacity
            onPress={async () => {
              if (locationData) { setLocationData(null); return; }
              setLocating(true);
              const loc = await getCurrentLocation();
              if (loc) setLocationData(loc);
              setLocating(false);
            }}
            style={[styles.locationBtn, { backgroundColor: locationData ? colors.primary + '15' : colors.surface, borderColor: locationData ? colors.primary + '30' : colors.border }]}
            activeOpacity={0.7}
            disabled={locating}
          >
            <Ionicons name={locating ? 'hourglass-outline' : locationData ? 'location' : 'location-outline'} size={18} color={locationData ? colors.primary : colors.textSecondary} />
            <Text style={[styles.locationBtnText, { color: locationData ? colors.primary : colors.textSecondary }]}>
              {locating ? t(locale, 'common.loading') : locationData ? (locationData.name || t(locale, 'nuevaNota.locationSet')) : t(locale, 'nuevaNota.addLocation')}
            </Text>
            {locationData && <Ionicons name="close-circle" size={18} color={colors.textTertiary} style={{ marginLeft: 'auto' }} />}
          </TouchableOpacity>
        </View>
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
  ideaAccentBar: { height: 4, borderRadius: 2, marginBottom: 20, opacity: 0.6 },
  ideaTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  ideaTitleInput: { flex: 1, fontSize: 26, fontWeight: '800', paddingVertical: 4 },
  ideaPinBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ideaColorSection: { marginBottom: 40 },
  ideaColorLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  ideaColorRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  ideaColorSwatch: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  ideaColorSwatchActive: { borderWidth: 3, borderColor: '#FFFFFF' },
  ideaBodyInput: { fontSize: 16, lineHeight: 24, minHeight: 100, paddingVertical: 4, marginBottom: 8 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  ideaTagsSection: { marginBottom: 28 },
  ideaTagsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ideaTagsLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  ideaTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  ideaTag: {
    borderRadius: 14, minHeight: 46, paddingLeft: 14, paddingRight: 8, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  ideaTagTextButton: { paddingVertical: 8, paddingRight: 8 },
  ideaTagText: { fontSize: 15, fontWeight: '600' },
  ideaTagEditInput: { fontSize: 15, fontWeight: '600', paddingVertical: 8, minWidth: 72, paddingRight: 8 },
  ideaTagRemoveBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 2,
  },
  ideaTagRemove: { fontSize: 16, lineHeight: 16, color: '#ef4444', fontWeight: '800' },
  ideaAddTagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ideaTagInput: { flex: 1, fontSize: 16, paddingVertical: 12, borderBottomWidth: 1, minHeight: 48 },
  ideaAddTagBtn: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  ideaAddTagBtnText: { fontSize: 26, color: '#FFFFFF', fontWeight: '400', marginTop: -1 },
  section: { marginBottom: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  reminderChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  reminderChipText: { fontSize: 13, fontWeight: '600' },
  reminderClear: { padding: 4 },
  reminderDateText: { fontSize: 12, fontWeight: '500', marginTop: 8 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  locationBtnText: { fontSize: 14, fontWeight: '500' },
});
