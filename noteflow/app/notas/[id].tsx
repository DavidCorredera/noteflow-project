import { useState, useLayoutEffect, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';
import NoteComposer from '../../components/notes/NoteComposer';
import { NoteImage, NoteSketch, parseNoteContent, serializeNoteContent } from '../../lib/noteContent';
import { scheduleReminder, cancelReminder } from '../../lib/notifications';
import { getCurrentLocation } from '../../lib/location';
import { useFolderStore } from '../../store/folderStore';

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
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; name: string | null } | null>(null);
  const [locating, setLocating] = useState(false);
  const [folderId, setFolderId] = useState<string | null>(note?.folderId ?? null);
  const folders = useFolderStore((s) => s.foldersByType.note);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);
  const hasChanges = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const titleRef = useRef(title);
  const bodyRef = useRef(body);
  const sketchesRef = useRef(sketches);
  const imagesRef = useRef(images);
  const reminderDateRef = useRef<Date | null>(null);
  const locationDataRef = useRef(locationData);
  const folderIdRef = useRef(folderId);

  useLayoutEffect(() => {
    if (note) {
      if (note.id !== loadedIdRef.current) {
        loadedIdRef.current = note.id;
        const parsedContent = parseNoteContent(note.content);
        setTitle(note.title);
        setBody(parsedContent.body);
        setSketches(parsedContent.sketches);
        setImages(parsedContent.images);
        setReminderDate(note.reminderDate ? new Date(note.reminderDate) : null);
        setLocationData(note.latitude ? { latitude: note.latitude, longitude: note.longitude ?? 0, name: null } : null);
        if (note.folderId !== undefined) setFolderId(note.folderId ?? null);
        hasChanges.current = false;
      }
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
  }, [note?.id, navigation, colors]);

  useEffect(() => {
    titleRef.current = title;
    bodyRef.current = body;
    sketchesRef.current = sketches;
    imagesRef.current = images;
    reminderDateRef.current = reminderDate;
    locationDataRef.current = locationData;
    folderIdRef.current = folderId;
  }, [title, body, sketches, images, reminderDate, locationData, folderId]);

  useEffect(() => {
    fetchFolders('note');
  }, []);

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
          reminderDate: reminderDateRef.current?.toISOString(),
          latitude: locationDataRef.current?.latitude,
          longitude: locationDataRef.current?.longitude,
          folderId: folderIdRef.current ?? undefined,
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
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(180, insets.bottom + 160) }]}
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

        {/* Reminder */}
        <View style={styles.section}>
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
                  onPress={() => {
                    if (isActive) {
                      setReminderDate(null);
                    } else {
                      setReminderDate(optDate);
                      scheduleReminder(title || note.title, optDate);
                      hasChanges.current = true;
                    }
                  }}
                  style={[styles.reminderChip, { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.reminderChipText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
            {reminderDate && (
              <>
                <Text style={[styles.reminderDateText, { color: colors.primary }]}>
                  {t(locale, 'nuevaNota.reminderSet')}: {reminderDate.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
                <TouchableOpacity onPress={() => { setReminderDate(null); hasChanges.current = true; }} style={styles.reminderClear} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={async () => {
              if (locationData) { setLocationData(null); hasChanges.current = true; return; }
              setLocating(true);
              const loc = await getCurrentLocation();
              if (loc) { setLocationData(loc); hasChanges.current = true; }
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

        {/* Folder */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Carpeta</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
            <TouchableOpacity
              onPress={() => { setFolderId(null); hasChanges.current = true; }}
              style={[styles.folderChip, { borderColor: colors.border, backgroundColor: !folderId ? colors.primary + '15' : colors.surface }]}
              activeOpacity={0.7}
            >
              <Ionicons name="folder-open-outline" size={16} color={!folderId ? colors.primary : colors.textTertiary} />
              <Text style={[styles.folderChipText, { color: !folderId ? colors.primary : colors.textTertiary }]}>Sin carpeta</Text>
            </TouchableOpacity>
            {folders.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => { setFolderId(f.id); hasChanges.current = true; }}
                style={[styles.folderChip, { borderColor: f.color + '40', backgroundColor: folderId === f.id ? f.color + '20' : colors.surface }]}
                activeOpacity={0.7}
              >
                <Ionicons name="folder-outline" size={16} color={f.color} />
                <Text style={[styles.folderChipText, { color: folderId === f.id ? f.color : colors.textSecondary }]}>{f.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
  section: { marginBottom: 8, marginTop: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  reminderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  reminderChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  reminderChipText: { fontSize: 13, fontWeight: '600' },
  reminderClear: { padding: 4 },
  reminderDateText: { fontSize: 12, fontWeight: '500' },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  locationBtnText: { fontSize: 14, fontWeight: '500' },
  folderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    marginRight: 8,
  },
  folderChipText: { fontSize: 13, fontWeight: '600' },
});
