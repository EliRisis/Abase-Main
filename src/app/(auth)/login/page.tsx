"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logInAction, type AuthActionResult } from "../actions";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionResult = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(logInAction, initialState);

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Welcome back</h1>
        <p className="mt-1 text-body text-muted">Log in to keep training.</p>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-caption font-medium text-muted">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-section">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        {state.error && (
          <p className="text-body text-danger" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isPending} className="mt-1">
          Log in
        </Button>
      </form>

      <p className="text-center text-body text-muted">
        New to Abase?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          Create an account
        </Link>
      </p>
    </div>
  );
}
