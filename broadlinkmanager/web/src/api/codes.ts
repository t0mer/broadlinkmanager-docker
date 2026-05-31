import type { Code, CodeInput, OperationResult } from '@/types';

export async function fetchAllCodes(): Promise<Code[]> {
  const res = await fetch('/api/codes');
  if (!res.ok) throw new Error('Failed to fetch codes');
  return res.json();
}

export async function fetchCode(id: number): Promise<Code[]> {
  const res = await fetch(`/api/code/${id}`);
  if (!res.ok) throw new Error('Failed to fetch code');
  return res.json();
}

export async function createCode(input: CodeInput): Promise<OperationResult> {
  const res = await fetch('/api/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to create code');
  return res.json();
}

export async function updateCode(id: number, input: CodeInput): Promise<OperationResult> {
  const res = await fetch(`/api/code/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('Failed to update code');
  return res.json();
}

export async function deleteCode(id: number): Promise<OperationResult> {
  const res = await fetch(`/api/code/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete code');
  return res.json();
}
