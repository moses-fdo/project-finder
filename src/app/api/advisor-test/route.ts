import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getErrorMessage } from "@/lib/error";
import { ADVISOR_SYSTEM_PROMPT } from "@/lib/advisor-prompt";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET() {
  try {
    const fakeUserContext = `
Student profile:
Name: Test Student
Department: Computer Science
Year: 3
Bio: Interested in building web apps
Skills: JavaScript, React, HTML, CSS
Projects: Campus Event Finder (Web): A React app to browse college events; Weather Dashboard (Web): Shows live weather using a public API
Applications sent: AI Chatbot for Campus Helpdesk
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: fakeUserContext,
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
      return NextResponse.json({ error: "Invalid JSON from Gemini", raw: text }, { status: 500 });
    }

    return NextResponse.json({ recommendation: parsed });
  } catch (error) {
    console.error("Advisor test error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}