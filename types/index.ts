import {
  allCurrencies,
  categories,
  projectSizes,
  qualityOptions,
} from "@/constants";

export type CategoryId = (typeof categories)[number]["id"];
export type ProjectSizeId = (typeof projectSizes)[number]["id"];
export type QualityId = (typeof qualityOptions)[number]["id"];
export type Category = (typeof categories)[number];
export type ProjectSize = (typeof projectSizes)[number];
export type QualityOption = (typeof qualityOptions)[number];
export type CurrencyCode = (typeof allCurrencies)[number];

// A city inside a pricing country. The multiplier fine-tunes the country's
// pricing (1 = the country baseline), so major hubs can cost a little more.
export interface City {
  name: string;
  multiplier: number;
}

// A pricing country: its currency, sales tax / VAT, a baseline pricing
// multiplier and the cities the user can pick from.
export interface Country {
  id: string;
  country: string;
  currency: CurrencyCode;
  taxRate: number;
  multiplier: number;
  cities: City[];
}

// A selectable location = one city in one country, flattened for the app.
export interface Location {
  id: string;
  countryId: string;
  country: string;
  city: string;
  currency: CurrencyCode;
  multiplier: number;
  taxRate: number;
}

// Any city id ("us", "us-los-angeles", ...). Kept as a string so the country
// list can keep growing without touching every call site.
export type LocationId = string;

export type Stage = "describe" | "complete";

// How a timeline is measured: weeks for software/services, months or years
// for physical builds (chosen by the AI for the project type).
export type TimelineUnit = "weeks" | "months" | "years";

export type IconName =
  | "arrow-right"
  | "bot"
  | "calculator"
  | "check"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
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
  | "star"
  | "target"
  | "trending"
  | "users"
  | "zap";

export interface EstimateItem {
  name: string;
  detail: string;
  quantity: number;
  rate: number;
  /** Server-computed amount and share of the estimate subtotal. */
  amount?: number;
  percentage?: number;
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
  /** Server-side id used by share links (the link carries only this id). */
  shareId?: string;
}

export interface SharedEstimate {
  description: string;
  categoryId: CategoryId;
  locationId: LocationId;
  sizeId: ProjectSizeId;
  qualityId: QualityId;
}

// A saved quotation draft. New drafts store the COMPLETE estimate so loading
// one never has to rebuild it from (or merge it into) the current project.
export interface SavedDraftData {
  estimate: EstimateResult;
  businessName: string;
  customerName: string;
  identity: string;
}

// Draft shape written by older app versions. It is recognised so old storage
// can be handled gracefully, but it is no longer created.
export interface LegacyDraftData {
  items: EstimateItem[];
  businessName: string;
  customerName: string;
}

export interface HistoryEntry {
  id: string;
  type: "estimate" | "draft";
  title: string;
  savedAt: string;
  data: EstimateResult | SavedDraftData | LegacyDraftData;
}

export interface CustomProjectType {
  name: string;
  type: CategoryId;
  features: string[];
}
