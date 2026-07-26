"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAbuseCheck } from "@/components/moderation/useAbuseCheck";
import AbuseWarningPopup from "@/components/moderation/AbuseWarningPopup";

const CATEGORIES = [
  "Web / Full-Stack",
  "Mobile",
  "AI / ML",
  "IoT / Hardware",
  "Data Science",
  "Design / UI-UX",
  "Cybersecurity",
  "AR / VR",
  "Blockchain",
  "Research",
  "Other",
];

const PROJECT_TYPES = [
  "Hackathon",
  "Side Project",
  "Academic / Course",
  "Open Source",
  "Research",
  "Startup",
  "Other",
];

const EXPERIENCE_LEVELS = [
  "Any level",
  "Beginner",
  "Intermediate",
  "Advanced",
];

const DURATIONS = [
  "< 1 week",
  "1 – 2 weeks",
  "1 month",
  "2 – 3 months",
  "Semester-long",
  "Ongoing",
];

export default function ProjectCreateForm({ userId }: { userId: number }) {
  const router = useRouter();

  const [title,           setTitle]           = useState("");
  const [description,     setDescription]     = useState("");
  const [skills,          setSkills]          = useState("");
  const [category,        setCategory]        = useState("");
  const [projectType,     setProjectType]     = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [teamSize,        setTeamSize]        = useState("");
  const [duration,        setDuration]        = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  // Abuse moderation state
  const { checkText, isChecking } = useAbuseCheck({ userId });
  const [showAbusePopup, setShowAbusePopup] = useState(false);
  const [flaggedWords, setFlaggedWords]     = useState<string[]>([]);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // ── Abuse check on description before creating ──
    const abuseResult = await checkText(description);
    if (abuseResult.abusive) {
      setFlaggedWords(abuseResult.flaggedWords);
      setShowAbusePopup(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          category:        category        || undefined,
          projectType:     projectType     || undefined,
          experienceLevel: experienceLevel || undefined,
          teamSize:        teamSize        ? Number(teamSize) : undefined,
          duration:        duration        || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project.");

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-7">
      {error && (
        <div className="p-3 mb-5 text-[12px] rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Core info ──────────────────────────────── */}
        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-title">
            Project title <span className="text-destructive">*</span>
          </label>
          <input
            id="proj-title"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. IoT Classroom Energy Monitor"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="forge-input text-[14px]"
          />
        </div>

        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-desc">
            Description <span className="text-destructive">*</span>
          </label>
          <textarea
            id="proj-desc"
            ref={descRef}
            required
            rows={6}
            placeholder="Describe the scope, goals, and what you're building. Be specific — collaborators decide to apply based on this."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="forge-input resize-y"
          />
        </div>

        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-skills">
            Required skills <span className="text-destructive">*</span>
          </label>
          <input
            id="proj-skills"
            type="text"
            required
            placeholder="Next.js, Arduino, Python, PostgreSQL"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="forge-input"
          />
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Separate skills with commas. New tags are created automatically.
          </p>
        </div>

        {/* ── Project details ─────────────────────────── */}
        <div className="pt-2 border-t border-border">
          <p className="text-[13px] font-semibold text-foreground mb-4">Project details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Category */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="proj-category">
                Category
              </label>
              <select
                id="proj-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="forge-input cursor-pointer"
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Project type */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="proj-type">
                Project type
              </label>
              <select
                id="proj-type"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="forge-input cursor-pointer"
              >
                <option value="">Select a type…</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Experience level */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="proj-exp">
                Experience level
              </label>
              <select
                id="proj-exp"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="forge-input cursor-pointer"
              >
                <option value="">Any level</option>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="proj-duration">
                Expected duration
              </label>
              <select
                id="proj-duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="forge-input cursor-pointer"
              >
                <option value="">Not specified</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Team size */}
            <div>
              <label className="block section-label mb-1.5" htmlFor="proj-teamsize">
                Max team size
              </label>
              <input
                id="proj-teamsize"
                type="number"
                min={2}
                max={20}
                placeholder="e.g. 4"
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="forge-input"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Including yourself.
              </p>
            </div>

          </div>
        </div>

        {/* ── Actions ────────────────────────────────── */}
        <div className="flex gap-3 justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary text-[13px] py-2 px-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isChecking}
            className="btn-primary text-[13px] py-2 px-5"
          >
            {isChecking ? "Checking…" : loading ? "Publishing…" : "Publish project"}
          </button>
        </div>

      </form>

      {/* ── Abuse Warning Popup ── */}
      <AbuseWarningPopup
        isOpen={showAbusePopup}
        flaggedWords={flaggedWords}
        onClose={() => setShowAbusePopup(false)}
        onRevise={() => {
          setShowAbusePopup(false);
          descRef.current?.focus();
        }}
      />
    </div>
  );
}
