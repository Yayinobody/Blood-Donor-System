import type { UrgencyLevel, MatchStatus } from "@/types";

/** DB stores area inside notes: "Hospital Area: Manila | Note: ..." */
export function parseHospitalArea(notes: string | null | undefined): string {
  if (!notes) return "Unknown area";
  const match = notes.match(/Hospital Area:\s*([^|]+)/);
  return match?.[1]?.trim() || "Unknown area";
}

export function urgencyToDb(level: UrgencyLevel): string {
  return level === "planning_ahead" ? "planning" : level;
}

export function urgencyFromDb(level: string | null | undefined): UrgencyLevel {
  if (level === "planning") return "planning_ahead";
  if (level === "within_day") return "within_day";
  return "within_hours";
}

export function matchStatusFromDb(status: string | null | undefined): MatchStatus {
  if (status === "contact_revealed") return "revealed";
  return (status as MatchStatus) || "notified";
}