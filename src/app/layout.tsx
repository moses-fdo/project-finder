import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, Bricolage_Grotesque } from "next/font/google";
import { Suspense } from "react";
import NavigationProgress from "@/components/NavigationProgress";
import CustomCursor from "@/components/CustomCursor";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

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
      className={`${plusJakarta.variable} ${outfit.variable} ${bricolage.variable} h-full`}
      style={{ fontFamily: "var(--font-plus-jakarta), system-ui, -apple-system, sans-serif" }}
      suppressHydrationWarning
    >
      <head>
        {/* Inline script — runs before paint to set dark class, preventing flash */}
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
