import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/error";
import { ADVISOR_SYSTEM_PROMPT, ADVISOR_TOOLS } from "@/lib/advisor-prompt";
import { getResourcesForCareer } from "@/lib/roadmap-tools";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ChatMessage = { role: "user" | "model"; text: string };

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to use the AI Advisor." },
        { status: 401 }
      );
    }

    const { message, history, recommendation } = (await req.json()) as {
      message: string;
      history: ChatMessage[];
      recommendation: unknown;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const contextIntro = `
This is a follow-up chat conversation. The student already received this recommendation:
${JSON.stringify(recommendation)}

Respond in plain conversational text (not JSON) to their follow-up question below. Keep it concise and stay in character as their advisor. If the student asks for resources, courses, or links, call the getResources function instead of inventing anything.
`;

    let contents: any[] = [
      { role: "user" as const, parts: [{ text: contextIntro }] },
      ...(history || []).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    let finalText = "";
    const maxRounds = 3;

    for (let round = 0; round < maxRounds; round++) {
      const result = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents,
        config: {
          systemInstruction: ADVISOR_SYSTEM_PROMPT,
          tools: ADVISOR_TOOLS,
        },
      });

      const functionCall = result.functionCalls?.[0];

      if (functionCall?.name === "getResources") {
        const career = (functionCall.args as { career: string }).career;
        const resourceData = await getResourcesForCareer(career);

        contents = [
          ...contents,
          result.candidates![0].content!,
          {
            role: "user" as const,
            parts: [
              {
                functionResponse: {
                  name: "getResources",
                  response: resourceData,
                },
              },
            ],
          },
        ];
        continue; // loop again so Gemini can respond using the real data
      }

      // No function call this round — this is the final answer
      finalText = result.text ?? "";
      break;
    }

    if (!finalText) {
      finalText =
        "I found the resources but had trouble putting together a reply — try asking again in a different way?";
    }

    return NextResponse.json({ reply: finalText });
  } catch (error) {
    console.error("Advisor chat error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}