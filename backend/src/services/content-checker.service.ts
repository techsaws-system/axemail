import type { ContentCheckDto, ContentCheckSectionDto, ContentCheckSignalDto } from "@/types/api.types";

const severeSpamPhrases = [
  "act now",
  "urgent response",
  "limited time",
  "risk free",
  "guaranteed",
  "winner",
  "click here",
  "free money",
  "exclusive offer",
  "claim now",
  "final warning",
];

const cautionPhrases = [
  "immediate action",
  "do not ignore",
  "verify now",
  "special offer",
  "buy now",
  "congratulations",
  "once in a lifetime",
  "fast cash",
  "lowest price",
  "urgent",
];

const legalTonePhrases = [
  "notice",
  "review",
  "serial number",
  "reference",
  "application",
  "appointment",
  "examining officer",
  "filing",
  "registration",
  "compliance",
  "trademark",
  "case",
  "official",
  "response window",
];

export function analyzeContent(input: {
  fromName: string;
  subject: string;
  previewText?: string;
  message: string;
}): ContentCheckDto {
  const fromName = input.fromName.trim();
  const subject = input.subject.trim();
  const previewText = input.previewText?.trim() ?? "";
  const messageText = stripHtml(input.message).trim();

  const signals: ContentCheckSignalDto[] = [];
  const suggestions = new Set<string>();

  const fromNameSection = analyzeFromName(fromName, signals, suggestions);
  const subjectSection = analyzeSubject(subject, signals, suggestions);
  const previewSection = analyzePreviewText(
    previewText,
    subject,
    signals,
    suggestions,
  );
  const messageSection = analyzeMessage(messageText, signals, suggestions);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        fromNameSection.score * 0.15 +
          subjectSection.score * 0.25 +
          previewSection.score * 0.1 +
          messageSection.score * 0.5,
      ),
    ),
  );

  const riskLevel = score >= 80 ? "low" : score >= 60 ? "medium" : "high";

  return {
    score,
    riskLevel,
    summary: buildSummary(score, riskLevel, signals),
    sections: {
      fromName: finalizeSection(fromNameSection),
      subject: finalizeSection(subjectSection),
      previewText: finalizeSection(previewSection),
      message: finalizeSection(messageSection),
    },
    suggestions: Array.from(suggestions),
    signals,
    metrics: {
      messageWordCount: countWords(messageText),
      linkCount: countLinks(input.message),
      exclamationCount: countExclamations(`${subject} ${previewText} ${messageText}`),
      allCapsWordCount: countAllCapsWords(`${subject} ${previewText} ${messageText}`),
      spamPhraseHits: countPhraseHits(
        `${fromName} ${subject} ${previewText} ${messageText}`.toLowerCase(),
        [...severeSpamPhrases, ...cautionPhrases],
      ),
      legalToneHits: countPhraseHits(
        `${fromName} ${subject} ${previewText} ${messageText}`.toLowerCase(),
        legalTonePhrases,
      ),
    },
  };
}

function analyzeFromName(
  value: string,
  signals: ContentCheckSignalDto[],
  suggestions: Set<string>,
) {
  let score = 100;
  const findings: string[] = [];
  const normalized = value.toLowerCase();

  if (value.length < 3) {
    score -= 15;
    findings.push("From name is too short to look trustworthy.");
    suggestions.add("Use a clear professional sender name such as a team, department, or named reviewer.");
    pushSignal(signals, "warning", "from_name", "Short sender name", "Use a fuller sender identity to improve trust.");
  }

  if (hasAggressiveCaps(value)) {
    score -= 20;
    findings.push("From name uses excessive capital letters.");
    suggestions.add("Avoid all-caps sender names.");
    pushSignal(signals, "risk", "from_name", "Aggressive capitalization", "All-caps sender names increase spam suspicion.");
  }

  if (/\d{3,}/.test(value)) {
    score -= 10;
    findings.push("From name contains heavy numeric patterns.");
    suggestions.add("Remove unnecessary numbers from the sender name.");
    pushSignal(signals, "warning", "from_name", "Numeric sender name", "Numeric-heavy sender names look machine-generated.");
  }

  if (matchesAnyPhrase(normalized, [...severeSpamPhrases, ...cautionPhrases])) {
    score -= 25;
    findings.push("From name contains promotional or urgent wording.");
    suggestions.add("Keep the sender name neutral and organization-like.");
    pushSignal(signals, "risk", "from_name", "Promotional sender name", "Urgent or promotional language in sender names hurts trust.");
  }

  if (matchesAnyPhrase(normalized, legalTonePhrases)) {
    score += 5;
    findings.push("From name supports a formal legal/compliance tone.");
    pushSignal(signals, "positive", "from_name", "Professional sender identity", "The sender name aligns with legal-notice style messaging.");
  }

  return { score: clampScore(score), findings };
}

