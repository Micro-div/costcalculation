import type {
  Country,
  CurrencyCode,
  Location,
  ProjectSizeId,
  QualityId,
} from "@/types";

export const categories = [
  {
    id: "web",
    name: "Website development",
    shortName: "Web development",
    description: "Marketing sites, portfolios and business websites.",
    icon: "code",
    base: 5200,
    hours: 190,
    weeks: 5,
    example:
      "I need a responsive business website with a modern design, contact form and basic SEO.",
  },
  {
    id: "mobile",
    name: "Mobile application",
    shortName: "Mobile app",
    description: "Native and cross-platform apps for iOS and Android.",
    icon: "smartphone",
    base: 9800,
    hours: 340,
    weeks: 8,
    example:
      "I need a cross-platform fitness app with user profiles, subscriptions and progress tracking.",
  },
  {
    id: "ecommerce",
    name: "Ecommerce development",
    shortName: "Ecommerce",
    description: "Online stores, payments, inventory and product pages.",
    icon: "shopping-bag",
    base: 7200,
    hours: 245,
    weeks: 6,
    example:
      "I need an ecommerce website for a clothing brand with online payments, customer accounts and about 500 products.",
  },
  {
    id: "design",
    name: "UI and UX design",
    shortName: "UI/UX design",
    description: "Product research, wireframes, prototypes and visual design.",
    icon: "palette",
    base: 3400,
    hours: 115,
    weeks: 3,
    example:
      "I need a complete UI and UX design for a budgeting mobile app, including research and a clickable prototype.",
  },
  {
    id: "seo",
    name: "Search engine optimization",
    shortName: "SEO",
    description: "Technical SEO, content strategy and search improvements.",
    icon: "search",
    base: 2100,
    hours: 70,
    weeks: 3,
    example:
      "I need technical SEO and a three-month content plan to improve organic traffic for my SaaS website.",
  },
  {
    id: "social",
    name: "Social media management",
    shortName: "Social media",
    description: "Content calendars, publishing and monthly reporting.",
    icon: "megaphone",
    base: 2300,
    hours: 80,
    weeks: 4,
    example:
      "I need social media management for a small fashion brand, with 12 posts per month and monthly reports.",
  },
  {
    id: "branding",
    name: "Branding and graphic design",
    shortName: "Branding",
    description: "Visual identities, logos and brand guidelines.",
    icon: "pen-tool",
    base: 3600,
    hours: 105,
    weeks: 4,
    example:
      "I need a complete visual identity for a new coffee brand, including logo, color palette and brand guide.",
  },
  {
    id: "ai",
    name: "AI solutions",
    shortName: "AI solutions",
    description: "AI assistants, automations and custom integrations.",
    icon: "bot",
    base: 10500,
    hours: 330,
    weeks: 8,
    example:
      "I need an AI customer support assistant that connects to our knowledge base and Shopify store.",
  },
] as const;

