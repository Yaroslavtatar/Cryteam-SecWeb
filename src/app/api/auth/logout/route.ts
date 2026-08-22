import { type NextRequest } from "next/server";
import { clearSession, getSessionClaims } from "@/lib/auth";
import { jsonOk, jsonError, verifyCsrf, getClientIp } from "@/lib/http";
import { writeAudit, AUDIT } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    return jsonError("Недействительный CSRF-токен.", 403, { code: "CSRF_REJECTED" });
  }

  const claims = await getSessionClaims();
  if (claims) {
    await writeAudit({
      action: AUDIT.LOGOUT,
      severity: "info",
      message: `Выход из системы: ${claims.email}.`,
      userId: claims.sub,
      ip: getClientIp(req),
    });
  }

  const res = jsonOk({ loggedOut: true });
  clearSession(res);
  return res;
}
