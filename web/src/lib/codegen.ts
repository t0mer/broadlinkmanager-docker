// ── Shared helpers ─────────────────────────────────────────────────────────

export function hexToBase64(hex: string): string {
  const clean = hex.replace(/\s/g, '');
  const bytes = (clean.match(/.{1,2}/g) ?? []).map(b => parseInt(b, 16));
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToHex(b64: string): string {
  const bin = atob(b64);
  return Array.from(bin)
    .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ');
}

// ── RF Generator (ports generator.js) ──────────────────────────────────────

const HIGH_BIT = '240d';
const LOW_BIT  = '0d24';
const FOOTER   = '0c00016f00000000';
const BYTES    = 24;

export function generateRfCode(type: 'RF433' | 'RF315'): { regular: string; long: string } {
  const prefix = type === 'RF433' ? 'b2' : 'd7';
  let code = '';
  for (let i = 0; i < BYTES; i++) {
    code += Math.random() < 0.5 ? HIGH_BIT : LOW_BIT;
  }
  const regular = `${prefix}0c3400${code}${FOOTER}`;
  const long    = `${prefix}5c3400${code}${FOOTER}`;
  return { regular: hexToBase64(regular), long: hexToBase64(long) };
}

export function changeRepeats(b64: string, newRepeats: number): string {
  const hex = base64ToHex(b64).replace(/\s/g, '');
  const repeatHex = newRepeats.toString(16).padStart(2, '0');
  const modified = hex.slice(0, 2) + repeatHex + hex.slice(4);
  return hexToBase64(modified);
}

// ── Livolo ──────────────────────────────────────────────────────────────────

export function generateLivoloCode(remoteId: number, buttonCode: number): string {
  const LIVOLO_HIGH = '0011';
  const LIVOLO_LOW  = '0006';
  const PREFIX      = 'd700';

  const idBits  = remoteId.toString(2).padStart(16, '0');
  const btnBits = buttonCode.toString(2).padStart(8, '0');
  let payload = '';
  for (const bit of idBits + btnBits) {
    payload += bit === '1' ? LIVOLO_HIGH : LIVOLO_LOW;
  }
  return hexToBase64(`${PREFIX}${payload}0003`);
}

// ── Energenie (Type D 433 MHz learning sockets) ────────────────────────────

const E_HIGH    = '1507';
const E_LOW     = '0815';
const E_FOOTER  = '08dc000000000000';
const E_PREFIX  = 'b2';
const E_REPEATS = '08';
const E_LEN     = '2000';

export function generateEnergeniCode(socket: 1 | 2 | 3 | 4, on: boolean): string {
  // 20 random remote-group bits (unique per remote — generated fresh each time)
  let remoteBits = '';
  for (let i = 0; i < 20; i++) {
    remoteBits += Math.random() < 0.5 ? '1' : '0';
  }
  // 4-bit socket command: 2-bit socket index + on/off + padding
  const socketBits = (socket - 1).toString(2).padStart(2, '0');
  const cmdBits    = socketBits + (on ? '1' : '0') + '0';

  let payload = '';
  for (const bit of remoteBits + cmdBits) {
    payload += bit === '1' ? E_HIGH : E_LOW;
  }
  return hexToBase64(`${E_PREFIX}${E_REPEATS}${E_LEN}${payload}${E_FOOTER}`);
}
