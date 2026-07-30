"use client";

import { getNotificationLink } from "@/lib/notifications";
import { useRouter } from "next/navigation";

interface NotificationsTabProps {
  localNotifications: any[];
  markAllRead: () => void;
  markNotifRead: (id: number) => void;
}

export default function NotificationsTab({
  localNotifications,
  markAllRead,
  markNotifRead,
}: NotificationsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-textPrimary tracking-tight">Notifications</h2>
          <p className="text-[12px] text-textMuted mt-0.5">Application status updates and alerts.</p>
        </div>
        {localNotifications.some((n) => !n.read) && (
          <button
            onClick={markAllRead}
            className="btn-ghost text-[12px] cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {localNotifications.length > 0 ? (
        <div className="space-y-2">
          {localNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.read) markNotifRead(notif.id);
                router.push(getNotificationLink(notif));
              }}
              className="card p-4 transition-all cursor-pointer hover:border-muted-foreground/40 hover:bg-secondary/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${
                      notif.read ? "bg-transparent" : "bg-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  <p className="text-[13px] text-textPrimary leading-relaxed">{notif.message}</p>
                </div>
                <span className="text-[11px] text-textMuted whitespace-nowrap shrink-0 pt-0.5">
                  {new Date(notif.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-[13px] text-textMuted">You&apos;re all caught up.</p>
        </div>
      )}
    </div>
  );
}
