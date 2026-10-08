// =====================================================================
// PROJECT ANALYZER — config-driven. All prices below are BASE PRICES IN USD.
// Edit the config blocks; logic reads from them, nothing is hardcoded.
// =====================================================================

// PROJECT TYPES: what the user wants to build.
// keywords  -> scoring words (longer = stronger signal, typo-tolerant)
// category  -> display category returned to the UI
// categoryId-> existing dropdown id (web | mobile | ecommerce | design | seo | social | branding | ai)
// projectType -> short label used in the heading ("<projectType> for <subject>")
// strip     -> words removed from the extracted subject
// basePriceUSD / baseWeeks -> starting cost & timeline before features
// scope / assumptions -> per-type defaults for the result page
const PROJECT_TYPES = [
  {
    key: "food",
    label: "Food Delivery",
    projectType: "Food Delivery Mobile App",
    keywords: ["food delivery", "food app", "restaurant app", "meal delivery", "food ordering"],
    category: "Mobile app",
    categoryId: "mobile",
    strip: ["food delivery", "food app", "restaurant app", "meal delivery", "food ordering", "mobile app", "app"],
    basePriceUSD: 8800,
    baseWeeks: 9,
    scope: [
      { title: "Customer ordering app", description: "Browse restaurants, view menus and place orders from a mobile app." },
      { title: "Restaurant & vendor management", description: "Vendor listing, menu management and order acceptance screens." },
      { title: "Cart, checkout & payments", description: "Secure cart, checkout flow with an integrated payment gateway." },
      { title: "Order tracking", description: "Live order status updates and delivery tracking for customers." },
    ],
    assumptions: [
      "Separate restaurant and driver apps are out of scope unless requested",
      "Delivery zone and driver onboarding is handled by you",
    ],
  },
  {
    key: "booking",
    label: "Booking / Hotel",
    projectType: "Booking Website",
    keywords: ["hotel", "hotels", "booking", "reservation", "reservations", "appointment", "travel"],
    category: "Web development",
    categoryId: "web",
    strip: ["booking", "reservation", "reservations", "appointment", "travel", "website", "site"],
    basePriceUSD: 5200,
    baseWeeks: 5,
    scope: [
      { title: "Booking calendar", description: "Availability calendar with real-time date selection for bookings." },
      { title: "Listings & detail pages", description: "Room or service listings with photos, details and pricing." },
      { title: "Reservation flow", description: "Guided booking steps with automatic email confirmation." },
      { title: "Admin panel", description: "Manage bookings, availability and pricing from one dashboard." },
    ],
    assumptions: [
      "You provide availability data and pricing for listings",
      "PMS/channel-manager sync is quoted separately",
    ],
  },
  {
    key: "ecommerce",
    label: "E-commerce",
    projectType: "E-commerce Store",
    keywords: ["ecommerce", "e-commerce", "shop", "store", "sell", "buy", "tyre", "tyres", "tire", "tires", "perfume", "cart", "shopify", "woocommerce", "online store", "products"],
    category: "E-commerce",
    categoryId: "ecommerce",
    strip: ["ecommerce", "e-commerce", "online store", "shopify", "woocommerce", "website", "site"],
    basePriceUSD: 7000,
    baseWeeks: 6,
    scope: [
      { title: "Product catalog", description: "Categories, variants and product detail pages for the full inventory." },
      { title: "Cart & checkout", description: "Smooth cart, checkout and order flow with order confirmation." },
      { title: "Payment integration", description: "Card and wallet payments through a secure gateway setup." },
      { title: "Admin panel", description: "Manage products, orders and stock from one dashboard." },
    ],
    assumptions: [
      "You provide product photos, descriptions and prices",
      "Payment gateway and shipping accounts are set up by you",
    ],
  },
  {
    key: "saas",
    label: "Software / SaaS",
    projectType: "SaaS Web App",
    keywords: ["saas", "software", "platform", "web app", "web application", "webapp", "chatbot", "automation", "subscription platform"],
    category: "Software/SaaS",
    categoryId: "web",
    strip: ["saas", "software", "platform", "web app", "web application", "webapp", "chatbot"],
    basePriceUSD: 9500,
    baseWeeks: 10,
    scope: [
      { title: "Dashboard & workspace", description: "Core user dashboard with account workspace and navigation." },
      { title: "Authentication & accounts", description: "Sign-up, sign-in and account/profile management screens." },
      { title: "Subscription & billing", description: "Plan setup, billing portal and recurring charge configuration." },
      { title: "Admin controls & analytics", description: "Admin user management and basic product analytics views." },
    ],
    assumptions: [
      "Single tenant structure unless otherwise agreed",
      "Third-party service costs (hosting, APIs) are excluded",
    ],
  },
  {
    key: "mobile",
    label: "Mobile App",
    projectType: "Mobile App",
    keywords: ["mobile app", "android", "ios", "app", "application", "react native", "flutter"],
    category: "Mobile app",
    categoryId: "mobile",
    strip: ["mobile app", "android", "ios", "app", "application", "react native", "flutter"],
    basePriceUSD: 9000,
    baseWeeks: 10,
    scope: [
      { title: "UX & wireframes", description: "User flows and wireframes for the core screens before build." },
      { title: "Cross-platform app", description: "iOS and Android build from one React Native/Flutter codebase." },
      { title: "Backend & auth", description: "API integration and user authentication screens wired up." },
      { title: "Store launch support", description: "App store and Play Store release preparation and submission." },
    ],
    assumptions: [
      "App store developer account fees are paid by you",
      "Push notifications and third-party SDKs may add cost",
    ],
  },
  {
    key: "portfolio",
    label: "Portfolio",
    projectType: "Portfolio Website",
    keywords: ["portfolio", "resume", "showcase", "personal site", "personal website", "cv"],
    category: "Web development",
    categoryId: "web",
    strip: ["portfolio", "resume", "showcase", "personal site", "personal website", "cv", "website", "site"],
    basePriceUSD: 1600,
    baseWeeks: 2,
    scope: [
      { title: "About & introduction", description: "Personal intro, bio and services section on a clean layout." },
      { title: "Project gallery", description: "Case study and project showcase grid with detail views." },
      { title: "Contact & socials", description: "Contact form, email link and social profile links." },
      { title: "Responsive launch", description: "Mobile-friendly build, testing and launch handover." },
    ],
    assumptions: [
      "You provide your bio, projects and images",
      "Domain and basic hosting are extra",
    ],
  },
  {
    key: "design",
    label: "UI/UX Design",
    projectType: "UI/UX Design",
    keywords: ["ui", "ux", "ui/ux", "prototype", "wireframe", "wireframes", "product design", "figma"],
    category: "UI/UX design",
    categoryId: "design",
    strip: ["ui", "ux", "ui/ux", "prototype", "wireframe", "wireframes", "product design", "figma", "design"],
    basePriceUSD: 3600,
    baseWeeks: 3,
    scope: [
      { title: "Research & journeys", description: "User research notes and journey maps for the core flows." },
      { title: "Wireframes", description: "Low-fidelity wireframes for all key screens." },
      { title: "High-fidelity UI", description: "Polished UI screens in your brand style, ready for build." },
      { title: "Prototype & handover", description: "Clickable prototype and design files handed over to developers." },
    ],
    assumptions: [
      "Development of the design is quoted separately",
      "One round of revisions per screen is included",
    ],
  },
  {
    key: "branding",
    label: "Branding",
    projectType: "Branding Package",
    keywords: ["logo", "branding", "brand identity", "visual identity", "brand", "rebrand"],
    category: "Branding",
    categoryId: "branding",
    strip: ["logo", "branding", "brand identity", "visual identity", "brand", "rebrand", "and"],
    basePriceUSD: 2800,
    baseWeeks: 3,
    scope: [
      { title: "Discovery & positioning", description: "Brand workshop notes, positioning and moodboard direction." },
      { title: "Logo concepts", description: "Initial logo concepts refined into a final primary mark." },
      { title: "Brand assets", description: "Color palette, typography choices and core brand assets." },
      { title: "Guidelines handover", description: "A brand guideline document with files ready for production." },
    ],
    assumptions: [
      "Up to 3 initial logo concepts are included",
      "Printing and trademark registration are excluded",
    ],
  },
  {
    key: "seo",
    label: "Marketing/SEO",
    projectType: "SEO Campaign",
    keywords: ["seo", "search engine", "ranking", "organic traffic", "marketing", "ads", "google ads", "social media"],
    category: "Marketing/SEO",
    categoryId: "seo",
    strip: ["seo", "search engine", "ranking", "organic traffic", "marketing", "ads", "google ads", "social media"],
    basePriceUSD: 2400,
    baseWeeks: 4,
    scope: [
      { title: "Technical SEO audit", description: "Site audit with fixes for indexation, speed and markup." },
      { title: "Keyword & content strategy", description: "Keyword research and a focused content plan." },
      { title: "On-page optimization", description: "Titles, meta tags and structure optimized on key pages." },
      { title: "Monthly reporting", description: "Reports, insights and recommendations delivered monthly." },
    ],
    assumptions: [
      "Ad spend and paid media budgets are excluded",
      "Results depend on industry competition and time",
    ],
  },
  {
    key: "web",
    label: "Web Development",
    projectType: "Website",
    keywords: ["website", "web site", "web page", "landing page", "blog", "business website", "landing", "site"],
    category: "Web development",
    categoryId: "web",
    strip: ["website", "web site", "web page", "landing page", "blog", "landing", "site", "web"],
    basePriceUSD: 3200,
    baseWeeks: 3,
    scope: [
      { title: "Structure & responsive design", description: "Page layout and a responsive design that works on all devices." },
      { title: "Content & contact forms", description: "Content pages added plus working contact/enquiry forms." },
      { title: "SEO & performance", description: "Basic SEO setup and performance tuning out of the box." },
      { title: "Testing & launch", description: "Cross-browser testing, launch and handover to you." },
    ],
    assumptions: [
      "You provide final copy and brand assets",
      "Domain, hosting and SSL are extra",
    ],
  },
  {
    key: "other",
    label: "Other",
    projectType: "Custom Project",
    keywords: [],
    category: "Other",
    categoryId: "web",
    strip: [],
    basePriceUSD: 2600,
    baseWeeks: 3,
    scope: [
      { title: "Discovery & review", description: "Short call to review goals, requirements and constraints." },
      { title: "Proposal & timeline", description: "Recommended solution, scope and milestone timeline." },
      { title: "Core build", description: "Build of the agreed core deliverable with quality checks." },
      { title: "Testing & handover", description: "Final testing, launch and documentation handover." },
    ],
    assumptions: [
      "Final scope is confirmed after a short discovery call",
      "Estimate may be revised once requirements are clear",
    ],
  },
];

