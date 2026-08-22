import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyRefreshToken } from "@/lib/jwt";
import { COOKIE, issueSession, clearSession } from "@/lib/auth";
import { jsonOk, jsonError, getClientIp } from "@/lib/http";
import { writeAudit, AUDIT } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE.refresh)?.value;
  if (!token) {
    return jsonError("Отсутствует токен обновления.", 401, { code: "NO_REFRESH" });
  }

  const claims = await verifyRefreshToken(token);
  if (!claims) {
    const res = jsonError("Токен обновления недействителен или истёк.", 401, {
      code: "INVALID_REFRESH",
    });
    clearSession(res);
    return res;
  }

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { id: true, email: true, fullName: true, role: true, isBlocked: true },
  });

  if (!user || user.isBlocked) {
    const res = jsonError("Сессия недействительна.", 401, { code: "SESSION_INVALID" });
    clearSession(res);
    return res;
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  await writeAudit({
    action: AUDIT.TOKEN_REFRESH,
    severity: "info",
    message: `Обновление сессии: ${user.email}.`,
    userId: user.id,
    ip: getClientIp(req),
  });

  const res = jsonOk({ user: safeUser });
  await issueSession(res, safeUser);
  return res;
}
