const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "default-dev-secret-change-me";
}

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  if (expected.length !== signature.length) return false;
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionCookie(): Promise<string> {
  const secret = getSecret();
  const exp = Date.now() + SESSION_DURATION;
  const payload = btoa(JSON.stringify({ exp }));
  const signature = await hmacSign(payload, secret);
  return `${payload}.${signature}`;
}

export async function verifySessionCookie(cookie: string): Promise<boolean> {
  try {
    const secret = getSecret();
    const [payload, signature] = cookie.split(".");
    if (!payload || !signature) return false;

    const valid = await hmacVerify(payload, signature, secret);
    if (!valid) return false;

    const data = JSON.parse(atob(payload));
    if (data.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  if (input.length !== password.length) return false;
  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ password.charCodeAt(i);
  }
  return result === 0;
}

export { SESSION_COOKIE_NAME };
