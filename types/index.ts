import {
  allCurrencies,
  categories,
  locations,
  projectSizes,
  qualityOptions,
} from "@/constants";

export type CategoryId = (typeof categories)[number]["id"];
export type LocationId = (typeof locations)[number]["id"];
export type ProjectSizeId = (typeof projectSizes)[number]["id"];
export type QualityId = (typeof qualityOptions)[number]["id"];
export type Category = (typeof categories)[number];
export type Location = (typeof locations)[number];
export type ProjectSize = (typeof projectSizes)[number];
export type QualityOption = (typeof qualityOptions)[number];
export type CurrencyCode = (typeof allCurrencies)[number];

export type Stage = "describe" | "questions" | "complete";

// How a timeline is measured: weeks for software/services, months or years
// for physical builds (chosen by the AI for the project type).
export type TimelineUnit = "weeks" | "months" | "years";

export type IconName =
  | "arrow-right"
  | "bot"
  | "calculator"
  | "check"
  | "chevron-down"
  | "clock"
  | "close"
  | "code"
  | "download"
  | "file-text"
  | "globe"
  | "layers"
  | "lock"
  | "megaphone"
  | "menu"
  | "palette"
  | "pen-tool"
  | "plus"
  | "rotate"
  | "search"
  | "share"
  | "shield"
  | "shopping-bag"
  | "sparkles"
  | "smartphone"
  | "trending"
  | "users"
  | "zap";

export interface EstimateItem {
  name: string;
  detail: string;
  quantity: number;
  rate: number;
}

export interface CostComponent {
  name: string;
  cost: number;
  percentage: number;
  note: string;
}

export interface ScopeItem {
  title: string;
  description: string;
}

export interface EstimateResult {
  projectTitle: string;
  // The AI's own project type for this description, shown in the subtitle in
  // place of the preset category (e.g. "Zoo / Wildlife Park Development").
  // Null when the AI was unavailable and the rule-based preset was used.
  projectTypeLabel?: string | null;
  description: string;
  category: Category;
  location: Location;
  size: ProjectSize;
  quality: QualityOption;
  items: EstimateItem[];
  components?: CostComponent[];
  subtotal: number;
  contingency: number;
  taxes: number;
  total: number;
  low: number;
  high: number;
  confidence: number;
  durationMin: number;
  durationMax: number;
  durationUnit?: TimelineUnit;
  scope: ScopeItem[];
  assumptions: string[];
  risks: string[];
  complexity: string;
  aiSource?: "ai" | "fallback";
  aiModel?: string | null;
}

export interface SharedEstimate {
  description: string;
  categoryId: CategoryId;
  locationId: LocationId;
  sizeId: ProjectSizeId;
  qualityId: QualityId;
}

export interface CustomProjectType {
  name: string;
  type: CategoryId;
  features: string[];
}
