import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { getColors } from '../constants/theme';

export default function PrivacidadScreen() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const colors = getColors(isDarkMode);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Privacidad</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        En NoteFlow valoramos tu privacidad. Esta politica explica como manejamos tu informacion.
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>Que informacion recopilamos</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Recopilamos el contenido que creas (notas, tareas e ideas) y datos basicos de uso para mejorar la aplicacion. No recopilamos informacion personal sensible.
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>Como usamos tu informacion</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Tus datos se utilizan unicamente para mostrarte tu contenido dentro de la aplicacion. No vendemos ni compartimos tu informacion con anunciantes.
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>Seguridad</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Implementamos medidas de seguridad estandar para proteger tus datos contra acceso no autorizado.
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>Contacto</Text>
      <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
        Para cualquier consulta sobre privacidad, utiliza la seccion de feedback en ajustes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20 },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
});
