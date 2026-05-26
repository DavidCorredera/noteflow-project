import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
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
  const Card = Platform.OS === 'ios' ? BlurView : View;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card intensity={60} tint="light" style={[styles.card, { borderColor: colors.border, shadowColor: colors.cardShadow, ...(Platform.OS === 'android' && { backgroundColor: colors.surface }) }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
          <Text style={[styles.count, { color: colors.primary }]}>{completedItems}/{totalItems}</Text>
        </View>
        <View style={[styles.progressBg, { backgroundColor: colors.borderLight }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 16, marginHorizontal: 20, marginBottom: 10,
    borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  count: { fontSize: 13, fontWeight: '700' },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
});
