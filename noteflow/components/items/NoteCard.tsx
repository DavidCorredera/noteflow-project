import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { Note } from '../../types';
import { AppColors } from '../../constants/theme';
import { getNotePlainTextPreview, parseNoteContent } from '../../lib/noteContent';

interface Props {
  note: Note;
  onPress: () => void;
  colors: AppColors;
}

export default function NoteCard({ note, onPress, colors }: Props) {
  const preview = getNotePlainTextPreview(note.content);
  const sketchCount = parseNoteContent(note.content).sketches.length;
  const Card = Platform.OS === 'ios' ? BlurView : View;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.touchable}>
      <Card intensity={60} tint="light" style={[styles.card, { borderColor: colors.borderLight, shadowColor: colors.cardShadow, backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{note.title}</Text>
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={3}>{preview || 'Sin contenido'}</Text>
        {sketchCount > 0 && (
          <Text style={[styles.badge, { color: colors.primary }]}>{sketchCount} lienzo{sketchCount === 1 ? '' : 's'}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { flex: 1 },
  card: {
    borderRadius: 14, padding: 14, aspectRatio: 1, borderWidth: 1,
    shadowOffset: { width: 4, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  preview: { fontSize: 12, lineHeight: 16, marginTop: 8, flex: 1 },
  badge: { fontSize: 11, fontWeight: '700', marginTop: 'auto', paddingTop: 8 },
});
