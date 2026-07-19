import Link from "next/link";
import { ArrowRight, Users, FolderOpen, Send, Shield, Zap, GitMerge } from "lucide-react";

// Pure static marketing page — no DB queries, no auth checks.
// All project/user data is behind login.
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Public Navbar ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[7px] bg-foreground flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Colabro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"  className="btn-ghost text-[13px] px-3 py-[7px]">Sign in</Link>
            <Link href="/signup" className="btn-primary text-[13px] py-[7px] px-3">Get started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary border border-border text-[11px] font-medium text-muted-foreground mb-6">
                <Shield size={11} strokeWidth={1.75} />
                Verified @karunya.edu.in only
              </span>
              <h1 className="text-[2.5rem] sm:text-[3rem] font-bold tracking-tight text-foreground leading-[1.12] mb-5">
                Find collaborators.<br />Build real projects.
              </h1>
              <p className="text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-xl">
                Forge connects Karunya students and faculty to build real projects together.
                Post your idea, find the right team, and start building.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup" className="btn-primary text-[13px] px-5 py-2.5">
                  Create free account
                  <ArrowRight size={14} strokeWidth={2} />
                </Link>
                <Link href="/login" className="btn-secondary text-[13px] px-5 py-2.5">
                  Sign in
                </Link>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4">
                Requires a verified @karunya.edu.in email address.
              </p>
            </div>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────── */}
        <section className="border-y border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-3 divide-x divide-border text-center">
              <div className="px-4 sm:px-8 py-2">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
                  <FolderOpen size={13} strokeWidth={1.75} />
                  <span className="section-label">Projects posted</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Student and faculty initiatives across all departments</p>
              </div>
              <div className="px-4 sm:px-8 py-2">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
                  <Users size={13} strokeWidth={1.75} />
                  <span className="section-label">Active members</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Verified Karunya students seeking collaborators</p>
              </div>
              <div className="px-4 sm:px-8 py-2">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1.5">
                  <Send size={13} strokeWidth={1.75} />
                  <span className="section-label">Team applications</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Collaboration requests sent between students</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────── */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-[20px] font-semibold text-foreground tracking-tight mb-2">
                Everything you need to collaborate
              </h2>
              <p className="text-[13px] text-muted-foreground max-w-lg">
                Forge brings together the tools that make finding the right team and starting a project effortless.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="card p-6 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <FolderOpen size={15} strokeWidth={1.75} className="text-foreground" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">Post your project</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Describe your idea, list the skills you need, and publish your proposal to the entire Karunya community in minutes.
                </p>
              </div>
              <div className="card p-6 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <Users size={15} strokeWidth={1.75} className="text-foreground" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">Find the right team</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Browse profiles, filter by department and skill set, and send a collaboration request directly to project owners.
                </p>
              </div>
              <div className="card p-6 space-y-3">
                <div className="h-8 w-8 rounded-lg bg-secondary border border-border flex items-center justify-center">
                  <GitMerge size={15} strokeWidth={1.75} className="text-foreground" />
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">Build together</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Accept applications, assemble your cross-department team, and start building with people who complement your skills.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────── */}
        <section className="py-16 border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="text-[20px] font-semibold text-foreground tracking-tight mb-2">How it works</h2>
              <p className="text-[13px] text-muted-foreground">Get from idea to team in three steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { n: "1", title: "Sign up & verify", body: "Register with your @karunya.edu.in email and confirm your identity with a one-time verification code." },
                { n: "2", title: "Discover or post",  body: "Browse ongoing projects filtered by skill or department, or post your own idea with the required tech stack." },
                { n: "3", title: "Collaborate",        body: "Apply to join a project or review incoming applications. Accept teammates and start building your idea together." },
              ].map((step) => (
                <div key={step.n} className="flex gap-4">
                  <div className="h-7 w-7 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold shrink-0">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Access notice ──────────────────────────────────── */}
        <section className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={16} strokeWidth={1.75} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1">
                    Project details are visible to verified members only
                  </h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed max-w-lg">
                    All project listings, team member profiles, and collaboration details are accessible exclusively to verified Karunya students and faculty.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Link href="/signup" className="btn-primary text-[13px] px-4 py-2.5 justify-center">
                  Create account <ArrowRight size={13} strokeWidth={2} />
                </Link>
                <Link href="/login" className="btn-secondary text-[13px] px-4 py-2.5 justify-center">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-[5px] bg-foreground flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2h4v4H2zM8 2h4v4H8zM2 8h4v4H2zM8 8h4v4H8z" fill="white" />
              </svg>
            </div>
            <p className="text-[12px] text-muted-foreground">
              © {new Date().getFullYear()} Forge — Karunya Institute of Technology &amp; Sciences
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login"  className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/signup" className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
