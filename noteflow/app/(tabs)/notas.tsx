import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function NotasScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="headlineMedium">Mis Notas</Text>
    </View>
  );
}