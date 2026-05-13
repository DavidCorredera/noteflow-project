import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChecklistNote } from '../../types';
import { AppColors } from '../../constants/theme';

interface Props {
  note: ChecklistNote;
  onPress: () => void;
  colors: AppColors;
}

export default function ChecklistCard({ note, onPress, colors }: Props) {
  const totalItems = note.items.length;
  const completedItems = note.items.filter(i => i.isCompleted).length;
  const progress = totalItems === 0 ? 0 : completedItems / totalItems;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.cardShadow }]} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
        <Text style={[styles.count, { color: colors.primary }]}>{completedItems}/{totalItems}</Text>
      </View>
      <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  count: { fontSize: 13, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
});
