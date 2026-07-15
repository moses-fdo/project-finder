"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiTag, FiFileText, FiInfo } from "react-icons/fi";

export default function ProjectCreateForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project.");
      }

      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-xl border border-border">
      {error && (
        <div className="p-3 mb-6 text-xs bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <FiInfo />
            Project Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. IoT Classroom Energy Monitor"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <FiFileText />
            Detailed Description
          </label>
          <textarea
            required
            rows={8}
            placeholder="Describe the scope, objectives, technical stack, features, and target outcomes of your project. Be as specific as possible so prospective partners know what to expect."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <FiTag />
            Required Skills (Comma Separated)
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Next.js, Arduino, Python, PostgreSQL, CSS"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Type out tags separated by commas. Existing tags will be matched, and new tags will be registered automatically.
          </p>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? "Creating Proposal..." : "Publish Proposal"}
          </button>
        </div>
      </form>
    </div>
  );
}
