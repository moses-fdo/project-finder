import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "You must be logged in to update your profile." }, { status: 401 });
    }

    const { name, bio, githubUrl, linkedinUrl, department, year, skills } = await req.json();

    const currentUserId = Number((currentUser as any).id);

    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (department) updateData.department = department;
    if (year) updateData.year = Number(year);

    if (skills && Array.isArray(skills)) {
      updateData.skills = {
        set: [],
        connectOrCreate: skills.map((name: string) => ({
          where: { name },
          create: { name },
        })),
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
    });

    return NextResponse.json({ message: "Profile updated successfully.", user: updatedUser });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