// PRICING COUNTRIES + CITIES
// Each country carries its currency, sales tax / VAT and a baseline pricing
// multiplier. Every city can fine-tune that multiplier (1 = the country
// baseline), so major hubs can cost a little more or less. The FIRST city of
// each original country keeps the legacy country id (us, uk, pk...) with a
// multiplier of 1, so older saved estimates and share links keep working.
export const countries: Country[] = [
  {
    id: "us",
    country: "United States",
    currency: "USD",
    taxRate: 0.08875,
    multiplier: 1.2,
    cities: [
      { name: "New York", multiplier: 1 },
      { name: "Los Angeles", multiplier: 1.05 },
      { name: "Chicago", multiplier: 0.95 },
      { name: "San Francisco", multiplier: 1.25 },
      { name: "Miami", multiplier: 0.98 },
      { name: "Austin", multiplier: 0.96 },
      { name: "Seattle", multiplier: 1.08 },
    ],
  },
  {
    id: "ca",
    country: "Canada",
    currency: "CAD",
    taxRate: 0.13,
    multiplier: 1,
    cities: [
      { name: "Toronto", multiplier: 1 },
      { name: "Vancouver", multiplier: 1.08 },
      { name: "Montreal", multiplier: 0.95 },
      { name: "Calgary", multiplier: 0.98 },
      { name: "Ottawa", multiplier: 0.96 },
      { name: "Edmonton", multiplier: 0.94 },
    ],
  },
  {
    id: "uk",
    country: "United Kingdom",
    currency: "GBP",
    taxRate: 0.2,
    multiplier: 0.92,
    cities: [
      { name: "London", multiplier: 1 },
      { name: "Manchester", multiplier: 0.86 },
      { name: "Birmingham", multiplier: 0.85 },
      { name: "Edinburgh", multiplier: 0.9 },
      { name: "Glasgow", multiplier: 0.84 },
      { name: "Leeds", multiplier: 0.85 },
    ],
  },
  {
    id: "ae",
    country: "United Arab Emirates",
    currency: "AED",
    taxRate: 0.05,
    multiplier: 1.02,
    cities: [
      { name: "Dubai", multiplier: 1 },
      { name: "Abu Dhabi", multiplier: 1.02 },
      { name: "Sharjah", multiplier: 0.9 },
      { name: "Ajman", multiplier: 0.85 },
      { name: "Al Ain", multiplier: 0.88 },
      { name: "Ras Al Khaimah", multiplier: 0.87 },
    ],
  },
  {
    id: "pk",
    country: "Pakistan",
    currency: "PKR",
    taxRate: 0.05,
    multiplier: 0.34,
    cities: [
      { name: "Karachi", multiplier: 1 },
      { name: "Lahore", multiplier: 0.96 },
      { name: "Islamabad", multiplier: 1.05 },
      { name: "Rawalpindi", multiplier: 0.94 },
      { name: "Faisalabad", multiplier: 0.9 },
      { name: "Peshawar", multiplier: 0.88 },
      { name: "Multan", multiplier: 0.89 },
    ],
  },
  {
    id: "in",
    country: "India",
    currency: "INR",
    taxRate: 0.18,
    multiplier: 0.3,
    cities: [
      { name: "Mumbai", multiplier: 1 },
      { name: "Delhi", multiplier: 0.98 },
      { name: "Bangalore", multiplier: 1.02 },
      { name: "Hyderabad", multiplier: 0.96 },
      { name: "Chennai", multiplier: 0.94 },
      { name: "Pune", multiplier: 0.95 },
      { name: "Kolkata", multiplier: 0.9 },
    ],
  },
  {
    id: "au",
    country: "Australia",
    currency: "AUD",
    taxRate: 0.1,
    multiplier: 1.08,
    cities: [
      { name: "Sydney", multiplier: 1 },
      { name: "Melbourne", multiplier: 0.98 },
      { name: "Brisbane", multiplier: 0.95 },
      { name: "Perth", multiplier: 0.96 },
      { name: "Adelaide", multiplier: 0.9 },
      { name: "Canberra", multiplier: 0.97 },
    ],
  },
  {
    id: "de",
    country: "Germany",
    currency: "EUR",
    taxRate: 0.19,
    multiplier: 0.98,
    cities: [
      { name: "Berlin", multiplier: 1 },
      { name: "Munich", multiplier: 1.08 },
      { name: "Hamburg", multiplier: 1.02 },
      { name: "Frankfurt", multiplier: 1.1 },
      { name: "Cologne", multiplier: 0.95 },
      { name: "Stuttgart", multiplier: 1 },
    ],
  },
  {
    id: "sg",
    country: "Singapore",
    currency: "SGD",
    taxRate: 0.09,
    multiplier: 1.04,
    cities: [
      { name: "Singapore", multiplier: 1 },
      { name: "Central Area", multiplier: 1.05 },
      { name: "Jurong", multiplier: 0.95 },
      { name: "Tampines", multiplier: 0.94 },
      { name: "Woodlands", multiplier: 0.93 },
      { name: "Punggol", multiplier: 0.94 },
    ],
  },
  {
    id: "ng",
    country: "Nigeria",
    currency: "NGN",
    taxRate: 0.075,
    multiplier: 0.28,
    cities: [
      { name: "Lagos", multiplier: 1 },
      { name: "Abuja", multiplier: 0.98 },
      { name: "Port Harcourt", multiplier: 0.96 },
      { name: "Ibadan", multiplier: 0.9 },
      { name: "Kano", multiplier: 0.88 },
      { name: "Benin City", multiplier: 0.9 },
    ],
  },
  {
    id: "sa",
    country: "Saudi Arabia",
    currency: "SAR",
    taxRate: 0.15,
    multiplier: 0.95,
    cities: [
      { name: "Riyadh", multiplier: 1 },
      { name: "Jeddah", multiplier: 0.98 },
      { name: "Dammam", multiplier: 0.95 },
      { name: "Mecca", multiplier: 0.97 },
      { name: "Medina", multiplier: 0.94 },
      { name: "Khobar", multiplier: 0.96 },
    ],
  },
  {
    id: "fr",
    country: "France",
    currency: "EUR",
    taxRate: 0.2,
    multiplier: 1,
    cities: [
      { name: "Paris", multiplier: 1.05 },
      { name: "Marseille", multiplier: 0.9 },
      { name: "Lyon", multiplier: 0.93 },
      { name: "Toulouse", multiplier: 0.9 },
      { name: "Nice", multiplier: 0.95 },
      { name: "Bordeaux", multiplier: 0.92 },
    ],
  },
  {
    id: "es",
    country: "Spain",
    currency: "EUR",
    taxRate: 0.21,
    multiplier: 0.9,
    cities: [
      { name: "Madrid", multiplier: 1 },
      { name: "Barcelona", multiplier: 1.03 },
      { name: "Valencia", multiplier: 0.9 },
      { name: "Seville", multiplier: 0.87 },
      { name: "Bilbao", multiplier: 0.93 },
      { name: "Malaga", multiplier: 0.88 },
    ],
  },
  {
    id: "it",
    country: "Italy",
    currency: "EUR",
    taxRate: 0.22,
    multiplier: 0.92,
    cities: [
      { name: "Rome", multiplier: 1 },
      { name: "Milan", multiplier: 1.08 },
      { name: "Naples", multiplier: 0.85 },
      { name: "Turin", multiplier: 0.92 },
      { name: "Florence", multiplier: 0.95 },
      { name: "Bologna", multiplier: 0.94 },
    ],
  },
  {
    id: "nl",
    country: "Netherlands",
    currency: "EUR",
    taxRate: 0.21,
    multiplier: 1,
    cities: [
      { name: "Amsterdam", multiplier: 1.08 },
      { name: "Rotterdam", multiplier: 0.96 },
      { name: "The Hague", multiplier: 0.98 },
      { name: "Utrecht", multiplier: 0.97 },
      { name: "Eindhoven", multiplier: 0.95 },
    ],
  },
  {
    id: "br",
    country: "Brazil",
    currency: "BRL",
    taxRate: 0.17,
    multiplier: 0.72,
    cities: [
      { name: "Sao Paulo", multiplier: 1 },
      { name: "Rio de Janeiro", multiplier: 0.98 },
      { name: "Brasilia", multiplier: 0.95 },
      { name: "Belo Horizonte", multiplier: 0.9 },
      { name: "Salvador", multiplier: 0.88 },
      { name: "Curitiba", multiplier: 0.92 },
    ],
  },
  {
    id: "mx",
    country: "Mexico",
    currency: "MXN",
    taxRate: 0.16,
    multiplier: 0.7,
    cities: [
      { name: "Mexico City", multiplier: 1 },
      { name: "Guadalajara", multiplier: 0.9 },
      { name: "Monterrey", multiplier: 0.95 },
      { name: "Puebla", multiplier: 0.85 },
      { name: "Tijuana", multiplier: 0.88 },
      { name: "Cancun", multiplier: 0.92 },
    ],
  },
  {
    id: "jp",
    country: "Japan",
    currency: "JPY",
    taxRate: 0.1,
    multiplier: 1.05,
    cities: [
      { name: "Tokyo", multiplier: 1 },
      { name: "Osaka", multiplier: 0.92 },
      { name: "Yokohama", multiplier: 0.95 },
      { name: "Nagoya", multiplier: 0.93 },
      { name: "Sapporo", multiplier: 0.9 },
      { name: "Fukuoka", multiplier: 0.91 },
    ],
  },
  {
    id: "cn",
    country: "China",
    currency: "CNY",
    taxRate: 0.13,
    multiplier: 0.8,
    cities: [
      { name: "Shanghai", multiplier: 1.05 },
      { name: "Beijing", multiplier: 1.02 },
      { name: "Shenzhen", multiplier: 1 },
      { name: "Guangzhou", multiplier: 0.96 },
      { name: "Chengdu", multiplier: 0.9 },
      { name: "Hangzhou", multiplier: 0.94 },
    ],
  },
  {
    id: "za",
    country: "South Africa",
    currency: "ZAR",
    taxRate: 0.15,
    multiplier: 0.62,
    cities: [
      { name: "Johannesburg", multiplier: 1 },
      { name: "Cape Town", multiplier: 0.98 },
      { name: "Durban", multiplier: 0.9 },
      { name: "Pretoria", multiplier: 0.94 },
      { name: "Port Elizabeth", multiplier: 0.88 },
    ],
  },
  {
    id: "tr",
    country: "Turkey",
    currency: "TRY",
    taxRate: 0.2,
    multiplier: 0.55,
    cities: [
      { name: "Istanbul", multiplier: 1.05 },
      { name: "Ankara", multiplier: 0.95 },
      { name: "Izmir", multiplier: 0.96 },
      { name: "Antalya", multiplier: 0.94 },
      { name: "Bursa", multiplier: 0.92 },
    ],
  },
  {
    id: "eg",
    country: "Egypt",
    currency: "EGP",
    taxRate: 0.14,
    multiplier: 0.35,
    cities: [
      { name: "Cairo", multiplier: 1 },
      { name: "Alexandria", multiplier: 0.92 },
      { name: "Giza", multiplier: 0.95 },
      { name: "Luxor", multiplier: 0.85 },
      { name: "Aswan", multiplier: 0.82 },
    ],
  },
  {
    id: "id",
    country: "Indonesia",
    currency: "IDR",
    taxRate: 0.11,
    multiplier: 0.5,
    cities: [
      { name: "Jakarta", multiplier: 1.05 },
      { name: "Surabaya", multiplier: 0.92 },
      { name: "Bandung", multiplier: 0.9 },
      { name: "Medan", multiplier: 0.88 },
      { name: "Bali", multiplier: 0.95 },
    ],
  },
  {
    id: "my",
    country: "Malaysia",
    currency: "MYR",
    taxRate: 0.06,
    multiplier: 0.62,
    cities: [
      { name: "Kuala Lumpur", multiplier: 1.05 },
      { name: "Penang", multiplier: 0.95 },
      { name: "Johor Bahru", multiplier: 0.92 },
      { name: "Malacca", multiplier: 0.9 },
      { name: "Ipoh", multiplier: 0.88 },
    ],
  },
  {
    id: "ph",
    country: "Philippines",
    currency: "PHP",
    taxRate: 0.12,
    multiplier: 0.55,
    cities: [
      { name: "Manila", multiplier: 1.05 },
      { name: "Cebu", multiplier: 0.92 },
      { name: "Davao", multiplier: 0.9 },
      { name: "Quezon City", multiplier: 1 },
      { name: "Makati", multiplier: 1.1 },
    ],
  },
  {
    id: "ke",
    country: "Kenya",
    currency: "KES",
    taxRate: 0.16,
    multiplier: 0.4,
    cities: [
      { name: "Nairobi", multiplier: 1.05 },
      { name: "Mombasa", multiplier: 0.92 },
      { name: "Kisumu", multiplier: 0.85 },
      { name: "Nakuru", multiplier: 0.88 },
      { name: "Eldoret", multiplier: 0.86 },
    ],
  },
  {
    id: "bd",
    country: "Bangladesh",
    currency: "BDT",
    taxRate: 0.15,
    multiplier: 0.33,
    cities: [
      { name: "Dhaka", multiplier: 1.05 },
      { name: "Chittagong", multiplier: 0.92 },
      { name: "Sylhet", multiplier: 0.9 },
      { name: "Khulna", multiplier: 0.85 },
      { name: "Rajshahi", multiplier: 0.86 },
    ],
  },
  {
    id: "vn",
    country: "Vietnam",
    currency: "VND",
    taxRate: 0.1,
    multiplier: 0.42,
    cities: [
      { name: "Ho Chi Minh City", multiplier: 1.05 },
      { name: "Hanoi", multiplier: 1 },
      { name: "Da Nang", multiplier: 0.92 },
      { name: "Hai Phong", multiplier: 0.9 },
      { name: "Can Tho", multiplier: 0.86 },
    ],
  },
];

function citySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Flattened list of selectable locations (one row per city). The first city of
// each country keeps the country id ("us", "uk"...); the rest get a compound
// id ("us-los-angeles"), so the whole app can keep using a single id.
export const locations: Location[] = countries.flatMap((country) =>
  country.cities.map((city, index) => ({
    id: index === 0 ? country.id : `${country.id}-${citySlug(city.name)}`,
    countryId: country.id,
    country: country.country,
    city: city.name,
    currency: country.currency,
    multiplier: Number(
      (country.multiplier * (city.multiplier ?? 1)).toFixed(3),
    ),
    taxRate: country.taxRate,
  })),
);

export const projectSizes = [
  {
    id: "small",
    name: "Focused",
    description: "A smaller scope with essential features",
    example: "Landing page or one core workflow",
    multiplier: 0.72,
    weekFactor: 0.75,
  },
  {
    id: "medium",
    name: "Standard",
    description: "A balanced project with the usual features",
    example: "Several screens and integrations",
    multiplier: 1,
    weekFactor: 1,
  },
  {
    id: "large",
    name: "Complex",
    description: "A larger scope with advanced requirements",
    example: "Multiple workflows, roles and integrations",
    multiplier: 1.58,
    weekFactor: 1.45,
  },
] as const;

export const qualityOptions = [
  {
    id: "essential",
    name: "Essential",
    description: "Reliable, efficient and budget-conscious",
    multiplier: 0.82,
    weekFactor: 0.9,
  },
  {
    id: "standard",
    name: "Standard",
    description: "A strong balance of quality and value",
    multiplier: 1,
    weekFactor: 1,
  },
  {
    id: "premium",
    name: "Premium",
    description: "More polish, scale and customization",
    multiplier: 1.38,
    weekFactor: 1.2,
  },
] as const;

