import { hotelBranches } from "@/data/hotels";

export type BrandCode = "Boudl" | "Braira" | "Narcissus" | "Aber";

const groupToBrand: Record<string, BrandCode | undefined> = {
  بودل: "Boudl",
  بريرا: "Braira",
  نارسس: "Narcissus",
  عابر: "Aber",
};

export const enterpriseBrands: BrandCode[] = ["Boudl", "Braira", "Narcissus", "Aber"];

export const branchesByBrand: Record<BrandCode, string[]> = enterpriseBrands.reduce(
  (acc, brand) => ({ ...acc, [brand]: [] }),
  {} as Record<BrandCode, string[]>
);

hotelBranches.forEach((branch) => {
  const brand = groupToBrand[branch.group];
  if (!brand) return;
  branchesByBrand[brand].push(`${branch.name} - ${branch.city}`);
});

enterpriseBrands.forEach((brand) => {
  branchesByBrand[brand] = [...new Set(branchesByBrand[brand])].sort((a, b) =>
    a.localeCompare(b, "ar")
  );
});

export const complaintHierarchy: Record<string, string[]> = {
  "Room Suite Issues": [
    "Air Conditioning Failure",
    "Plumbing or Water Leak",
    "Unclean Suite Upon Arrival",
    "Noise Disturbance in Suite",
    "Furniture or Fixture Damage",
  ],
  "Housekeeping Issues": [
    "Delayed Room Cleaning",
    "Missing Amenities",
    "Laundry Delay or Loss",
    "Poor Linen Quality",
    "Unprofessional Housekeeping Conduct",
  ],
  "Staff Service Issues": [
    "Reception Delay",
    "Rude Staff Behavior",
    "Concierge Service Failure",
    "Porter Assistance Delay",
    "Communication Gap",
  ],
  "Booking & Financial Issues": [
    "Overbooking Incident",
    "Incorrect Billing",
    "Refund Delay",
    "Payment Gateway Failure",
    "Reservation Data Mismatch",
  ],
  "Restaurant & Hospitality Issues": [
    "Food Quality Complaint",
    "Order Delay",
    "Wrong Order Delivered",
    "Restaurant Hygiene Concern",
    "Hospitality Team Response Delay",
  ],
  "Facilities Issues": [
    "Elevator Not Working",
    "Parking Access Issue",
    "Gym Facility Malfunction",
    "Pool Cleanliness Complaint",
    "Public Area Cleanliness",
  ],
  "Technical Issues": [
    "Wi-Fi Not Working",
    "TV System Malfunction",
    "Key Card Failure",
    "In-room Phone Not Working",
    "App/Portal Technical Error",
  ],
  "Security & Safety Issues": [
    "Unauthorized Access Concern",
    "Lost & Found Escalation",
    "Fire Safety Equipment Issue",
    "Medical Emergency Handling",
    "Security Staff Response Delay",
  ],
  "Policy & Management Issues": [
    "Late Check-out Dispute",
    "Policy Communication Gap",
    "Manager Escalation Request",
    "VIP Handling Concern",
    "Compensation Disagreement",
  ],
  "Special & Rare Cases": [
    "Legal Matter",
    "High-profile Guest Escalation",
    "Sensitive Cultural Concern",
    "Media-related Incident",
    "Other Exceptional Complaint",
  ],
};

export const brandPrefixes: Record<BrandCode, string> = {
  Boudl: "BO",
  Braira: "BR",
  Narcissus: "NA",
  Aber: "AB",
};
