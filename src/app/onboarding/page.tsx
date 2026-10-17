import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: sports }, { data: positions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sports").select("*").order("name"),
    supabase.from("positions").select("*").order("name"),
  ]);

  if (profile?.onboarded) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col bg-background px-5 py-8 safe-top safe-bottom">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <OnboardingForm
          sports={sports ?? []}
          positions={positions ?? []}
          defaultName={profile?.display_name ?? user.user_metadata?.full_name ?? ""}
        />
      </div>
    </div>
  );
}
