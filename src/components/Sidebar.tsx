"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FolderOpen, Send, Bell, Settings } from "lucide-react";

const menuItems = [
  { id: "projects",      label: "My Projects",   icon: FolderOpen },
  { id: "applications",  label: "Applications",  icon: Send       },
  { id: "notifications", label: "Notifications", icon: Bell       },
  { id: "profile",       label: "Settings",      icon: Settings   },
];

export default function Sidebar() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const activeTab   = searchParams.get("tab") || "projects";

  return (
    <aside
      className="w-full md:w-52 shrink-0 md:border-r border-b md:border-b-0 border-border md:min-h-[calc(100vh-3.5rem)]"
      aria-label="Dashboard navigation"
    >
      <nav className="flex md:flex-col gap-0.5 p-2 md:p-3 overflow-x-auto md:overflow-visible">
        {menuItems.map((item) => {
          const Icon    = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => router.push(`/dashboard?tab=${item.id}`)}
              className={[
                "nav-item shrink-0 md:w-full text-left",
                isActive ? "nav-item-active" : "",
              ].join(" ")}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={14} strokeWidth={1.75} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
