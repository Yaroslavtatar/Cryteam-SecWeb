import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">{children}</div>
    </>
  );
}
