"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiMail, FiLock } from "react-icons/fi";

function LoginFormContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  const errorParam = searchParams.get("error");
  const codeParam = searchParams.get("code");

  let defaultError = "";
  if (errorParam === "CredentialsSignin") {
    if (codeParam === "not_verified") {
      defaultError = "Please verify your email before logging in.";
    } else if (codeParam === "no_user") {
      defaultError = "No user found with this email.";
    } else if (codeParam === "invalid_password") {
      defaultError = "Invalid password.";
    } else if (codeParam === "missing_credentials") {
      defaultError = "Please enter your email and password.";
    } else {
      defaultError = "Invalid email or password.";
    }
  } else if (errorParam) {
    defaultError = errorParam;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: "/dashboard",
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative bg-background">
      <div className="w-full max-w-md glass-panel p-8 rounded-lg shadow-sm relative z-10 border border-border bg-card">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block h-9 w-9 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm mb-4 text-base">
            K
          </Link>
          <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-xs text-muted-foreground mt-1.5">Sign in with your @karunya.edu.in account</p>
        </div>

        {(error || defaultError) && (
          <div className="p-3 mb-6 text-xs notion-tag-red border border-rose-200/20 rounded-lg">
            {error || defaultError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
              <input
                type="email"
                required
                placeholder="student@karunya.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary hover:bg-opacity-90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors text-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Loading login...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
