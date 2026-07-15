import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { FiMail, FiGithub, FiLinkedin, FiBookOpen } from "react-icons/fi";
import ProjectCard from "@/components/ProjectCard";
import Link from "next/link";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+view+student+profiles.");
  }

  const { id } = await params;
  const userId = Number(id);

  if (isNaN(userId)) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      skills: true,
      projects: {
        include: {
          owner: true,
          skills: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <FiBookOpen className="text-xs" />
          Back to Discover
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: User info */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-panel p-6 rounded-xl border border-border text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-primary to-ring flex items-center justify-center font-bold text-white uppercase text-3xl mx-auto mb-4">
                {user.name[0]}
              </div>
              <h1 className="text-xl font-bold text-white mb-1">{user.name}</h1>
              <p className="text-xs text-muted-foreground mb-4">
                {user.department} • Year {user.year}
              </p>

              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full uppercase bg-secondary text-primary border border-border">
                {user.role}
              </span>
            </div>

            {/* Contact & Links */}
            <div className="glass-panel p-6 rounded-xl border border-border space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact & Portfolios</h3>

              <div className="space-y-3 text-sm">
                <a
                  href={`mailto:${user.email}`}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors break-all"
                >
                  <FiMail className="text-base shrink-0" />
                  {user.email}
                </a>

                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FiGithub className="text-base shrink-0" />
                    GitHub Profile
                  </a>
                )}

                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <FiLinkedin className="text-base shrink-0" />
                    LinkedIn Profile
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Bio, Skills & Projects */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio & Skills */}
            <div className="glass-panel p-6 rounded-xl border border-border space-y-6">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">About Me</h3>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {user.bio || "This student hasn't completed their bio yet."}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.length > 0 ? (
                    user.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="text-xs font-medium px-2.5 py-1 rounded bg-secondary border border-border text-foreground/80"
                      >
                        {skill.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No skills added yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Projects */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FiBookOpen className="text-primary" />
                Projects Posted by {user.name.split(" ")[0]}
              </h3>

              {user.projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {user.projects.map((project) => (
                    <ProjectCard key={project.id} project={project as any} />
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-xl border border-border text-center">
                  <p className="text-sm text-muted-foreground">This student hasn&apos;t posted any projects yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
