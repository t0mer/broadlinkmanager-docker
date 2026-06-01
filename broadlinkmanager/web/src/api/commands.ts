import type { CommandResult, RfState } from '@/types';

export async function learnIr(host: string, mac: string, type: string): Promise<CommandResult> {
  const params = new URLSearchParams({ host, mac, type });
  const res = await fetch(`/ir/learn?${params}`);
  if (!res.ok) throw new Error('IR learn request failed');
  return res.json();
}

export async function sendCommand(host: string, mac: string, type: string, command: string): Promise<CommandResult> {
  const params = new URLSearchParams({ host, mac, type, command });
  const res = await fetch(`/command/send?${params}`);
  if (!res.ok) throw new Error('Send command failed');
  return res.json();
}

export async function learnRf(host: string, mac: string, type: string): Promise<CommandResult> {
  const params = new URLSearchParams({ host, mac, type });
  const res = await fetch(`/rf/learn?${params}`);
  if (!res.ok) throw new Error('RF learn request failed');
  return res.json();
}

export async function fetchRfStatus(): Promise<RfState> {
  const res = await fetch('/rf/status');
  if (!res.ok) throw new Error('RF status failed');
  return res.json();
}

export async function continueRf(): Promise<RfState> {
  const res = await fetch('/rf/continue');
  if (!res.ok) throw new Error('RF continue failed');
  return res.json();
}

export async function readTemperature(host: string, mac: string, type: string): Promise<{ data: string; success: string }> {
  const params = new URLSearchParams({ host, mac, type });
  const res = await fetch(`/temperature?${params}`);
  if (!res.ok) throw new Error('Temperature read failed');
  return res.json();
}
