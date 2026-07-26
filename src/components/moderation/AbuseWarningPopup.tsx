"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ShieldAlert, ArrowLeft } from "lucide-react";

interface AbuseWarningPopupProps {
  isOpen: boolean;
  flaggedWords: string[];
  onClose: () => void;
  onRevise: () => void;
}

export default function AbuseWarningPopup({
  isOpen,
  flaggedWords,
  onClose,
  onRevise,
}: AbuseWarningPopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="card w-full max-w-[460px] p-6 space-y-4 border border-border bg-card shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center font-bold shrink-0">
                  <ShieldAlert size={20} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground">Content Blocked</h3>
                  <p className="text-[12px] text-muted-foreground">Inappropriate or abusive language detected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost p-1.5 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2.5">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={15} strokeWidth={2} className="shrink-0" />
                <p className="text-[12px] font-semibold">
                  Please remove or rephrase the following word{flaggedWords.length > 1 ? "s" : ""} before submitting:
                </p>
              </div>

              {flaggedWords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {flaggedWords.map((word, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-md bg-destructive/15 border border-destructive/30 px-2.5 py-1 text-[11px] font-mono font-semibold text-destructive"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Colabro enforces community moderation standards. Submitting abusive text may lead to account penalties or restrictions.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-[12px] py-2 px-4 flex-1 justify-center cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={onRevise}
                className="btn-primary text-[12px] py-2 px-4 flex-1 justify-center gap-1.5 bg-destructive hover:bg-destructive/90 text-white cursor-pointer border-none"
              >
                <ArrowLeft size={14} />
                Revise Content
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
