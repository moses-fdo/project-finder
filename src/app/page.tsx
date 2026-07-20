import Link from "next/link";
import {
  ArrowRight,
  Users,
  FolderOpen,
  Send,
  Shield,
  Zap,
  GitMerge,
  CheckCircle2,
  Layers,
  Search,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CountUpStat from "@/components/CountUpStat";
import ThemeToggle from "@/components/ThemeToggle";
import ColabroLogo from "@/components/ColabroLogo";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <ColabroLogo size={40} />
            <span
              className="text-[15px] font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif" }}
            >
              Colabro
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn-ghost text-[13px] px-3 py-[7px]">Sign in</Link>
            <Link href="/signup" className="btn-primary text-[13px] py-[7px] px-4">Get started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden hero-grid-bg">
          {/* radial fade over the grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 100% 60%, rgba(0,0,0,0.02) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 md:pt-32 md:pb-28">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left — copy */}
              <div>
                <h1
                  className="reveal delay-100 text-[2.75rem] sm:text-[3.25rem] lg:text-[3.75rem] font-extrabold tracking-tight leading-[1.08] text-foreground mb-5"
                  style={{ fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif" }}
                >
                  Find teammates.<br />
                  <span className="text-[#7c3aed]">Ship ideas.</span>
                </h1>

                <p className="reveal delay-200 text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-md">
                  Colabro connects students and faculty to build real
                  projects together — from weekend hackathons to semester-long
                  research initiatives.
                </p>

                <div className="reveal delay-300 flex flex-col sm:flex-row gap-3 mb-6">
                  <Link
                    href="/signup"
                    className="btn-primary text-[13.5px] px-6 py-2.5 rounded-lg"
                  >
                    Create free account
                    <ArrowRight size={14} strokeWidth={2.25} />
                  </Link>
                  <Link href="/login" className="btn-secondary text-[13.5px] px-6 py-2.5 rounded-lg">
                    Sign in
                  </Link>
                </div>

                <p className="reveal delay-400 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 size={11} strokeWidth={2} className="text-[#16a34a]" />
                  Free to use · No app download required
                </p>
              </div>

              {/* Right — UI mockup */}
              <div className="reveal delay-300 hidden md:block interactive-mockup">
                <div className="mockup-inner mockup-card p-5 space-y-3">
                  {/* mockup header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-foreground">Open projects</span>
                    <span className="badge badge-green text-[10px]">Live</span>
                  </div>

                  {/* project cards */}
                  {[
                    { title: "AI Resume Screener", dept: "CSE · AI/ML", tags: ["Python", "FastAPI"], slots: 2 },
                    { title: "Campus EV Tracker",  dept: "ECE · IoT",   tags: ["React", "Node"],   slots: 1 },
                    { title: "Smart Attendance",   dept: "IT · CV",     tags: ["OpenCV", "Flask"], slots: 3 },
                  ].map((p) => (
                    <div
                      key={p.title}
                      className="card p-3.5 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-foreground truncate">{p.title}</p>
                        <p className="text-[10.5px] text-muted-foreground mt-0.5">{p.dept}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {p.tags.map((t) => (
                            <span key={t} className="badge badge-gray text-[9.5px] px-1.5 py-0.5 rounded-md">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {p.slots} slot{p.slots !== 1 ? "s" : ""} open
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* bottom bar */}
                  <div className="pt-1 flex items-center justify-between" style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.05)" }}>
                    <span className="text-[10.5px] text-muted-foreground">Showing 3 of 24 projects</span>
                    <span className="text-[10.5px] font-medium text-foreground flex items-center gap-1">
                      View all <ArrowRight size={10} strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ──────────────────────────────────────── */}
        <section className="bg-card" style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.05), inset 0 1px 0 rgba(0,0,0,0.04)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-3">
              <CountUpStat
                end={120}
                suffix="+"
                label="Projects posted"
                sub="Student & faculty initiatives"
                icon={<FolderOpen size={15} strokeWidth={1.75} />}
              />
              <CountUpStat
                end={850}
                suffix="+"
                label="Active members"
                sub="Verified students"
                icon={<Users size={15} strokeWidth={1.75} />}
              />
              <CountUpStat
                end={2400}
                suffix="+"
                label="Applications"
                sub="Collaboration requests sent"
                icon={<Send size={15} strokeWidth={1.75} />}
              />
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section id="features" className="py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center mb-14">
              <p className="reveal section-label mb-3">Platform features</p>
              <h2
                className="reveal delay-100 text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-foreground leading-tight"
                style={{ fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif" }}
              >
                Everything you need to collaborate
              </h2>
              <p className="reveal delay-200 text-[14px] text-muted-foreground mt-3 max-w-md mx-auto">
                Built around how student teams actually work — fast, informal, and results-driven.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <FolderOpen size={18} strokeWidth={1.75} />,
                  title: "Post your project",
                  body: "Describe your idea, set required skills and team size, and publish to the entire community in under two minutes.",
                  delay: "",
                },
                {
                  icon: <Search size={18} strokeWidth={1.75} />,
                  title: "Discover & filter",
                  body: "Browse open projects filtered by department, tech stack, or hackathon. Find exactly the kind of work you want to be part of.",
                  delay: "delay-100",
                },
                {
                  icon: <Users size={18} strokeWidth={1.75} />,
                  title: "Build your team",
                  body: "Accept applications, review profiles, and assemble a cross-department team with the exact skills your project needs.",
                  delay: "delay-200",
                },
                {
                  icon: <Zap size={18} strokeWidth={1.75} />,
                  title: "Instant notifications",
                  body: "Get notified the moment someone applies to your project or accepts your collaboration request.",
                  delay: "delay-300",
                },
                {
                  icon: <Layers size={18} strokeWidth={1.75} />,
                  title: "Hackathon listings",
                  body: "Admins curate an up-to-date list of upcoming hackathons. Find events, form a team, and register together.",
                  delay: "delay-400",
                },
                {
                  icon: <GitMerge size={18} strokeWidth={1.75} />,
                  title: "Verified community",
                  body: "Every member is verified with an institutional email. No bots, no noise — just real students and faculty.",
                  delay: "delay-500",
                },
              ].map((f) => (
                <div key={f.title} className={`reveal ${f.delay} feature-card p-6 space-y-3`}>
                  <div className="h-9 w-9 rounded-lg bg-[rgba(124,58,237,0.08)] border border-[rgba(124,58,237,0.15)] flex items-center justify-center text-[#7c3aed]">
                    {f.icon}
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground">{f.title}</h3>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 bg-card" style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.04)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">

            <div className="text-center mb-14">
              <p className="reveal section-label mb-3">Getting started</p>
              <h2
                className="reveal delay-100 text-[1.875rem] sm:text-[2.25rem] font-bold tracking-tight text-foreground leading-tight"
                style={{ fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif" }}
              >
                From idea to team in three steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {[
                {
                  n: "01",
                  title: "Sign up & verify",
                  body: "Register with your institutional email address and confirm your identity with a one-time code sent to your inbox.",
                  delay: "",
                },
                {
                  n: "02",
                  title: "Discover or post",
                  body: "Browse ongoing projects filtered by skill or department — or post your own idea with the skills and stack you need.",
                  delay: "delay-200",
                },
                {
                  n: "03",
                  title: "Collaborate",
                  body: "Apply to join a project or review incoming applications. Accept teammates and start building together.",
                  delay: "delay-400",
                },
              ].map((step, i) => (
                <div key={step.n} className={`reveal ${step.delay} step-connector relative flex flex-col items-center text-center px-6 py-8`}>
                  {/* connector line — rendered by .step-connector::after except last child */}
                  {i < 2 && (
                    <div
                      className="hidden md:block absolute top-[2.75rem] left-[calc(50%+2rem)] right-0 h-px bg-border"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className="h-11 w-11 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold shrink-0 mb-5 z-10"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {step.n}
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-[12.5px] text-muted-foreground leading-relaxed max-w-[220px]">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social proof strip ───────────────────────────────── */}
        <section className="py-16" style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.04)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="reveal text-center section-label mb-10">Trusted by students across departments</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  quote: "Found my entire hackathon team in less than a day. We ended up winning second place.",
                  name: "Arjun R.",
                  dept: "B.Tech CSE, 3rd year",
                  delay: "",
                },
                {
                  quote: "Posted my IoT project and got three solid applicants within 48 hours. Way better than asking around manually.",
                  name: "Priya S.",
                  dept: "B.Tech ECE, 4th year",
                  delay: "delay-100",
                },
                {
                  quote: "The verified-only access makes a real difference. Everyone here is serious about building something.",
                  name: "Karthik M.",
                  dept: "M.Tech AI, 1st year",
                  delay: "delay-200",
                },
              ].map((t) => (
                <div key={t.name} className={`reveal ${t.delay} card p-6 space-y-4`}>
                  {/* stars */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#7c3aed" aria-hidden="true">
                        <path d="M6 1l1.236 2.505L10 3.924 8 5.88l.472 2.748L6 7.25l-2.472 1.378L4 5.88 2 3.924l2.764-.419z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-[13px] text-foreground leading-relaxed">"{t.quote}"</p>
                  <div>
                    <p className="text-[12px] font-semibold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.dept}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="py-24 cta-dark" style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.08)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <p
              className="reveal text-[11px] font-semibold tracking-widest uppercase mb-5 opacity-50"
              style={{ color: "var(--background)" }}
            >
              Ready to build?
            </p>
            <h2
              className="reveal delay-100 text-[2rem] sm:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-5"
              style={{
                color: "var(--background)",
                fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif",
              }}
            >
              Your next project team<br />is already here.
            </h2>
            <p
              className="reveal delay-200 text-[14px] leading-relaxed max-w-md mx-auto mb-10 opacity-60"
              style={{ color: "var(--background)" }}
            >
              Join Colabro for free and start connecting with students
              who want to build the same things you do.
            </p>
            <div className="reveal delay-300 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg text-[13.5px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
              >
                Create free account
                <ArrowRight size={14} strokeWidth={2.25} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg border text-[13.5px] font-medium transition-colors hover:opacity-70"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "var(--background)",
                  background: "transparent",
                }}
              >
                Sign in
              </Link>
            </div>
            <p
              className="reveal delay-400 text-[11px] mt-6 opacity-40"
              style={{ color: "var(--background)" }}
            >
              Requires a verified institutional email address
            </p>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-card py-8" style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.05)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ColabroLogo size={22} />
              <span
                className="text-[13px] font-semibold text-foreground"
                style={{ fontFamily: "var(--font-bricolage), var(--font-outfit), sans-serif" }}
              >
                Colabro
              </span>
              <span className="text-[12px] text-muted-foreground">
                · Campus Collaboration Platform
              </span>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/login"  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/signup" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Register</Link>
              <span className="text-[12px] text-muted-foreground">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
