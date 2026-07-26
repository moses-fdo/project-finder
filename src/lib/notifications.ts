export interface NotificationLike {
  id?: number;
  type?: string | null;
  message?: string | null;
  link?: string | null;
}

export function getNotificationLink(notification: NotificationLike): string {
  if (notification.link && notification.link.trim()) {
    return notification.link;
  }

  const type = notification.type || "";
  const msg = (notification.message || "").toLowerCase();

  // Project invitation notifications
  if (
    type.startsWith("INVITATION") ||
    msg.includes("invited") ||
    msg.includes("invitation")
  ) {
    return "/dashboard?tab=invitations";
  }

  // Application received -> project owner checking applications
  if (
    type === "APPLICATION_RECEIVED" ||
    msg.includes("applied to collaborate") ||
    msg.includes("application to your project")
  ) {
    return "/dashboard?tab=projects";
  }

  // Application response (accepted/rejected) -> applicant checking applications
  if (
    type.startsWith("APPLICATION_") ||
    msg.includes("application to collaborate")
  ) {
    return "/dashboard?tab=applications";
  }

  // Hackathons / announcements
  if (
    type === "HACKATHON" ||
    type === "SYSTEM" ||
    msg.includes("hackathon") ||
    msg.includes("competition")
  ) {
    return "/dashboard?tab=hackathons";
  }

  return "/dashboard?tab=notifications";
}
