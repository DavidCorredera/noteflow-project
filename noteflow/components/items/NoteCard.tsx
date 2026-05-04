import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Note } from '../../types';

interface Props {
  note: Note;
  onPress: () => void;
}

export default function NoteCard({ note, onPress }: Props) {
  const theme = useTheme();

  // Formatear la fecha simple
  const dateStr = new Date(note.updatedAt).toLocaleDateString();

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1 }}>
            {note.title}
          </Text>
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {dateStr}
          </Text>
        </View>
        <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          {note.content}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, marginHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
});