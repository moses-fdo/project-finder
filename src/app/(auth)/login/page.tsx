"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

function LoginFormContent() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const searchParams  = useSearchParams();
  const errorParam    = searchParams.get("error");
  const codeParam     = searchParams.get("code");

  let defaultError = "";
  if (errorParam === "CredentialsSignin") {
    const map: Record<string, string> = {
      not_verified:        "Please verify your email before logging in.",
      no_user:             "No account found with this email.",
      invalid_password:    "Incorrect password.",
      missing_credentials: "Please enter your email and password.",
    };
    defaultError = map[codeParam ?? ""] ?? "Invalid email or password.";
  } else if (errorParam) {
    defaultError = errorParam;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[360px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-[9px] bg-foreground flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-foreground">Forge</span>
          </Link>
        </div>

        <div className="card p-7">
          <h1 className="text-[18px] font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-[12px] text-muted-foreground mb-6">Sign in with your @karunya.edu.in account</p>

          {(error || defaultError) && (
            <div className="p-3 mb-5 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              {error || defaultError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block section-label mb-1.5" htmlFor="login-email">
                Email address
              </label>
              <div className="relative">
                <Mail size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@karunya.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="forge-input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block section-label mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="forge-input pl-9"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-[13px] py-2.5 mt-1"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-[12px] text-center text-muted-foreground mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground font-medium hover:underline underline-offset-2">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
