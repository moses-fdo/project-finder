import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearUserDashboardCache } from "@/app/dashboard/page";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to upload a profile picture." },
        { status: 401 }
      );
    }

    const currentUserId = Number((currentUser as any).id);
    if (isNaN(currentUserId)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Convert file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/jpeg";
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;

    let imageUrl = base64Data;

    // Optional Cloudinary Upload if environment variables are provided
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset";

    if (cloudName) {
      try {
        const cloudFormData = new FormData();
        cloudFormData.append("file", base64Data);
        cloudFormData.append("upload_preset", uploadPreset);

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: cloudFormData,
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.secure_url) {
            imageUrl = cloudData.secure_url;
          }
        }
      } catch (err) {
        console.warn("[Cloudinary] Upload fallback to Data URL:", err);
      }
    }

    // Save profile image to DB
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: { profileImage: imageUrl },
    });

    clearUserDashboardCache(currentUserId);

    return NextResponse.json({
      message: "Profile picture updated successfully.",
      url: imageUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload profile picture." },
      { status: 500 }
    );
  }
}
