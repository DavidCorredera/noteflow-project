import { Redirect } from 'expo-router';

export default function Index() {
  // Redirigimos automáticamente a la pestaña de notas
  return <Redirect href="/notas" />;
}