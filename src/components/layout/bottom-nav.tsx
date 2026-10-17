"use client";

import { CalendarRange, Dumbbell, Home, LineChart, User } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/today", label: "Today", icon: Home },
  { href: "/program", label: "Program", icon: CalendarRange },
  { href: "/plans", label: "Modules", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-background safe-bottom sm:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 pb-2 pt-3 transition text-label-sm",
                active ? "text-foreground" : "text-muted",
              )}
            >
              {active && <span className="absolute inset-x-4 top-0 h-[3px] bg-primary" />}
              <item.icon size={22} className={active ? "text-primary" : undefined} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
