import { PositionIcon } from "@/components/icons/app-icon";
import { LogOut, Target } from "@/components/icons";
import Link from "next/link";
import { signOutAction } from "@/app/(auth)/actions";
import { ProfileForm } from "./profile-form";
import { Button } from "@/components/ui/button";
import { PhasePicker } from "@/components/program/phase-picker";
import { requireOnboardedProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, profile } = await requireOnboardedProfile();

  const [{ data: sports }, { data: positions }] = await Promise.all([
    supabase.from("sports").select("*").order("name"),
    supabase.from("positions").select("*").order("name"),
  ]);

  const primary = (positions ?? []).find((p) => p.id === profile.position_id) ?? null;
  const secondary = (positions ?? []).find((p) => p.id === profile.secondary_position_id) ?? null;

  return (
    <div className="flex flex-col gap-page">
      <div className="flex items-center gap-4">
        {primary && <PositionIcon slug={primary.slug} name={primary.name} size={56} className="rounded-card" />}
        <div className="min-w-0">
          <h1 className="text-title">{profile.display_name ?? "Profile"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-body text-muted">
            {primary && <span className="text-foreground">{primary.name}</span>}
            {secondary && (
              <span className="inline-flex items-center gap-1.5">
                + <PositionIcon slug={secondary.slug} name={secondary.name} size={22} className="rounded-chip" /> {secondary.name}
              </span>
            )}
            <span>{profile.email}</span>
          </p>
        </div>
      </div>

      <PhasePicker initial={profile.training_phase} />

      <Link href="/program/coach" className="flex items-center gap-3 surface-card p-card-sm text-body transition hover:bg-surface-raised">
        <Target size={18} className="text-primary" />
        <span>
          <span className="block font-semibold">Coach settings</span>
          <span className="text-caption text-muted">Target date, go-easy flags, games &amp; practices</span>
        </span>
      </Link>

      <ProfileForm profile={profile} sports={sports ?? []} positions={positions ?? []} />

      <form action={signOutAction}>
        <Button type="submit" variant="outline" className="w-full">
          <LogOut size={16} /> Log out
        </Button>
      </form>
    </div>
  );
}