// FEATURES: detected from the text. price -> USD add-on, weeks -> added weeks.
const FEATURES = [
  { label: "Online payment", keywords: ["payment", "payments", "online payment", "checkout", "stripe", "paypal", "billing"], price: 1500, weeks: 2, scopeItem: { title: "Secure payment integration", description: "Card and wallet payments through a PCI-compliant checkout gateway." } },
  { label: "Admin dashboard", keywords: ["admin dashboard", "admin panel", "dashboard", "backoffice", "cms"], price: 2200, weeks: 3, scopeItem: { title: "Admin dashboard for managing content and orders", description: "Back-office screens for content, orders, users and settings." } },
  { label: "User login", keywords: ["login", "log in", "signup", "sign up", "auth", "accounts", "customer accounts"], price: 900, weeks: 1, scopeItem: { title: "User accounts with sign-in and roles", description: "Sign-up/sign-in screens, profiles and role-based access control." } },
  { label: "Inventory", keywords: ["inventory", "stock", "warehouse", "product management"], price: 1600, weeks: 2, scopeItem: { title: "Inventory and stock management", description: "Stock levels, warehouses and low-stock alerts." } },
  { label: "Search", keywords: ["search", "filters"], price: 600, weeks: 1, scopeItem: { title: "Search and filtering", description: "Fast keyword search with filters on the listings." } },
  { label: "Multi-language", keywords: ["multi-language", "multilingual", "multi language", "translations", "i18n", "languages"], price: 1100, weeks: 2, scopeItem: { title: "Multi-language content support", description: "Translations and localized content for multiple languages." } },
  { label: "Delivery tracking", keywords: ["delivery tracking", "tracking", "order tracking", "shipping tracking"], price: 900, weeks: 1, scopeItem: { title: "Order and delivery tracking", description: "Live status updates for orders while they are in delivery." } },
  { label: "Blog", keywords: ["blog", "articles", "news"], price: 700, weeks: 1, scopeItem: { title: "Blog or news section", description: "Posts, categories and an editorial-friendly CMS." } },
  { label: "Live chat", keywords: ["live chat", "chat", "chatbot", "messaging"], price: 600, weeks: 1, scopeItem: { title: "Live chat or chatbot support", description: "Chat widget with canned replies or basic chatbot flows." } },
  { label: "SEO", keywords: ["seo", "search engine", "optimization", "ranking"], price: 600, weeks: 1, scopeItem: { title: "On-page SEO setup", description: "Metadata, sitemap and search-ready page structure." } },
  { label: "API integration", keywords: ["api", "integration", "integrations", "webhook", "third party"], price: 1400, weeks: 2, scopeItem: { title: "Third-party API integrations", description: "Connect external services securely via APIs or webhooks." } },
  { label: "Contact form", keywords: ["contact form", "contact"], price: 300, weeks: 1, scopeItem: { title: "Contact form with email notifications", description: "Enquiry form with spam protection and email alerts." } },
  { label: "Booking & reservations", keywords: ["booking", "reservations", "reservation", "appointment"], price: 1200, weeks: 2, scopeItem: { title: "Booking and reservation system", description: "Availability, time slots and booking confirmation emails." } },
  { label: "Reviews & ratings", keywords: ["reviews", "ratings"], price: 400, weeks: 1, scopeItem: { title: "Customer reviews and ratings", description: "Customer ratings, review moderation and display on pages." } },
  { label: "Push notifications", keywords: ["notifications", "push notifications"], price: 500, weeks: 1, scopeItem: { title: "Push notifications", description: "Mobile/web push messages for orders, updates and promos." } },
  { label: "Subscriptions", keywords: ["subscription", "subscriptions", "recurring"], price: 1000, weeks: 1, scopeItem: { title: "Subscription billing setup", description: "Plans, trials and recurring billing configuration." } },
];

