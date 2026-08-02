"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ColabroLogo from "@/components/ColabroLogo";
import { User, GraduationCap, Calendar, ArrowRight } from "lucide-react";
import { departments } from "@/lib/projects";

export default function OnboardingPage() {
  const router = useRouter();
  const [name,       setName]       = useState("");
  const [department, setDepartment] = useState("");
  const [year,       setYear]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!department) {
      setError("Please select your department / course.");
      setLoading(false);
      return;
    }
    if (!year) {
      setError("Please select your year of study.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name.trim() ? { name: name.trim() } : {}),
          department,
          year: Number(year),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile.");

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <ColabroLogo size={36} />
            <span className="text-[15px] font-semibold text-foreground">Colabro</span>
          </Link>
        </div>

        <div className="card p-7 sm:p-8 space-y-5">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <GraduationCap size={24} strokeWidth={1.75} className="text-primary" />
              </div>
            </div>
            <div>
              <h1 className="type-page-title text-[22px] mb-1.5">Complete your profile</h1>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Tell us your department and year to personalize your experience.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 mb-5 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional Name update */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="onboard-name">
                Full Name
              </label>
              <div className="relative">
                <User size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  id="onboard-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="forge-input pl-9"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="onboard-dept">
                Department / Course <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <GraduationCap size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <select
                  id="onboard-dept"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="forge-input pl-9 pr-10 cursor-pointer forge-select"
                >
                  <option value="">Select your department…</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year of Study */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="onboard-year">
                Year of Study <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Calendar size={13} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
                <select
                  id="onboard-year"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="forge-input pl-9 pr-10 cursor-pointer forge-select"
                >
                  <option value="">Select year…</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-[13px] py-2.5 mt-2 flex items-center gap-2"
            >
              {loading ? "Saving…" : (
                <>
                  Complete Profile &amp; Start
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
