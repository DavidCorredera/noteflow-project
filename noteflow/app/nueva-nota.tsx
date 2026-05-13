import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { z } from 'zod';
import { useNotesStore } from '../store/notesStore';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';

const titleSchema = z.string().min(3, 'El título debe tener al menos 3 caracteres');

export default function NuevaNotaScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);
  const addNote = useNotesStore(s => s.addNote);
  const addChecklist = useNotesStore(s => s.addChecklist);
  const addIdea = useNotesStore(s => s.addIdea);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const typeLabel = type === 'idea' ? 'Idea' : type === 'checklist' ? 'Tarea' : 'Nota';

  const handleSave = () => {
    const titleResult = titleSchema.safeParse(title);
    if (!titleResult.success) { setError(titleResult.error.issues[0].message); return; }
    if (type === 'note') {
      if (!content.trim()) { setError('El contenido no puede estar vacío'); return; }
      addNote({ title, content } as any);
    } else if (type === 'checklist') {
      addChecklist({ title } as any);
    } else if (type === 'idea') {
      const tagsArray = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
      addIdea({ title, tags: tagsArray } as any);
    }
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nueva {typeLabel}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Completa los detalles a continuación</Text>
      </View>
      {error ? <View style={[styles.errorBox, { backgroundColor: isDarkMode ? '#3b1a1a' : '#fef2f2', borderColor: isDarkMode ? '#7f1d1d' : '#fecaca' }]}><Text style={{ color: colors.error, fontSize: 14, fontWeight: '500' }}>{error}</Text></View> : null}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Título</Text>
        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={title} onChangeText={(t) => { setTitle(t); setError(''); }} placeholder="Ej. Mi nueva nota" placeholderTextColor={colors.border} />
      </View>
      {type === 'note' && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Contenido</Text>
          <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={content} onChangeText={(t) => { setContent(t); setError(''); }} placeholder="Escribe aquí..." placeholderTextColor={colors.border} multiline textAlignVertical="top" />
        </View>
      )}
      {type === 'idea' && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Etiquetas</Text>
          <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]} value={tagsInput} onChangeText={(t) => { setTagsInput(t); setError(''); }} placeholder="ej. urgente, trabajo, personal" placeholderTextColor={colors.border} />
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Separa las etiquetas con comas</Text>
        </View>
      )}
      {type === 'checklist' && <Text style={[styles.hint, { color: colors.textSecondary }]}>Crearás el título ahora. Podrás añadir subtareas dentro de la tarea.</Text>}
      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  errorBox: { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  textArea: { minHeight: 140, paddingTop: 14 },
  hint: { fontSize: 12, marginTop: 6 },
  buttons: { marginTop: 8, gap: 12 },
  saveButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  cancelButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },
});
