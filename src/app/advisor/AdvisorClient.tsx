"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

type Recommendation = {
  career: string;
  why: string;
  skillGaps: string[];
  learningOrder: string[];
};

type ChatMessage = { role: "user" | "model"; text: string };

export default function AdvisorClient() {
  const [loading, setLoading] = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState({
    interests: "",
    preferredDomain: "",
    experienceLevel: "",
    technologies: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetch("/api/advisor")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (data.isColdStart) {
          setIsColdStart(true);
        } else if (data.recommendation) {
          setRecommendation(data.recommendation);
        }
      })
      .catch(() => setError("Something went wrong loading your advisor."))
      .finally(() => setLoading(false));
  }, []);

  async function handleQuizSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch {
      setError("Something went wrong generating your recommendation.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChatSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: "user", text: chatInput };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/advisor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          history: chatHistory,
          recommendation,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatHistory([...newHistory, { role: "model", text: data.reply }]);
      } else if (data.error) {
        setChatHistory([
          ...newHistory,
          { role: "model", text: "Sorry, something went wrong: " + data.error },
        ]);
      }
    } catch {
      setChatHistory([
        ...newHistory,
        { role: "model", text: "Sorry, something went wrong." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  if (loading) {
    return <div className="p-6 type-body">Loading your advisor...</div>;
  }

  if (error) {
    return <div className="p-6 text-destructive type-body">{error}</div>;
  }

  if (recommendation) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-4">
        <h1 className="type-page-title">Your AI Advisor</h1>

        <div className="card">
          <p className="type-meta mb-1">Recommended Career</p>
          <h2 className="type-section-title text-primary">{recommendation.career}</h2>
        </div>

        <div className="card">
          <p className="type-meta mb-2">Why this career</p>
          <p className="type-body">{recommendation.why}</p>
        </div>

        <div className="card">
          <p className="type-meta mb-2">Skill Gaps</p>
          <ul className="flex flex-wrap gap-2">
            {recommendation.skillGaps.map((skill, i) => (
              <li key={i} className="badge badge-neutral normal-case font-medium">
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <p className="type-meta mb-2">Suggested Learning Order</p>
          <ol className="space-y-2">
            {recommendation.learningOrder.map((step, i) => (
              <li key={i} className="flex gap-3 type-body">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="card">
          <p className="type-meta mb-3">Ask a follow-up question</p>

          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {chatHistory.length === 0 && (
              <p className="type-meta">
                Ask me anything about this recommendation — e.g. &quot;what resources should I use?&quot;
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`text-[13px] rounded-[10px] px-3 py-2 max-w-[85%] prose prose-invert prose-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-secondary text-foreground"
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {chatLoading && (
              <div className="bg-secondary text-muted-foreground text-[13px] rounded-[10px] px-3 py-2 max-w-[85%]">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleChatSend} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="forge-input flex-1"
            />
            <button type="submit" disabled={chatLoading} className="btn-primary shrink-0">
              {chatLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isColdStart) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto">
        <h1 className="type-page-title mb-2">Let&apos;s get to know you</h1>
        <p className="type-body mb-6">
          Your profile doesn&apos;t have any skills or projects yet, so answer
          a few quick questions to get a personalized recommendation.
        </p>

        <form onSubmit={handleQuizSubmit} className="space-y-4">
          <div>
            <label className="type-meta block mb-1.5">What are you interested in?</label>
            <input
              type="text"
              required
              value={quiz.interests}
              onChange={(e) => setQuiz({ ...quiz, interests: e.target.value })}
              className="forge-input"
              placeholder="e.g. building apps, AI, design"
            />
          </div>

          <div>
            <label className="type-meta block mb-1.5">Preferred domain</label>
            <input
              type="text"
              required
              value={quiz.preferredDomain}
              onChange={(e) => setQuiz({ ...quiz, preferredDomain: e.target.value })}
              className="forge-input"
              placeholder="e.g. Web Development, Data Science"
            />
          </div>

          <div>
            <label className="type-meta block mb-1.5">Experience level</label>
            <input
              type="text"
              required
              value={quiz.experienceLevel}
              onChange={(e) => setQuiz({ ...quiz, experienceLevel: e.target.value })}
              className="forge-input"
              placeholder="Beginner / Intermediate / Advanced"
            />
          </div>

          <div>
            <label className="type-meta block mb-1.5">Technologies you&apos;ve used</label>
            <input
              type="text"
              required
              value={quiz.technologies}
              onChange={(e) => setQuiz({ ...quiz, technologies: e.target.value })}
              className="forge-input"
              placeholder="e.g. HTML, CSS, Python"
            />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Generating..." : "Get My Recommendation"}
          </button>
        </form>
      </div>
    );
  }

  return null;
}