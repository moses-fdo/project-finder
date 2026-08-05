"use client";

import { useState } from "react";
import { Trophy, CalendarDays, MapPin, Globe, CreditCard } from "lucide-react";
import { parseEventEndDate } from "@/lib/projects";

interface EventsTabProps {
  events?: any[];
  hackathons?: any[];
  nowMs: number;
}

export default function EventsTab({ events = [], hackathons = [], nowMs }: EventsTabProps) {
  const [eventFilter, setEventFilter] = useState<"all" | "active" | "ended">("active");
  const eventsList = (events && events.length > 0) ? events : hackathons;

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
          <h2 className="type-section-title">Events &amp; Competitions</h2>
          <p className="type-meta mt-0.5">Explore hackathons, hiring challenges, and tech events from top platforms &amp; universities.</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-secondary/50 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setEventFilter("active")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "active"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming &amp; Live ({activeEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("ended")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "ended"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Past Events ({endedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("all")}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              eventFilter === "all"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
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
                className={`card p-5 space-y-4 flex flex-col justify-between hover:bg-muted relative transition-all ${
                  isEnded ? "opacity-75 bg-card/60" : ""
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Trophy size={18} strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-foreground leading-snug line-clamp-1">{h.title}</h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {h.organizer && (
                            <span className="text-[11px] font-semibold text-foreground/90">{h.organizer}</span>
                          )}
                          {h.organizerType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-medium">
                              {h.organizerType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isEnded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border shrink-0">
                        Ended
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        Live / Upcoming
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-3">
                    {h.description}
                  </p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[11px] text-muted-foreground font-medium pt-3 border-t border-border/50">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <CalendarDays size={11} className="shrink-0 mt-0.5 text-foreground" />
                      <span className="truncate">
                        {h.startDate
                          ? `${h.startDate}${h.endDate ? ` → ${h.endDate}` : ""}`
                          : (h.date || "TBA")}
                      </span>
                    </div>
                    <div className="flex items-start gap-1.5 min-w-0">
                      <MapPin size={11} className="shrink-0 mt-0.5 text-foreground" />
                      <span className="truncate">{locationStr}</span>
                    </div>
                    {h.mode && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Globe size={11} className="shrink-0 mt-0.5 text-foreground" />
                        <span className="truncate">{h.mode}</span>
                      </div>
                    )}
                    {h.registrationFee && (
                      <div className="flex items-start gap-1.5 min-w-0">
                        <CreditCard size={11} className="shrink-0 mt-0.5 text-foreground" />
                        <span className="truncate">{h.registrationFee}</span>
                      </div>
                    )}
                    {h.prize && (
                      <div className="col-span-2 flex items-center gap-1.5 text-amber-400 font-semibold truncate">
                        <Trophy size={11} className="shrink-0" />
                        <span className="truncate">Prize Pool: {h.prize}</span>
                      </div>
                    )}
                    {h.source && (
                      <div className="col-span-2 text-[10px] text-muted-foreground/80">
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
                          ? "btn-secondary text-muted-foreground hover:text-foreground opacity-80"
                          : "btn-primary"
                      }`}
                    >
                      {isEnded ? "View Event Page ↗" : "Register Now ↗"}
                    </a>
                  </div>
                ) : (
                  <div className="border-t border-border pt-3">
                    <span className="text-[11px] text-muted-foreground italic">Registration opens soon</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center space-y-2">
          <Trophy size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-[14px] font-medium text-foreground">
            {eventFilter === "active" ? "No upcoming events right now" : "No events found"}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {eventFilter === "active"
              ? "Check back soon for new hackathons and competitions, or view past events."
              : "Try switching filters to view upcoming or past events."}
          </p>
        </div>
      )}
    </div>
  );
}
