export function parseNameAndRollNumber(fullName: string): { name: string; rollNumber: string } {
  if (!fullName) return { name: "", rollNumber: "" };
  const trimmed = fullName.trim();
  if (!trimmed) return { name: "", rollNumber: "" };
  const match = trimmed.match(/\s+([A-Z]{3}\d{2}[A-Z]{2}\d{4}|\d{2}[A-Z]{3}\d{4}|\d{4,10})$/i);
  if (match) {
    const rollNumber = match[1];
    const name = trimmed.substring(0, trimmed.lastIndexOf(rollNumber)).trim();
    return { name, rollNumber };
  }
  return { name: trimmed, rollNumber: "" };
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter((c): c is string => typeof c === "string" && c.trim() !== "").join(" ");
}
