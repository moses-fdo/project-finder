"use client";

import React, { useState } from "react";
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, X } from "lucide-react";

interface StudentIdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentIdModal({ isOpen, onClose }: StudentIdModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [department, setDepartment] = useState("");
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "err", message: "Image size must be under 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setIdCardImage(event.target?.result as string);
      setFeedback(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardImage) {
      setFeedback({ type: "err", message: "Please upload a photo of your Student ID Card." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/id-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          collegeName,
          department,
          idCardImage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request.");

      setFeedback({ type: "ok", message: data.message });
      setName("");
      setEmail("");
      setCollegeName("");
      setDepartment("");
      setIdCardImage(null);
    } catch (err: any) {
      setFeedback({ type: "err", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-[480px] p-6 space-y-5 border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Student ID Verification</h3>
              <p className="text-[11px] text-muted-foreground">For students without a .edu email address</p>
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
            className={`p-3.5 rounded-lg text-[12px] flex items-start gap-2.5 leading-relaxed border ${
              feedback.type === "ok"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            {feedback.type === "ok" ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block section-label mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="forge-input"
            />
          </div>

          <div>
            <label className="block section-label mb-1">Personal Email Address *</label>
            <input
              type="email"
              required
              placeholder="e.g. alex.johnson@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forge-input"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Once approved by admins, you can log in directly using this email.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block section-label mb-1">College / University Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. St. Joseph's Tech"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="forge-input"
              />
            </div>
            <div>
              <label className="block section-label mb-1">Department (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="forge-input"
              />
            </div>
          </div>

          {/* Student ID Photo Upload */}
          <div>
            <label className="block section-label mb-1">Student ID Card Photo *</label>
            <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-4 text-center transition-colors bg-card">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {idCardImage ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idCardImage}
                    alt="Student ID Card Preview"
                    className="max-h-36 mx-auto rounded-lg border border-border object-contain"
                  />
                  <p className="text-[11px] text-primary font-semibold">Click or drag to replace ID image</p>
                </div>
              ) : (
                <div className="space-y-1.5 py-2">
                  <Upload size={24} className="mx-auto text-muted-foreground" />
                  <p className="text-[12px] font-medium text-foreground">Click or drag Student ID image here</p>
                  <p className="text-[10px] text-muted-foreground">Supports JPG, PNG, or WebP (max 5MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-[12px] py-2 px-4 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !idCardImage}
              className="btn-primary text-[12px] py-2 px-5 font-bold cursor-pointer"
            >
              {submitting ? "Submitting Request…" : "Submit Student ID"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
