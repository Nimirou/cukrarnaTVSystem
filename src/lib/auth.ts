import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  return process.env.AUTH_SECRET || "default-dev-secret-change-me";
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionCookie(): string {
  const secret = getSecret();
  const exp = Date.now() + SESSION_DURATION;
  const payload = JSON.stringify({ exp });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const signature = sign(payloadB64, secret);
  return `${payloadB64}.${signature}`;
}

export function verifySessionCookie(cookie: string): boolean {
  try {
    const secret = getSecret();
    const [payloadB64, signature] = cookie.split(".");
    if (!payloadB64 || !signature) return false;

    const expectedSig = sign(payloadB64, secret);
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (payload.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  const inputBuf = Buffer.from(input);
  const passwordBuf = Buffer.from(password);
  if (inputBuf.length !== passwordBuf.length) return false;

  return timingSafeEqual(inputBuf, passwordBuf);
}

export { SESSION_COOKIE_NAME };
