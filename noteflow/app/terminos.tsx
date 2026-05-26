import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';

export default function TerminosScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Terminos y condiciones</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Al utilizar NoteFlow, aceptas los siguientes terminos. NoteFlow es una aplicacion de notas, tareas e ideas proporcionada tal cual, sin garantias de disponibilidad continua.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Los datos se almacenan en servidores externos y se toman medidas razonables para proteger tu informacion. No compartimos tus datos con terceros sin tu consentimiento.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Eres responsable del contenido que creas. NoteFlow no se hace responsable por la perdida accidental de datos. Recomendamos realizar copias de seguridad periodicas.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        NoteFlow puede actualizar estos terminos en cualquier momento. El uso continuado de la aplicacion implica la aceptacion de los cambios.
      </Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Si tienes preguntas sobre estos terminos, contactanos a traves de la seccion de feedback en ajustes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});
