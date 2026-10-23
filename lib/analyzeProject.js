// =====================================================================
// PROJECT ANALYZER â€” config-driven. All prices below are BASE PRICES IN USD.
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
    "Scope tends to grow during development â€” changes are quoted separately",
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
    "Results depend on competition and typically take 3â€“6 months",
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

// Risks for physical projects (land, construction, animals, infrastructure).
// Used whenever the AI identifies the project as physical â€” the software
// risks above ("extra pages, CMS complexity") would be nonsense there.
const PHYSICAL_RISKS = [
  "Ground conditions, weather and site access can move both cost and schedule",
  "Permits, environmental approvals and inspections can delay the works",
  "Material, equipment and supply prices vary by market and season",
  "Ongoing staffing, utilities and maintenance are operating costs after handover",
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
    .replace(/[$â‚¬Â£Â¥â‚¹]/g, "")
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
  s = s.replace(/\s+/g, " ").trim().replace(/^[-â€“\s]+|[-â€“\s]+$/g, "");
  if (!s) return "";
  return toTitleCase(s);
}


// =====================================================================
// EXTRACTION-ONLY ANALYSIS
// =====================================================================
// The AI is used for ONE job: reading the user's description and telling us
// WHAT the project is â€” kind, type, features, quantities and location hint.
// It never returns a price, a timeline or a confidence score. Every number is
// computed by the rule-based engine in lib/pricing.ts.

const QUANTITY_KEYS = [
  "acres",
  "rooms",
  "floors",
  "units",
  "animals",
  "squareMeters",
  "kilometers",
  "staff",
];

// Signals used only when the AI is unavailable. The AI's own `kind` always
// wins; these keep the offline fallback sensible.
const PHYSICAL_SIGNALS = [
  /\bacres?\b/,
  /\bzoo\b/,
  /\bwildlife\b/,
  /\bsafari\b/,
  /\banimals?\b/,
  /\blivestock\b/,
  /\bcattle\b/,
  /\bfarms?\b/,
  /\benclosures?\b/,
  /\bconstruction\b/,
  /\brenovation\b/,
  /\bfit[- ]?out\b/,
  /\bland\b/,
  /\bplot\b/,
  /\bwarehouse\b/,
  /\bfactory\b/,
  /\broads?\b/,
  /\bhighways?\b/,
  /\bbridges?\b/,
  /\bpipelines?\b/,
  /\bbuildings?\b/,
  /\bsolar\b/,
  /\bstadium\b/,
  /\baquarium\b/,
  /\brestaurant\b/,
  /\bcafe\b/,
  /\bsalon\b/,
  /\bshowroom\b/,
  /\bvenue\b/,
  /\bhotel\b/,
  /\bresort\b/,
  /\b(?:tuc|tyre|tire|corner|grocery|retail)\s+shop\b/,
  /\bshop\s+(?:floor|front|unit)\b/,
  /\bphysical\s+(?:shop|store)\b/,
];

const SOFTWARE_SIGNALS = [
  /\bwebsites?\b/,
  /\bweb\b/,
  /\bapps?\b/,
  /\bsoftware\b/,
  /\bsaas\b/,
  /\bdashboards?\b/,
  /\bonline\b/,
  /\be-?commerce\b/,
  /\bdigital\b/,
  /\bplatform\b/,
  /\bapi\b/,
  /\bmobile\b/,
  /\bios\b/,
  /\bandroid\b/,
];

const SERVICE_TYPES = new Set(["design", "branding", "seo"]);

function detectProjectKind(text, aiKind) {
  if (aiKind === "physical" || aiKind === "software" || aiKind === "service") {
    return aiKind;
  }
  const norm = normalize(text);
  if (SOFTWARE_SIGNALS.some((pattern) => pattern.test(norm))) return "software";
  if (PHYSICAL_SIGNALS.some((pattern) => pattern.test(norm))) return "physical";
  return "software";
}

// Quantities are the main cost drivers for physical work. Only positive,
// finite numbers within a sane range survive.
function sanitizeQuantities(value) {
  const quantities = {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return quantities;
  }
  for (const key of QUANTITY_KEYS) {
    const amount = Number(value[key]);
    if (Number.isFinite(amount) && amount > 0 && amount <= 10_000_000) {
      quantities[key] = Math.round(amount * 100) / 100;
    }
  }
  return quantities;
}

function risksFor(kind, presetType) {
  if (kind === "physical") return PHYSICAL_RISKS;
  return TYPE_RISKS[presetType.key] || GENERIC_RISKS;
}

