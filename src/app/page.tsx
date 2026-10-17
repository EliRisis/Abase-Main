import { ArrowRight, FieldIcon, LineChart, WeightRoomIcon } from "@/components/icons";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 safe-top">
        <span className="flex items-center gap-2 text-title leading-none tracking-wide">
          <span className="flex h-7 w-7 items-center justify-center rounded-chip bg-primary text-primary-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3l9 15H3z" /><rect x="6" y="20" width="12" height="2.5" /></svg>
          </span>
          <span>Abase</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5">
        <section className="flex flex-col items-start gap-6 py-12 sm:py-20">
          <h1 className="text-display-xl max-w-3xl">
            Lift inside.
            <br />
            <span className="text-primary">Run outside.</span>
          </h1>
          <p className="max-w-xl text-body text-muted">
            One weekly program for your sport and position, split into the sessions you actually walk into: the weight
            room, the field, the recovery day. Each one shows what to bring and what to log.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Build my program <ArrowRight size={18} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2">
          <div className="surface-card overflow-hidden">
            <div className="plate flex items-center gap-3 px-card py-4">
              <WeightRoomIcon size={28} className="text-primary" />
              <h2 className="text-heading">Weight Room</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 p-card">
              {[
                ["5", "sets"],
                ["3", "reps"],
                ["315", "lb"],
              ].map(([n, u]) => (
                <div key={u} className="surface-inset px-3 py-4 text-center">
                  <div className="text-stat">{n}</div>
                  <div className="text-label mt-1 text-muted">{u}</div>
                </div>
              ))}
            </div>
            <p className="px-card pb-card text-body text-muted">Sets, reps and weight, with last session&apos;s numbers beside every set.</p>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="lane-stripes flex items-center gap-3 border-b border-border px-card py-4">
              <FieldIcon size={28} className="text-primary" />
              <h2 className="text-heading">Field &amp; Conditioning</h2>
            </div>
            <div className="grid grid-cols-3 gap-2 p-card">
              {[
                ["40", "yd"],
                ["4.62", "sec"],
                ["90", "rest"],
              ].map(([n, u]) => (
                <div key={u} className="surface-inset px-3 py-4 text-center">
                  <div className="text-stat">{n}</div>
                  <div className="text-label mt-1 text-muted">{u}</div>
                </div>
              ))}
            </div>
            <p className="px-card pb-card text-body text-muted">Distance, time and rest. A timer between reps and a result you can beat next week.</p>
          </div>

          <div className="surface-card flex items-start gap-4 p-card sm:col-span-2">
            <LineChart size={28} className="mt-1 shrink-0 text-primary" />
            <div>
              <h2 className="text-heading">It changes when you do</h2>
              <p className="mt-1.5 max-w-2xl text-body text-muted">
                Change position or season and adjust the program in place, history intact. Start a new block when the old
                one is done. The old one is archived, never deleted.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 text-caption text-muted">
        © {new Date().getFullYear()} Abase
      </footer>
    </div>
  );
}
