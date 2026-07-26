import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/error";
import readXlsxFile from "read-excel-file/node";

interface HackathonImportRow {
  title: string;
  description: string;
  date: string;
  location: string;
  teamSize: string;
  prize: string | null;
  link: string | null;
}

function rowsToObjects(rows: unknown[][]): Record<string, string>[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => String(h ?? "").trim());
  const result: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        obj[header] = String(row[idx] ?? "").trim();
      }
    });
    if (Object.values(obj).some((v) => v.length > 0)) {
      result.push(obj);
    }
  }

  return result;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No Excel or CSV file provided." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sheetRows = await readXlsxFile(buffer);

    if (sheetRows.length === 0) {
      return NextResponse.json(
        { error: "Excel file appears to be empty." },
        { status: 400 }
      );
    }

    const rawRows = rowsToObjects(sheetRows as unknown as unknown[][]);

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in Excel sheet." },
        { status: 400 }
      );
    }

    const newHackathons: HackathonImportRow[] = [];
    const errors: string[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;

      const getVal = (...possibleKeys: string[]) => {
        for (const k of possibleKeys) {
          const matchedKey = Object.keys(row).find(
            (rk) => rk.trim().toLowerCase() === k.toLowerCase()
          );
          if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== "") {
            return row[matchedKey].trim();
          }
        }
        return "";
      };

      const title = getVal("title", "hackathon name", "name", "hackathon");
      const description = getVal("description", "details", "about", "desc");
      const date = getVal("date", "event date", "when");
      const location = getVal("location", "venue", "place", "where");
      const teamSize =
        getVal("team size", "teamsize", "team", "members") || "1 - 4 Members";
      const prize = getVal("prize", "prizes", "prize money", "perks") || null;
      const link =
        getVal("link", "registration link", "url", "register link") || null;

      if (!title || !description || !date || !location) {
        errors.push(
          `Row ${rowNum}: Missing required fields (Title, Description, Date, or Location).`
        );
        return;
      }

      newHackathons.push({
        title,
        description,
        date,
        location,
        teamSize,
        prize,
        link,
      });
    });

    if (newHackathons.length === 0) {
      return NextResponse.json(
        { error: "No valid hackathons found in sheet.", details: errors },
        { status: 400 }
      );
    }

    await prisma.event.createMany({ data: newHackathons });

    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          message: `🏆 ${newHackathons.length} New Hackathon${newHackathons.length > 1 ? "s" : ""} Announced on Campus!`,
        })),
      });
    }

    return NextResponse.json({
      message: `Successfully imported ${newHackathons.length} hackathon${newHackathons.length > 1 ? "s" : ""}.`,
      count: newHackathons.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import hackathons error:", error);
    return NextResponse.json(
      { error: "Failed to process Excel file: " + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