function buildAnalysis(
  type,
  features,
  complexity,
  subject,
  heading,
  aiScope,
  aiAssumptions,
  aiMeta,
  kind,
) {
  const scopeSource =
    Array.isArray(aiScope) && aiScope.length > 0 ? aiScope : type.scope;
  const scope = dedupeScopeItems([
    ...scopeSource.map((item) => sanitizeScopeItem(item)).filter(Boolean),
    ...features.map((f) => sanitizeScopeItem(f.scopeItem)).filter(Boolean),
  ]).slice(0, 6);

  const assumptions = [
    ...(Array.isArray(aiAssumptions) && aiAssumptions.length > 0
      ? aiAssumptions
      : type.assumptions),
    ...GENERIC_ASSUMPTIONS,
  ].slice(0, 5);

  const risks = dedupeRisks([
    ...risksFor(kind, type),
    ...features.flatMap((f) => FEATURE_RISKS[f.label] || []),
    ...GENERIC_RISKS,
  ]).slice(0, 5);

  return {
    category: type.category,
    categoryId: type.categoryId,
    projectType: aiMeta?.projectType || type.projectType,
    projectTypeKey: type.key,
    kind,
    aiCategory: aiMeta?.category || undefined,
    aiProjectType: aiMeta?.projectType || undefined,
    subject,
    heading,
    features: features.map((f) => f.label),
    complexity,
    quantities: aiMeta?.quantities || {},
    locationHint: aiMeta?.locationHint || "",
    scope,
    assumptions,
    risks,
  };
}

function analyzeProject(text) {
  const norm = normalize(text);
  const { type } = pickRuleBasedType(norm);
  const features = FEATURES.filter((f) => keywordMatches(norm, f.keywords));

  let complexity = "Standard";
  if (features.length === 0 && norm.length < 90) complexity = "Basic";
  else if (features.length >= 4 || (features.length >= 2 && norm.length > 200)) {
    complexity = "Advanced";
  } else if (features.length <= 1 && norm.length < 140) complexity = "Basic";

  const kind = detectProjectKind(norm, null);
  const subject = extractSubject(text, type);
  const heading = subject ? `${type.projectType} for ${subject}` : type.projectType;

  return buildAnalysis(
    type,
    features,
    complexity,
    subject,
    heading,
    [],
    [],
    null,
    kind,
  );
}

// ---------------------------------------------------------------------
// Optional AI extraction pass (POST /api/analyze -> Groq). The payload is
// already sanitized by the server; everything here is defensive so a stale
// or malformed payload can never break the estimate.
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
  const projectType = matchConfigValue(ai.projectType, AI_PROJECT_TYPE_LIST);
  const category = matchConfigValue(ai.category, AI_CATEGORY_LIST);

  const type =
    PROJECT_TYPES.find((t) => t.projectType === projectType) ||
    PROJECT_TYPES.find((t) => t.category === category) ||
    ruleBased.type;

  const kind = detectProjectKind(
    norm,
    ["physical", "software", "service"].includes(String(ai.kind))
      ? String(ai.kind)
      : null,
  );

  const allowedFeatureLabels = new Set(FEATURES.map((f) => f.label.toLowerCase()));
  const wanted = new Set(
    (Array.isArray(ai.features) ? ai.features : [])
      .filter((f) => typeof f === "string")
      .map((f) => f.trim().toLowerCase())
      .filter((f) => allowedFeatureLabels.has(f)),
  );
  const features = FEATURES.filter((f) => wanted.has(f.label.toLowerCase()));

  const complexity = AI_ALLOWED_COMPLEXITY[ai.complexity]
    ? ai.complexity
    : "Standard";

  let subject = sanitizeAiPhrase(ai.subject, 3, 60);
  if (subject) subject = toTitleCase(subject.toLowerCase());
  let heading = sanitizeAiPhrase(ai.heading, 6, 120);
  if (!heading) {
    heading = subject ? `${type.projectType} for ${subject}` : type.projectType;
  }

  const aiScope = Array.isArray(ai.scope)
    ? ai.scope.map((item) => sanitizeScopeItem(item)).filter(Boolean)
    : [];

  const aiAssumptions = Array.isArray(ai.assumptions)
    ? ai.assumptions
        .map((a) => sanitizeAiPhrase(a, 16, 120))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const aiMeta = {
    category: sanitizeAiPhrase(ai.category, 4, 40),
    projectType: sanitizeAiPhrase(ai.projectType, 6, 60),
    quantities: sanitizeQuantities(ai.quantities),
    locationHint: sanitizeAiPhrase(ai.locationHint, 4, 60),
  };

  return buildAnalysis(
    type,
    features,
    complexity,
    subject,
    heading,
    aiScope,
    aiAssumptions,
    aiMeta,
    kind,
  );
}

export { analyzeProject, analyzeProjectWithAi, PROJECT_TYPES, FEATURES, SERVICE_TYPES };
export default analyzeProject;
