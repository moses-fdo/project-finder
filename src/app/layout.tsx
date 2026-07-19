import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Colabro — Campus Project & Hackathon Collaboration Platform",
  description:
    "Find collaborators, post projects, and build together. Colabro connects students and developers across campus.",
  keywords: ["Colabro", "Project Collaboration", "Hackathons", "Student Portal", "Team Finder"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
