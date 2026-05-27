import { auth } from './firebase';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noteflow-api-q3xo.vercel.app/api';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function uploadImage(localUri: string): Promise<string> {
  const fileName = localUri.split('/').pop() || 'photo.jpg';
  const ext = fileName.split('.').pop() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

  const token = await auth.currentUser?.getIdToken();

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    type: contentType,
    name: fileName,
  } as any);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    let errMsg: string;
    try {
      const err = await res.json();
      errMsg = err.error || JSON.stringify(err);
    } catch {
      errMsg = await res.text();
    }
    throw new Error(`Error al subir la imagen (${res.status}): ${errMsg}`);
  }

  const { publicUrl } = await res.json();

  return publicUrl;
}
