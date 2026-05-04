import { View, StyleSheet } from 'react-native';
    import { Card, Text, Chip } from 'react-native-paper';
    import { IdeaNote } from '../../types';

    interface Props {
      note: IdeaNote;
      onPress: () => void;
    }

    export default function IdeaCard({ note, onPress }: Props) {
      return (
        <Card style={[styles.card, { backgroundColor: note.color }]} onPress={onPress} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" numberOfLines={1}>{note.title}</Text>
            {note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {note.tags.map(tag => (
                  <Chip key={tag} compact style={styles.chip} textStyle={{ fontSize: 10 }}>
                    {tag}
                  </Chip>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      );
    }

    const styles = StyleSheet.create({
      card: { marginBottom: 12, marginHorizontal: 16 },
      tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 4 },
      chip: { height: 24, paddingVertical: 0 }
    });