// COMPLEXITY multiplier by scope size (Basic/Standard/Advanced).
const COMPLEXITY = {
  Basic: 0.85,
  Standard: 1,
  Advanced: 1.3,
};

const GENERIC_ASSUMPTIONS = [
  "One approved revision round is included per deliverable",
  "You provide content, brand assets and feedback on time",
  "Hosting, third-party subscriptions and ongoing services are excluded",
];

// RISKS: what could push the final price UP or DOWN, shown on the result page
// as "What could change the price". Keyed by project-type key and by feature
// label; GENERIC_RISKS applies to every estimate.
const TYPE_RISKS = {
  food: [
    "Driver onboarding, delivery zones and live order support add cost",
    "Payments to restaurants and drivers require a payout setup",
  ],
  booking: [
    "Syncing with an existing PMS or channel manager is quoted separately",
    "Payment gateway fees and no-show policies may add cost",
  ],
  ecommerce: [
    "Product data entry (photos, descriptions, variants) is not included",
    "Shipping, tax engines and marketplace sync add cost",
    "Payment gateway fees are charged by the provider",
  ],
  saas: [
    "Scope tends to grow during development — changes are quoted separately",
    "Third-party APIs, hosting and usage-based services are extra",
    "Security reviews, compliance or SSO can extend the timeline",
  ],
  mobile: [
    "App Store / Play Store developer accounts and fees are paid by you",
    "Device testing across many models can extend QA time",
    "Push, maps and other SDKs may require paid tiers",
  ],
  portfolio: [
    "Delays in receiving your content and images shift the timeline",
    "Extra revision rounds beyond the included one add cost",
  ],
  design: [
    "Additional revision rounds per screen are billed separately",
    "Development of the design is quoted separately",
  ],
  branding: [
    "More than the included logo concepts adds design time",
    "Printing, trademark checks and registration are excluded",
  ],
  seo: [
    "Ad spend and paid media budgets are excluded",
    "Results depend on competition and typically take 3–6 months",
    "Major site changes or migrations require a new audit",
  ],
  web: [
    "Extra pages, CMS complexity or custom integrations add cost",
    "Content writing, copywriting and photography are excluded",
    "Delays in feedback or content shift the timeline",
  ],
  other: [
    "Final scope is confirmed after a short discovery call",
    "Unclear requirements may lead to a revised estimate",
  ],
};

