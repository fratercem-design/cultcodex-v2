// Correction form contract, shared by the /corrections form and its API route.

export const CORRECTION_TYPES = [
  { value: "speaker", label: "Wrong guest or speaker" },
  { value: "summary", label: "Inaccurate summary or description" },
  { value: "quote", label: "Misattributed quote" },
  { value: "metadata", label: "Wrong date, episode number or other details" },
  { value: "category", label: "Wrong topic or lore category" },
  { value: "privacy", label: "Privacy concern or removal request" },
  { value: "other", label: "Something else" },
] as const;

export type CorrectionType = (typeof CORRECTION_TYPES)[number]["value"];

export const CORRECTION_LIMITS = {
  pageUrl: 500,
  details: 4000,
  correct: 2000,
  context: 2000,
  minDetails: 10,
} as const;

/** Map the ?type= the "Suggest a correction" buttons send to a sensible default. */
export function defaultCorrectionType(entityType: string | undefined): CorrectionType {
  switch (entityType) {
    case "person":
      return "speaker";
    case "lore":
    case "topic":
      return "category";
    case "episode":
      return "summary";
    default:
      return "other";
  }
}
