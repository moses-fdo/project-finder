"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Check, X, Clock, Settings, Bookmark, Copy, CheckCheck } from "lucide-react";

interface ProjectDetailClientProps {
  projectId: number;
  isOwner: boolean;
  hasApplied: boolean;
  applicationStatus?: string;
  projectStatus: string;
  initialBookmarked: boolean;
  ownerEmail: string;
}

export default function ProjectDetailClient({
  projectId,
  isOwner,
  hasApplied,
  applicationStatus,
  projectStatus,
  initialBookmarked,
  ownerEmail,
}: ProjectDetailClientProps) {
  const [modalOpen, setModalOpen]     = useState(false);
  const [message, setMessage]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [applyError, setApplyError]   = useState("");

  const [bookmarked, setBookmarked]   = useState(initialBookmarked);
  const [bmLoading, setBmLoading]     = useState(false);

  const [copied, setCopied]           = useState(false);

  const router = useRouter();

  /* ── Bookmark toggle ─────────────────────────────────────── */
  const toggleBookmark = async () => {
    if (bmLoading) return;
    setBmLoading(true);
    try {
      const method = bookmarked ? "DELETE" : "POST";
      const res = await fetch(`/api/projects/${projectId}/bookmark`, { method });
      if (res.ok) {
        setBookmarked(!bookmarked);
        router.refresh(); // refresh sidebar bookmark panel
      }
    } finally {
      setBmLoading(false);
    }
  };

  /* ── Copy email ──────────────────────────────────────────── */
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(ownerEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for browsers that block clipboard without HTTPS
      const el = document.createElement("textarea");
      el.value = ownerEmail;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── Apply submit ────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application.");
      setModalOpen(false);
      setMessage("");
      router.refresh();
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Shared contact button (used by both owner + non-owner) ─ */
  const renderContactButton = () => (
    <button
      type="button"
      onClick={copyEmail}
      className="btn-secondary w-full justify-center text-[12px] py-2 flex items-center gap-1.5 transition-all"
    >
      {copied ? (
        <>
          <CheckCheck size={13} strokeWidth={2} className="text-success" />
          <span className="text-success">Email copied!</span>
        </>
      ) : (
        <>
          <Copy size={13} strokeWidth={1.75} />
          Copy owner&apos;s email
        </>
      )}
    </button>
  );

  /* ── Owner view ──────────────────────────────────────────── */
  if (isOwner) {
    return (
      <div className="card p-5 space-y-3">
        <p className="section-label flex items-center gap-1.5">
          <Settings size={12} strokeWidth={1.75} />
          Your project
        </p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Review applications and manage recruitment from your dashboard.
        </p>
        <button
          onClick={() => router.push("/dashboard?tab=projects")}
          className="btn-secondary w-full justify-center text-[12px] py-2"
        >
          Manage applications
        </button>
      </div>
    );
  }

  /* ── Already applied ─────────────────────────────────────── */
  if (hasApplied) {
    const statusMap = {
      ACCEPTED: { cls: "badge-green", icon: Check,  label: "Application accepted",  desc: "The project owner accepted your request — you're now part of the team." },
      REJECTED: { cls: "badge-red",   icon: X,      label: "Application declined",   desc: "The owner decided not to proceed. Keep exploring other projects." },
    } as Record<string, { cls: string; icon: any; label: string; desc: string }>;

    const info = statusMap[applicationStatus ?? ""] ?? {
      cls: "badge-yellow", icon: Clock,
      label: "Application pending",
      desc: "Your request is being reviewed by the project owner.",
    };
    const Icon = info.icon;

    return (
      <div className="card p-5 space-y-4">
        <div className={`badge ${info.cls}`}>
          <Icon size={11} strokeWidth={2} />
          {info.label}
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{info.desc}</p>
        {renderContactButton()}
      </div>
    );
  }

  /* ── Recruitment closed ──────────────────────────────────── */
  if (projectStatus !== "OPEN") {
    return (
      <div className="card p-5 space-y-3">
        <p className="text-[13px] font-semibold text-foreground">Recruitment closed</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          This project is no longer accepting new applications.
        </p>
        {renderContactButton()}
      </div>
    );
  }

  /* ── Open — show apply + bookmark + contact ──────────────── */
  return (
    <>
      <div className="card p-5 space-y-3">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Join this project</h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Send a short message explaining how you can contribute.
        </p>

        <div className="flex flex-col gap-2 pt-1">
          {/* Apply */}
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary w-full justify-center text-[13px] py-2"
          >
            Apply to join
          </button>

          {/* Bookmark toggle */}
          <button
            type="button"
            onClick={toggleBookmark}
            disabled={bmLoading}
            className={`btn-secondary w-full justify-center text-[13px] py-2 gap-1.5 transition-all ${
              bookmarked ? "text-foreground border-foreground/30" : ""
            }`}
          >
            <Bookmark
              size={14}
              strokeWidth={1.75}
              className={bookmarked ? "fill-foreground" : ""}
            />
            {bookmarked ? "Bookmarked" : "Save project"}
          </button>

          {/* Contact */}
          {renderContactButton()}
        </div>
      </div>

      {/* Apply modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="w-full max-w-md card p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} strokeWidth={1.75} className="text-muted-foreground" />
                <h3 className="text-[15px] font-semibold text-foreground">Apply to collaborate</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="btn-ghost p-1.5" aria-label="Close">
                <X size={15} strokeWidth={1.75} />
              </button>
            </div>

            <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
              Explain why you&apos;re interested and what skills you bring to the team.
            </p>

            {applyError && (
              <div className="p-3 mb-4 text-[12px] rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                {applyError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                minLength={10}
                maxLength={500}
                placeholder="Hi, I'd love to help with this project because…"
                className="forge-input resize-none mb-1 w-full"
              />
              <p className="text-[10px] text-muted-foreground text-right mb-4">
                {message.length}/500
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="btn-secondary text-[13px] py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || message.trim().length < 10}
                  className="btn-primary text-[13px] py-2 px-4"
                >
                  {submitting ? "Sending…" : "Submit application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
