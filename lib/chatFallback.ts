// Shared, dependency-free chat fallback used BOTH on the server (when the
// Groq key is missing or the API fails) and on the client (when the network
// is down). It never throws and always returns a usable reply, so the chatbot
// keeps working fully offline with the rule-based project analyzer.

import { analyzeProject } from "@/lib/analyzeProject";

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface ChatReply {
  reply: string;
  suggestEstimate: boolean;
  brief: string;
  source: "ai" | "fallback";
  model?: string | null;
}

export type ChatLanguage =
  | "en"
  | "roman-ur"
  | "ur"
  | "hi"
  | "es"
  | "fr"
  | "ar";

// Lightweight language guess so the offline fallback at least answers in the
// same script/language family the user wrote in. The online AI path handles
// language on its own.
export function detectLanguage(text: string): ChatLanguage {
  const t = String(text ?? "");
  if (/[\u0600-\u06FF]/.test(t)) return "ur";
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  if (/[ñáéíóúü¿¡]/i.test(t)) return "es";
  if (/\b(bonjour|merci|je veux|prix|coût|combien|besoin)\b/i.test(t)) {
    return "fr";
  }
  if (
    /\b(ky|kya|kia|kaise|kaisay|chahiye|chahiyay|banana|banao|banwana|banani|kitna|kitne|mera|meri|mujhe|mujhay|hai|hain|karna|karne|nahi|nahin|acha|achha|paisa|paise|kharcha|kharche|batao|bata|chahye|rha|raha|kya hai)\b/i.test(
      t,
    )
  ) {
    return "roman-ur";
  }
  return "en";
}

function greeting(lang: ChatLanguage): string {
  const map: Record<ChatLanguage, string> = {
    en: "Hi! I'm the CostCalc assistant. Tell me what you want to build and your city, and I'll help you price it.",
    "roman-ur":
      "Assalam-o-Alaikum! Main CostCalc assistant hoon. Batayein kya banana hai aur kis shehar mein — main price estimate karne mein madad karunga.",
    ur: "السلام علیکم! میں CostCalc اسسٹنٹ ہوں۔ بتائیں کیا بنانا ہے اور کس شہر میں — میں قیمت کا اندازہ لگانے میں مدد کروں گا۔",
    hi: "नमस्ते! मैं CostCalc असिस्टेंट हूँ। बताइए क्या बनाना है और किस शहर में — मैं कीमत का अनुमान लगाने में मदद करूँगा।",
    es: "¡Hola! Soy el asistente de CostCalc. Cuéntame qué quieres crear y tu ciudad y te ayudaré con el precio.",
    fr: "Bonjour ! Je suis l'assistant CostCalc. Dites-moi ce que vous voulez créer et votre ville, et je vous aiderai avec le prix.",
    ar: "مرحبًا! أنا مساعد CostCalc. أخبرني بما تريد إنشاءه ومدينتك وسأساعدك في التسعير.",
  };
  return map[lang] ?? map.en;
}

export function buildLocalGreeting(): string {
  return greeting("en");
}

// Shown in the chat right after the estimate has been created, so the chat
// stays put (instead of vanishing) and invites follow-up changes.
export function buildEstimateReadyMessage(lang: ChatLanguage): string {
  const map: Record<ChatLanguage, string> = {
    en: "Done! Your estimate is ready and shown on the page. Want any changes? Just tell me and I'll update it.",
    "roman-ur":
      "Ho gaya! Aap ka estimate ban gaya hai aur page par nazar aa raha hai. Koi tabdeeli chahiye to bata dein, main update kar dunga.",
    ur: "ہو گیا! آپ کا تخمینہ تیار ہے اور صفحے پر نظر آ رہا ہے۔ کوئی تبدیلی چاہیں تو بتائیں، میں اپ ڈیٹ کر دوں گا۔",
    hi: "हो गया! आपका अनुमान तैयार है और पेज पर दिख रहा है। कोई बदलाव चाहें तो बताएं, मैं अपडेट कर दूंगा।",
    es: "¡Listo! Tu presupuesto está hecho y aparece en la página. ¿Quieres cambios? Solo dímelo y lo actualizo.",
    fr: "C'est fait ! Votre devis est prêt et affiché sur la page. Des modifications ? Dites-le-moi et je le mets à jour.",
    ar: "تم! تقديرك جاهز ويظهر في الصفحة. تريد أي تغيير؟ أخبرني وسأحدّثه.",
  };
  return map[lang] ?? map.en;
}

// Builds an offline reply from the rule-based analyzer: it names the project
// type it detected and offers the "Create estimate" action.
export function buildLocalReply(
  turns: ChatTurn[],
  locationLabelText = "",
): ChatReply {
  const lastUser =
    [...turns].reverse().find((turn) => turn.role === "user")?.content ?? "";
  const text = lastUser.trim();
  const lang = detectLanguage(text);

  if (text.length < 4) {
    return {
      reply: greeting(lang),
      suggestEstimate: false,
      brief: "",
      source: "fallback",
      model: null,
    };
  }

  const analysis = analyzeProject(text);
  const type =
    analysis.aiProjectType ||
    analysis.projectType ||
    analysis.category ||
    "project";
  const where = locationLabelText ? ` (${locationLabelText})` : "";

  const map: Record<ChatLanguage, string> = {
    en: `Got it — this looks like ${type}${where}. I can turn it into a detailed cost estimate. Tap “Create estimate” and I'll price it for you.`,
    "roman-ur": `Samajh gaya — yeh ${type}${where} lagta hai. Main iska detailed estimate bana sakta hoon. “Create estimate” par tap karein.`,
    ur: `سمجھ گیا — یہ ${type} لگتا ہے۔ میں اس کا تفصیلی تخمینہ بنا سکتا ہوں۔ ”Create estimate“ دبائیں۔`,
    hi: `समझ गया — यह ${type} लगता है। मैं इसका विस्तृत अनुमान बना सकता हूँ। “Create estimate” दबाएँ।`,
    es: `Entendido: parece ${type}${where}. Puedo crear un presupuesto detallado. Pulsa «Create estimate».`,
    fr: `Compris — cela ressemble à ${type}${where}. Je peux créer un devis détaillé. Appuyez sur « Create estimate ».`,
    ar: `فهمت — يبدو أن هذا ${type}. يمكنني إنشاء تقدير مفصّل. اضغط على "Create estimate".`,
  };

  return {
    reply: map[lang] ?? map.en,
    suggestEstimate: true,
    brief: text.slice(0, 300),
    source: "fallback",
    model: null,
  };
}
