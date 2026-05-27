import auth from '@react-native-firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noteflow-api-q3xo.vercel.app/api';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth().currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function uploadImage(localUri: string): Promise<string> {
  const fileName = localUri.split('/').pop() || 'photo.jpg';
  const ext = fileName.split('.').pop() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al obtener URL de subida');
  }

  const { signedUrl, publicUrl } = await res.json();

  const blob = await fetch(localUri).then((r) => r.blob());

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': contentType },
  });

  if (!uploadRes.ok) throw new Error('Error al subir la imagen a S3');

  return publicUrl;
}
