"use client";

import { MailCheck } from "@/components/icons";
import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthActionResult } from "../actions";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionResult = {};

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  if (state.needsEmailConfirmation) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <MailCheck size={36} className="text-primary" />
        <h1 className="text-title">Check your email</h1>
        <p className="text-body text-muted">
          We sent you a confirmation link. Click it to finish creating your
          account, then come back and log in.
        </p>
        <Button asChild variant="secondary">
          <Link href="/login">Back to log in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-page">
      <div>
        <h1 className="text-title">Create your account</h1>
        <p className="mt-1 text-body text-muted">
          Position-specific training starts here.
        </p>
      </div>

      <GoogleButton />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-caption font-medium text-muted">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="flex flex-col gap-section">
        <div>
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            name="displayName"
            autoComplete="name"
            required
            minLength={2}
            placeholder="Jordan Smith"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
        </div>

        {state.error && (
          <p className="text-body text-danger" role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" loading={isPending} className="mt-1">
          Create account
        </Button>
      </form>

      <p className="text-center text-body text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Log in
        </Link>
      </p>
    </div>
  );
}
