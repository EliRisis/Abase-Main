"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function enrollInPlanAction(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("user_plans")
    .update({ status: "abandoned" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { error } = await supabase.from("user_plans").upsert(
    {
      user_id: user.id,
      plan_id: planId,
      status: "active",
      current_week: 1,
      started_at: new Date().toISOString(),
      completed_at: null,
    },
    { onConflict: "user_id,plan_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  // If the athlete has an assembled program this module is an extra; show it in the module view.
  redirect("/dashboard?view=module");
}
