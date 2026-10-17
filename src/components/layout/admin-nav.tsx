"use client";

import {
  Dumbbell,
  LayoutDashboard,
  ListTree,
  SlidersHorizontal,
  Shapes,
  Trophy,
  Users,
} from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/sports", label: "Sports", icon: Trophy },
  { href: "/admin/positions", label: "Positions", icon: Users },
  { href: "/admin/archetypes", label: "Archetypes", icon: Shapes },
  { href: "/admin/needs", label: "Position needs", icon: SlidersHorizontal },
  { href: "/admin/exercises", label: "Exercises", icon: ListTree },
  { href: "/admin/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/admin/plans", label: "Plans", icon: LayoutDashboard },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto no-scrollbar sm:w-56 sm:shrink-0 sm:flex-col sm:overflow-visible">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap border-l-[3px] px-3.5 py-2.5 text-button transition",
              active
                ? "border-primary bg-surface-raised text-foreground"
                : "border-transparent text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            <item.icon size={18} className={active ? "text-primary" : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
