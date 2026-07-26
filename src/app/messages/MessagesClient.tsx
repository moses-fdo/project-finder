"use client";

import { useState, useEffect, useRef } from "react";
import { MessageInput } from "@/components/chat";

interface ChatMessage {
  id: number;
  text: string;
  sender: "me" | "other";
  timestamp: Date;
}

interface MessagesClientProps {
  userId: number | null;
}

export default function MessagesClient({ userId }: MessagesClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Welcome to the project chat! Please keep messages respectful and constructive. 🚀",
      sender: "other",
      timestamp: new Date(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    const msg: ChatMessage = {
      id: Date.now(),
      text,
      sender: "me",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, msg]);

    // Simulate reply after a short delay
    setTimeout(() => {
      const reply: ChatMessage = {
        id: Date.now() + 1,
        text: "Got it, thanks! 👍",
        sender: "other",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-sm font-bold text-primary">
          TC
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Team Chat</h2>
          <p className="text-xs text-muted-foreground">Project collaboration · Messages are moderated</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400">Active</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-secondary/20 p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "other" && (
                <div className="mr-2.5 flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                  TC
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === "me"
                    ? "rounded-br-sm bg-primary text-primary-foreground shadow-sm"
                    : "rounded-bl-sm bg-card text-foreground shadow-sm border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    msg.sender === "me"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input with abuse blocker */}
      <div className="mx-auto w-full max-w-2xl">
        <MessageInput
          onSend={handleSend}
          userId={userId}
          placeholder="Type a message… (abusive content will be blocked)"
        />
      </div>
    </div>
  );
}
