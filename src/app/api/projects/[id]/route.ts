import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in to modify a project." }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);
    const { title, description, status, skills } = await req.json();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);
    const isAdmin = (currentUser as any).role === "ADMIN";

    if (project.ownerId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to update this project." }, { status: 403 });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;

    if (skills && Array.isArray(skills)) {
      updateData.skills = {
        set: [],
        connectOrCreate: skills.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    return NextResponse.json({ message: "Project updated.", project: updatedProject });
  } catch (error: any) {
    console.error("Patch project error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const projectId = Number(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);
    const isAdmin = (currentUser as any).role === "ADMIN";

    if (project.ownerId !== currentUserId && !isAdmin) {
      return NextResponse.json({ error: "You are not authorized to delete this project." }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully." });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
