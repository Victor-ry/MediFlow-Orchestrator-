// src/utils/flextoken.js
const FLEX_URL = "https://aiworkshopapi.flexinfra.com.my/v1/chat/completions";
const FLEX_TOKEN = "Bearer sk-0rwIrkJyb1pRG8l1sDt0yA";
const JSON_RESPONSE_FORMAT = { type: "json_object" };

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

const extractSymptomsFromText = (value) =>
  String(value || "")
    .split(/[;,]|\band\b/gi)
    .map((item) => normalizeString(item.replace(/^patient (complains?|reports?) of\s+/i, "")))
    .filter((item) => item.length > 2)
    .slice(0, 5);

const inferPriorityFromText = (value) => {
  const normalizedValue = normalizeString(value).toLowerCase();

  if (!normalizedValue) {
    return "Low";
  }

  if (/urgent|emergency|immediate|severe|acute|vision loss|chest pain/.test(normalizedValue)) {
    return "High";
  }

  if (/blurry vision|elevated|moderate|persistent|headache/.test(normalizedValue)) {
    return "Medium";
  }

  return "Low";
};

const buildAnalysisMessages = ({ transcript, patient, allowedDepartments }) => {
  const safePatient = {
    age: patient?.age ?? null,
    sex: patient?.sex ?? "",
    medical_history: patient?.medical_history ?? "",
    allergies: patient?.allergies ?? "",
    family_history: patient?.family_history ?? "",
  };

  return [
    {
      role: "system",
      content:
        "You are a clinical intake routing assistant. Always return exactly one JSON object. Never return markdown. Never return prose outside the JSON object.",
    },
    {
      role: "user",
      content: `Analyze the provided consultation transcript and patient context.

Rules:
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown.
- Do not include any fields outside this schema.
- extracted_intent must be an object.
- extracted_intent.symptoms must always be an array of strings.
- extracted_intent.recommended_department must be exactly one of the allowed departments.
- extracted_intent.confidence_score must be a number from 0 to 100.
- predicted_disease must always be an array of objects.
- Each predicted_disease item must contain disease and probability_percentage.
- probability_percentage must be a number from 0 to 100.
- ai_recommendation must be a short plain-text summary.
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

Example valid response:
{
  "extracted_intent": {
    "symptoms": ["red eye", "blurry vision", "mild headache"],
    "recommended_department": "Ophthalmology",
    "confidence_score": 84
  },
  "predicted_disease": [
    {
      "disease": "Conjunctivitis",
      "probability_percentage": 58
    },
    {
      "disease": "Acute glaucoma",
      "probability_percentage": 24
    }
  ],
  "ai_recommendation": "Urgent ophthalmology assessment is recommended for red eye with blurry vision. Monitor blood pressure and escalate if symptoms worsen.",
  "priority": "Medium"
}

Input:
${JSON.stringify(
        {
          transcript,
          patient: safePatient,
        },
        null,
        2
      )}`,
    },
  ];
};

const getAnalysisSchemaIssues = (rawAnalysis, allowedDepartments) => {
  const issues = [];

  if (!rawAnalysis || typeof rawAnalysis !== "object" || Array.isArray(rawAnalysis)) {
    return ["Top-level response must be a JSON object."];
  }

  const extractedIntent = rawAnalysis.extracted_intent;
  const predictedDisease = rawAnalysis.predicted_disease;

  if (!extractedIntent || typeof extractedIntent !== "object" || Array.isArray(extractedIntent)) {
    issues.push("extracted_intent must be an object.");
  }

  if (!Array.isArray(extractedIntent?.symptoms)) {
    issues.push("extracted_intent.symptoms must be an array of strings.");
  }

  if (typeof extractedIntent?.recommended_department !== "string") {
    issues.push("extracted_intent.recommended_department must be a string.");
  }

  if (!Number.isFinite(Number(extractedIntent?.confidence_score))) {
    issues.push("extracted_intent.confidence_score must be numeric.");
  }

  if (!Array.isArray(predictedDisease)) {
    issues.push("predicted_disease must be an array of objects.");
  }

  const diseaseShapeValid = Array.isArray(predictedDisease) && predictedDisease.every(
    (item) =>
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.disease === "string" &&
      Number.isFinite(Number(item.probability_percentage))
  );

  if (!diseaseShapeValid) {
    issues.push("Each predicted_disease item must include disease and probability_percentage.");
  }

  if (typeof rawAnalysis.ai_recommendation !== "string") {
    issues.push("ai_recommendation must be a string.");
  }

  if (!PRIORITY_LEVELS.has(normalizeString(rawAnalysis.priority))) {
    issues.push("priority must be one of High, Medium, Low.");
  }

  if (
    typeof extractedIntent?.recommended_department === "string" &&
    !normalizeDepartment(extractedIntent.recommended_department, allowedDepartments)
  ) {
    issues.push("extracted_intent.recommended_department must match an allowed department exactly or closely.");
  }

  return issues;
};

