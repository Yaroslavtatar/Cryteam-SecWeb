import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { SandboxConsole } from "@/components/sandbox-console";

export const metadata: Metadata = { title: "Песочница — CRYTEAM SecWeb" };
export const dynamic = "force-dynamic";

export default async function SandboxPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/sandbox");

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-6 md:py-10">
        <SandboxConsole />
      </div>
    </>
  );
}
