import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProjectCreateForm from "./ProjectCreateForm";

export default async function CreateProjectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?error=You+must+be+logged+in+to+create+a+project.");
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Create Project Proposal
          </h1>
          <p className="text-muted-foreground">
            Share your idea with the Karunya campus and specify what skills you are looking for in collaborators.
          </p>
        </div>

        <ProjectCreateForm />
      </main>
    </>
  );
}
