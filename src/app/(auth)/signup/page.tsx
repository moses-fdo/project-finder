"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiUser, FiMail, FiLock, FiClock } from "react-icons/fi";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const departments = [
    "Computer Science",
    "Information Technology",
    "Electronics & Communication",
    "Electrical & Electronics",
    "Mechanical Engineering",
    "Civil Engineering",
    "Biotechnology",
    "Food Processing Technology"
  ];

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.endsWith("@karunya.edu.in")) {
      setError("Only @karunya.edu.in email addresses are allowed.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          department,
          year: Number(year),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to register.");
      }

      setSuccessMsg(data.message || "OTP Sent to your email.");
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP.");
      }

      setSuccessMsg("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?error=Verification+Successful.+Please+log+in.");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative bg-background">
      <div className="w-full max-w-md glass-panel p-8 rounded-lg shadow-sm relative z-10 border border-border bg-card">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <Link href="/" className="inline-block h-9 w-9 rounded bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm mb-4 text-base">
                K
              </Link>
              <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
              <p className="text-xs text-muted-foreground mt-1.5">Sign up for verified Karunya student portal</p>
            </div>

            {error && (
              <div className="p-3 mb-6 text-xs notion-tag-red border border-rose-200/20 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
                  <input
                    type="text"
                    required
                    placeholder="Moses Fernando"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Karunya Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
                  <input
                    type="email"
                    required
                    placeholder="username@karunya.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Department</label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-secondary"
                  >
                    <option value="">Select...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Year of Study</label>
                  <select
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-secondary"
                  >
                    <option value="">Select...</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-2.5 text-muted-foreground text-sm" />
                  <input
                    type="password"
                    required
                    minLength={6}
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
                className="w-full py-2 px-4 bg-primary hover:bg-opacity-90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors text-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? "Registering..." : "Send Verification OTP"}
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <FiClock className="mx-auto text-3xl text-muted-foreground mb-3 animate-pulse" />
              <h2 className="text-2xl font-bold text-foreground">Enter OTP</h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                We&apos;ve sent a 6-digit OTP code to <strong className="text-foreground">{email}</strong>.
              </p>
              <div className="text-[10px] notion-tag-yellow border border-yellow-200/20 p-3 rounded-lg mt-4 text-left">
                <strong>Development mode notice:</strong> Since no mailer is configured, check your server console/terminal logs to grab the OTP code!
              </div>
            </div>

            {successMsg && (
              <div className="p-3 mb-4 text-xs notion-tag-green border border-green-200/20 rounded-lg">
                {successMsg}
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 text-xs notion-tag-red border border-rose-200/20 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-2 bg-card border border-border rounded-lg text-center font-mono text-base tracking-widest text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-primary hover:bg-opacity-90 text-primary-foreground font-semibold rounded-lg shadow-sm transition-colors text-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border mt-2 transition-colors cursor-pointer text-center"
              >
                Back to Details
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
