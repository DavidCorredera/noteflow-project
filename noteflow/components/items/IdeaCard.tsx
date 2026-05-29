import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IdeaNote } from '../../types';
import { AppColors } from '../../constants/theme';

interface Props {
  note: IdeaNote;
  onPress: () => void;
  colors: AppColors;
  folderColor?: string;
}

const PREVIEW_LENGTH = 80;

export default function IdeaCard({ note, onPress, colors, folderColor }: Props) {
  const Card = Platform.OS === 'ios' ? BlurView : View;
  const accentColor = note.color || colors.primary;

  const preview = note.content
    ? note.content.length > PREVIEW_LENGTH
      ? note.content.slice(0, PREVIEW_LENGTH) + '...'
      : note.content
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
      {folderColor && <View style={[styles.folderStripe, { backgroundColor: folderColor }]} />}
      <Card intensity={60} tint="light" style={[styles.card, { borderColor: colors.borderLight, shadowColor: colors.cardShadow, backgroundColor: colors.surface }]}>
        <View style={[styles.accentLine, { backgroundColor: accentColor }]} />
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={3}>{note.title}</Text>
          {note.pinned && (
            <Ionicons name="pin" size={14} color={accentColor} style={styles.pinIcon} />
          )}
        </View>
        {preview && (
          <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>{preview}</Text>
        )}
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
  touchable: { flex: 1, position: 'relative' },
  folderStripe: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderTopLeftRadius: 14, borderTopRightRadius: 14, zIndex: 1 },
  card: {
    borderRadius: 14, padding: 14, aspectRatio: 1, borderWidth: 1,
    shadowOffset: { width: 4, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    overflow: 'hidden',
  },
  accentLine: { height: 3, borderRadius: 2, marginBottom: 10, opacity: 0.5 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', lineHeight: 20 },
  pinIcon: { marginLeft: 4, marginTop: 2 },
  preview: { fontSize: 13, lineHeight: 17, marginTop: 6, opacity: 0.7 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 'auto', paddingTop: 10, gap: 6 },
  tag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '600' },
});
