import Link from "next/link";
import { auth } from "@/lib/auth";
import { FiPlus, FiBookOpen, FiGrid } from "react-icons/fi";
import NavbarClient from "./NavbarClient";
import { prisma } from "@/lib/prisma";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  let unreadNotificationsCount = 0;
  if (user) {
    unreadNotificationsCount = await prisma.notification.count({
      where: {
        userId: Number((user as any).id),
        read: false,
      },
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary to-ring flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-105 transition-transform duration-200">
              K
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Karunya<span className="text-primary font-extrabold text-sm ml-0.5">Collab</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/projects"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
            >
              <FiBookOpen className="text-xs" />
              Discover Projects
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1.5"
              >
                <FiGrid className="text-xs" />
                Dashboard
              </Link>
            )}
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/projects/create"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-opacity-90 rounded-lg shadow-md transition-all duration-200 hover:shadow-indigo-500/20 active:scale-95"
              >
                <FiPlus className="text-sm" />
                Post Project
              </Link>

              <NavbarClient user={user} unreadNotifications={unreadNotificationsCount} />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-3"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-ring hover:opacity-90 rounded-lg shadow-lg shadow-indigo-500/10 transition-all duration-200 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
