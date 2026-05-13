import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IdeaNote } from '../../types';
import { AppColors } from '../../constants/theme';

interface Props {
  note: IdeaNote;
  onPress: () => void;
  colors: AppColors;
}

export default function IdeaCard({ note, onPress, colors }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight, shadowColor: colors.cardShadow }]} activeOpacity={0.7}>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
      {note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10,
    borderWidth: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  title: { fontSize: 16, fontWeight: '700' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '600' },
});
