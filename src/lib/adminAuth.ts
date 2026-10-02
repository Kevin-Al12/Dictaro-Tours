export const ADMIN_SESSION_COOKIE = 'ditaros_admin_session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

function getSessionSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('Falta configurar NEXTAUTH_SECRET en el entorno (.env.local)');
  }
  return secret;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '=');
  const binary = atob(withPadding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getSessionSecret());
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

interface AdminSessionPayload {
  sub: string; // adminId
  role: string;
  exp: number; // epoch ms
}

/**
 * Crea un token de sesión de admin firmado (HMAC-SHA256) con el id y rol del
 * AdminUser autenticado. El propio token lleva la firma, así que no hace
 * falta guardar sesiones en la base de datos: el middleware solo la verifica.
 */
export async function createAdminSession(adminId: string, role: string): Promise<{ token: string; maxAge: number }> {
  const payload: AdminSessionPayload = {
    sub: adminId,
    role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return { token: `${payloadB64}.${signatureB64}`, maxAge: SESSION_TTL_SECONDS };
}

/**
 * Verifica un token de sesión de admin. Devuelve los datos del admin si la
 * firma es válida y no ha expirado, o null si no.
 */
export async function verifyAdminSession(token: string | undefined | null): Promise<{ adminId: string; role: string } | null> {
  if (!token) return null;
  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getHmacKey();
    const expectedSignature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expectedSignatureB64 = base64UrlEncode(new Uint8Array(expectedSignature));

    if (expectedSignatureB64.length !== signatureB64.length) return null;
    let mismatch = 0;
    for (let i = 0; i < expectedSignatureB64.length; i++) {
      mismatch |= expectedSignatureB64.charCodeAt(i) ^ signatureB64.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as AdminSessionPayload;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    if (!payload.sub || !payload.role) return null;

    return { adminId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}
