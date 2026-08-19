// Home Assistant serves the add-on under /api/hassio_ingress/<token>/, so every
// API path needs that prefix when running behind Ingress.
const match = window.location.pathname.match(/^(.*\/api\/hassio_ingress\/[^/]+)(?:\/|$)/);

export const API_BASE = match ? match[1] : '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