const FEATURE_RISKS = {
  "Online payment": ["Payment gateway fees and compliance checks may add cost"],
  "Admin dashboard": [
    "Complex permissions and custom reports can extend the timeline",
  ],
  "User login": ["Advanced roles and single sign-on are not included"],
  Inventory: ["Stock sync with external systems is quoted separately"],
  "Multi-language": ["Translation and localized content are not included"],
  "API integration": [
    "Third-party API limits or paid tiers may affect the price",
  ],
  "Booking & reservations": [
    "Calendar sync with external tools may add integration work",
  ],
};

const GENERIC_RISKS = [
  "Changes to requirements after approval may affect the price",
  "A rush delivery shortens the timeline and may increase cost",
  "Third-party price changes (hosting, licences, plugins) are outside this estimate",
];

// Drops near-duplicate risks (e.g. the ecommerce type and the "Online payment"
// feature both mentioning "Payment gateway fees"). Two entries count as
// duplicates when they share two or more significant words.
function dedupeRisks(entries) {
  const stop = new Set([
    "about", "above", "after", "again", "added", "also", "and", "any", "are",
    "before", "being", "between", "both", "could", "each", "extra", "from",
    "have", "into", "more", "most", "must", "only", "other", "over", "same",
    "some", "such", "than", "that", "their", "them", "then", "there", "these",
    "they", "this", "those", "very", "were", "what", "when", "where", "which",
    "while", "with", "would", "your",
  ]);
  const sig = (text) =>
    new Set(
      String(text)
        .toLowerCase()
        .split(/[^a-z]+/)
        .filter((w) => w.length >= 5 && !stop.has(w)),
    );
  const accepted = [];
  for (const entry of entries) {
    const words = sig(entry);
    const hasDuplicate = accepted.some((existing) => {
      let shared = 0;
      for (const w of words) {
        if (existing.words.has(w)) {
          shared += 1;
          if (shared >= 2) return true;
        }
      }
      return false;
    });
    if (!hasDuplicate) accepted.push({ words, entry });
  }
  return accepted.map((item) => item.entry);
}