function analyzeSubject(
  value: string,
  signals: ContentCheckSignalDto[],
  suggestions: Set<string>,
) {
  let score = 100;
  const findings: string[] = [];
  const normalized = value.toLowerCase();

  if (value.length < 8) {
    score -= 15;
    findings.push("Subject is too short to provide enough context.");
    suggestions.add("Use a specific subject that names the notice, matter, or case reference.");
    pushSignal(signals, "warning", "subject", "Short subject", "Short subjects are less trustworthy and less informative.");
  }

  if (value.length > 90) {
    score -= 10;
    findings.push("Subject is overly long.");
    suggestions.add("Keep the subject concise and specific.");
    pushSignal(signals, "warning", "subject", "Long subject", "Overly long subjects are easier to flag and harder to scan.");
  }

  const severeHits = countPhraseHits(normalized, severeSpamPhrases);
  const cautionHits = countPhraseHits(normalized, cautionPhrases);
  if (severeHits > 0) {
    score -= Math.min(45, severeHits * 18);
    findings.push("Subject includes high-risk spam phrases.");
    suggestions.add("Remove urgency, prize, or guarantee-style wording from the subject.");
    pushSignal(signals, "risk", "subject", "Spam-heavy subject", "High-risk phrases in the subject increase filtering risk.");
  }
  if (cautionHits > 0) {
    score -= Math.min(25, cautionHits * 10);
    findings.push("Subject uses pressure-based or promotional language.");
    suggestions.add("Prefer neutral, formal wording over pressure-based phrasing.");
    pushSignal(signals, "warning", "subject", "Pushy wording", "Pressure-based subject lines perform worse in legal-email contexts.");
  }

  const exclamations = countExclamations(value);
  if (exclamations > 1) {
    score -= 15;
    findings.push("Subject uses excessive exclamation marks.");
    suggestions.add("Remove exclamation marks from the subject.");
    pushSignal(signals, "risk", "subject", "Excess punctuation", "Exclamation-heavy subjects are a common spam pattern.");
  }

  if (hasAggressiveCaps(value)) {
    score -= 20;
    findings.push("Subject uses excessive capitalization.");
    suggestions.add("Use sentence case or title case instead of all caps.");
    pushSignal(signals, "risk", "subject", "Aggressive capitalization", "All-caps subjects are more likely to be flagged.");
  }

  if (matchesAnyPhrase(normalized, legalTonePhrases)) {
    score += 8;
    findings.push("Subject aligns with formal legal/compliance terminology.");
    pushSignal(signals, "positive", "subject", "Formal legal tone", "The subject uses terminology that fits legal-notice messaging.");
  }

  return { score: clampScore(score), findings };
}

function analyzePreviewText(
  value: string,
  subject: string,
  signals: ContentCheckSignalDto[],
  suggestions: Set<string>,
) {
  let score = 100;
  const findings: string[] = [];
  const normalized = value.toLowerCase();

  if (!value) {
    findings.push("No preview text supplied.");
    suggestions.add("Add preview text that extends the subject with a precise compliance or case context.");
    return { score: 88, findings };
  }

  if (normalized === subject.trim().toLowerCase()) {
    score -= 15;
    findings.push("Preview text duplicates the subject exactly.");
    suggestions.add("Use preview text to add context instead of repeating the subject.");
    pushSignal(signals, "warning", "preview_text", "Repeated preview text", "Preview text should add context, not duplicate the subject.");
  }

  if (value.length > 120) {
    score -= 8;
    findings.push("Preview text is longer than typical inbox display space.");
    suggestions.add("Keep preview text short and context-specific.");
  }

  if (countPhraseHits(normalized, severeSpamPhrases) > 0) {
    score -= 20;
    findings.push("Preview text contains spam-risk phrases.");
    suggestions.add("Remove urgency and promotional language from preview text.");
    pushSignal(signals, "risk", "preview_text", "Spam phrasing", "Spam-style preview text weakens inbox trust.");
  }

  if (matchesAnyPhrase(normalized, legalTonePhrases)) {
    score += 5;
    findings.push("Preview text supports a formal notice tone.");
    pushSignal(signals, "positive", "preview_text", "Formal context", "The preview text reinforces a legal/compliance context.");
  }

  return { score: clampScore(score), findings };
}

