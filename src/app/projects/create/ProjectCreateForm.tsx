"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectCreateForm() {
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [skills,      setSkills]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
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
        <div className="p-3 mb-6 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-title">
            Project title
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

        {/* Description */}
        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-desc">
            Description
          </label>
          <textarea
            id="proj-desc"
            required
            rows={8}
            placeholder="Describe the scope, objectives, and what you're building. Be specific so potential collaborators know what to expect."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="forge-input resize-y"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block section-label mb-1.5" htmlFor="proj-skills">
            Required skills
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

        {/* Actions */}
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
            disabled={loading}
            className="btn-primary text-[13px] py-2 px-5"
          >
            {loading ? "Publishing…" : "Publish project"}
          </button>
        </div>
      </form>
    </div>
  );
}
