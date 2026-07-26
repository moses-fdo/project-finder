"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="mx-4 w-full max-w-md rounded-2xl border border-red-500/20 bg-white p-6 shadow-2xl dark:bg-gray-900 dark:border-red-500/30"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Message Blocked
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your message contains inappropriate language
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-red-50 p-4 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Please remove the following word{flaggedWords.length > 1 ? "s" : ""}{" "}
                before sending:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {flaggedWords.map((word, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/50 dark:text-red-300"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Dismiss
              </button>
              <button
                onClick={onRevise}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Revise Message
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}