import { getCurrentUser } from "@/lib/auth";
import { jsonOk, jsonError } from "@/lib/http";
import { roleLabel } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return jsonError("Требуется авторизация.", 401, { code: "UNAUTHENTICATED" });
  }
  return jsonOk({ user: { ...user, roleLabel: roleLabel(user.role) } });
}
