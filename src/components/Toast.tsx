"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = "info", onClose, duration = 4500 }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgMap = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    success: "bg-success/10 border-success/20 text-green-700 dark:text-green-400",
    info: "bg-secondary border-border text-foreground",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[200] flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-slide-in ${bgMap[type]} max-w-sm`}
      role="alert"
    >
      <span className="text-[13px] font-medium leading-snug flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="p-0.5 rounded-md opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
