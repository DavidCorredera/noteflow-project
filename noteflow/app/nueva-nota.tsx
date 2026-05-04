import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { useNotesStore } from '../store/notesStore';

// Regla base para el título (la comparten todos)
const titleSchema = z.string().min(3, 'El título debe tener al menos 3 caracteres');

export default function NuevaNotaScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { type } = useLocalSearchParams(); 
  
  const { addNote, addChecklist, addIdea } = useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Para notas
  const [tagsInput, setTagsInput] = useState(''); // Para ideas
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validamos el título primero
    const titleResult = titleSchema.safeParse(title);
    if (!titleResult.success) {
      setError(titleResult.error.errors[0].message);
      return;
    }

    const newId = Date.now().toString();
    const now = new Date();

    if (type === 'note') {
      if (!content.trim()) {
        setError('El contenido no puede estar vacío');
        return;
      }
      addNote({ id: newId, title, content, createdAt: now, updatedAt: now });
    } 
    
    else if (type === 'checklist') {
      // Creamos la checklist con una lista de tareas vacía por ahora
      addChecklist({ id: newId, title, items: [], createdAt: now, updatedAt: now });
    } 
    
    else if (type === 'idea') {
      // Convertimos un string "react, diseño, app" en un array ["react", "diseño", "app"]
      const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      addIdea({ 
        id: newId, 
        title, 
        tags: tagsArray, 
        color: theme.colors.primaryContainer, // Color por defecto
        createdAt: now, 
        updatedAt: now 
      });
    }

    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.title}>
        Nueva {type === 'idea' ? 'Idea' : type === 'checklist' ? 'Tarea' : 'Nota'}
      </Text>

      {error ? <Text style={{ color: theme.colors.error, marginBottom: 16 }}>{error}</Text> : null}

      <TextInput
        label="Título"
        value={title}
        onChangeText={(t) => { setTitle(t); setError(''); }}
        mode="outlined"
        style={styles.input}
      />
      
      {/* Campos dinámicos según el tipo */}
      {type === 'note' && (
        <TextInput
          label="Escribe aquí..."
          value={content}
          onChangeText={(t) => { setContent(t); setError(''); }}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={styles.input}
        />
      )}

      {type === 'idea' && (
        <TextInput
          label="Etiquetas (separadas por coma)"
          value={tagsInput}
          onChangeText={(t) => { setTagsInput(t); setError(''); }}
          mode="outlined"
          placeholder="ej. urgente, trabajo, personal"
          style={styles.input}
        />
      )}

      {type === 'checklist' && (
        <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.outline }}>
          Crearás el título de tu lista ahora. Podrás añadir las subtareas concretas dentro de la vista de detalle.
        </Text>
      )}

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