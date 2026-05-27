import { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';

const IDEA_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
  const colors = getColors(isDarkMode);
  const idea = useNotesStore(s => s.ideas.find(i => i.id === id));
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateIdea = useNotesStore(s => s.updateIdea);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editingTagIdx, setEditingTagIdx] = useState<number | null>(null);
  const [editingTagText, setEditingTagText] = useState('');
  const [pinned, setPinned] = useState(false);
  const [ideaColor, setIdeaColor] = useState(IDEA_COLORS[0]);
  const hasChanges = useRef(false);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const tagsRef = useRef(tags);
  const pinnedRef = useRef(pinned);
  const colorRef = useRef(ideaColor);

  useLayoutEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setContent(idea.content ?? '');
      setTags(idea.tags || []);
      setPinned(idea.pinned ?? false);
      setIdeaColor(idea.color || IDEA_COLORS[0]);
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
  }, [idea, navigation, colors]);

  useEffect(() => { titleRef.current = title; contentRef.current = content; tagsRef.current = tags; pinnedRef.current = pinned; colorRef.current = ideaColor; }, [title, content, tags, pinned, ideaColor]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (hasChanges.current && idea) {
        updateIdea(idea.id, { title: titleRef.current, content: contentRef.current || undefined, tags: tagsRef.current, pinned: pinnedRef.current, color: colorRef.current });
      }
    });
    return unsubscribe;
  }, [navigation, idea]);

  if (!idea) return null;

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleDelete = () => {
    Alert.alert(t(locale, 'common.delete') + ' idea', t(locale, 'common.confirmDelete'), [
      { text: t(locale, 'common.cancel'), style: 'cancel' },
      { text: t(locale, 'common.delete'), style: 'destructive', onPress: () => { deleteNote(idea.id); router.back(); } },
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

  const handleRemoveTag = (tag: string) => saveTags(tags.filter(t => t !== tag));

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

  const togglePinned = () => {
    setPinned(!pinned);
    hasChanges.current = true;
    if (idea) updateIdea(idea.id, { pinned: !pinned });
  };

  const pickColor = (c: string) => {
    setIdeaColor(c);
    hasChanges.current = true;
    if (idea) updateIdea(idea.id, { color: c });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.accentBar, { backgroundColor: ideaColor }]} />

      <View style={styles.titleRow}>
        <TextInput autoCapitalize="none" autoCorrect={false}
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); hasChanges.current = true; }}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity onPress={togglePinned} style={[styles.pinBtn, { backgroundColor: pinned ? ideaColor + '20' : colors.surface }]} activeOpacity={0.7}>
          <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={18} color={pinned ? ideaColor : colors.textTertiary} />
        </TouchableOpacity>
      </View>

      <TextInput autoCapitalize="none" autoCorrect={false}
        style={[styles.bodyInput, { color: colors.text }]}
        value={content}
        onChangeText={(t) => { setContent(t); hasChanges.current = true; }}
        placeholder={t(locale, 'idea.write')}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
      />

      {content.trim() ? (
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{charCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'common.characters')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{wordCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'common.words')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{tags.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{t(locale, 'common.tags')}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.tagsSection}>
        <View style={styles.tagsHeader}>
          <Text style={[styles.tagsLabel, { color: colors.textTertiary }]}>{t(locale, 'common.tags')}</Text>
        </View>
        <View style={styles.tagsContainer}>
          {tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={[styles.tag, { backgroundColor: colors.ideaColors[idx % colors.ideaColors.length] }]}>
              {editingTagIdx === idx ? (
                <TextInput autoCapitalize="none" autoCorrect={false}
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
          <TextInput autoCapitalize="none" autoCorrect={false}
            style={[styles.tagInput, { color: colors.text, borderBottomColor: colors.border }]}
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
            placeholder={t(locale, 'idea.newTag')}
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity
            onPress={handleAddTag}
            disabled={!tagInput.trim()}
            style={[styles.addTagBtn, { backgroundColor: ideaColor, opacity: tagInput.trim() ? 1 : 0.45 }]}
            activeOpacity={0.85}
          >
            <Text style={styles.addTagBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.colorSection}>
        <Text style={[styles.colorLabel, { color: colors.textTertiary }]}>{t(locale, 'common.color')}</Text>
        <View style={styles.colorRow}>
          {IDEA_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => pickColor(c)}
              style={[
                styles.colorSwatch,
                { backgroundColor: c },
                ideaColor === c && styles.colorSwatchActive,
                ideaColor === c && { borderColor: c },
              ]}
              activeOpacity={0.7}
            >
              {ideaColor === c && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: Platform.OS === 'ios' ? 16 : 72, paddingBottom: 60 },
  headerAction: { fontSize: 15, fontWeight: '600' },
  accentBar: { height: 4, borderRadius: 2, marginBottom: 20, opacity: 0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  titleInput: { flex: 1, fontSize: 26, fontWeight: '800', paddingVertical: 4 },
  pinBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bodyInput: { fontSize: 16, lineHeight: 24, minHeight: 120, paddingVertical: 4, marginBottom: 16 },
  statsRow: {
    flexDirection: 'row', borderRadius: 12, padding: 14, marginBottom: 28,
    borderWidth: 1, alignItems: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  tagsSection: { marginBottom: 28 },
  tagsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  tag: {
    borderRadius: 14, minHeight: 46, paddingLeft: 14, paddingRight: 8, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  tagTextButton: { paddingVertical: 8, paddingRight: 8 },
  tagText: { fontSize: 15, fontWeight: '600' },
  tagEditInput: { fontSize: 15, fontWeight: '600', paddingVertical: 8, minWidth: 72, paddingRight: 8 },
  tagRemoveBtn: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 2,
  },
  tagRemove: { fontSize: 16, lineHeight: 16, color: '#ef4444', fontWeight: '800' },
  addTagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tagInput: { flex: 1, fontSize: 16, paddingVertical: 12, borderBottomWidth: 1, minHeight: 48 },
  addTagBtn: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  addTagBtnText: { fontSize: 26, color: '#FFFFFF', fontWeight: '400', marginTop: -1 },
  colorSection: { marginBottom: 40 },
  colorLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  colorSwatch: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  colorSwatchActive: { borderWidth: 3, borderColor: '#FFFFFF' },
});
