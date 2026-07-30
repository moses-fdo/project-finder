"use client";

import { useState } from "react";
import { Trophy } from "lucide-react";

interface EventsTabProps {
  events?: any[];
  hackathons?: any[];
  nowMs: number;
}

export default function EventsTab({ events = [], hackathons = [], nowMs }: EventsTabProps) {
  const [eventFilter, setEventFilter] = useState<"all" | "active" | "ended">("active");
  const eventsList = (events && events.length > 0) ? events : hackathons;

  const parseEventEndDate = (h: any): number | null => {
    const dateStr = h.endDate || h.date || h.startDate;
    if (!dateStr) return null;

    let endPart = dateStr;
    if (dateStr.includes(" - ")) {
      endPart = dateStr.split(" - ").pop()!.trim();
    } else if (dateStr.includes(" to ")) {
      endPart = dateStr.split(" to ").pop()!.trim();
    } else if (dateStr.includes("→")) {
      endPart = dateStr.split("→").pop()!.trim();
    }

    let d = new Date(endPart);
    if (isNaN(d.getTime())) {
      d = new Date(`${endPart} ${new Date().getFullYear()}`);
    }
    if (isNaN(d.getTime())) return null;

    if (!endPart.includes("T") && !endPart.includes(":")) {
      d.setHours(23, 59, 59, 999);
    }
    return d.getTime();
  };

  const activeEvents = eventsList.filter((h: any) => {
    const endMs = parseEventEndDate(h);
    if (endMs === null) return true;
    return endMs >= nowMs;
  });

  const endedEvents = eventsList.filter((h: any) => {
    const endMs = parseEventEndDate(h);
    if (endMs === null) return false;
    return endMs < nowMs;
  });

  const displayEvents = eventFilter === "active" ? activeEvents : (eventFilter === "ended" ? endedEvents : eventsList);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-bold text-textPrimary tracking-tight">Events &amp; Competitions</h2>
          <p className="text-[12px] text-textMuted mt-0.5">Explore hackathons, hiring challenges, and tech events from top platforms &amp; universities.</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEventFilter("active")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "active"
                ? "bg-card text-textPrimary shadow-sm font-bold"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            Upcoming &amp; Live ({activeEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("ended")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "ended"
                ? "bg-card text-textPrimary shadow-sm font-bold"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            Past Events ({endedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("all")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "all"
                ? "bg-card text-textPrimary shadow-sm font-bold"
                : "text-textMuted hover:text-textPrimary"
            }`}
          >
            All ({eventsList.length})
          </button>
        </div>
      </div>

      {displayEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayEvents.map((h: any) => {
            const endMs = parseEventEndDate(h);
            const isEnded = endMs !== null && endMs < nowMs;
            const locationStr = [h.location, h.city, h.state, h.country].filter(Boolean).join(", ") || h.location || "Online";

            return (
              <div
                key={h.id}
                className={`card p-5 space-y-4 flex flex-col justify-between hover:bg-card-hover relative transition-all ${
                  isEnded ? "opacity-75 bg-card/60" : ""
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold shrink-0 text-[18px]">
                        🏆
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-textPrimary leading-snug line-clamp-1">{h.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {h.organizer && (
                            <span className="text-[11px] font-semibold text-textPrimary/90">{h.organizer}</span>
                          )}
                          {h.organizerType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-textMuted font-medium">
                              {h.organizerType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isEnded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-textMuted border border-border shrink-0">
                        Ended
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Live / Upcoming
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-textMuted leading-relaxed line-clamp-3">
                    {h.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-textMuted font-medium pt-2 border-t border-border/50">
                    <div>
                      <span className="text-textPrimary font-semibold">📅 Dates:</span>{" "}
                      {h.startDate
                        ? `${h.startDate}${h.endDate ? ` → ${h.endDate}` : ""}`
                        : (h.date || "TBA")}
                    </div>
                    <div>
                      <span className="text-textPrimary font-semibold">📍 Venue:</span> {locationStr}
                    </div>
                    {h.mode && (
                      <div>
                        <span className="text-textPrimary font-semibold">🌐 Mode:</span> {h.mode}
                      </div>
                    )}
                    {h.registrationFee && (
                      <div>
                        <span className="text-textPrimary font-semibold">💳 Fee:</span> {h.registrationFee}
                      </div>
                    )}
                    {h.prize && (
                      <div className="col-span-2 text-amber-400 font-semibold line-clamp-1">
                        🏆 Prize Pool: {h.prize}
                      </div>
                    )}
                    {h.source && (
                      <div className="col-span-2 text-[10px] text-textMuted/80">
                        Source: {h.source}
                      </div>
                    )}
                  </div>
                </div>

                {h.link ? (
                  <div className="border-t border-border pt-3">
                    <a
                      href={h.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full justify-center text-[12px] py-2 flex items-center gap-1.5 font-bold transition-all rounded-lg ${
                        isEnded
                          ? "btn-secondary text-textMuted hover:text-textPrimary opacity-80"
                          : "btn-primary"
                      }`}
                    >
                      {isEnded ? "View Event Page ↗" : "Register Now ↗"}
                    </a>
                  </div>
                ) : (
                  <div className="border-t border-border pt-3">
                    <span className="text-[11px] text-textMuted italic">Registration opens soon</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center space-y-2">
          <Trophy size={32} className="mx-auto text-textMuted/40" />
          <p className="text-[14px] font-medium text-textPrimary">
            {eventFilter === "active" ? "No upcoming events right now" : "No events found"}
          </p>
          <p className="text-[12px] text-textMuted">
            {eventFilter === "active"
              ? "Check back soon for new hackathons and competitions, or view past events."
              : "Try switching filters to view upcoming or past events."}
          </p>
        </div>
      )}
    </div>
  );
}
