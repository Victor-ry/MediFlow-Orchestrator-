// src/utils/flextoken.js
const FLEX_URL = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions";
const FLEX_TOKEN = "Bearer sk-0rwIrkJyb1pRG8l1sDt0yA";

const PRIORITY_LEVELS = new Set(["High", "Medium", "Low"]);

const clampPercentage = (value, fallback = 0) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
};

const normalizeString = (value) => String(value || "").trim();

const normalizeDepartment = (value, allowedDepartments) => {
  const requestedDepartment = normalizeString(value);
  if (!requestedDepartment) {
    return "";
  }

  const normalizedRequestedDepartment = requestedDepartment.toLowerCase();
  const exactMatch = allowedDepartments.find(
    (department) => department.toLowerCase() === normalizedRequestedDepartment
  );

  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = allowedDepartments.find(
    (department) =>
      department.toLowerCase().includes(normalizedRequestedDepartment) ||
      normalizedRequestedDepartment.includes(department.toLowerCase())
  );

  return partialMatch || "";
};

const stripCodeFence = (value) =>
  String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

const replaceSmartQuotes = (value) =>
  String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

const extractJsonObject = (value) => {
  const text = String(value || "");
  const startIndex = text.indexOf("{");

  if (startIndex === -1) {
    return "";
  }

  let depth = 0;
  let isInString = false;
  let isEscaped = false;

  for (let index = startIndex; index < text.length; index += 1) {
    const character = text[index];

    if (isInString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        isInString = false;
      }

      continue;
    }

    if (character === '"') {
      isInString = true;
      continue;
    }

    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;

      if (depth === 0) {
        return text.slice(startIndex, index + 1);
      }
    }
  }

  return text.slice(startIndex).trim();
};

const sanitizeJsonCandidate = (value) =>
  replaceSmartQuotes(String(value || ""))
    .replace(/^[^{[]*/, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();

const tryParseJson = (value) => {
  if (!String(value || "").trim()) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const parseAnalysisResponse = (value) => {
  const cleanedValue = stripCodeFence(value);
  const directParse = tryParseJson(cleanedValue);
  if (directParse) {
    return directParse;
  }

  const extractedObject = extractJsonObject(cleanedValue);
  const extractedParse = tryParseJson(extractedObject);
  if (extractedParse) {
    return extractedParse;
  }

  const sanitizedValue = sanitizeJsonCandidate(cleanedValue);
  const sanitizedParse = tryParseJson(sanitizedValue);
  if (sanitizedParse) {
    return sanitizedParse;
  }

  const sanitizedExtractedObject = sanitizeJsonCandidate(extractedObject);
  return tryParseJson(sanitizedExtractedObject);
};

const getMessageContent = (responseJson) => {
  const content = responseJson?.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("\n")
      .trim();
  }

  return typeof content === "string" ? content.trim() : "";
};

const buildAnalysisPrompt = ({ transcript, patient, allowedDepartments }) => {
  const safePatient = {
    age: patient?.age ?? null,
    sex: patient?.sex ?? "",
    medical_history: patient?.medical_history ?? "",
    allergies: patient?.allergies ?? "",
    family_history: patient?.family_history ?? "",
  };

  return `You are a clinical intake routing assistant.
Analyze the provided consultation transcript and patient context.

Rules:
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown.
- Do not include any fields outside this schema.
- recommended_department must be exactly one of the allowed departments.
- If information is uncertain, keep the best estimate but stay within the schema.
- confidence_score and probability_percentage must be numbers from 0 to 100.
- priority must be exactly one of: High, Medium, Low.

Allowed departments:
${JSON.stringify(allowedDepartments, null, 2)}

Required JSON schema:
{
  "extracted_intent": {
    "symptoms": ["string"],
    "recommended_department": "string",
    "confidence_score": 0
  },
  "predicted_disease": [
    {
      "disease": "string",
      "probability_percentage": 0
    }
  ],
  "ai_recommendation": "string",
  "priority": "High"
}

Input:
${JSON.stringify(
    {
      transcript,
      patient: safePatient,
    },
    null,
    2
  )}`;
};

const normalizeAnalysisResult = (rawAnalysis, allowedDepartments) => {
  const extractedIntent = rawAnalysis?.extracted_intent || {};
  const predictedDisease = Array.isArray(rawAnalysis?.predicted_disease)
    ? rawAnalysis.predicted_disease
    : [];
  const symptoms = Array.isArray(extractedIntent?.symptoms)
    ? extractedIntent.symptoms
        .map((symptom) => normalizeString(symptom))
        .filter(Boolean)
    : [];
  const recommendedDepartment = normalizeDepartment(
    extractedIntent?.recommended_department,
    allowedDepartments
  );
  const priority = normalizeString(rawAnalysis?.priority);

  return {
    extracted_intent: {
      symptoms,
      recommended_department: recommendedDepartment,
      confidence_score: clampPercentage(extractedIntent?.confidence_score),
    },
    predicted_disease: predictedDisease
      .map((item) => ({
        disease: normalizeString(item?.disease),
        probability_percentage: clampPercentage(item?.probability_percentage),
      }))
      .filter((item) => item.disease),
    ai_recommendation: normalizeString(rawAnalysis?.ai_recommendation),
    priority: PRIORITY_LEVELS.has(priority) ? priority : "Low",
  };
};

export async function callFlexAI(message) {
  return callFlexAIWithMessages([{ role: "user", content: message }]);
}

export async function callFlexAIWithMessages(messages) {
  const body = {
    messages,
    model: "qwen2.5",
    max_tokens: 508,
    temperature: 0.1,
    top_p: 0.9,
  };

  const res = await fetch(FLEX_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: FLEX_TOKEN,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Flex API error: ${res.status} ${errText}`);
  }

  return res.json();
}

const repairAnalysisJson = async (rawContent) => {
  const repairMessages = [
    {
      role: "system",
      content:
        "You repair malformed JSON. Return only valid JSON with no markdown, no explanation, and no extra text.",
    },
    {
      role: "user",
      content: `Convert the following content into valid JSON. Preserve only these fields: extracted_intent, predicted_disease, ai_recommendation, priority. Do not add any new fields.\n\n${rawContent}`,
    },
  ];

  const repairedResponse = await callFlexAIWithMessages(repairMessages);
  return getMessageContent(repairedResponse);
};

export async function analyzeConsultationTranscript({
  transcript,
  patient,
  allowedDepartments,
}) {
  if (!normalizeString(transcript)) {
    throw new Error("Transcript is required for AI analysis.");
  }

  if (!Array.isArray(allowedDepartments) || allowedDepartments.length === 0) {
    throw new Error("Department list is required for AI analysis.");
  }

  const prompt = buildAnalysisPrompt({
    transcript,
    patient,
    allowedDepartments,
  });
  const responseJson = await callFlexAI(prompt);
  const responseContent = getMessageContent(responseJson);

  if (!responseContent) {
    throw new Error("Flex AI returned an empty response.");
  }

  let parsedAnalysis = parseAnalysisResponse(responseContent);

  if (!parsedAnalysis) {
    const repairedContent = await repairAnalysisJson(responseContent);
    parsedAnalysis = parseAnalysisResponse(repairedContent);
  }

  if (!parsedAnalysis) {
    throw new Error("Flex AI returned invalid JSON after retry.");
  }

  return normalizeAnalysisResult(parsedAnalysis, allowedDepartments);
}