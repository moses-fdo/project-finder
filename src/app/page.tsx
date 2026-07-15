import Link from "next/link";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import ProjectCard from "@/components/ProjectCard";
import { FiArrowRight } from "react-icons/fi";

export default async function Home() {
  const featuredProjects = await prisma.project.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      skills: true,
    },
  });

  const totalProjects = await prisma.project.count();
  const totalUsers = await prisma.user.count();
  const totalApplications = await prisma.application.count();

  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_50%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full mb-6">
                Verified @karunya.edu.in Only
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                Connect. Collaborate.{" "}
                <span className="bg-gradient-to-r from-primary via-indigo-300 to-ring bg-clip-text text-transparent">
                  Innovate together.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed">
                The premier hub for Karunya Institute of Technology and Sciences. Post projects, discover talented classmates, and assemble cross-department dream teams.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/projects"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-opacity-95 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  Explore Projects
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-foreground bg-card hover:bg-secondary rounded-xl border border-border transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-card/50 backdrop-blur-sm py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-4xl font-extrabold text-white mb-1">{totalProjects}</p>
                <p className="text-sm text-muted-foreground font-medium">Projects Posted</p>
              </div>
              <div className="border-t sm:border-t-0 sm:border-x border-border pt-6 sm:pt-0">
                <p className="text-4xl font-extrabold text-white mb-1">{totalUsers}</p>
                <p className="text-sm text-muted-foreground font-medium">Karunya Students</p>
              </div>
              <div className="border-t sm:border-t-0 pt-6 sm:pt-0">
                <p className="text-4xl font-extrabold text-white mb-1">{totalApplications}</p>
                <p className="text-sm text-muted-foreground font-medium">Team Applications</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Projects */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">Featured Projects</h2>
              <p className="text-muted-foreground">Recent initiatives looking for project team members.</p>
            </div>
            <Link
              href="/projects"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-primary hover:text-white transition-colors"
            >
              All Projects <FiArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project as any} />
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="py-16 bg-gradient-to-b from-transparent to-card/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-border relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.05),transparent_40%)]"></div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Ready to start collaborating?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Sign in with your @karunya.edu.in email to browse projects, post your ideas, and find students with the skills you need.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-ring hover:opacity-95 rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                Join Now
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:flex sm:justify-between sm:items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Karunya Collab Hub. All rights reserved.
          </p>
          <div className="flex justify-center gap-4 mt-4 sm:mt-0">
            <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground">Discover</Link>
            <span className="text-border">|</span>
            <span className="text-xs text-muted-foreground">Karunya University Student Project</span>
          </div>
        </div>
      </footer>
    </>
  );
}