const coercePredictedDisease = (rawAnalysis) => {
  if (Array.isArray(rawAnalysis?.predicted_disease)) {
    return rawAnalysis.predicted_disease;
  }

  if (typeof rawAnalysis?.predicted_disease === "string") {
    return rawAnalysis.predicted_disease
      .split(/[;]|\bor\b/gi)
      .map((item) => normalizeString(item))
      .filter(Boolean)
      .slice(0, 3)
      .map((disease, index) => ({
        disease,
        probability_percentage: index === 0 ? 60 : 30,
      }));
  }

  return [];
};

const normalizeAnalysisResult = (rawAnalysis, allowedDepartments) => {
  const extractedIntent =
    rawAnalysis?.extracted_intent &&
    typeof rawAnalysis.extracted_intent === "object" &&
    !Array.isArray(rawAnalysis.extracted_intent)
      ? rawAnalysis.extracted_intent
      : {};
  const extractedIntentText =
    typeof rawAnalysis?.extracted_intent === "string"
      ? rawAnalysis.extracted_intent
      : "";
  const predictedDisease = coercePredictedDisease(rawAnalysis);
  const symptoms = Array.isArray(extractedIntent?.symptoms)
    ? extractedIntent.symptoms
        .map((symptom) => normalizeString(symptom))
        .filter(Boolean)
    : extractSymptomsFromText(extractedIntentText || rawAnalysis?.ai_recommendation)
      .filter(Boolean);
  const recommendedDepartment = normalizeDepartment(
    extractedIntent?.recommended_department ||
      rawAnalysis?.recommended_department ||
      rawAnalysis?.department ||
      rawAnalysis?.suggested_department ||
      rawAnalysis?.ai_recommendation,
    allowedDepartments
  );
  const priority = normalizeString(rawAnalysis?.priority);

  return {
    extracted_intent: {
      symptoms,
      recommended_department: recommendedDepartment,
      confidence_score: clampPercentage(extractedIntent?.confidence_score, symptoms.length > 0 ? 65 : 0),
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

const buildFallbackAnalysis = ({ transcript, allowedDepartments, rawContent = "", partialAnalysis = null }) => {
  const safePartialAnalysis =
    partialAnalysis && typeof partialAnalysis === "object" && !Array.isArray(partialAnalysis)
      ? partialAnalysis
      : {};
  const transcriptSymptoms = extractSymptomsFromText(transcript);
  const contentForInference = `${rawContent} ${transcript}`;
  const fallbackAnalysis = normalizeAnalysisResult(
    {
      ...safePartialAnalysis,
      extracted_intent:
        safePartialAnalysis.extracted_intent &&
        typeof safePartialAnalysis.extracted_intent === "object" &&
        !Array.isArray(safePartialAnalysis.extracted_intent)
          ? safePartialAnalysis.extracted_intent
          : {
              symptoms: transcriptSymptoms,
              recommended_department:
                safePartialAnalysis.recommended_department ||
                safePartialAnalysis.department ||
                safePartialAnalysis.suggested_department ||
                "",
              confidence_score: transcriptSymptoms.length > 0 ? 45 : 0,
            },
      predicted_disease: safePartialAnalysis.predicted_disease || [],
      ai_recommendation:
        normalizeString(safePartialAnalysis.ai_recommendation) ||
        normalizeString(rawContent),
      priority:
        normalizeString(safePartialAnalysis.priority) || inferPriorityFromText(contentForInference),
    },
    allowedDepartments
  );

  return {
    ...fallbackAnalysis,
    ai_recommendation:
      fallbackAnalysis.ai_recommendation &&
      fallbackAnalysis.ai_recommendation.startsWith("{")
        ? ""
        : fallbackAnalysis.ai_recommendation,
  };
};

export async function callFlexAI(message, options = {}) {
  return callFlexAIWithMessages([{ role: "user", content: message }], options);
}

export async function callFlexAIWithMessages(messages, options = {}) {
  const body = {
    messages,
    model: "qwen2.5",
    max_tokens: 508,
    temperature: 0.1,
    top_p: 0.9,
    ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
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

const repairAnalysisJson = async (rawContent, allowedDepartments, issues = []) => {
  const repairMessages = [
    {
      role: "system",
      content:
        "You repair malformed or schema-incompatible JSON. Return only valid JSON with no markdown, no explanation, and no extra text.",
    },
    {
      role: "user",
      content: `Convert the following content into valid JSON using this exact schema and nothing else:
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

Allowed departments:
${JSON.stringify(allowedDepartments, null, 2)}

Schema issues to fix:
${issues.length > 0 ? JSON.stringify(issues, null, 2) : "[]"}

Preserve only these fields: extracted_intent, predicted_disease, ai_recommendation, priority.
Do not add any new fields.
Ensure extracted_intent is an object, not a string.
Ensure predicted_disease is an array of objects, not a string.

Content to repair:
${rawContent}`,
    },
  ];

  const repairedResponse = await callFlexAIWithMessages(repairMessages, {
    responseFormat: JSON_RESPONSE_FORMAT,
  });
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

  const messages = buildAnalysisMessages({
    transcript,
    patient,
    allowedDepartments,
  });
  const responseJson = await callFlexAIWithMessages(messages, {
    responseFormat: JSON_RESPONSE_FORMAT,
  });
  const responseContent = getMessageContent(responseJson);

  if (!responseContent) {
    throw new Error("Flex AI returned an empty response.");
  }

  let parsedAnalysis = parseAnalysisResponse(responseContent);
  let repairedContent = "";
  let schemaIssues = parsedAnalysis
    ? getAnalysisSchemaIssues(parsedAnalysis, allowedDepartments)
    : ["Initial response was not parseable JSON."];

  if (!parsedAnalysis || schemaIssues.length > 0) {
    repairedContent = await repairAnalysisJson(
      parsedAnalysis ? JSON.stringify(parsedAnalysis, null, 2) : responseContent,
      allowedDepartments,
      schemaIssues
    );
    parsedAnalysis = parseAnalysisResponse(repairedContent);
    schemaIssues = parsedAnalysis
      ? getAnalysisSchemaIssues(parsedAnalysis, allowedDepartments)
      : ["Repair response was not parseable JSON."];
  }

  if (parsedAnalysis && schemaIssues.length > 0) {
    repairedContent = await repairAnalysisJson(
      JSON.stringify(parsedAnalysis, null, 2),
      allowedDepartments,
      schemaIssues
    );
    parsedAnalysis = parseAnalysisResponse(repairedContent);
    schemaIssues = parsedAnalysis
      ? getAnalysisSchemaIssues(parsedAnalysis, allowedDepartments)
      : ["Second repair response was not parseable JSON."];
  }

  const fallbackUsed = !parsedAnalysis || schemaIssues.length > 0;
  const normalizedAnalysis = fallbackUsed
    ? buildFallbackAnalysis({
        transcript,
        allowedDepartments,
        rawContent: repairedContent || responseContent,
        partialAnalysis: parsedAnalysis,
      })
    : normalizeAnalysisResult(parsedAnalysis, allowedDepartments);

  return {
    analysis: normalizedAnalysis,
    rawResponseContent: responseContent,
    repairedResponseContent: repairedContent,
    schemaIssues,
    fallbackUsed,
  };
}