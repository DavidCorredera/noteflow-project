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
  const dateStr = new Date(note.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const preview = getNotePlainTextPreview(note.content);
  const sketchCount = parseNoteContent(note.content).sketches.length;
  const Card = Platform.OS === 'ios' ? BlurView : View;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card intensity={60} tint="light" style={[styles.card, { borderColor: colors.border, shadowColor: colors.cardShadow, ...(Platform.OS === 'android' && { backgroundColor: colors.surface }) }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{note.title}</Text>
          <Text style={[styles.date, { color: colors.textTertiary }]}>{dateStr}</Text>
        </View>
        <Text style={[styles.content, { color: colors.textSecondary }]} numberOfLines={2}>{preview || 'Sin contenido todavia'}</Text>
        {sketchCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {sketchCount} lienzo{sketchCount === 1 ? '' : 's'}
            </Text>
          </View>
        ) : null}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  date: { fontSize: 12, fontWeight: '500' },
  content: { fontSize: 13, lineHeight: 19 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
