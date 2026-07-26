import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/error";
import readXlsxFile from "read-excel-file/node";

interface EventImportRow {
  title: string;
  organizer: string | null;
  organizerType: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  mode: string | null;
  registrationFee: string | null;
  startDate: string | null;
  endDate: string | null;
  date: string | null;
  prize: string | null;
  link: string | null;
  source: string | null;
  description: string;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        cur += char;
      }
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i++;
      }
      if (cur.trim().length > 0) {
        lines.push(cur);
      }
      cur = "";
    } else {
      cur += char;
    }
  }
  if (cur.trim().length > 0) {
    lines.push(cur);
  }

  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const cols: string[] = [];
    let field = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (c === "," && !q) {
        cols.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    cols.push(field.trim());
    return cols;
  };

  const headers = parseRow(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (header) {
        rowObj[header] = values[idx] ?? "";
      }
    });
    if (Object.values(rowObj).some((val) => val.trim().length > 0)) {
      rows.push(rowObj);
    }
  }

  return rows;
}

function sheetRowsToObjects(rows: unknown[][]): Record<string, string>[] {
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

    const fileName = file.name.toLowerCase();
    let rawRows: Record<string, string>[] = [];

    if (fileName.endsWith(".csv") || file.type.includes("csv") || file.type.includes("text")) {
      const textContent = await file.text();
      rawRows = parseCSV(textContent);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      try {
        const sheetRows = await readXlsxFile(buffer);
        rawRows = sheetRowsToObjects(sheetRows as unknown as unknown[][]);
      } catch {
        // Fallback to text CSV parsing if readXlsxFile fails
        const textContent = Buffer.from(arrayBuffer).toString("utf-8");
        rawRows = parseCSV(textContent);
      }
    }

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: "No data rows found in file." },
        { status: 400 }
      );
    }

    const newEvents: EventImportRow[] = [];
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

      const title = getVal("name", "title", "hackathon name", "event name", "hackathon");
      const organizer = getVal("organizer", "host") || null;
      const organizerType = getVal("organizer type", "organizertype", "host type") || null;
      const location = getVal("location", "venue", "place", "where") || null;
      const city = getVal("city") || null;
      const state = getVal("state") || null;
      const country = getVal("country") || null;
      const mode = getVal("mode", "event mode", "type") || null;
      const registrationFee = getVal("registration fee", "registrationfee", "fee", "cost") || null;
      const startDate = getVal("start date", "startdate", "start") || null;
      const endDate = getVal("end date", "enddate", "end") || null;
      const prize = getVal("prize pool", "prizepool", "prize", "prizes", "prize money") || null;
      const link = getVal("link", "registration link", "url", "register link") || null;
      const source = getVal("source", "platform") || null;
      const description = getVal("description", "details", "about", "desc");

      if (!title || !description) {
        errors.push(
          `Row ${rowNum}: Missing required fields (Name or Description).`
        );
        return;
      }

      let date = getVal("date");
      if (!date) {
        if (startDate && endDate) {
          date = `${startDate} - ${endDate}`;
        } else if (startDate) {
          date = startDate;
        } else if (endDate) {
          date = endDate;
        } else {
          date = "TBA";
        }
      }

      newEvents.push({
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
        prize,
        link,
        source,
        description,
      });
    });

    if (newEvents.length === 0) {
      return NextResponse.json(
        { error: "No valid events found in sheet.", details: errors },
        { status: 400 }
      );
    }

    await prisma.event.createMany({ data: newEvents });

    const users = await prisma.user.findMany({ select: { id: true } });
    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: "SYSTEM",
          message: `📅 ${newEvents.length} New Event${newEvents.length > 1 ? "s" : ""} Announced on Campus!`,
          link: "/dashboard?tab=events",
        })),
      });
    }

    return NextResponse.json({
      message: `Successfully imported ${newEvents.length} event${newEvents.length > 1 ? "s" : ""}.`,
      count: newEvents.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Import events error:", error);
    return NextResponse.json(
      { error: "Failed to process file: " + getErrorMessage(error) },
      { status: 500 }
    );
  }
}
