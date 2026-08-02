"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MoveRight, Rocket, Users, CalendarDays, Bell } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import LenisScroller from "@/components/animated/LenisScroller";
import ColabroLogo from "@/components/ColabroLogo";

gsap.registerPlugin(ScrollTrigger);

interface Stats {
  users: number;
  projects: number;
  openProjects: number;
  events?: number;
  hackathons?: number;
}
interface Props { stats: Stats }

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

const HOW = [
  {
    icon: Rocket,
    step: "01",
    title: "Post your idea",
    body: "Name it, describe it, list the skills you need. Takes two minutes — your project is live immediately.",
  },
  {
    icon: Users,
    step: "02",
    title: "Applications come to you",
    body: "Students browse and apply. You see their profile, skills, and year. Pick who fits.",
  },
  {
    icon: CalendarDays,
    step: "03",
    title: "Ship together",
    body: "Team assembled. Event registered. Build something you'd actually want to use.",
  },
];

const FEATURES = [
  {
    icon: Rocket,
    title: "Post in minutes",
    body: "A clean form, instant publish. No friction between having an idea and finding teammates for it.",
  },
  {
    icon: Users,
    title: "Match on skills",
    body: "Profiles carry your skills, year, and links — so you can vet applicants before you ever chat.",
  },
  {
    icon: Bell,
    title: "Never miss a reply",
    body: "Applications and mentions land in your inbox, with unread badges that actually stay accurate.",
  },
  {
    icon: CalendarDays,
    title: "Built for campus events",
    body: "From weekend hackathons to semester-long research, Colabro is tuned for the way students build.",
  },
];

