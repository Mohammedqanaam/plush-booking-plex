import { branches, type Branch, type BranchVerificationStatus } from "@/data/branches";

type BranchReviewItem = {
  branch: string;
  status: BranchVerificationStatus;
  contacts: string[];
  breakfast: string;
  topServices: string[];
  notes: string;
  needsManualReview: string[];
};

const criticalKeys: Array<keyof Branch["services"]> = [
  "breakfast",
  "pool",
  "restaurant",
  "coffeeShop",
  "parking",
  "meetingRoom",
  "weddingPackage",
  "gym",
  "laundry",
  "outdoorSeating",
  "spa",
  "jacuzzi",
  "kidsArea",
];

const isMissing = (value: string) => value === "غير متوفر";

const manualFlags = (branch: Branch): string[] => {
  const flags: string[] = [];
  const values = Object.entries(branch.services);

  if (branch.contacts.length === 0) flags.push("missing: contact_numbers");
  if (values.some(([, value]) => /غير محدد/.test(value))) flags.push("needs_manual_review: unspecified_capacity_or_scope");
  if (values.some(([, value]) => /حسب الإمكانية/.test(value))) flags.push("needs_manual_review: subject_to_availability");
  if (values.some(([, value]) => /تحت الإنشاء|صيانة/.test(value))) flags.push("conflicting: temporarily_unavailable_service");

  return flags;
};

const reviewItems: BranchReviewItem[] = branches.map((branch) => {
  const servicePairs = Object.entries(branch.services)
    .filter(([, value]) => !isMissing(value))
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${value}`);

  return {
    branch: branch.name,
    status: branch.verificationStatus,
    contacts: branch.contacts.map((contact) => `${contact.label}: ${contact.value}`),
    breakfast: branch.services.breakfast,
    topServices: servicePairs,
    notes: `source=${branch.sourceRowRef}`,
    needsManualReview: manualFlags(branch),
  };
});

const missingByField = criticalKeys
  .map((field) => ({
    field,
    count: branches.filter((branch) => isMissing(branch.services[field])).length,
  }))
  .sort((a, b) => b.count - a.count);

export const branchDataReview = {
  summary: {
    extractedBranches: branches.length,
    completedBranches: branches.filter((b) => b.verificationStatus === "verified").length,
    partiallyVerifiedBranches: branches.filter((b) => b.verificationStatus === "partially_verified").length,
    conflictingBranches: branches.filter((b) => b.verificationStatus === "conflicting").length,
    missingInfoBranches: branches.filter((b) => b.verificationStatus === "missing_info").length,
    mostMissingFields: missingByField.slice(0, 5),
  },
  branches: reviewItems,
};
