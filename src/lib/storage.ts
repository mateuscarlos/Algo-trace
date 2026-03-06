import type { SavedTrace, AlgoTrace } from '../types';
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export async function getSavedTraces(): Promise<SavedTrace[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/traces`, { headers });
    if (!res.ok) return [];
    return (await res.json()) as SavedTrace[];
  } catch {
    return [];
  }
}

export async function saveTrace(title: string, trace: AlgoTrace, category?: string, tags?: string[]): Promise<SavedTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, trace, category, tags }),
  });
  if (!res.ok) throw new Error('Falha ao salvar trace');
  return (await res.json()) as SavedTrace;
}

export async function updateTrace(id: string, updates: { title?: string; category?: string; tags?: string[] }): Promise<SavedTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Falha ao atualizar trace');
  return (await res.json()) as SavedTrace;
}

export async function deleteTrace(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${API_BASE}/traces/${id}`, { method: 'DELETE', headers });
}

export async function getTraceById(id: string): Promise<SavedTrace | undefined> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/traces/${id}`, { headers });
    if (!res.ok) return undefined;
    return (await res.json()) as SavedTrace;
  } catch {
    return undefined;
  }
}

export async function generateTraceFromCode(code: string, language: string): Promise<AlgoTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || 'Falha ao gerar trace');
  }
  return (await res.json()) as AlgoTrace;
}


