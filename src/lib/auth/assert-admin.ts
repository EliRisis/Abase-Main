import { createClient } from "@/lib/supabase/server";

/**
 * Defense-in-depth check for use inside server actions that mutate content
 * tables. RLS is the actual enforcement boundary (see the admin write
 * policies in supabase/migrations); this just produces a friendlier error
 * than a raw Postgres permission-denied response.
 */
export async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Admin access required");

  return { supabase, user };
}
