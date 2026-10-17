import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { TimezoneSync } from "@/components/program/timezone-sync";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireOnboardedProfile();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <TopBar
        displayName={profile.display_name ?? "Athlete"}
        isAdmin={profile.role === "admin"}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-6">
        {children}
      </main>
      <BottomNav />
      <TimezoneSync current={profile.timezone} />
    </div>
  );
}
