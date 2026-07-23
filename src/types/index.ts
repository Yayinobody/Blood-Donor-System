// --------------------- User & Auth ---------------------
export type UserRole = "donor" | "seeker" | "admin";

export type VerificationLevel = "none" | "light" | "strong";

export type AvailabilityStatus = "available" | "resting" | "unavailable";

export interface User {
  id: string;
  display_id: string; // e.g. "Donor #482"
  role: UserRole;
  email: string;
  phone?: string;
  real_name?: string;
  blood_type?: BloodType;
  verification_level: VerificationLevel;
  availability_status: AvailabilityStatus;
  last_donation_date?: string;
  next_eligible_date?: string;
  fuzzed_lat: number;
  fuzzed_lng: number;
  barangay?: string;
  city?: string;
  created_at: string;
  updated_at: string;
}

// --------------------- Blood Types ---------------------
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Compatibility: which donor types can give to a recipient type
export const COMPATIBLE_DONORS: Record<BloodType, BloodType[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

// --------------------- Blood Bank ---------------------
export interface BloodBank {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  city: string;
}

// --------------------- Donation Request ---------------------
export type UrgencyLevel = "within_hours" | "within_day" | "planning_ahead";
export type RequestStatus = "open" | "matched" | "fulfilled" | "cancelled" | "expired";
export type MatchStatus = "notified" | "accepted" | "declined" | "expired" | "revealed";

export interface DonationRequest {
  id: string;
  seeker_email: string;
  seeker_phone?: string;
  seeker_verified: boolean;
  blood_type_needed: BloodType;
  urgency: UrgencyLevel;
  hospital_name: string;
  hospital_area: string;
  units_needed: number;
  note?: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
}

export interface RequestMatch {
  id: string;
  request_id: string;
  donor_id: string;
  status: MatchStatus;
  distance_km: number;
  notified_at: string;
  responded_at?: string;
  revealed_at?: string;
  fulfilled_at?: string;
}

// --------------------- Donor Card (anonymized for seekers) ---------------------
export interface AnonymizedDonor {
  display_id: string;
  blood_type: BloodType;
  distance_km: number;
  availability_status: AvailabilityStatus;
  verification_badge: boolean; // strong verification
  fuzzed_lat: number;
  fuzzed_lng: number;
  last_active: string;
}

// --------------------- AI Assistant ---------------------
export type AssistantMode = "public" | "authenticated";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  scope?: "public" | "personal" | "out_of_scope";
  metadata?: Record<string, any>;
}

// --------------------- Map ---------------------
export interface MapViewport {
  lat: number;
  lng: number;
  zoom: number;
}