"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, MoveRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import LenisScroller from "@/components/animated/LenisScroller";
import anime from "animejs";

gsap.registerPlugin(ScrollTrigger);

interface Stats {
  users: number;
  projects: number;
  openProjects: number;
  hackathons: number;
}
interface Props { stats: Stats }

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

const HOW = [
  {
    title: "Post your idea",
    body: "Name it, describe it, list the skills you need. Takes two minutes. Your project is live immediately.",
  },
  {
    title: "Applications come to you",
    body: "Students browse and apply. You see their profile, skills, and year. Pick who fits.",
  },
  {
    title: "Ship together",
    body: "Team assembled. Hackathon registered. Build something you'd actually want to use.",
  },
];

export default function LandingPage({ stats = { users: 0, projects: 0, openProjects: 0, hackathons: 0 } }: Props) {
  const navRef    = useRef<HTMLElement>(null);
  const heroRef   = useRef<HTMLDivElement>(null);
  const statsRef  = useRef<HTMLDivElement>(null);
  const howRef    = useRef<HTMLElement>(null);
  const ctaRef    = useRef<HTMLElement>(null);
  const line1Ref  = useRef<HTMLSpanElement>(null);
  const line2Ref  = useRef<HTMLSpanElement>(null);
  const line3Ref  = useRef<HTMLSpanElement>(null);
  const subRef    = useRef<HTMLParagraphElement>(null);

  const statCards = [
    { value: stats.users,        label: "students",         suffix: "+" },
    { value: stats.openProjects, label: "open projects",    suffix: ""  },
    { value: stats.projects,     label: "total projects",   suffix: "+" },
    { value: stats.hackathons,   label: "hackathons",       suffix: ""  },
  ];

  useEffect(() => {
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
            anime({
              targets: obj, val: target,
              duration: 1600, easing: "easeOutExpo", delay: 120, round: 1,
              update() {
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

    /* ── How-it-works rows ── */
    if (howRef.current) {
      const rows = howRef.current.querySelectorAll(".how-row");
      gsap.fromTo(rows,
        { x: -32, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.7, ease: "power3.out", stagger: 0.14,
          scrollTrigger: { trigger: howRef.current, start: "top 78%", once: true },
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
  }, []);

  return (
    <LenisScroller>
      {/*
        Dark near-black surface with a single indigo accent.
        Scene: students in a campus lab at 2am, deadline energy.
        The darkness is intentional — not "tools are dark", but because
        this audience lives in dark-mode IDEs and terminal windows.
      */}
      <div
        className="min-h-screen overflow-x-hidden"
        style={{
          background: "oklch(0.12 0.01 260)",
          color: "oklch(0.97 0.005 260)",
          fontFamily: "var(--font-plus-jakarta), system-ui, -apple-system, sans-serif",
        }}
      >

        {/* ── SVG grid background — single clean texture ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 0 }}
        >
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="lp-grid" width="64" height="64" patternUnits="userSpaceOnUse">
                <path d="M 64 0 L 0 0 0 64" fill="none" stroke="oklch(0.97 0.005 260 / 0.05)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lp-grid)" />
          </svg>
          {/* Single radial accent glow — top-left, structural not decorative */}
          <div style={{
            position: "absolute", top: "-10%", left: "-5%",
            width: "55vw", height: "55vw", borderRadius: "50%",
            background: "radial-gradient(circle, oklch(0.55 0.28 272 / 0.18) 0%, transparent 70%)",
            filter: "blur(1px)",
          }} />
        </div>

        {/* ── Navbar ──────────────────────────────────────────── */}
        <header
          ref={navRef}
          className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 sm:px-10 h-[58px]"
          style={{
            zIndex: 40,
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            background: "oklch(0.12 0.01 260 / 0.85)",
            borderBottom: "1px solid oklch(0.97 0.005 260 / 0.07)",
          }}
        >
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect width="26" height="26" rx="6" fill="oklch(0.55 0.28 272)"/>
              <path d="M6 6h6v6H6zM14 6h6v6H14zM6 14h6v6H6zM14 14h6v6H14z" fill="white"/>
            </svg>
            <span className="text-[16px] font-logo text-white">
              Colabro
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/login"
              style={{
                fontSize: "13px", fontWeight: 500, padding: "6px 14px",
                color: "oklch(0.97 0.005 260 / 0.75)",
                borderRadius: "8px",
                transition: "color 0.15s, background 0.15s",
              }}
              className="hover:text-white hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.28_272)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.55_0.28_272)] focus-visible:ring-offset-2"
              style={{
                fontSize: "13px", fontWeight: 700, padding: "7px 18px",
                background: "oklch(0.55 0.28 272)",
                color: "white", borderRadius: "8px",
                boxShadow: "0 0 20px oklch(0.55 0.28 272 / 0.4)",
                transition: "opacity 0.15s, transform 0.15s, box-shadow 0.15s",
              }}
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
              }}
            >
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line1Ref} className="inline-block">Find your</span>
              </span>
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line2Ref} className="inline-block">
                  next&nbsp;
                  <span style={{ color: "oklch(0.72 0.22 272)" }}>teammates.</span>
                </span>
              </span>
              <span className="block overflow-hidden py-[0.04em]">
                <span ref={line3Ref} className="inline-block">
                  Build&nbsp;
                  <span style={{
                    WebkitTextStroke: "1.5px oklch(0.97 0.005 260 / 0.5)",
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
              style={{
                fontSize: "17px",
                lineHeight: 1.65,
                color: "oklch(0.97 0.005 260 / 0.72)",
                maxWidth: "52ch",
                marginBottom: "2.75rem",
                textWrap: "pretty",
              }}
            >
              Colabro is the platform where students post projects, find collaborators,
              and ship together — from weekend hackathons to semester-long research.
              No cold emails. No Discord rabbit holes.
            </p>

            {/* Inline stats — not a hero-metric card grid; woven into a natural sentence */}
            <div
              ref={statsRef}
              className="flex flex-wrap gap-x-10 gap-y-4"
              style={{ borderTop: "1px solid oklch(0.97 0.005 260 / 0.08)", paddingTop: "1.5rem" }}
            >
              {statCards.map((s) => (
                <div key={s.label} className="sc flex items-baseline gap-2">
                  <span
                    data-count={s.value}
                    data-suffix={s.suffix}
                    style={{
                      fontFamily: "var(--font-outfit), sans-serif",
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                      color: "oklch(0.97 0.005 260)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmt(s.value)}{s.suffix}
                  </span>
                  <span style={{ fontSize: "13px", color: "oklch(0.97 0.005 260 / 0.60)", fontWeight: 500 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works — flowing prose, not a card grid ── */}
        <section
          ref={howRef}
          className="px-6 sm:px-10 py-28"
          style={{ zIndex: 1, position: "relative" }}
        >
          <div className="max-w-5xl mx-auto">
            <div
              className="grid gap-0"
              style={{ borderTop: "1px solid oklch(0.97 0.005 260 / 0.08)" }}
            >
              {HOW.map((step, i) => (
                <div
                  key={step.title}
                  className="how-row grid sm:grid-cols-[2.5rem_1fr] gap-6 py-10"
                  style={{ borderBottom: "1px solid oklch(0.97 0.005 260 / 0.08)" }}
                >
                  {/* Step number — structural, not decorative scaffolding */}
                  <span
                    style={{
                      fontFamily: "var(--font-outfit), sans-serif",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "oklch(0.55 0.28 272)",
                      paddingTop: "4px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    0{i + 1}
                  </span>
                  <div>
                    <h3
                      style={{
                        fontSize: "clamp(1.125rem, 2.5vw, 1.5rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        marginBottom: "0.6rem",
                        color: "oklch(0.97 0.005 260)",
                        fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "15px",
                        lineHeight: 1.7,
                        color: "oklch(0.97 0.005 260 / 0.52)",
                        maxWidth: "55ch",
                        textWrap: "pretty",
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA band ──────────────────────────────────────────── */}
        <section
          ref={ctaRef}
          className="px-6 sm:px-10 py-24"
          style={{
            zIndex: 1, position: "relative",
            background: "oklch(0.55 0.28 272 / 0.1)",
            borderTop: "1px solid oklch(0.55 0.28 272 / 0.18)",
          }}
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">
            <div>
              <h2
                className="cc"
                style={{
                  fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif",
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  color: "oklch(0.97 0.005 260)",
                  textWrap: "balance",
                  marginBottom: "0.75rem",
                }}
              >
                Your next team is<br />
                one post away.
              </h2>
              <p
                className="cc"
                style={{
                  fontSize: "15px",
                  color: "oklch(0.97 0.005 260 / 0.5)",
                  maxWidth: "44ch",
                  lineHeight: 1.65,
                }}
              >
                Free forever. No credit card. Verified campus community.
              </p>
            </div>

            <div className="cc flex flex-col gap-3 shrink-0">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 group"
                style={{
                  fontSize: "14px", fontWeight: 700, padding: "13px 28px",
                  background: "oklch(0.55 0.28 272)",
                  color: "white", borderRadius: "10px",
                  boxShadow: "0 0 40px oklch(0.55 0.28 272 / 0.4)",
                  transition: "opacity 0.15s",
                  minWidth: "220px",
                }}
              >
                Create free account
                <MoveRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                style={{
                  fontSize: "13px", fontWeight: 500, padding: "11px 28px",
                  color: "oklch(0.97 0.005 260 / 0.45)",
                  border: "1px solid oklch(0.97 0.005 260 / 0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                  transition: "color 0.15s, border-color 0.15s",
                }}
                className="hover:text-white/75 hover:border-white/2"
              >
                Already have an account
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer
          className="px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            zIndex: 1, position: "relative",
            borderTop: "1px solid oklch(0.97 0.005 260 / 0.07)",
          }}
        >
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect width="26" height="26" rx="6" fill="oklch(0.55 0.28 272)"/>
              <path d="M6 6h6v6H6zM14 6h6v6H14zM6 14h6v6H6zM14 14h6v6H14z" fill="white"/>
            </svg>
            <span className="text-[14px] font-logo text-white/80">
              Colabro
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "oklch(0.97 0.005 260 / 0.60)" }}>
            &#169; {new Date().getFullYear()} &#8212; Campus Collaboration Platform
          </span>
          <div className="flex gap-5" style={{ fontSize: "12px", color: "oklch(0.97 0.005 260 / 0.70)" }}>
            <Link href="/login"  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white">Sign in</Link>
            <Link href="/signup" className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white">Register</Link>
          </div>
        </footer>

      </div>
    </LenisScroller>
  );
}
