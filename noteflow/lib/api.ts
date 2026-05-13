// Si estás probando en un emulador de Android físico o local, 
// localhost a veces da problemas. Si es así, cambia localhost por la IP de tu ordenador.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://noteflow-api-q3xo.vercel.app/api';

// Tipos básicos para que TypeScript no se queje (ajústalos según tus tipos reales)
export type CreateNoteInput = {
  title: string;
  type: 'note' | 'checklist' | 'idea';
  content?: string;
  color?: string;
};

export async function getNotes() {
  const res = await fetch(`${BASE_URL}/notes`);
  if (!res.ok) throw new Error('Error al cargar notas');
  return res.json();
}

export async function createNote(data: CreateNoteInput) {
  const res = await fetch(`${BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear nota');
  return res.json();
}

export async function deleteNoteApi(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al borrar nota');
}

export async function addChecklistItemApi(noteId: string, text: string) {
  const res = await fetch(`${BASE_URL}/notes/${noteId}/checklist-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Error al añadir ítem');
  return res.json();
}

export async function toggleChecklistItemApi(itemId: string, isCompleted: boolean) {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_completed: isCompleted }),
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function updateChecklistItemApi(itemId: string, text: string) {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Error al actualizar ítem');
  return res.json();
}

export async function deleteChecklistItemApi(itemId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/checklist-items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al borrar ítem');
}

export async function updateNoteApi(id: string, data: Partial<{ title: string; content: string; tags: string[]; color: string }>) {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar nota');
  return res.json();
}