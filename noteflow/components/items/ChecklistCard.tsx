import { View, StyleSheet } from 'react-native';
    import { Card, Text, ProgressBar, useTheme } from 'react-native-paper';
    import { ChecklistNote } from '../../types';

    interface Props {
      note: ChecklistNote;
      onPress: () => void;
    }

    export default function ChecklistCard({ note, onPress }: Props) {
      const theme = useTheme();
      const totalItems = note.items.length;
      const completedItems = note.items.filter(i => i.isCompleted).length;
      const progress = totalItems === 0 ? 0 : completedItems / totalItems;

      return (
        <Card style={styles.card} onPress={onPress} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" numberOfLines={1}>{note.title}</Text>
            <View style={styles.progressContainer}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <ProgressBar progress={progress} color={theme.colors.primary} style={{ height: 6, borderRadius: 3 }} />
              </View>
              <Text variant="labelMedium" style={{ color: theme.colors.outline }}>
                {completedItems}/{totalItems}
              </Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    const styles = StyleSheet.create({
      card: { marginBottom: 12, marginHorizontal: 16 },
      progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12 }
    });