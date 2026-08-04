import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { getErrorMessage } from "@/lib/error";
import { ADVISOR_SYSTEM_PROMPT } from "@/lib/advisor-prompt";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to use the AI Advisor." },
        { status: 401 }
      );
    }

    const currentUserId = Number((currentUser as any).id);
    if (isNaN(currentUserId)) {
      return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });
    }

    const profile = await safeQuery(
      () =>
        prisma.user.findUnique({
          where: { id: currentUserId },
          select: {
            id: true,
            name: true,
            bio: true,
            department: true,
            year: true,
            skills: { select: { name: true } },
            projects: { select: { title: true, description: true, category: true } },
            applications: {
              select: { project: { select: { title: true, category: true } } },
            },
          },
        }),
      null
    );

    if (!profile) {
      return NextResponse.json({ error: "Could not load profile." }, { status: 500 });
    }

    const isColdStart = profile.skills.length === 0 && profile.projects.length === 0;

    // For now, cold-start users get a placeholder response instead of calling Gemini
    // (we'll wire up the actual onboarding quiz next)
    if (isColdStart) {
      return NextResponse.json({
        isColdStart: true,
        message: "No profile data yet — onboarding quiz needed.",
      });
    }

    const userContext = `
Student profile:
Name: ${profile.name}
Department: ${profile.department}
Year: ${profile.year}
Bio: ${profile.bio || "Not provided"}
Skills: ${profile.skills.map((s) => s.name).join(", ") || "None listed"}
Projects: ${profile.projects.map((p) => `${p.title} (${p.category || "uncategorized"}): ${p.description}`).join("; ") || "None"}
Applications sent: ${profile.applications.map((a) => a.project.title).join(", ") || "None"}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: userContext,
      config: {
        systemInstruction: ADVISOR_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = result.text;
    let parsed;
    try {
      parsed = JSON.parse(text ?? "{}");
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ isColdStart: false, recommendation: parsed });
  } catch (error) {
    console.error("Advisor error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to use the AI Advisor." },
        { status: 401 }
      );
    }

    const { interests, preferredDomain, experienceLevel, technologies } = await req.json();

    if (!interests || !preferredDomain || !experienceLevel || !technologies) {
      return NextResponse.json(
        { error: "Please answer all quiz questions." },
        { status: 400 }
      );
    }

    const quizContext = `
This student has no existing profile data (skills, projects, or applications). Base your recommendation entirely on this onboarding quiz:
Interests: ${interests}
Preferred domain: ${preferredDomain}
Experience level: ${experienceLevel}
Technologies used: ${technologies}
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: quizContext,
      config: {
        systemInstruction: ADVISOR_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
    });

    const text = result.text;
    let parsed;
    try {
      parsed = JSON.parse(text ?? "{}");
    } catch {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({ isColdStart: true, recommendation: parsed });
  } catch (error) {
    console.error("Advisor quiz error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}