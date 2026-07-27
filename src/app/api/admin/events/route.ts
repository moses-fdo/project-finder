import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      organizer,
      organizerType,
      location,
      city,
      state,
      country,
      mode,
      registrationFee,
      startDate,
      endDate,
      date,
      teamSize,
      prize,
      link,
      source,
      description,
    } = body;

    const eventTitle = title || body.name;
    const eventDesc = description || body.details;

    if (!eventTitle || !eventDesc) {
      return NextResponse.json(
        { error: "Event Title (Name) and Description are required." },
        { status: 400 }
      );
    }

    const computedDate =
      date ||
      (startDate && endDate
        ? `${startDate} - ${endDate}`
        : startDate || endDate || "TBA");

    const event = await prisma.event.create({
      data: {
        title: eventTitle.trim(),
        organizer: organizer ? organizer.trim() : null,
        organizerType: organizerType ? organizerType.trim() : null,
        location: location ? location.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : null,
        mode: mode ? mode.trim() : null,
        registrationFee: registrationFee ? registrationFee.trim() : null,
        startDate: startDate ? startDate.trim() : null,
        endDate: endDate ? endDate.trim() : null,
        date: computedDate,
        teamSize: teamSize ? teamSize.trim() : "1 - 4 Members",
        prize: prize ? prize.trim() : null,
        link: link ? link.trim() : null,
        source: source ? source.trim() : null,
        description: eventDesc.trim(),
      },
    });

    // Notify all users about the new event
    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          message: `📅 New Event Announced: ${event.title}!`,
          link: "/dashboard?tab=events",
        })),
      });
    }

    return NextResponse.json({ message: "Event created successfully.", event });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || (currentUser as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const ids: number[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No event IDs provided." }, { status: 400 });
    }

    const { count } = await prisma.event.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ message: `${count} event(s) deleted successfully.`, count });
  } catch (error) {
    console.error("Bulk delete events error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