function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ------------------------- scope items --------------------------
// Every scope entry is { title, description }. The AI returns this
// shape too; when its description is missing we fall back to a
// short default so the UI always has something to show.
const DEFAULT_SCOPE_DESCRIPTION = "Included in the agreed project scope.";

function sanitizeScopeItem(value) {
  if (typeof value !== "object" || value === null) return null;
  const title = String(value.title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 8)
    .join(" ")
    .slice(0, 80);
  if (!title) return null;
  const description = String(value.description ?? "")
    .replace(/\s+/g, " ")
    .replace(/[$€£¥₹]/g, "")
    .trim()
    .slice(0, 160);
  return {
    title,
    description: description
      ? description.split(" ").filter(Boolean).slice(0, 25).join(" ")
      : DEFAULT_SCOPE_DESCRIPTION,
  };
}

const SCOPE_TOPIC_ROOTS = [
  "account",
  "authentication",
  "login",
  "signin",
  "role",
  "payment",
  "billing",
  "subscription",
  "admin",
];

function scopeSigWords(text) {
  const stop = new Set([
    "about", "above", "after", "again", "added", "also", "and", "any", "are",
    "before", "being", "between", "both", "could", "each", "extra", "from",
    "have", "into", "more", "most", "must", "only", "other", "over", "same",
    "some", "such", "than", "that", "their", "them", "then", "there", "these",
    "they", "this", "those", "very", "were", "what", "when", "where", "which",
    "while", "with", "would", "your",
  ]);
  return new Set(
    String(text || "")
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 5 && !stop.has(w)),
  );
}

function scopeWordsRelated(a, b) {
  return (
    a === b ||
    (a.length >= 5 && b.length >= 5 && (a.startsWith(b) || b.startsWith(a)))
  );
}

// Merges scope items (AI output, per-type defaults and feature add-ons)
// into one list where each feature appears only once. Two items count as
// the same feature when they share two significant words, or a single
// significant word from a known overlapping topic (auth, payments, admin...).
function dedupeScopeItems(items) {
  const accepted = [];
  for (const item of items) {
    const words = scopeSigWords(item.title);
    const isDuplicate = accepted.some((prev) => {
      let shared = 0;
      let sharedTopic = false;
      for (const w of words) {
        for (const pw of prev.words) {
          if (scopeWordsRelated(w, pw)) {
            shared += 1;
            if (
              SCOPE_TOPIC_ROOTS.some(
                (root) => w.startsWith(root) || pw.startsWith(root),
              )
            ) {
              sharedTopic = true;
            }
          }
        }
      }
      return shared >= 2 || (shared >= 1 && sharedTopic);
    });
    if (!isDuplicate) accepted.push({ words, item });
  }
  return accepted.map((entry) => entry.item);
}

