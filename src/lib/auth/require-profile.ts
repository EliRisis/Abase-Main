import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return { supabase, user, profile: profile as Tables<"profiles"> };
}

export async function requireOnboardedProfile() {
  const result = await requireProfile();
  if (!result.profile.onboarded) redirect("/onboarding");
  return result;
}

export async function requireAdminProfile() {
  const result = await requireOnboardedProfile();
  if (result.profile.role !== "admin") redirect("/dashboard");
  return result;
}
