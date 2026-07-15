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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent_50%)]"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-border">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block h-10 w-10 rounded-lg bg-gradient-to-tr from-primary to-ring flex items-center justify-center font-bold text-white shadow-lg mb-4 text-lg">
            K
          </Link>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-muted-foreground mt-1">Sign in with your @karunya.edu.in account</p>
        </div>

        {(error || defaultError) && (
          <div className="p-3 mb-6 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
            {error || defaultError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="student@karunya.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-opacity-95 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
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