// Small edit-distance so typos ("tyree", "perfum", "ecomerce") still match.
function distance(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

function keywordMatches(text, keywords) {
  const words = text.split(" ");
  for (const kw of keywords) {
    const kwNorm = normalize(kw);
    if (!kwNorm) continue;
    if (text.includes(kwNorm)) return true;
    const kwWords = kwNorm.split(" ");
    if (kwWords.length === 1 && kwNorm.length >= 4) {
      for (const w of words) {
        // Exact single-word match, or a close typo of a real word
        // (the candidate word must look similar in length and start).
        if (
          w !== kwNorm &&
          Math.abs(w.length - kwNorm.length) <= 2 &&
          w.charAt(0) === kwNorm.charAt(0) &&
          w.charAt(1) === kwNorm.charAt(1) &&
          distance(w, kwNorm) <= (kwNorm.length <= 5 ? 1 : 2)
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function scoreType(text, type) {
  let score = 0;
  for (const kw of type.keywords) {
    const kwNorm = normalize(kw);
    if (!kwNorm) continue;
    const multiWord = kwNorm.includes(" ");
    if (text.includes(kwNorm)) {
      // Exact whole-phrase hits dominate single-word keyword hits.
      score += kwNorm.length * 2 + (multiWord ? 25 : 0);
    } else if (keywordMatches(text, [kw])) {
      score += kwNorm.length;
    }
  }
  return score;
}

// Best config match for the text using keyword scoring only.
function pickRuleBasedType(norm) {
  let type = PROJECT_TYPES[PROJECT_TYPES.length - 1]; // Other fallback
  let score = 0;
  for (const t of PROJECT_TYPES) {
    if (t.key === "other") continue;
    const typeScore = scoreType(norm, t);
    if (typeScore > score) {
      score = typeScore;
      type = t;
    }
  }
  return { type, score };
}

function toTitleCase(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractSubject(rawText, type) {
  let s = String(rawText || "").toLowerCase();
  // Drop common filler prefixes.
  const prefixes = [
    "here i need to", "here i need", "here we need to", "here we need",
    "i need to", "i need", "i want to make", "i want to", "i want",
    "we need to", "we need", "we want to", "we want", "please create",
    "can you create", "can you make", "help me make", "make", "build",
    "create", "develop", "design", "my", "our", "a", "an", "the",
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of prefixes) {
      if (s.startsWith(p + " ")) {
        s = s.slice(p.length + 1).trim();
        changed = true;
      }
    }
  }
  // Prefer a "for <subject>" clause (e.g. "... for a gym").
  const forMatch = s.match(/\bfor\s+(?:a|an|the|my|our)?\s*(.+)/);
  if (forMatch) s = forMatch[1];
  // Cut at filler connectors.
  s = s.split(/\s+(with|and|using|that|around|including|via|for)\s+/)[0];
  s = s.split(/[,.;]/)[0];
  // Remove the matched type's words so the subject stays specific.
  for (const stripWord of type.strip) {
    s = s.replace(new RegExp(`\\b${stripWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"), " ");
  }
  // Clean leftover articles / filler and tidy spacing.
  s = s.replace(/\b(a|an|the|my|our|i|need|make|build|create|app|and|here)\b/g, " ");
  s = s.replace(/\s+/g, " ").trim().replace(/^[-–\s]+|[-–\s]+$/g, "");
  if (!s) return "";
  return toTitleCase(s);
}

// Shared tail: EVERYTHING below is computed from the static USD config
// (PROJECT_TYPES / FEATURES / COMPLEXITY). The AI never supplies prices.
function buildAnalysis(norm, type, features, complexity, subject, heading, confidence, aiScope, aiAssumptions) {
  const complexityMultiplier = COMPLEXITY[complexity];

  const featurePrice = features.reduce((sum, f) => sum + f.price, 0);
  const featureWeeks = features.reduce((sum, f) => sum + f.weeks, 0);
  const basePriceUSD = Math.round((type.basePriceUSD + featurePrice) * complexityMultiplier);
  const coreWeeks = type.baseWeeks + featureWeeks;
  const weeksMin = Math.max(1, Math.round(coreWeeks * 0.85));
  const weeksMax = Math.max(weeksMin + 1, Math.round(coreWeeks * 1.25));

  const lines = [
    { label: type.projectType, detail: "Core build based on your description", usd: Math.round(type.basePriceUSD * complexityMultiplier) },
    ...features.map((f) => ({ label: f.label, detail: "Add-on feature", usd: Math.round(f.price * complexityMultiplier) })),
  ];

  // Scope: the AI's project-tailored list replaces the per-type defaults
  // when present; add-on features are MERGED into this same list (not
  // appended as separate strings) and near-duplicates are merged so each
  // feature appears only once.
  const scopeSource =
    Array.isArray(aiScope) && aiScope.length > 0 ? aiScope : type.scope;
  const scope = dedupeScopeItems([
    ...scopeSource.map((item) => sanitizeScopeItem(item)).filter(Boolean),
    ...features
      .map((f) => sanitizeScopeItem(f.scopeItem))
      .filter(Boolean),
  ]).slice(0, 6);

  const assumptions = [
    ...(Array.isArray(aiAssumptions) && aiAssumptions.length > 0
      ? aiAssumptions
      : type.assumptions),
    ...GENERIC_ASSUMPTIONS,
  ].slice(0, 5);

  const risks = dedupeRisks([
    ...(TYPE_RISKS[type.key] || []),
    ...features.flatMap((f) => FEATURE_RISKS[f.label] || []),
    ...GENERIC_RISKS,
  ]).slice(0, 5);

  return {
    category: type.category,
    categoryId: type.categoryId,
    projectType: type.projectType,
    subject,
    heading,
    features: features.map((f) => f.label),
    complexity,
    basePriceUSD,
    weeksMin,
    weeksMax,
    confidence,
    scope,
    assumptions,
    risks,
    lines,
  };
}

function analyzeProject(text) {
  const norm = normalize(text);
  const { type, score: typeScore } = pickRuleBasedType(norm);

  const features = FEATURES.filter((f) => keywordMatches(norm, f.keywords));

  // Complexity from feature count + description length.
  let complexity = "Standard";
  if (features.length === 0 && norm.length < 90) complexity = "Basic";
  else if (features.length >= 4 || (features.length >= 2 && norm.length > 200)) complexity = "Advanced";
  else if (features.length <= 1 && norm.length < 140) complexity = "Basic";

  const subject = extractSubject(text, type);
  const heading = subject ? `${type.projectType} for ${subject}` : type.projectType;

  // Confidence: more signal (type, features, subject, detail) = higher score.
  let confidence = 0.35;
  if (typeScore > 0) confidence += 0.2;
  confidence += Math.min(features.length, 4) * 0.1;
  if (subject) confidence += 0.1;
  if (norm.length > 60) confidence += 0.1;
  if (type.key === "other") confidence = Math.min(confidence, 0.5);
  confidence = Math.min(0.95, Math.max(0.2, Math.round(confidence * 100) / 100));

  return buildAnalysis(norm, type, features, complexity, subject, heading, confidence);
}

// ---------------------------------------------------------------------
// Optional AI pass (POST /api/analyze -> Groq). The AI only PICKS values
// from the config lists above; every price/week/scope line is recomputed
// here from the static USD config. Any missing/invalid AI field falls
// back to the rule-based result, so this is safe to call with null.
// ---------------------------------------------------------------------
const AI_ALLOWED_COMPLEXITY = { Basic: true, Standard: true, Advanced: true };
const AI_CATEGORY_LIST = Array.from(new Set(PROJECT_TYPES.map((t) => t.category)));
const AI_PROJECT_TYPE_LIST = PROJECT_TYPES.map((t) => t.projectType);

function matchConfigValue(value, allowed) {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return null;
  return allowed.find((item) => item.toLowerCase() === v) || null;
}

function sanitizeAiPhrase(value, maxWords, maxChars) {
  const raw = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxChars).trim();
  if (!raw) return "";
  return raw.split(" ").filter(Boolean).slice(0, maxWords).join(" ");
}

function analyzeProjectWithAi(text, ai) {
  if (!ai || typeof ai !== "object" || Array.isArray(ai)) {
    return analyzeProject(text);
  }

  const norm = normalize(text);
  const ruleBased = pickRuleBasedType(norm);

  // Resolve the config type: prefer the AI projectType, then the AI
  // category, then the rule-based keyword match. Only config types with
  // their config prices can ever be selected.
  const projectType = matchConfigValue(ai.projectType, AI_PROJECT_TYPE_LIST);
  const category = matchConfigValue(ai.category, AI_CATEGORY_LIST);
  const type =
    PROJECT_TYPES.find((t) => t.projectType === projectType) ||
    PROJECT_TYPES.find((t) => t.category === category) ||
    ruleBased.type;

  // AI features are filtered to the allowed config labels (order preserved).
  const allowedFeatureLabels = new Set(FEATURES.map((f) => f.label.toLowerCase()));
  const wanted = new Set(
    (Array.isArray(ai.features) ? ai.features : [])
      .filter((f) => typeof f === "string")
      .map((f) => f.trim().toLowerCase())
      .filter((f) => allowedFeatureLabels.has(f)),
  );
  const features = FEATURES.filter((f) => wanted.has(f.label.toLowerCase()));

  const complexity = AI_ALLOWED_COMPLEXITY[ai.complexity] ? ai.complexity : "Standard";

  let subject = sanitizeAiPhrase(ai.subject, 3, 60);
  if (subject) subject = toTitleCase(subject.toLowerCase());
  let heading = sanitizeAiPhrase(ai.heading, 6, 120);
  if (!heading) {
    heading = subject ? `${type.projectType} for ${subject}` : type.projectType;
  }

  let confidence = Number(ai.confidence);
  if (!Number.isFinite(confidence)) confidence = 0.5;
  confidence = Math.min(0.95, Math.max(0.2, Math.round(confidence * 100) / 100));

  // AI-provided scope items ({ title, description }), sanitized; missing
  // descriptions fall back to the default inside sanitizeScopeItem later.
  const aiScope = Array.isArray(ai.scope)
    ? ai.scope
        .map((item) => sanitizeScopeItem(item))
        .filter(Boolean)
    : [];

  // AI-provided, project-specific assumptions (from the AI payload).
  const aiAssumptions = Array.isArray(ai.assumptions)
    ? ai.assumptions
        .map((a) => sanitizeAiPhrase(a, 16, 120))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return buildAnalysis(norm, type, features, complexity, subject, heading, confidence, aiScope, aiAssumptions);
}

export { analyzeProject, analyzeProjectWithAi, PROJECT_TYPES, FEATURES };
export default analyzeProject;

// ===================== TEST CASES =====================
// "here i need to make a tyre shop"
//   -> heading "E-commerce Store for Tyre Shop", category E-commerce, Basic, no extra features
// "perfume store with online payment and admin panel"
//   -> heading "E-commerce Store for Perfume Store", category E-commerce, Online payment + Admin dashboard features
// "hotel booking website"
//   -> heading "Booking Website for Hotel", category Web development, Booking feature detected
// "food delivery mobile app"
//   -> heading "Food Delivery Mobile App", category Mobile app, different price/weeks
// "my portfolio"
//   -> heading "Portfolio Website", category Web development, low base price, Basic
// "logo and branding for a gym"
//   -> heading "Branding Package for Gym", category Branding, distinct scope/assumptions
// Each input must produce a different heading, category, price, breakdown and scope.

// ===================== AI TEST CASES (POST /api/analyze) =====================
// These run through the optional AI step (app/api/analyze/route.js, Groq,
// GROQ_API_KEY on the server). The AI returns ONLY config-list values; all
// prices stay computed by the static USD config in this file + lib/index.ts.
// With GROQ_API_KEY removed the route returns 503 ai_unavailable and the app
// silently uses the rule-based analyzeProject() fallback above.
//
// "here i nned to make a tuc shop tell em the price tag i nend to add it i a petrol pump"
//   -> AI: heading "E-commerce Store for Tuc Shop" (subject "Tuc Shop", max 3 words,
//      no verbs), category "E-commerce", projectType "E-commerce Store",
//      features only from the FEATURES labels. Prices = 7000 + feature add-ons
//      from PROJECT_TYPES/FEATURES x COMPLEXITY — never from the AI.
//   -> Rule-based fallback (no key): still detects E-commerce via "shop" and
//      produces a usable (rougher) subject/heading from the same config.
// "hotel booking website"
//   -> AI heading "Booking Website for Hotel", category "Web development",
//      feature "Booking & reservations"; rule-based fallback matches this too.
// "my portfolio"
//   -> AI heading "Portfolio Website", category "Web development", Basic;
//      rule-based fallback gives the same category and low base price.
// Verify for all three: heading has no prices/numbers/currency, category and
// features exist in the config lists, and the total still comes from
// calculateEstimate() (static USD config x location x size x quality + tax).
