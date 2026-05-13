import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Note } from '../../types';
import { AppColors } from '../../constants/theme';

interface Props {
  note: Note;
  onPress: () => void;
  colors: AppColors;
}

export default function NoteCard({ note, onPress, colors }: Props) {
  const dateStr = new Date(note.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.cardShadow }]} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{dateStr}</Text>
      </View>
      <Text style={[styles.content, { color: colors.textSecondary }]} numberOfLines={2}>{note.content}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  date: { fontSize: 12, fontWeight: '500' },
  content: { fontSize: 14, lineHeight: 20 },
});
