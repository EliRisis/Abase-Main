"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { profileSchema } from "@/lib/validations/onboarding";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionResult {
  error?: string;
  success?: boolean;
}

export async function updateProfileAction(
  _prev: ProfileActionResult,
  formData: FormData,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    sportId: formData.get("sportId"),
    positionId: formData.get("positionId"),
    level: formData.get("level"),
    secondaryPositionId: formData.get("secondaryPositionId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ids = [parsed.data.positionId, parsed.data.secondaryPositionId].filter((x): x is string => !!x);
  const { data: found } = await supabase.from("positions").select("id, sport_id").in("id", ids);
  if ((found ?? []).length !== ids.length || (found ?? []).some((p) => p.sport_id !== parsed.data.sportId)) {
    return { error: "Pick positions from your sport." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      sport_id: parsed.data.sportId,
      position_id: parsed.data.positionId,
      secondary_position_id: parsed.data.secondaryPositionId,
      level: parsed.data.level,
    })
    .eq("id", user.id);

  if (error) {
    return { error: "Something went wrong saving your profile. Try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/program");
  return { success: true };
}
