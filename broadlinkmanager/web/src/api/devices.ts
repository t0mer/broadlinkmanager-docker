import type { Device, PingResult } from '@/types';
import { apiUrl } from './base';

export async function fetchDevices(freshscan = true): Promise<Device[]> {
  const res = await fetch(apiUrl(`/autodiscover?freshscan=${freshscan ? '1' : '0'}`));
  if (!res.ok) throw new Error('Failed to fetch devices');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function pingDevice(host: string): Promise<PingResult> {
  const res = await fetch(apiUrl(`/device/ping?host=${encodeURIComponent(host)}`));
  if (!res.ok) throw new Error('Ping failed');
  return res.json();
}

export async function saveDevices(devices: Device[]): Promise<void> {
  const res = await fetch(apiUrl('/devices/save'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(devices),
  });
  if (!res.ok) throw new Error('Failed to save devices');
}

export async function loadDevices(): Promise<Device[]> {
  const res = await fetch(apiUrl('/devices/load'));
  if (!res.ok) throw new Error('Failed to load devices');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
