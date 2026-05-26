import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { IdeaNote } from '../../types';
import { AppColors } from '../../constants/theme';

interface Props {
  note: IdeaNote;
  onPress: () => void;
  colors: AppColors;
}

export default function IdeaCard({ note, onPress, colors }: Props) {
  const Card = Platform.OS === 'ios' ? BlurView : View;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card intensity={60} tint="light" style={[styles.card, { borderColor: colors.border, shadowColor: colors.cardShadow }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
        {note.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {note.tags.map((tag, idx) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.ideaColors[idx % colors.ideaColors.length] }]}>
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
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
  title: { fontSize: 15, fontWeight: '700' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600' },
});
