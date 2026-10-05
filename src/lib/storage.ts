import type { SavedTrace, AlgoTrace } from '../types';
import { auth } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return { 'Content-Type': 'application/json' };
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function throwApiError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body: unknown = await response.json();
    if (
      typeof body === 'object'
      && body !== null
      && 'error' in body
      && typeof body.error === 'string'
    ) {
      message = body.error;
    }
  } catch {
    // Keep the endpoint-specific fallback when the response has no JSON body.
  }
  throw new Error(message);
}

export async function getSavedTraces(): Promise<SavedTrace[]> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces`, { headers });
  if (!res.ok) await throwApiError(res, 'Falha ao carregar os traces');
  return (await res.json()) as SavedTrace[];
}

export async function saveTrace(title: string, trace: AlgoTrace, category?: string, tags?: string[]): Promise<SavedTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, trace, category, tags }),
  });
  if (!res.ok) await throwApiError(res, 'Falha ao salvar trace');
  return (await res.json()) as SavedTrace;
}

export async function updateTrace(id: string, updates: { title?: string; category?: string }): Promise<SavedTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) await throwApiError(res, 'Falha ao atualizar trace');
  return (await res.json()) as SavedTrace;
}

export async function deleteTrace(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces/${id}`, { method: 'DELETE', headers });
  if (!res.ok) await throwApiError(res, 'Falha ao excluir trace');
}

export async function getTraceById(id: string): Promise<SavedTrace | undefined> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/traces/${id}`, { headers });
  if (res.status === 404) return undefined;
  if (!res.ok) await throwApiError(res, 'Falha ao carregar o trace');
  return (await res.json()) as SavedTrace;
}

export async function generateTraceFromCode(code: string, language: string): Promise<AlgoTrace> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) {
    await throwApiError(res, 'Falha ao gerar trace');
  }
  return (await res.json()) as AlgoTrace;
}

