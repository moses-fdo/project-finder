import { Sprout, Brain, Dumbbell, Folder, type LucideIcon } from "lucide-react";

export const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Food Processing Technology",
];

export function getProjectIcon(title: string): { icon: LucideIcon; bg: string; text: string } {
  const t = (title || "").toLowerCase();
  if (
    t.includes("eco") ||
    t.includes("track") ||
    t.includes("waste") ||
    t.includes("green") ||
    t.includes("environ")
  ) {
    return { icon: Sprout, bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" };
  }
  if (
    t.includes("study") ||
    t.includes("buddy") ||
    t.includes("learn") ||
    t.includes("book") ||
    t.includes("ai") ||
    t.includes("companion")
  ) {
    return { icon: Brain, bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
  }
  if (
    t.includes("fit") ||
    t.includes("forge") ||
    t.includes("gym") ||
    t.includes("health") ||
    t.includes("workout")
  ) {
    return { icon: Dumbbell, bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" };
  }
  return { icon: Folder, bg: "bg-secondary", text: "text-foreground" };
}

export function parseEventEndDate(item: any): number | null {
  const dateStr = item.endDate || item.date || item.startDate;
  if (!dateStr) return null;
  let endPart = dateStr;
  if (dateStr.includes(" - ")) endPart = dateStr.split(" - ").pop()!.trim();
  else if (dateStr.includes(" to ")) endPart = dateStr.split(" to ").pop()!.trim();
  else if (dateStr.includes("→")) endPart = dateStr.split("→").pop()!.trim();
  let d = new Date(endPart);
  if (isNaN(d.getTime())) d = new Date(`${endPart} ${new Date().getFullYear()}`);
  if (isNaN(d.getTime())) return null;
  if (!endPart.includes("T") && !endPart.includes(":")) d.setHours(23, 59, 59, 999);
  return d.getTime();
}
