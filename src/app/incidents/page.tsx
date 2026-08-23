import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { IncidentReporter } from "@/components/incident-reporter";

export const metadata: Metadata = { title: "Инциденты — CRYTEAM SecWeb" };
export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">
        <IncidentReporter />
      </div>
    </>
  );
}
