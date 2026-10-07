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

export interface EstimateResult {
  projectTitle: string;
  description: string;
  category: Category;
  location: Location;
  size: ProjectSize;
  quality: QualityOption;
  items: EstimateItem[];
  subtotal: number;
  contingency: number;
  taxes: number;
  total: number;
  low: number;
  high: number;
  confidence: number;
  durationMin: number;
  durationMax: number;
  scope: string[];
  assumptions: string[];
  complexity: string;
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
