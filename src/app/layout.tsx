import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Bricolage_Grotesque, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";
import ThemeProvider from "@/components/ThemeProvider";
import CustomCursor from "@/components/CustomCursor";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";
import "../styles/animations.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Colabro \u2013 Campus Project & Hackathon Collaboration Platform",
  description:
    "'Where ideas meet people'. Colabro connects students and developers across campus for project collaboration.",
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
      className={`${plusJakarta.variable} ${outfit.variable} ${bricolage.variable} ${spaceGrotesk.variable} h-full`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, -apple-system, sans-serif" }}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script -- runs before paint to set dark class, preventing flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('colabro-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <ThemeProvider>
          <CustomCursor />
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <ErrorBoundary>{children}</ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
