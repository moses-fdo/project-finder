"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, CheckCircle2, AlertCircle } from "lucide-react";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: number;
    title: string;
    description: string;
    status: string;
    skills?: { id?: number; name: string }[];
  };
  onProjectUpdated?: (updatedProject: any) => void;
}

export default function EditProjectModal({
  isOpen,
  onClose,
  project,
  onProjectUpdated,
}: EditProjectModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState(project.status);
  const [skillsInput, setSkillsInput] = useState(
    project.skills ? project.skills.map((s) => s.name).join(", ") : ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  const [prevProjectId, setPrevProjectId] = useState(project.id);

  if (project.id !== prevProjectId) {
    setPrevProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setStatus(project.status);
    setSkillsInput(project.skills ? project.skills.map((s) => s.name).join(", ") : "");
    setFeedback(null);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFeedback({ type: "err", message: "Title and description are required." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          skills: skillsArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project.");

      setFeedback({ type: "ok", message: "Project updated successfully!" });
      if (onProjectUpdated) {
        onProjectUpdated(data.project);
      }
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 600);
    } catch (err: any) {
      setFeedback({ type: "err", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-[540px] p-6 space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
              <Pencil size={18} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Edit Project Details</h3>
              <p className="text-[11px] text-muted-foreground">Update title, recruitment status, or requirements</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-[12px] flex items-center gap-2 border ${
              feedback.type === "ok"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {feedback.type === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block section-label mb-1">Project Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. EcoTrack Campus"
              className="forge-input"
            />
          </div>

          <div>
            <label className="block section-label mb-1">Recruitment Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="forge-input cursor-pointer"
            >
              <option value="OPEN">🟢 Open (Looking for collaborators)</option>
              <option value="FULL">🟡 In Progress (Team assembled)</option>
              <option value="CLOSED">🔴 Closed (Completed / Inactive)</option>
            </select>
          </div>

          <div>
            <label className="block section-label mb-1">Required Skills &amp; Tech Stack</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. React, Node.js, Python, Figma (comma separated)"
              className="forge-input"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Separate skills with commas (e.g. Next.js, PostgreSQL, Tailwind)
            </p>
          </div>

          <div>
            <label className="block section-label mb-1">Project Description *</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the project goals, tech stack, and what team members will work on..."
              className="forge-input resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-[12px] py-2 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !description.trim()}
              className="btn-primary text-[12px] py-2 px-5 font-bold cursor-pointer"
            >
              {submitting ? "Saving Changes…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
