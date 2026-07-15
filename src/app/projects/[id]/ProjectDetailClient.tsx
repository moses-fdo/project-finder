"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMessageSquare, FiCheck, FiX, FiClock } from "react-icons/fi";

interface ProjectDetailClientProps {
  projectId: number;
  isLoggedIn: boolean;
  isOwner: boolean;
  hasApplied: boolean;
  applicationStatus?: string;
  projectStatus: string;
}

export default function ProjectDetailClient({
  projectId,
  isLoggedIn,
  isOwner,
  hasApplied,
  applicationStatus,
  projectStatus,
}: ProjectDetailClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (isOwner) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Project Control</h3>
        <p className="text-xs text-muted-foreground mb-4">
          You are the owner of this project. Go to the dashboard to review applications and update status.
        </p>
        <button
          onClick={() => router.push("/dashboard?tab=projects")}
          className="w-full py-2.5 px-4 text-sm font-semibold bg-secondary text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer text-center"
        >
          Manage Applications
        </button>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Join Project</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Sign in with your verified Karunya account to apply for collaboration.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full py-2.5 px-4 text-sm font-semibold bg-primary text-white hover:bg-opacity-90 rounded-lg shadow-md transition-all cursor-pointer text-center"
        >
          Login to Apply
        </button>
      </div>
    );
  }

  if (hasApplied) {
    const getStatusCard = () => {
      switch (applicationStatus) {
        case "ACCEPTED":
          return {
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            label: "Application Approved",
            desc: "Congratulations! The project owner accepted your request. You are now a team member.",
            icon: FiCheck,
          };
        case "REJECTED":
          return {
            color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            label: "Application Declined",
            desc: "The project owner decided not to proceed with your request. Keep searching!",
            icon: FiX,
          };
        default:
          return {
            color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            label: "Application Pending",
            desc: "Your request is currently being reviewed by the project owner. Check back later.",
            icon: FiClock,
          };
      }
    };

    const statusCard = getStatusCard();
    const Icon = statusCard.icon;

    return (
      <div className={`p-6 rounded-xl border ${statusCard.color} flex flex-col gap-3`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Icon className="text-lg" />
          {statusCard.label}
        </div>
        <p className="text-xs opacity-90">{statusCard.desc}</p>
      </div>
    );
  }

  if (projectStatus !== "OPEN") {
    return (
      <div className="p-6 rounded-xl border border-border bg-secondary text-muted-foreground">
        <p className="text-sm font-semibold">Recruitment Closed</p>
        <p className="text-xs mt-1">This project is currently full or closed for new applications.</p>
      </div>
    );
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="glass-panel p-6 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Join Project</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Send a request to collaborate on this project. Specify your skills and how you can contribute.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-2.5 px-4 text-sm font-semibold bg-primary text-white hover:bg-opacity-90 rounded-lg shadow-md transition-all cursor-pointer text-center"
        >
          Apply to Collaborate
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
              <FiMessageSquare className="text-primary" />
              Apply to Collaborate
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Write a short message to the project owner explaining why you are interested and what you can bring to the team.
            </p>

            {error && (
              <div className="p-3 mb-4 text-xs bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleApplySubmit}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                maxLength={500}
                placeholder="Hi, I would love to help with this project because..."
                className="w-full p-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-4"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg border border-border transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  {submitting ? "Sending..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