// Random example project descriptions shown next to the description box.
// Each entry: label (short chip text) + full description used to fill the box.
export const exampleProjects = [
  {
    label: "Clothing ecommerce store",
    description:
      "I need an ecommerce website for a clothing brand with online payments, customer accounts and around 500 products.",
  },
  {
    label: "Food delivery app",
    description:
      "I need a food delivery mobile app with restaurant listings, order tracking and online payments.",
  },
  {
    label: "Hotel booking website",
    description:
      "I need a hotel booking website with a reservation calendar, room listings and email confirmations.",
  },
  {
    label: "Portfolio website",
    description:
      "I need a personal portfolio website to showcase my projects with a contact form and blog.",
  },
  {
    label: "SaaS dashboard",
    description:
      "I need a SaaS web app with user login, subscriptions, an admin dashboard and analytics.",
  },
  {
    label: "WordPress business site",
    description:
      "I need a responsive business website with a modern design, contact form and basic SEO.",
  },
  {
    label: "Logo and brand identity",
    description:
      "I need a complete visual identity for a new coffee brand, including logo, color palette and brand guide.",
  },
  {
    label: "SEO campaign",
    description:
      "I need technical SEO and a three-month content plan to improve organic traffic for my SaaS website.",
  },
  {
    label: "Fitness mobile app",
    description:
      "I need a cross-platform fitness app with user profiles, subscriptions and progress tracking.",
  },
  {
    label: "AI support assistant",
    description:
      "I need an AI customer support assistant that connects to our knowledge base and ecommerce store.",
  },
  {
    label: "Tyre shop online store",
    description:
      "I need an online store for my tyre shop with product search, inventory and online payments.",
  },
  {
    label: "Social media management",
    description:
      "I need social media management for a small fashion brand, with 12 posts per month and monthly reports.",
  },
] as const;

