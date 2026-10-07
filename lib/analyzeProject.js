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
      "Customer app for browsing restaurants and ordering food",
      "Restaurant/vendor listing and menu management",
      "Cart, checkout and online payment setup",
      "Order status and delivery tracking",
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
      "Booking and availability calendar",
      "Room/service listing and detail pages",
      "Reservation flow with email confirmation",
      "Admin panel for bookings and availability",
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
      "Product catalog with categories and variants",
      "Cart, checkout and order flow",
      "Payment gateway integration",
      "Admin panel for products, orders and stock",
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
      "Core dashboard and user workspace",
      "Authentication and account management",
      "Subscription or billing setup",
      "Admin controls and analytics",
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
      "Wireframes and user flows for the core screens",
      "Cross-platform app build (iOS and Android)",
      "Backend integration and user authentication",
      "App store release and launch support",
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
      "Personal introduction and about section",
      "Project/case study gallery",
      "Contact form and social links",
      "Responsive design and launch",
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
      "User research and journey mapping",
      "Wireframes for key screens",
      "High-fidelity UI design",
      "Clickable prototype and handover",
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
      "Brand discovery and positioning",
      "Logo concepts and refinement",
      "Color palette, typography and assets",
      "Brand guideline document and handover",
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
      "Technical SEO audit and fixes",
      "Keyword and content strategy",
      "On-page optimization setup",
      "Monthly reporting and recommendations",
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
      "Page structure and responsive design",
      "Content entry and contact forms",
      "Basic SEO and performance setup",
      "Testing, launch and handover",
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
      "Discovery and requirement review",
      "Proposed solution and timeline",
      "Build of the agreed core deliverable",
      "Testing and handover",
    ],
    assumptions: [
      "Final scope is confirmed after a short discovery call",
      "Estimate may be revised once requirements are clear",
    ],
  },
];

// FEATURES: detected from the text. price -> USD add-on, weeks -> added weeks.
const FEATURES = [
  { label: "Online payment", keywords: ["payment", "payments", "online payment", "checkout", "stripe", "paypal", "billing"], price: 1500, weeks: 2, scopeItem: "Secure payment integration" },
  { label: "Admin dashboard", keywords: ["admin dashboard", "admin panel", "dashboard", "backoffice", "cms"], price: 2200, weeks: 3, scopeItem: "Admin dashboard for managing content and orders" },
  { label: "User login", keywords: ["login", "log in", "signup", "sign up", "auth", "accounts", "customer accounts"], price: 900, weeks: 1, scopeItem: "User accounts with sign-in and roles" },
  { label: "Inventory", keywords: ["inventory", "stock", "warehouse", "product management"], price: 1600, weeks: 2, scopeItem: "Inventory and stock management" },
  { label: "Search", keywords: ["search", "filters"], price: 600, weeks: 1, scopeItem: "Search and filtering" },
  { label: "Multi-language", keywords: ["multi-language", "multilingual", "multi language", "translations", "i18n", "languages"], price: 1100, weeks: 2, scopeItem: "Multi-language content support" },
  { label: "Delivery tracking", keywords: ["delivery tracking", "tracking", "order tracking", "shipping tracking"], price: 900, weeks: 1, scopeItem: "Order and delivery tracking" },
  { label: "Blog", keywords: ["blog", "articles", "news"], price: 700, weeks: 1, scopeItem: "Blog or news section" },
  { label: "Live chat", keywords: ["live chat", "chat", "chatbot", "messaging"], price: 600, weeks: 1, scopeItem: "Live chat or chatbot support" },
  { label: "SEO", keywords: ["seo", "search engine", "optimization", "ranking"], price: 600, weeks: 1, scopeItem: "On-page SEO setup" },
  { label: "API integration", keywords: ["api", "integration", "integrations", "webhook", "third party"], price: 1400, weeks: 2, scopeItem: "Third-party API integrations" },
  { label: "Contact form", keywords: ["contact form", "contact"], price: 300, weeks: 1, scopeItem: "Contact form with email notifications" },
  { label: "Booking & reservations", keywords: ["booking", "reservations", "reservation", "appointment"], price: 1200, weeks: 2, scopeItem: "Booking and reservation system" },
  { label: "Reviews & ratings", keywords: ["reviews", "ratings"], price: 400, weeks: 1, scopeItem: "Customer reviews and ratings" },
  { label: "Push notifications", keywords: ["notifications", "push notifications"], price: 500, weeks: 1, scopeItem: "Push notifications" },
  { label: "Subscriptions", keywords: ["subscription", "subscriptions", "recurring"], price: 1000, weeks: 1, scopeItem: "Subscription billing setup" },
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

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
function buildAnalysis(norm, type, features, complexity, subject, heading, confidence) {
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

  const scope = [
    ...type.scope,
    ...features.map((f) => f.scopeItem),
  ].slice(0, 6);

  const assumptions = [
    ...type.assumptions,
    ...GENERIC_ASSUMPTIONS,
  ].slice(0, 5);

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

  return buildAnalysis(norm, type, features, complexity, subject, heading, confidence);
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
