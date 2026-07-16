"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, KeyRound } from "lucide-react";

const departments = [
  "Computer Science", "Information Technology",
  "Electronics & Communication", "Electrical & Electronics",
  "Mechanical Engineering", "Civil Engineering",
  "Biotechnology", "Food Processing Technology",
];

export default function SignupPage() {
  const [step,       setStep]       = useState<1 | 2>(1);
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [department, setDepartment] = useState("");
  const [year,       setYear]       = useState("");
  const [otp,        setOtp]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    if (!email.endsWith("@karunya.edu.in")) {
      setError("Only @karunya.edu.in email addresses are allowed.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, department, year: Number(year) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setSuccess(data.message || "OTP sent to your email.");
      setStep(2);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setSuccess("Email verified! Redirecting…");
      setTimeout(() => router.push("/login"), 1500);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="h-9 w-9 rounded-[9px] bg-foreground flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-foreground">Forge</span>
          </Link>
        </div>

        <div className="card p-7">
          {step === 1 ? (
            <>
              <h1 className="text-[18px] font-semibold text-foreground mb-1">Create your account</h1>
              <p className="text-[12px] text-muted-foreground mb-6">
                Sign up with your @karunya.edu.in email to get started.
              </p>

              {error && (
                <div className="p-3 mb-5 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block section-label mb-1.5" htmlFor="signup-name">Full name</label>
                  <div className="relative">
                    <User size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      id="signup-name"
                      type="text"
                      required
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="forge-input pl-9"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block section-label mb-1.5" htmlFor="signup-email">Karunya email</label>
                  <div className="relative">
                    <Mail size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      placeholder="you@karunya.edu.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="forge-input pl-9"
                    />
                  </div>
                </div>

                {/* Department + Year */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block section-label mb-1.5" htmlFor="signup-dept">Department</label>
                    <select
                      id="signup-dept"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="forge-input cursor-pointer"
                    >
                      <option value="">Select…</option>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block section-label mb-1.5" htmlFor="signup-year">Year</label>
                    <select
                      id="signup-year"
                      required
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="forge-input cursor-pointer"
                    >
                      <option value="">Select…</option>
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={y}>{y}{["st","nd","rd","th"][y-1]} Year</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block section-label mb-1.5" htmlFor="signup-password">Password</label>
                  <div className="relative">
                    <Lock size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      id="signup-password"
                      type="password"
                      required
                      minLength={6}
                      placeholder="Min 6 characters"
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
                  {loading ? "Sending OTP…" : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-[18px] font-semibold text-foreground mb-1">Check your email</h1>
              <p className="text-[12px] text-muted-foreground mb-2">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>.
              </p>
              <div className="p-3 mb-5 text-[12px] rounded-md bg-warning/10 text-warning border border-warning/20">
                <strong>Dev mode:</strong> Check your server console for the OTP code.
              </div>

              {success && (
                <div className="p-3 mb-4 text-[12px] rounded-md notion-tag-green border border-green-200/20">{success}</div>
              )}
              {error && (
                <div className="p-3 mb-4 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">{error}</div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block section-label mb-1.5" htmlFor="otp-input">
                    <span className="flex items-center gap-1.5">
                      <KeyRound size={11} strokeWidth={1.75} />
                      Verification code
                    </span>
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="forge-input text-center font-mono tracking-[0.4em] text-[16px]"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center text-[13px] py-2.5"
                >
                  {loading ? "Verifying…" : "Verify email"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); setSuccess(""); }}
                  className="btn-secondary w-full justify-center text-[13px] py-2"
                >
                  Back
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-[12px] text-center text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