export const allCurrencies = [
  "USD",
  "CAD",
  "GBP",
  "AED",
  "PKR",
  "INR",
  "AUD",
  "EUR",
  "SGD",
  "NGN",
  "JPY",
  "CNY",
  "KRW",
  "BRL",
  "MXN",
  "ZAR",
  "SAR",
  "CHF",
  "SEK",
  "NOK",
  "TRY",
  "EGP",
  "IDR",
  "MYR",
  "PHP",
  "KES",
  "BDT",
  "VND",
] as const;

// ---------------------------------------------------------------------------
// PRICING CONFIGURATION
// ---------------------------------------------------------------------------
// Exchange rates, tax rates (per country above) and the USD rate cards all
// live in this one configuration file. Every table carries the date it was
// last reviewed, so an estimate can always state how old its inputs are.
//
// Update this date whenever any rate in this file (exchange, tax or pricing)
// changes, then bump `lastPricingUpdate` too.
export const PRICING_META = {
  lastPricingUpdate: "2026-09-01",
  exchangeRatesUpdated: "2026-09-01",
  taxRatesUpdated: "2026-09-01",
  source: "CostCalc rule-based rate cards (USD base) + country pricing multipliers",
} as const;

export const USD_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  CAD: 1.37,
  GBP: 0.75,
  AED: 3.67,
  PKR: 280,
  INR: 88,
  AUD: 1.52,
  EUR: 0.86,
  SGD: 1.29,
  NGN: 1500,
  JPY: 148,
  CNY: 7.1,
  KRW: 1400,
  BRL: 5.4,
  MXN: 18.5,
  ZAR: 17.5,
  SAR: 3.75,
  CHF: 0.8,
  SEK: 9.4,
  NOK: 10,
  TRY: 34,
  EGP: 48,
  IDR: 15800,
  MYR: 4.4,
  PHP: 57,
  KES: 129,
  BDT: 118,
  VND: 25000,
};
