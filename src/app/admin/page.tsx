import { Dumbbell, ListTree, Trophy, Users } from "@/components/icons";
import Link from "next/link";
import { requireAdminProfile } from "@/lib/auth/require-profile";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminProfile();

  const [sports, positions, exercises, workouts, plans, athletes] = await Promise.all([
    supabase.from("sports").select("id", { count: "exact", head: true }),
    supabase.from("positions").select("id", { count: "exact", head: true }),
    supabase.from("exercises").select("id", { count: "exact", head: true }),
    supabase.from("workouts").select("id", { count: "exact", head: true }),
    supabase.from("plans").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "athlete"),
  ]);

  const stats = [
    { label: "Sports", value: sports.count ?? 0, href: "/admin/sports", icon: Trophy },
    { label: "Positions", value: positions.count ?? 0, href: "/admin/positions", icon: Users },
    { label: "Exercises", value: exercises.count ?? 0, href: "/admin/exercises", icon: ListTree },
    { label: "Workouts", value: workouts.count ?? 0, href: "/admin/workouts", icon: Dumbbell },
    { label: "Plans", value: plans.count ?? 0, href: "/admin/plans", icon: Dumbbell },
    { label: "Athletes", value: athletes.count ?? 0, href: "#", icon: Users },
  ];

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Admin Overview</h1>
        <p className="mt-1 text-body text-muted">Manage the content library.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-2 surface-card p-card transition hover:border-foreground/50"
          >
            <stat.icon size={18} className="text-primary" />
            <span className="text-stat">{stat.value}</span>
            <span className="text-body text-muted">{stat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
