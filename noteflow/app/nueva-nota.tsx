import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { useNotesStore } from '../store/notesStore';

// 1. Definimos las reglas estrictas con Zod
const noteSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  content: z.string().min(1, 'El contenido no puede estar vacío'),
});

export default function NuevaNotaScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { type } = useLocalSearchParams(); // Recibe 'note', 'checklist' o 'idea' de la URL
  
  const addNote = useNotesStore((state) => state.addNote);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    // 2. Comprobamos si los datos cumplen las reglas de Zod
    const result = noteSchema.safeParse({ title, content });
    
    if (!result.success) {
      // Si falla, sacamos el primer mensaje de error
      setError(result.error.errors[0].message);
      return;
    }

    // 3. Si todo es correcto, guardamos la nota en Zustand
    addNote({
      id: Date.now().toString(), // Generamos un ID rápido
      title: result.data.title,
      content: result.data.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 4. Cerramos el modal y volvemos a la lista
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        Creando {type === 'idea' ? 'Idea' : type === 'checklist' ? 'Tarea' : 'Nota'}
      </Text>

      {error ? (
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{error}</Text>
      ) : null}

      <TextInput
        label="Título"
        value={title}
        onChangeText={(text) => { setTitle(text); setError(''); }}
        mode="outlined"
        style={styles.input}
      />
      
      <TextInput
        label="Escribe aquí..."
        value={content}
        onChangeText={(text) => { setContent(text); setError(''); }}
        mode="outlined"
        multiline
        numberOfLines={6}
        style={styles.input}
      />

      <Button mode="contained" onPress={handleSave} style={styles.button}>
        Guardar
      </Button>
      <Button mode="text" onPress={() => router.back()}>
        Cancelar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { marginBottom: 24, fontWeight: 'bold' },
  input: { marginBottom: 16, backgroundColor: 'transparent' },
  button: { marginTop: 8, marginBottom: 12, paddingVertical: 6 }
});