function analyzeMessage(
  value: string,
  signals: ContentCheckSignalDto[],
  suggestions: Set<string>,
) {
  let score = 100;
  const findings: string[] = [];
  const normalized = value.toLowerCase();
  const wordCount = countWords(value);
  const linkCount = countLinks(value);
  const severeHits = countPhraseHits(normalized, severeSpamPhrases);
  const cautionHits = countPhraseHits(normalized, cautionPhrases);
  const legalHits = countPhraseHits(normalized, legalTonePhrases);

  if (wordCount < 60) {
    score -= 15;
    findings.push("Message body is quite short.");
    suggestions.add("Add more neutral context explaining the matter, reference, and next step.");
    pushSignal(signals, "warning", "message", "Thin body copy", "Very short messages are easier to misclassify as spam.");
  }

  if (wordCount > 700) {
    score -= 8;
    findings.push("Message body is quite long.");
    suggestions.add("Keep the message focused on the notice, context, and response path.");
  }

  if (linkCount > 4) {
    score -= 20;
    findings.push("Message includes too many links.");
    suggestions.add("Reduce the number of links and keep only the most necessary destination.");
    pushSignal(signals, "risk", "message", "High link density", "Messages with many links are more likely to be filtered.");
  } else if (linkCount > 2) {
    score -= 10;
    findings.push("Message includes multiple links.");
    suggestions.add("Use fewer links and keep the body focused on the notice content.");
  }

  if (countExclamations(value) > 3) {
    score -= 12;
    findings.push("Message uses excessive exclamation marks.");
    suggestions.add("Use neutral punctuation and remove emotional emphasis.");
    pushSignal(signals, "warning", "message", "Emphatic punctuation", "Legal emails should read neutral and procedural.");
  }

  if (countAllCapsWords(value) > 6) {
    score -= 15;
    findings.push("Message contains too many all-caps words.");
    suggestions.add("Avoid all-caps emphasis in message content.");
    pushSignal(signals, "warning", "message", "All-caps emphasis", "All-caps wording looks aggressive and promotional.");
  }

  if (severeHits > 0) {
    score -= Math.min(40, severeHits * 14);
    findings.push("Message contains high-risk spam phrases.");
    suggestions.add("Remove promotional, prize, or guarantee-style wording from the message.");
    pushSignal(signals, "risk", "message", "Spam-heavy copy", "High-risk phrases in the message body increase filtering risk.");
  }

  if (cautionHits > 0) {
    score -= Math.min(24, cautionHits * 8);
    findings.push("Message uses pressure-based language.");
    suggestions.add("Use a neutral legal/compliance tone rather than pressure-based calls to action.");
  }

  if (legalHits > 0) {
    score += Math.min(12, legalHits * 2);
    findings.push("Message supports a formal legal/compliance tone.");
    pushSignal(signals, "positive", "message", "Formal legal framing", "The body uses terminology that aligns with procedural legal emails.");
  } else {
    suggestions.add("Use more formal legal/compliance language such as notice, reference, application, review, or response window where appropriate.");
  }

  return { score: clampScore(score), findings };
}

function finalizeSection(input: { score: number; findings: string[] }): ContentCheckSectionDto {
  return {
    score: input.score,
    status: input.score >= 80 ? "strong" : input.score >= 60 ? "moderate" : "risky",
    findings: input.findings,
  };
}

function buildSummary(
  score: number,
  riskLevel: "low" | "medium" | "high",
  signals: ContentCheckSignalDto[],
) {
  if (riskLevel === "low") {
    return "This draft reads relatively safe for formal legal-style delivery. Keep the tone procedural and avoid adding promotional urgency before sending.";
  }

  if (riskLevel === "medium") {
    const primaryRisk = signals.find((signal) => signal.tone === "risk" || signal.tone === "warning");
    if (primaryRisk) {
      return `This draft has moderate spam risk. The main issue is ${primaryRisk.label.toLowerCase()}. Tighten that section before sending.`;
    }

    return "This draft is usable, but some phrasing still increases spam risk. Refine the wording before sending.";
  }

  return "This draft has elevated spam risk for legal-style outreach. Reduce urgency, promotional phrasing, excessive punctuation, and high-pressure copy before sending.";
}

function pushSignal(
  signals: ContentCheckSignalDto[],
  tone: ContentCheckSignalDto["tone"],
  area: ContentCheckSignalDto["area"],
  label: string,
  detail: string,
) {
  signals.push({ tone, area, label, detail });
}

function stripHtml(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(value: string) {
  return value ? value.split(/\s+/).filter(Boolean).length : 0;
}

function countLinks(value: string) {
  return (value.match(/https?:\/\/|www\./gi) ?? []).length;
}

function countExclamations(value: string) {
  return (value.match(/!/g) ?? []).length;
}

function countAllCapsWords(value: string) {
  return (
    value.match(/\b[A-Z]{2,}\b/g)?.filter((word) => /[A-Z]/.test(word)).length ?? 0
  );
}

function hasAggressiveCaps(value: string) {
  const lettersOnly = value.replace(/[^A-Za-z]/g, "");
  if (lettersOnly.length < 4) {
    return false;
  }

  const upperCount = lettersOnly.split("").filter((character) => character === character.toUpperCase()).length;
  return upperCount / lettersOnly.length >= 0.8;
}

function matchesAnyPhrase(value: string, phrases: string[]) {
  return phrases.some((phrase) => value.includes(phrase));
}

function countPhraseHits(value: string, phrases: string[]) {
  return phrases.reduce((total, phrase) => total + (value.includes(phrase) ? 1 : 0), 0);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
