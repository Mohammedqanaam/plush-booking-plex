export type ComplaintCategoryMap = Record<string, string[]>;

export const BRAND_PREFIX: Record<string, string> = {
  Boudl: "BO",
  Braira: "BR",
  Narcissus: "NA",
  Aber: "AB",
};

export const COMPLAINT_CATEGORIES: ComplaintCategoryMap = {
  "Room Suite Issues": [
    "Air Conditioning Failure",
    "Water Leakage",
    "Noise Disturbance",
    "Furniture Damage",
    "Unclean Suite",
  ],
  "Housekeeping Issues": [
    "Late Room Cleaning",
    "Missing Towels",
    "Linen Not Replaced",
    "Bathroom Hygiene",
    "Amenity Not Refilled",
  ],
  "Staff Service Issues": [
    "Reception Delay",
    "Rude Staff Behavior",
    "Unclear Communication",
    "Slow Response",
    "Incorrect Information",
  ],
  "Booking & Financial Issues": [
    "Wrong Room Allocation",
    "Booking Not Found",
    "Incorrect Billing",
    "Refund Delay",
    "Deposit Dispute",
  ],
  "Restaurant & Hospitality Issues": [
    "Late Food Delivery",
    "Food Quality Concern",
    "Order Mistake",
    "Poor Dining Service",
    "Special Diet Ignored",
  ],
  "Facilities Issues": [
    "Gym Equipment Fault",
    "Pool Cleanliness",
    "Parking Access Issue",
    "Elevator Downtime",
    "Public Area Cleanliness",
  ],
  "Technical Issues": [
    "Wi-Fi Connection Failure",
    "TV Not Working",
    "Key Card Malfunction",
    "Smart Lock Issue",
    "Power Outlet Failure",
  ],
  "Security & Safety Issues": [
    "Unauthorized Access",
    "Lost Item Security Concern",
    "Emergency Handling Delay",
    "Fire Alarm Concern",
    "Unsafe Area Report",
  ],
  "Policy & Management Issues": [
    "Policy Miscommunication",
    "Escalation Delay",
    "Compensation Dispute",
    "Manager Unavailable",
    "Procedure Non-Compliance",
  ],
  "Special & Rare Cases": [
    "Medical Emergency Support",
    "VIP Sensitive Case",
    "Legal Notice Concern",
    "Social Media Escalation",
    "Cross-Branch Incident",
  ],
};

export const DEFAULT_WHATSAPP_TEMPLATE = `Complaint No: {{complaintNo}}\nBrand: {{brand}}\nBranch: {{branch}}\nCategory: {{mainCategory}}\nSub-category: {{subCategory}}\n\nGuest Name: {{guestName}}\nBooking Mobile: {{bookingMobile}}\nSuite No: {{suiteNumber}}\nCheck-in Date: {{checkInDate}}\nGuest In-House: {{inHouse}}\nPriority: {{urgency}}\n\nPlease handle according to operational protocol.`;

export const DEFAULT_EMAIL_TEMPLATE = `
<h2>Complaint {{complaintNo}}</h2>
<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
  <tr><td><b>Brand</b></td><td>{{brand}}</td></tr>
  <tr><td><b>Branch</b></td><td>{{branch}}</td></tr>
  <tr><td><b>Main Category</b></td><td>{{mainCategory}}</td></tr>
  <tr><td><b>Sub Category</b></td><td>{{subCategory}}</td></tr>
  <tr><td><b>Urgency</b></td><td>{{urgency}}</td></tr>
  <tr><td><b>Guest Name</b></td><td>{{guestName}}</td></tr>
  <tr><td><b>Booking Mobile</b></td><td>{{bookingMobile}}</td></tr>
  <tr><td><b>Contact Mobile</b></td><td>{{contactMobile}}</td></tr>
  <tr><td><b>Suite Number</b></td><td>{{suiteNumber}}</td></tr>
  <tr><td><b>Check-in Date</b></td><td>{{checkInDate}}</td></tr>
  <tr><td><b>In House</b></td><td>{{inHouse}}</td></tr>
  <tr><td><b>Notes</b></td><td>{{notes}}</td></tr>
</table>
`;

export function applyTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val ?? ""),
    template,
  );
}
