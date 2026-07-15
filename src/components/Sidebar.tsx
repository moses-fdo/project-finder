"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FiGrid, FiLayers, FiBell, FiUser, FiShield } from "react-icons/fi";

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const menuItems = [
    { id: "projects", label: "My Projects", icon: FiGrid },
    { id: "applications", label: "My Applications", icon: FiLayers },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "profile", label: "Profile Settings", icon: FiUser },
  ];

  if (userRole === "ADMIN") {
    menuItems.push({ id: "admin", label: "Admin Console", icon: FiShield });
  }

  const handleTabChange = (tabId: string) => {
    router.push(`/dashboard?tab=${tabId}`);
  };

  return (
    <aside className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-border p-4 bg-card md:min-h-[calc(100vh-4rem)]">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap md:w-full ${
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="text-lg" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
