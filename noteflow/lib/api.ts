import auth from '@react-native-firebase/auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noteflow-api-q3xo.vercel.app/api';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth().currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type CreateNoteInput = {
  title: string;
  type: 'note' | 'checklist' | 'idea';
  content?: string;
  color?: string;
  tags?: string[];
};

export async function getNotes() {
  const res = await fetch(`${BASE_URL}/notes`, { headers: await authHeaders() });
  if (!res.ok) throw new Error('Error al cargar notas');
  return res.json();
}

export async function createNote(data: CreateNoteInput) {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear nota');
  return res.json();
}

export async function deleteNoteApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Error al borrar nota');
}

export async function addChecklistItemApi(noteId: string, text: string, priority?: string) {
  const body: Record<string, any> = { text };
  if (priority && priority !== 'none') body.priority = priority;
  const res = await fetch(`${BASE_URL}/notes/${noteId}/checklist-items`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Error al añadir ítem');
  return res.json();
}

export async function toggleChecklistItemApi(itemId: string, isCompleted: boolean) {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function updateChecklistItemApi(itemId: string, data: { text?: string; priority?: string; is_completed?: boolean }) {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function deleteChecklistItemApi(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  });
  if (!res.ok) throw new Error('Error al borrar ítem');
}

export async function updateNoteApi(id: string, data: Partial<{ title: string; content: string; tags: string[]; color: string; archived: boolean }>) {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar nota');
  return res.json();
}
