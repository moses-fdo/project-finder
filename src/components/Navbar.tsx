import Link from "next/link";
import { auth } from "@/lib/auth";
import { Plus, LayoutGrid } from "lucide-react";
import NavbarClient from "./NavbarClient";
import ColabroLogo from "./ColabroLogo";
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <ColabroLogo size={28} />
            <span className="text-[16px] font-logo text-foreground">
              Colabro
            </span>
          </Link>

          {/* Desktop nav links — only shown when authenticated */}
          {user && (
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              <Link href="/dashboard" className="nav-item text-[13px]">
                <LayoutGrid size={14} strokeWidth={1.75} />
                Dashboard
              </Link>
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/projects/create"
                className="hidden sm:flex btn-primary text-[13px] py-[7px] px-3 gap-1.5"
              >
                <Plus size={14} strokeWidth={2} />
                New Project
              </Link>
              <NavbarClient user={user} unreadNotifications={unreadNotificationsCount} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-ghost text-[13px] px-3 py-[7px]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-[13px] py-[7px] px-3"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
