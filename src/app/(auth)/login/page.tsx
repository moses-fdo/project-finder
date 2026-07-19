"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

function LoginFormContent() {
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState("");

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

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { redirectTo: "/dashboard" });
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
          <p className="text-[12px] text-muted-foreground mb-5">Sign in to your account to continue</p>

          {(error || defaultError) && (
            <div className="p-3 mb-5 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              {error || defaultError}
            </div>
          )}

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full h-10 px-4 rounded-md border border-border bg-background hover:bg-muted/60 transition-colors flex items-center justify-center gap-2.5 text-[13px] font-medium text-foreground cursor-pointer disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-border w-full"></div>
            <span className="bg-card px-2 text-[11px] text-muted-foreground uppercase tracking-wider relative">or</span>
          </div>

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
