import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { ChecklistNote } from '../../types';
import { AppColors } from '../../constants/theme';
import { useLocaleStore } from '../../store/localeStore';
import { t } from '../../i18n';

interface Props {
  note: ChecklistNote;
  onPress: () => void;
  colors: AppColors;
  mode?: 'full';
  folderColor?: string;
}

export default function ChecklistCard({ note, onPress, colors, mode, folderColor }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const totalItems = note.items.length;
  const completedItems = note.items.filter(i => i.isCompleted).length;
  const progress = totalItems === 0 ? 0 : completedItems / totalItems;
  const progressPercent = Math.round(progress * 100);
  const highCount = note.items.filter(i => i.priority === 'high' && !i.isCompleted).length;
  const Card = Platform.OS === 'ios' ? BlurView : View;
  const isFull = mode === 'full';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={isFull ? styles.touchableFull : styles.touchable}>
      {folderColor && <View style={[styles.folderStripe, { backgroundColor: folderColor }]} />}
      <Card intensity={60} tint="light" style={[isFull ? styles.cardFull : styles.cardGrid, { borderColor: colors.borderLight, shadowColor: colors.cardShadow, backgroundColor: colors.surface }]}>
        <View style={isFull ? styles.headerFull : undefined}>
          <Text style={[isFull ? styles.titleFull : styles.titleGrid, { color: colors.text }]} numberOfLines={isFull ? 1 : 2}>{note.title}</Text>
          {totalItems > 0 && (
            <Text style={[styles.percent, { color: progress === 1 ? '#22c55e' : colors.primary }]}>{progressPercent}%</Text>
          )}
        </View>
        {totalItems > 0 && (
          <>
            <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.progressFill, { backgroundColor: progress === 1 ? '#22c55e' : colors.primary, width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.footer}>
              <Text style={[styles.count, { color: colors.textTertiary }]}>{completedItems}/{totalItems}</Text>
              {highCount > 0 && (
                <View style={styles.highBadge}>
                  <Text style={styles.highBadgeUrg}>{t(locale, 'badge.urgent')}</Text>
                  <Text style={styles.highBadgeNum}>{highCount}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { flex: 1, position: 'relative' },
  touchableFull: { position: 'relative' },
  folderStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 14, borderTopRightRadius: 14, zIndex: 1 },
  cardGrid: {
    borderRadius: 14, padding: 14, aspectRatio: 1, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 4, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  cardFull: {
    borderRadius: 16, padding: 16, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 4, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  headerFull: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  titleGrid: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  titleFull: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  percent: { fontSize: 20, fontWeight: '800' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  count: { fontSize: 11, fontWeight: '600' },
  highBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ef444418',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  highBadgeUrg: { fontSize: 9, fontWeight: '700', color: '#ef4444' },
  highBadgeNum: {
    fontSize: 10, fontWeight: '800', color: '#FFFFFF',
    backgroundColor: '#ef4444',
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
    lineHeight: 14,
  },
});
