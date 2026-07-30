import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/error";
import { checkAbuseServer } from "@/lib/moderation";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to update your profile." },
        { status: 401 }
      );
    }

    const { name, bio, githubUrl, linkedinUrl, department, year, skills, availability, profileImage } =
      await req.json();

    const currentUserId = Number((currentUser as any).id);
    if (isNaN(currentUserId)) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    // ── Server-side moderation check ──
    const textToCheck = [name, bio, Array.isArray(skills) ? skills.join(" ") : ""].filter(Boolean).join(" ");
    if (textToCheck) {
      const abuseResult = await checkAbuseServer(textToCheck, currentUserId);
      if (abuseResult.abusive) {
        return NextResponse.json(
          {
            error: "Your profile details contain inappropriate language.",
            flaggedWords: abuseResult.flaggedWords,
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
    if (department) updateData.department = department;
    if (year) updateData.year = Number(year);
    if (availability) updateData.availability = availability;
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: updateData,
    });

    if (skills && Array.isArray(skills)) {
      const skillObjects = await Promise.all(
        skills.map(async (skillName: string) => {
          const cleanName = skillName.trim();
          return await prisma.skill.upsert({
            where: { name: cleanName },
            update: {},
            create: { name: cleanName },
          });
        })
      );
      await prisma.user.update({
        where: { id: currentUserId },
        data: {
          skills: {
            set: skillObjects.map((s) => ({ id: s.id })),
          },
        },
      });
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to delete your account." },
        { status: 401 }
      );
    }

    const currentUserId = Number((currentUser as any).id);
    if (isNaN(currentUserId)) {
      return NextResponse.json(
        { error: "Invalid user ID." },
        { status: 400 }
      );
    }

    // Execute sequential deletes instead of $transaction for Neon HTTP mode compatibility
    await prisma.application.deleteMany({ where: { userId: currentUserId } });
    await prisma.notification.deleteMany({ where: { userId: currentUserId } });
    await prisma.application.deleteMany({
      where: { project: { ownerId: currentUserId } },
    });
    await prisma.project.deleteMany({ where: { ownerId: currentUserId } });
    await prisma.user.delete({ where: { id: currentUserId } });

    return NextResponse.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}