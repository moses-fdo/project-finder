"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAbuseCheck } from "./useAbuseCheck";
import AbuseWarningPopup from "./AbuseWarningPopup";

interface MessageInputProps {
  /** Callback when the message passes abuse check and should be sent */
  onSend: (text: string) => Promise<void> | void;
  /** Current user ID (for logging blocked attempts) */
  userId?: number | null;
  /** Placeholder text */
  placeholder?: string;
  /** Disable input */
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  userId,
  placeholder = "Type your message...",
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [pendingWords, setPendingWords] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { checkText, isChecking, reset } = useAbuseCheck({
    userId,
    failOpen: true,
  });

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);

    try {
      // Step 1: Check for abusive content
      const result = await checkText(trimmed);

      if (result.abusive && result.flaggedWords.length > 0) {
        // Block the send and show popup with the specific offending words
        setPendingWords(result.flaggedWords);
        setShowPopup(true);
        setSending(false);
        return;
      }

      // Step 2: If clean, send the message
      await onSend(trimmed);
      setText("");
      reset();
    } catch {
      // Fail-open: allow send if check fails
      await onSend(trimmed);
      setText("");
      reset();
    } finally {
      setSending(false);
    }
  }, [text, sending, disabled, checkText, onSend, reset]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRevise = () => {
    setShowPopup(false);
    setPendingWords([]);
    textareaRef.current?.focus();
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPendingWords([]);
  };

  return (
    <>
      <div className="flex items-end gap-2 border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || sending}
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
            style={{ minHeight: "44px", maxHeight: "120px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
            }}
          />

          {isChecking && (
            <div className="absolute bottom-3 right-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          )}

          {!isChecking && text.length > 0 && (
            <div className="absolute bottom-3 right-3">
              <span
                className={`text-xs ${
                  text.length > 490
                    ? "text-red-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {text.length}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim() || sending || isChecking || disabled}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send message"
        >
          {sending || isChecking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      <AbuseWarningPopup
        isOpen={showPopup}
        flaggedWords={pendingWords}
        onClose={handleClosePopup}
        onRevise={handleRevise}
      />
    </>
  );
}