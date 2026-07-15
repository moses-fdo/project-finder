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
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    const { id } = await params;
    const notificationId = Number(id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification not found." }, { status: 404 });
    }

    const currentUserId = Number((currentUser as any).id);

    if (notification.userId !== currentUserId) {
      return NextResponse.json({ error: "You are not authorized to update this notification." }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return NextResponse.json({ message: "Notification marked as read.", notification: updated });
  } catch (error: any) {
    console.error("Mark read notification error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
