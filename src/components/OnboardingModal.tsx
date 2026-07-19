"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, GraduationCap, Calendar, CheckCircle2 } from "lucide-react";

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Food Processing Technology",
];

interface OnboardingModalProps {
  user: any;
  onComplete?: (updatedUser?: any) => void;
}

export default function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const [name, setName] = useState(user?.name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [year, setYear] = useState(user?.year ? String(user.year) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);

  // Check if onboarding is needed
  const needsOnboarding = !completed && (!user?.department || !user?.year || !user?.name);

  if (!needsOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Please enter your name.");
      setLoading(false);
      return;
    }
    if (!department) {
      setError("Please select your department/course.");
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
          name: name.trim(),
          department,
          year: Number(year),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      setCompleted(true);
      if (onComplete) onComplete(data.user);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card w-full max-w-[420px] p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-border bg-card">
        
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-[18px]">
            👋
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-foreground">Welcome to Colabro!</h2>
            <p className="text-[12px] text-muted-foreground">Please complete your student profile to continue</p>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block section-label mb-1.5" htmlFor="onboard-name">
              Full Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                id="onboard-name"
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="forge-input pl-9 text-[13px]"
              />
            </div>
          </div>

          {/* Department / Course */}
          <div>
            <label className="block section-label mb-1.5" htmlFor="onboard-dept">
              Department / Course
            </label>
            <div className="relative">
              <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <select
                id="onboard-dept"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="forge-input pl-9 text-[13px] cursor-pointer"
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
              Year of Study
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <select
                id="onboard-year"
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="forge-input pl-9 text-[13px] cursor-pointer"
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
            className="btn-primary w-full justify-center text-[13px] py-2.5 mt-2 flex items-center gap-2 cursor-pointer"
          >
            {loading ? "Saving Profile…" : (
              <>
                <CheckCircle2 size={15} />
                Save Profile & Continue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
