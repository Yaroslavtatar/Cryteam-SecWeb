import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { env } from "./env";

// JWT на базе `jose` (работает и в Node, и в Edge-рантайме middleware).

const accessKey = new TextEncoder().encode(env.jwtAccessSecret);
const refreshKey = new TextEncoder().encode(env.jwtRefreshSecret);

const ISSUER = "cryteam-secweb";
const AUDIENCE = "cryteam-secweb-app";

export interface SessionClaims extends JWTPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
  type: "access" | "refresh";
}

async function sign(
  payload: Omit<SessionClaims, "type" | "iat" | "exp">,
  type: "access" | "refresh",
): Promise<string> {
  const key = type === "access" ? accessKey : refreshKey;
  const ttl = type === "access" ? env.jwtAccessTtl : env.jwtRefreshTtl;
  return new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${ttl}s`)
    .sign(key);
}

export function signAccessToken(
  payload: Omit<SessionClaims, "type" | "iat" | "exp">,
) {
  return sign(payload, "access");
}

export function signRefreshToken(
  payload: Omit<SessionClaims, "type" | "iat" | "exp">,
) {
  return sign(payload, "refresh");
}

async function verify(
  token: string,
  type: "access" | "refresh",
): Promise<SessionClaims | null> {
  const key = type === "access" ? accessKey : refreshKey;
  try {
    const { payload } = await jwtVerify(token, key, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if ((payload as SessionClaims).type !== type) return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string) {
  return verify(token, "access");
}

export function verifyRefreshToken(token: string) {
  return verify(token, "refresh");
}
