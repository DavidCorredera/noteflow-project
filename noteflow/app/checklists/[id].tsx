import { useState, useLayoutEffect, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useNotesStore } from '../../store/notesStore';
import { useThemeStore } from '../../store/themeStore';
import { getColors } from '../../constants/theme';
import { ItemPriority } from '../../types';
import { useLocaleStore } from '../../store/localeStore';
import { useFolderStore } from '../../store/folderStore';
import { t } from '../../i18n';
import { scheduleReminder, cancelReminder } from '../../lib/notifications';
import { getCurrentLocation } from '../../lib/location';

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

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const locale = useLocaleStore((s) => s.locale);
  const colors = getColors(isDarkMode);
  const checklist = useNotesStore(s => s.checklists.find(c => c.id === id));
  const toggleItem = useNotesStore(s => s.toggleChecklistItem);
  const addItem = useNotesStore(s => s.addChecklistItem);
  const deleteItem = useNotesStore(s => s.deleteChecklistItem);
  const updateItem = useNotesStore(s => s.updateChecklistItem);
  const updateItemPriority = useNotesStore(s => s.updateItemPriority);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const updateChecklist = useNotesStore(s => s.updateChecklist);

  const [title, setTitle] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [newPriority, setNewPriority] = useState<ItemPriority>('none');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all');
  const editInputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [locationData, setLocationData] = useState<{ latitude: number; longitude: number; name: string | null } | null>(null);
  const [locating, setLocating] = useState(false);
  const hasTitleChanges = useRef(false);
  const loadedIdRef = useRef<string | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const folders = useFolderStore((s) => s.foldersByType.checklist);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);
  const titleRef = useRef(title);
  const folderIdRef = useRef(folderId);
  const reminderDateRef = useRef<Date | null>(null);
  const locationDataRef = useRef(locationData);

  useLayoutEffect(() => {
    if (checklist) {
      if (checklist.id !== loadedIdRef.current) {
        loadedIdRef.current = checklist.id;
        setTitle(checklist.title);
        setReminderDate(checklist.reminderDate ? new Date(checklist.reminderDate) : null);
        setLocationData(checklist.latitude ? { latitude: checklist.latitude, longitude: checklist.longitude ?? 0, name: null } : null);
        setFolderId(checklist.folderId ?? null);
        hasTitleChanges.current = false;
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
  }, [checklist?.id, navigation, colors]);

  useEffect(() => {
    titleRef.current = title;
    reminderDateRef.current = reminderDate;
    locationDataRef.current = locationData;
    folderIdRef.current = folderId;
  }, [title, reminderDate, locationData, folderId]);

  useEffect(() => {
    fetchFolders('checklist');
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if ((hasTitleChanges.current || reminderDateRef.current || locationDataRef.current) && checklist) {
        updateChecklist(checklist.id, {
          title: titleRef.current,
          reminderDate: reminderDateRef.current?.toISOString(),
          latitude: locationDataRef.current?.latitude,
          longitude: locationDataRef.current?.longitude,
          folderId: folderIdRef.current ?? undefined,
        });
      }
    });
    return unsubscribe;
  }, [navigation, checklist]);

  if (!checklist) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFound, { color: colors.textTertiary }]}>{t(locale, 'checklist.notFound')}</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(t(locale, 'common.delete') + ' tarea', t(locale, 'common.confirmDelete'), [
      { text: t(locale, 'common.cancel'), style: 'cancel' },
      { text: t(locale, 'common.delete'), style: 'destructive', onPress: () => { deleteNote(checklist.id); router.back(); } },
    ]);
  };

  const handleAddItem = async () => {
    const trimmedText = newItemText.trim();
    if (!trimmedText) return;
    setNewItemText('');
    setNewPriority('none');
    await addItem(checklist.id, trimmedText, newPriority);
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleStartEditItem = (itemId: string, currentText: string) => {
    setEditingItemId(itemId);
    setEditingItemText(currentText);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleFinishEditItem = () => {
    if (editingItemId && editingItemText.trim()) {
      updateItem(checklist.id, editingItemId, editingItemText.trim());
    }
    setEditingItemId(null);
    setEditingItemText('');
  };

  const totalItems = checklist.items.length;
  const completedItems = checklist.items.filter(i => i.isCompleted).length;
  const progress = totalItems === 0 ? 0 : completedItems / totalItems;
  const progressPercent = Math.round(progress * 100);
  const bottomInset = Math.max(12, insets.bottom);
  const ringSize = 80;
  const ringStroke = 7;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringOffset = ringCirc * (1 - progress);

  const filteredItems = useMemo(() => {
    const items = checklist.items;
    if (filter === 'active') return items.filter(i => !i.isCompleted);
    if (filter === 'done') return items.filter(i => i.isCompleted);
    return items;
  }, [checklist.items, filter]);

  const highCount = checklist.items.filter(i => i.priority === 'high').length;
  const overdueCount = 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior='padding'
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TextInput autoCapitalize="none" autoCorrect={false}
          style={[styles.titleInput, { color: colors.text }]}
          value={title}
          onChangeText={(t) => { setTitle(t); hasTitleChanges.current = true; }}
          placeholderTextColor={colors.textTertiary}
          placeholder={t(locale, 'checklist.placeholder')}
        />

        {totalItems > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.ringContainer}>
              <Svg width={ringSize} height={ringSize}>
                <Circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke={colors.borderLight} strokeWidth={ringStroke} fill="none" />
                <Circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  stroke={colors.primary}
                  strokeWidth={ringStroke}
                  fill="none"
                  strokeDasharray={ringCirc}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                />
              </Svg>
              <Text style={[styles.ringText, { color: colors.text }]}>{progressPercent}%</Text>
            </View>
            <View style={styles.statsTextCol}>
              <Text style={[styles.statsBig, { color: colors.text }]}>{completedItems}/{totalItems}</Text>
              <Text style={[styles.statsSmall, { color: colors.textTertiary }]}>{t(locale, 'checklist.completed')}</Text>
              <View style={styles.statsBadgeRow}>
                {highCount > 0 && (
                  <View style={[styles.statBadge, { backgroundColor: '#ef444418' }]}>
                    <Text style={[styles.statBadgeText, { color: '#ef4444' }]}>{highCount} {t(locale, highCount > 1 ? 'checklist.highPlural' : 'checklist.high')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Filter tabs */}
      {totalItems > 0 && (
        <View style={[styles.filterSegmented, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
          {(['all', 'active', 'done'] as const).map((f) => {
            const count = f === 'all' ? totalItems : f === 'active' ? totalItems - completedItems : completedItems;
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterSegBtn, isActive ? { backgroundColor: colors.primary } : null]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterSegText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                  {f === 'all' ? t(locale, 'checklist.all') : f === 'active' ? t(locale, 'checklist.active') : t(locale, 'checklist.done')} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* List */}
      <FlatList
        ref={listRef}
        data={filteredItems}
        keyExtractor={item => item.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: 20, paddingTop: totalItems > 0 ? 0 : 40 }}
        ListEmptyComponent={
          <View style={styles.emptyList}>
            <Ionicons name="list-outline" size={48} color={colors.textTertiary + '60'} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {filter === 'all' ? t(locale, 'checklist.noItems') : filter === 'active' ? t(locale, 'checklist.noActive') : t(locale, 'checklist.noDone')}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.reminderLocationFooter}>
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
                          scheduleReminder(title || checklist.title, optDate);
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
                    <TouchableOpacity onPress={() => setReminderDate(null)} style={styles.reminderClear} activeOpacity={0.7}>
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

            {/* Folder */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>Carpeta</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => { setFolderId(null); hasTitleChanges.current = true; }}
                  style={[styles.folderChip, { borderColor: colors.border, backgroundColor: !folderId ? colors.primary + '15' : colors.surface }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="folder-open-outline" size={16} color={!folderId ? colors.primary : colors.textTertiary} />
                  <Text style={[styles.folderChipText, { color: !folderId ? colors.primary : colors.textTertiary }]}>Sin carpeta</Text>
                </TouchableOpacity>
                {folders.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => { setFolderId(f.id); hasTitleChanges.current = true; }}
                    style={[styles.folderChip, { borderColor: f.color + '40', backgroundColor: folderId === f.id ? f.color + '20' : colors.surface }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="folder-outline" size={16} color={f.color} />
                    <Text style={[styles.folderChipText, { color: folderId === f.id ? f.color : colors.textSecondary }]}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const p = (item.priority || 'none') as ItemPriority;
          const pColor = PRIORITY_COLORS[p];
          const editing = editingItemId === item.id;
          return (
            <TouchableOpacity
              activeOpacity={0.95}
              onLongPress={() => handleStartEditItem(item.id, item.text)}
              style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.borderLight, borderLeftColor: pColor }]}
            >
              <TouchableOpacity onPress={() => toggleItem(checklist.id, item.id, item.isCompleted)} activeOpacity={0.7} style={styles.checkboxTouchable}>
                <View style={[styles.checkbox, {
                  borderColor: item.isCompleted ? colors.primary : colors.textTertiary,
                  backgroundColor: item.isCompleted ? colors.primary : 'transparent',
                }]}>
                  {item.isCompleted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>

              {editing ? (
                <TextInput autoCapitalize="none" autoCorrect={false}
                  ref={editInputRef}
                  style={[styles.itemEditInput, { color: colors.text, borderBottomColor: colors.primary }]}
                  value={editingItemText}
                  onChangeText={setEditingItemText}
                  onBlur={handleFinishEditItem}
                  onSubmitEditing={handleFinishEditItem}
                  returnKeyType="done"
                />
              ) : (
                <TouchableOpacity onPress={() => handleStartEditItem(item.id, item.text)} style={styles.itemTextTouchable}>
                  <Text style={[
                    styles.itemText,
                    { color: item.isCompleted ? colors.textTertiary : colors.text },
                    item.isCompleted && styles.itemTextDone,
                  ]} numberOfLines={2}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Priority cycle button */}
              <TouchableOpacity
                onPress={() => updateItemPriority(checklist.id, item.id, nextPriority(p))}
                style={[styles.prioBtn, { backgroundColor: pColor + '18' }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name={PRIORITY_ICONS[p]} size={14} color={pColor} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteItem(checklist.id, item.id)} style={styles.removeItem} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      {/* Bottom input */}
      <View style={[styles.inputContainer, {
        backgroundColor: colors.surface,
        borderTopColor: colors.borderLight,
        paddingBottom: bottomInset + 6,
      }]}>
        <View style={styles.inputRow}>
          <TextInput autoCapitalize="none" autoCorrect={false}
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
            placeholder={t(locale, 'checklist.newItem')}
            placeholderTextColor={colors.textTertiary}
            value={newItemText}
            onChangeText={setNewItemText}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={handleAddItem} style={[styles.addButton, { backgroundColor: colors.primary }]} activeOpacity={0.7}>
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.prioRow}>
          {(['low', 'medium', 'high'] as ItemPriority[]).map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setNewPriority(p)}
              style={[styles.prioChip, {
                borderColor: PRIORITY_COLORS[p],
                backgroundColor: newPriority === p ? PRIORITY_COLORS[p] + '20' : 'transparent',
              }]}
              activeOpacity={0.75}
            >
              <Ionicons name={PRIORITY_ICONS[p]} size={12} color={PRIORITY_COLORS[p]} />
              <Text style={[styles.prioChipText, { color: PRIORITY_COLORS[p] }]}>
                {t(locale, `priority.${p}`)}
              </Text>
            </TouchableOpacity>
          ))}
          {newPriority !== 'none' && (
            <TouchableOpacity onPress={() => setNewPriority('none')} style={styles.prioClear} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 15 },
  headerAction: { fontSize: 15, fontWeight: '600' },

  header: { paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 16 : 72, paddingBottom: 8 },
  titleInput: { fontSize: 24, fontWeight: '800', marginBottom: 8, paddingVertical: 4 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 4 },
  ringContainer: { position: 'relative', width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 16, fontWeight: '800' },
  statsTextCol: { flex: 1 },
  statsBig: { fontSize: 26, fontWeight: '800' },
  statsSmall: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  statsBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  statBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statBadgeText: { fontSize: 11, fontWeight: '700' },

  filterSegmented: {
    flexDirection: 'row', gap: 4, marginHorizontal: 24, marginTop: 12, marginBottom: 8,
    borderRadius: 16, borderWidth: 1, padding: 4,
  },
  filterSegBtn: {
    flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 8,
  },
  filterSegText: { fontSize: 13, fontWeight: '700' },

  list: { flex: 1, paddingHorizontal: 24 },
  emptyList: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },

  itemCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    marginBottom: 6, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4, gap: 10,
  },
  checkboxTouchable: { paddingRight: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemTextTouchable: { flex: 1, paddingVertical: 2 },
  itemText: { fontSize: 15, lineHeight: 20 },
  itemTextDone: { textDecorationLine: 'line-through' },
  itemEditInput: { flex: 1, fontSize: 15, paddingVertical: 2, borderBottomWidth: 1, marginRight: 4 },

  prioBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  removeItem: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  inputContainer: {
    paddingHorizontal: 24, paddingVertical: 10, borderTopWidth: 1, gap: 8,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  addButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  prioRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingLeft: 2 },
  prioChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  prioChipText: { fontSize: 11, fontWeight: '700' },
  prioClear: { marginLeft: 'auto' },
  reminderLocationFooter: { paddingTop: 16, paddingBottom: 8 },
  section: { marginBottom: 16 },
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
  },
  folderChipText: { fontSize: 13, fontWeight: '600' },
});