export default function LandingPage({ stats = { users: 0, projects: 0, openProjects: 0, events: 0, hackathons: 0 } }: Props) {
  const navRef    = useRef<HTMLElement>(null);
  const heroRef   = useRef<HTMLDivElement>(null);
  const statsRef  = useRef<HTMLDivElement>(null);
  const howRef    = useRef<HTMLElement>(null);
  const featRef   = useRef<HTMLElement>(null);
  const ctaRef    = useRef<HTMLElement>(null);
  const line1Ref  = useRef<HTMLSpanElement>(null);
  const line2Ref  = useRef<HTMLSpanElement>(null);
  const line3Ref  = useRef<HTMLSpanElement>(null);
  const subRef    = useRef<HTMLParagraphElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  const eventCount = stats.events ?? stats.hackathons ?? 0;

  const statCards = [
    { value: stats.users,        label: "students",         suffix: "+" },
    { value: stats.openProjects, label: "open projects",    suffix: ""  },
    { value: stats.projects,     label: "total projects",   suffix: "+" },
    { value: eventCount,         label: "events & hackathons", suffix: "" },
  ];

  useEffect(() => {
    if (reduceMotion) return;

    /* ── Navbar ── */
    gsap.fromTo(navRef.current,
      { y: -64, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
    );

    /* ── Hero headline: lines clip up from overflow:hidden containers ── */
    const lines = [line1Ref.current, line2Ref.current, line3Ref.current];
    gsap.fromTo(lines,
      { yPercent: 115 },
      { yPercent: 0, duration: 1.0, ease: "expo.out", stagger: 0.09, delay: 0.2 }
    );

    /* ── Sub-copy ── */
    gsap.fromTo(subRef.current,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.75, ease: "power2.out", delay: 0.85 }
    );

    /* ── Inline stats: count up when in view ── */
    if (statsRef.current) {
      const numEls = statsRef.current.querySelectorAll<HTMLElement>("[data-count]");
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 88%",
        once: true,
        onEnter: () => {
          gsap.fromTo(statsRef.current!.querySelectorAll(".sc"),
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: "power2.out", stagger: 0.08 }
          );
          numEls.forEach(el => {
            const target = parseInt(el.dataset.count ?? "0", 10);
            const suf    = el.dataset.suffix ?? "";
            const obj    = { val: 0 };
            gsap.to(obj, {
              val: target,
              duration: 1.6,
              delay: 0.12,
              ease: "power4.out",
              onUpdate() {
                const v = obj.val >= 1000
                  ? (obj.val / 1000).toFixed(1).replace(/\.0$/, "") + "k"
                  : String(Math.round(obj.val));
                el.textContent = v + suf;
              },
            });
          });
        },
      });
    }

    /* ── How-it-works cards ── */
    if (howRef.current) {
      gsap.fromTo(howRef.current.querySelectorAll(".how-card"),
        { y: 32, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.14,
          scrollTrigger: { trigger: howRef.current, start: "top 78%", once: true },
        }
      );
    }

    /* ── Feature cards ── */
    if (featRef.current) {
      gsap.fromTo(featRef.current.querySelectorAll(".feat-card"),
        { y: 32, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: featRef.current, start: "top 78%", once: true },
        }
      );
    }

    /* ── CTA ── */
    if (ctaRef.current) {
      gsap.fromTo(ctaRef.current.querySelectorAll(".cc"),
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.13,
          scrollTrigger: { trigger: ctaRef.current, start: "top 82%", once: true },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [reduceMotion]);

  return (
    <LenisScroller>
      {/* Theme-aware surface — follows light/dark via design tokens, accent stays #6C5CE7 */}
      <div className="min-h-screen overflow-x-hidden bg-background text-foreground">

        {/* ── SVG grid background — single clean texture, token-stroked ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 0 }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lp-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="var(--border)" strokeWidth="0.75"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lp-grid)" />
          </svg>
          {/* Single radial accent glow — top-left, structural not decorative */}
          <div style={{
            position: "absolute", top: "-10%", left: "-5%",
            width: "55vw", height: "55vw", borderRadius: "50%",
            background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 14%, transparent) 0%, transparent 70%)",
          }} />
        </div>

        {/* ── Navbar ──────────────────────────────────────────── */}
        <header
          ref={navRef}
          className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 sm:px-10 h-[58px] backdrop-blur-xl bg-background/80 border-b border-border"
          style={{ zIndex: 40 }}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <ColabroLogo size={28} />
            <span className="text-[16px] font-logo text-foreground">
              Colabro
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              className="inline-flex items-center px-3.5 py-[6px] text-[13px] font-medium text-muted-foreground rounded-lg hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 px-4.5 py-[7px] text-[13px] font-bold text-primary-foreground rounded-lg bg-primary hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              style={{ boxShadow: "0 0 20px color-mix(in oklab, var(--accent) 40%, transparent)" }}
            >
              Get started <ArrowRight size={13} />
            </Link>
          </div>
        </header>

        {/* ── Hero ──────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative flex flex-col justify-center min-h-screen px-6 sm:px-10 pt-[58px]"
          style={{ zIndex: 1 }}
        >
          <div className="max-w-5xl mx-auto w-full">

            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-muted-foreground"
              style={{ marginBottom: "1.5rem" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-semibold tracking-wide">Campus project collaboration</span>
            </div>

            {/* Headline — large, clipped lines */}
            <h1
              className="mb-8"
              style={{
                fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif",
                fontSize: "clamp(3rem, 9vw, 5.75rem)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
                textWrap: "balance",
                color: "var(--text-primary)",
              }}
            >
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line1Ref} className="inline-block">Find your</span>
              </span>
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line2Ref} className="inline-block">
                  next&nbsp;
                  <span style={{ color: "var(--accent)" }}>teammates.</span>
                </span>
              </span>
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line3Ref} className="inline-block">
                  Build&nbsp;
                  <span style={{
                    WebkitTextStroke: "1.5px var(--text-secondary)",
                    color: "transparent",
                  }}>
                    something real.
                  </span>
                </span>
              </span>
            </h1>

            {/* Sub-copy — capped line length, real contrast */}
            <p
              ref={subRef}
              className="text-muted-foreground"
              style={{
                fontSize: "17px",
                lineHeight: 1.65,
                maxWidth: "52ch",
                marginBottom: "2rem",
                textWrap: "pretty",
              }}
            >
              Colabro is the platform where students post projects, find collaborators,
              and ship together — from weekend hackathons to semester-long research.
              No cold emails. No Discord rabbit holes.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: "3rem" }}>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-bold text-primary-foreground bg-primary hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{ boxShadow: "0 0 32px color-mix(in oklab, var(--accent) 38%, transparent)" }}
              >
                Create free account <ArrowRight size={15} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[14px] font-semibold text-foreground bg-background/60 border border-border hover:border-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Sign in to browse
              </Link>
            </div>

            {/* Inline stats — not a hero-metric card grid; woven into a natural sentence */}
            <div
              ref={statsRef}
              className="flex flex-wrap gap-x-10 gap-y-4"
              style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}
            >
              {statCards.map((s) => (
                <div key={s.label} className="sc flex items-baseline gap-2">
                  <span
                    data-count={s.value}
                    data-suffix={s.suffix}
                    className="text-[28px] font-extrabold tabular-nums tracking-tight text-foreground"
                    style={{ fontFamily: "var(--font-outfit), sans-serif", lineHeight: 1 }}
                  >
                    {fmt(s.value)}{s.suffix}
                  </span>
                  <span className="text-[13px] font-medium text-muted-foreground">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works — labeled section, card grid ── */}
        <section
          ref={howRef}
          className="px-6 sm:px-10 py-24 sm:py-32"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="max-w-5xl mx-auto">
            <div style={{ marginBottom: "3rem" }}>
              <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-accent" style={{ marginBottom: "0.5rem" }}>
                How it works
              </p>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  color: "var(--text-primary)",
                  textWrap: "balance",
                  maxWidth: "24ch",
                }}
              >
                From idea to shipped team in three steps.
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
              {HOW.map((step) => (
                <div key={step.title} className="how-card card p-6 sm:p-7 flex flex-col gap-5 card-hover">
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
                      <step.icon size={18} />
                    </div>
                    <span className="text-[12px] font-bold text-muted-foreground/60 tracking-widest">{step.step}</span>
                  </div>
                  <div>
                    <h3 className="type-card-title text-[16px] mb-1.5">{step.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Colabro — feature grid ── */}
        <section
          ref={featRef}
          className="px-6 sm:px-10 pb-24 sm:pb-32"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="max-w-5xl mx-auto">
            <div style={{ marginBottom: "3rem", maxWidth: "46ch" }}>
              <p className="text-[11px] font-semibold tracking-[0.06em] uppercase text-accent" style={{ marginBottom: "0.5rem" }}>
                Built for the way you build
              </p>
              <h2
                className="font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  color: "var(--text-primary)",
                  textWrap: "balance",
                }}
              >
                Everything you need to find the right people.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="feat-card card p-6 flex flex-col gap-4 card-hover">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center" style={{ color: "var(--accent)" }}>
                    <f.icon size={18} />
                  </div>
                  <div>
                    <h3 className="type-card-title text-[15px] mb-1">{f.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA band ──────────────────────────────────────────── */}
        <section
          ref={ctaRef}
          className="px-6 sm:px-10 pb-24"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="max-w-5xl mx-auto card p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8"
            style={{
              background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 9%, var(--bg-surface)) 0%, var(--bg-surface) 55%)",
              borderColor: "color-mix(in oklab, var(--accent) 28%, var(--border))",
            }}
          >
            <div>
              <h2
                className="cc font-heading"
                style={{
                  fontSize: "clamp(1.75rem, 4.5vw, 3rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  color: "var(--text-primary)",
                  textWrap: "balance",
                  marginBottom: "0.75rem",
                }}
              >
                Your next team is<br />
                one post away.
              </h2>
              <p
                className="cc text-muted-foreground"
                style={{ fontSize: "15px", maxWidth: "44ch", lineHeight: 1.65 }}
              >
                Free forever. No credit card. Verified campus community.
              </p>
            </div>

            <div className="cc flex flex-col gap-3 shrink-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-7 py-3.5 text-[14px] font-bold text-primary-foreground bg-primary hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                style={{ boxShadow: "0 0 40px color-mix(in oklab, var(--accent) 40%, transparent)", minWidth: "220px" }}
              >
                Create free account
                <MoveRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg px-7 py-3 text-[13px] font-medium text-muted-foreground border border-border hover:text-foreground hover:border-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer
          className="px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ zIndex: 1, position: "relative", borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <ColabroLogo size={22} />
            <span className="text-[14px] font-logo text-foreground/80">
              Colabro
            </span>
          </div>
          <span className="text-[12px] text-muted-foreground">
            &#169; {new Date().getFullYear()} &#8212; Campus Collaboration Platform
          </span>
          <div className="flex gap-5 text-[12px] text-muted-foreground">
            <Link href="/login"  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">Sign in</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">Register</Link>
          </div>
        </footer>

      </div>
    </LenisScroller>
  );
}
