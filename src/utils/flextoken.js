// src/utils/flextoken.js
const getEnvValue = (keys) => {
  for (const key of keys) {
    const value = process.env?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const withBearerPrefix = (token) => {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    return "";
  }

  return /^Bearer\s+/i.test(normalizedToken)
    ? normalizedToken
    : `Bearer ${normalizedToken}`;
};

const FLEX_URL = getEnvValue([
  "REACT_APP_API_URL",
  "REACT_APP_FLEX_API_URL",
]);

const FLEX_TOKEN = withBearerPrefix(
  getEnvValue([
    "REACT_APP_API_KEY",
    "REACT_APP_FLEX_API_KEY",
    "REACT_APP_FLEX_TOKEN",
  ])
);
const JSON_RESPONSE_FORMAT = { type: "json_object" };

const PRIORITY_LEVELS = new Set(["High", "Medium", "Low"]);
const CLINICAL_HINT_PATTERN = /pain|ache|fever|cough|eye|vision|blood pressure|headache|nausea|vomit|swelling|dizzy|rash|infection|injury|chest|breath|diabetes|hypertension/i;
const TOKEN_STOP_WORDS = new Set(["patient", "complains", "complain", "reports", "report", "with", "for", "and", "the", "also", "mild", "slightly", "experiencing"]);
const CLINICAL_ROUTE_HINTS = [
  {
    departmentKeywords: ["ophthalmology", "eye", "vision", "visual"],
    serviceKeywords: ["eye", "vision", "red eye", "blurry vision", "blurred vision", "glaucoma", "conjunctivitis"],
    symptomKeywords: ["red eye", "blurry vision", "blurred vision", "eye pain", "vision loss", "itchy eye"],
  },
  {
    departmentKeywords: ["cardiology", "heart", "cardiac", "bp", "pressure"],
    serviceKeywords: ["blood pressure", "ecg", "cardio", "hypertension", "heart", "chest"],
    symptomKeywords: ["blood pressure", "chest pain", "palpitation", "hypertension", "shortness of breath"],
  },
  {
    departmentKeywords: ["general medicine", "internal medicine", "medicine", "medical"],
    serviceKeywords: ["assessment", "screening", "general", "consultation", "medical"],
    symptomKeywords: ["headache", "fever", "fatigue", "dizziness", "persistent"],
  },
  {
    departmentKeywords: ["emergency", "trauma", "urgent"],
    serviceKeywords: ["emergency", "triage", "urgent", "acute"],
    symptomKeywords: ["severe", "unconscious", "vision loss", "acute", "emergency"],
  },
];
const DISEASE_HINTS = [
  {
    disease: "Conjunctivitis",
    symptomKeywords: ["red eye", "itchy eye", "eye discharge", "conjunctivitis"],
    probability: 68,
  },
  {
    disease: "Acute Glaucoma",
    symptomKeywords: ["blurry vision", "blurred vision", "eye pain", "vision loss", "glaucoma"],
    probability: 57,
  },
  {
    disease: "Hypertension",
    symptomKeywords: ["blood pressure", "hypertension", "pressure", "headache"],
    probability: 63,
  },
  {
    disease: "Migraine or Tension Headache",
    symptomKeywords: ["headache", "dizzy", "nausea"],
    probability: 51,
  },
  {
    disease: "Non-specific Medical Complaint",
    symptomKeywords: ["pain", "fever", "fatigue", "persistent"],
    probability: 40,
  },
];

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
  } catch {
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

const tokenizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item.length > 2 && !TOKEN_STOP_WORDS.has(item));

const countPhraseMatches = (text, phrases) => {
  const loweredText = normalizeString(text).toLowerCase();
  return phrases.reduce((total, phrase) => {
    const normalizedPhrase = normalizeString(phrase).toLowerCase();
    return normalizedPhrase && loweredText.includes(normalizedPhrase) ? total + 1 : total;
  }, 0);
};

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

const buildServicesByDepartment = (allowedServices) => {
  return (Array.isArray(allowedServices) ? allowedServices : []).reduce((accumulator, service) => {
    const departmentName = normalizeString(service?.departmentName);
    if (!departmentName) {
      return accumulator;
    }

    if (!accumulator[departmentName]) {
      accumulator[departmentName] = [];
    }

    accumulator[departmentName].push({
      serviceName: normalizeString(service?.serviceName),
      serviceCode: normalizeString(service?.serviceCode),
    });

    return accumulator;
  }, {});
};

const findBestServiceMatch = ({ departmentName, serviceName, serviceCode, allowedDepartments, allowedServices }) => {
  const normalizedDepartment = normalizeDepartment(departmentName, allowedDepartments);
  const scopedServices = allowedServices.filter((service) => {
    if (!normalizedDepartment) {
      return true;
    }

    return normalizeString(service.departmentName).toLowerCase() === normalizedDepartment.toLowerCase();
  });

  const normalizedServiceCode = normalizeString(serviceCode).toLowerCase();
  if (normalizedServiceCode) {
    const exactCodeMatch = scopedServices.find(
      (service) => normalizeString(service.serviceCode).toLowerCase() === normalizedServiceCode
    );
    if (exactCodeMatch) {
      return exactCodeMatch;
    }
  }

  const normalizedServiceName = normalizeString(serviceName).toLowerCase();
  if (normalizedServiceName) {
    const exactNameMatch = scopedServices.find(
      (service) => normalizeString(service.serviceName).toLowerCase() === normalizedServiceName
    );
    if (exactNameMatch) {
      return exactNameMatch;
    }

    const partialNameMatch = scopedServices.find((service) => {
      const currentServiceName = normalizeString(service.serviceName).toLowerCase();
      return currentServiceName.includes(normalizedServiceName) || normalizedServiceName.includes(currentServiceName);
    });
    if (partialNameMatch) {
      return partialNameMatch;
    }
  }

  return null;
};

const rankServicesFromTranscript = ({ transcript, allowedServices }) => {
  const transcriptTokens = tokenizeText(transcript);
  if (transcriptTokens.length === 0) {
    return [];
  }

  const loweredTranscript = normalizeString(transcript).toLowerCase();

  return allowedServices
    .map((service) => {
      const searchable = `${service.departmentName || ""} ${service.serviceName || ""}`.toLowerCase();
      const tokenScore = transcriptTokens.reduce((total, token) => total + (searchable.includes(token) ? 1 : 0), 0);
      const matchingHint = CLINICAL_ROUTE_HINTS.find((hint) =>
        searchable.includes(hint.departmentKeywords[0]) ||
        hint.departmentKeywords.some((keyword) => searchable.includes(keyword))
      );
      const servicePhraseScore = matchingHint
        ? countPhraseMatches(loweredTranscript, [...matchingHint.serviceKeywords, ...matchingHint.symptomKeywords])
        : 0;
      const departmentPhraseScore = matchingHint
        ? countPhraseMatches(loweredTranscript, matchingHint.departmentKeywords)
        : 0;
      const score = tokenScore + (servicePhraseScore * 3) + (departmentPhraseScore * 2);

      return {
        ...service,
        score,
      };
    })
    .filter((service) => service.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
};

const buildFallbackRecommendationText = ({ transcript, recommendations, symptoms, isIrrelevantTranscript }) => {
  if (isIrrelevantTranscript) {
    return "This transcript does not appear to be relevant clinical data.";
  }

  const topRecommendation = recommendations[0];
  const symptomSummary = symptoms.length > 0 ? symptoms.join(", ") : normalizeString(transcript).slice(0, 120);

  if (!topRecommendation) {
    return "Clinical symptoms were detected, but no strong service match was found from the active service list. Review manually before routing.";
  }

  const serviceDetail = topRecommendation.service_name
    ? `${topRecommendation.department} via ${topRecommendation.service_name}`
    : topRecommendation.department;

  return `Fallback routing suggests ${serviceDetail} based on transcript findings${symptomSummary ? `: ${symptomSummary}` : ""}. Review before final confirmation.`;
};

const inferPredictedDiseases = ({ transcript, symptoms, isIrrelevantTranscript }) => {
  const searchableText = `${normalizeString(transcript)} ${symptoms.join(" ")}`.toLowerCase();

  if (isIrrelevantTranscript) {
    return [{
      disease: "Unclear or Non-clinical Condition",
      probability_percentage: 100,
    }];
  }

  const inferredDiseases = DISEASE_HINTS
    .map((hint) => ({
      disease: hint.disease,
      matchCount: countPhraseMatches(searchableText, hint.symptomKeywords),
      probability_percentage: hint.probability,
    }))
    .filter((hint) => hint.matchCount > 0)
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return right.probability_percentage - left.probability_percentage;
    })
    .slice(0, 3)
    .map(({ disease, probability_percentage }) => ({
      disease,
      probability_percentage,
    }));

  if (inferredDiseases.length > 0) {
    return inferredDiseases;
  }

  return [{
    disease: "General Clinical Review Required",
    probability_percentage: symptoms.length > 0 ? 55 : 35,
  }];
};

const buildGuaranteedRecommendation = ({ transcript, recommendations, symptoms, predictedDiseases, isIrrelevant }) => {
  if (isIrrelevant) {
    return "This transcript does not appear to contain relevant clinical data. Manual review is recommended before routing.";
  }

  const topRecommendation = recommendations[0];
  const topDisease = predictedDiseases[0];
  const symptomSummary = symptoms.length > 0 ? symptoms.join(", ") : normalizeString(transcript).slice(0, 120);

  if (topRecommendation) {
    const routeSummary = topRecommendation.service_name
      ? `${topRecommendation.department} via ${topRecommendation.service_name}`
      : topRecommendation.department;
    return `Suggested next step: route the patient to ${routeSummary}${topDisease ? ` for assessment of possible ${topDisease.disease.toLowerCase()}` : ""}${symptomSummary ? ` based on symptoms including ${symptomSummary}` : ""}.`;
  }

  if (topDisease) {
    return `Suggested next step: perform clinical review for possible ${topDisease.disease.toLowerCase()}${symptomSummary ? ` with symptoms including ${symptomSummary}` : ""}.`;
  }

  return "Suggested next step: manual clinical review is recommended because the transcript did not contain enough structured detail for confident routing.";
};

const buildAnalysisMessages = ({ transcript, patient, allowedDepartments, allowedServices }) => {
  const safePatient = {
    age: patient?.age ?? null,
    sex: patient?.sex ?? "",
    medical_history: patient?.medical_history ?? "",
    allergies: patient?.allergies ?? "",
    family_history: patient?.family_history ?? "",
  };
  const servicesByDepartment = buildServicesByDepartment(allowedServices);

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
- extracted_intent.recommendations must be an array and can contain more than one recommendation.
- each extracted_intent.recommendations item must map to an allowed department.
- if a service is provided, it must map to the allowed services for that department.
- extracted_intent.confidence_score must be a number from 0 to 100.
- predicted_disease must always be an array of objects.
- Each predicted_disease item must contain disease and probability_percentage.
- probability_percentage must be a number from 0 to 100.
- ai_recommendation must be a short plain-text summary.
- if the transcript is irrelevant or not clinical, ai_recommendation must clearly say the transcript is not relevant medical data.
- priority must be exactly one of: High, Medium, Low.

Allowed departments:
${JSON.stringify(allowedDepartments, null, 2)}

Allowed active services by department:
${JSON.stringify(servicesByDepartment, null, 2)}

Required JSON schema:
{
  "extracted_intent": {
    "symptoms": ["string"],
    "recommendations": [
      {
        "department": "string",
        "service_name": "string",
        "service_code": "string",
        "confidence_score": 0
      }
    ],
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
    "recommendations": [
      {
        "department": "Ophthalmology",
        "service_name": "Eye Examination",
        "service_code": "OPH-EXAM",
        "confidence_score": 84
      },
      {
        "department": "General Medicine",
        "service_name": "Blood Pressure Assessment",
        "service_code": "GM-BP",
        "confidence_score": 61
      }
    ],
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

  if (!Array.isArray(extractedIntent?.recommendations)) {
    issues.push("extracted_intent.recommendations must be an array.");
  }

  const recommendationsShapeValid = Array.isArray(extractedIntent?.recommendations) && extractedIntent.recommendations.every(
    (item) => item && typeof item === "object" && !Array.isArray(item) && typeof item.department === "string"
  );

  if (!recommendationsShapeValid) {
    issues.push("Each extracted_intent.recommendations item must include department and optional service mapping.");
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

  const hasInvalidDepartmentRecommendation = Array.isArray(extractedIntent?.recommendations) && extractedIntent.recommendations.some(
    (item) => !normalizeDepartment(item?.department, allowedDepartments)
  );

  if (hasInvalidDepartmentRecommendation) {
    issues.push("Each recommended department must match an allowed department exactly or closely.");
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

const normalizeRecommendations = (rawAnalysis, allowedDepartments, allowedServices) => {
  const extractedIntent = rawAnalysis?.extracted_intent;
  const rawRecommendations = Array.isArray(extractedIntent?.recommendations)
    ? extractedIntent.recommendations
    : normalizeString(extractedIntent?.recommended_department || rawAnalysis?.recommended_department)
      ? [{
          department: extractedIntent?.recommended_department || rawAnalysis?.recommended_department,
          service_name: rawAnalysis?.service_name || "",
          service_code: rawAnalysis?.service_code || "",
          confidence_score: extractedIntent?.confidence_score || 0,
        }]
      : [];

  const normalizedRecommendations = rawRecommendations
    .map((recommendation) => {
      const normalizedDepartment = normalizeDepartment(recommendation?.department, allowedDepartments);
      if (!normalizedDepartment) {
        return null;
      }

      const matchedService = findBestServiceMatch({
        departmentName: normalizedDepartment,
        serviceName: recommendation?.service_name,
        serviceCode: recommendation?.service_code,
        allowedDepartments,
        allowedServices,
      });

      return {
        department: normalizedDepartment,
        service_name: normalizeString(matchedService?.serviceName || recommendation?.service_name),
        service_code: normalizeString(matchedService?.serviceCode || recommendation?.service_code),
        confidence_score: clampPercentage(recommendation?.confidence_score, 0),
      };
    })
    .filter(Boolean);

  const seenRecommendations = new Set();
  return normalizedRecommendations.filter((recommendation) => {
    const key = `${recommendation.department}::${recommendation.service_code || recommendation.service_name}`.toLowerCase();
    if (seenRecommendations.has(key)) {
      return false;
    }

    seenRecommendations.add(key);
    return true;
  });
};

const normalizeAnalysisResult = (rawAnalysis, allowedDepartments, allowedServices = [], transcript = "") => {
  const extractedIntent =
    rawAnalysis?.extracted_intent &&
    typeof rawAnalysis.extracted_intent === "object" &&
    !Array.isArray(rawAnalysis.extracted_intent)
      ? rawAnalysis.extracted_intent
      : {};
  const extractedIntentText = typeof rawAnalysis?.extracted_intent === "string" ? rawAnalysis.extracted_intent : "";
  const predictedDisease = coercePredictedDisease(rawAnalysis);
  const recommendations = normalizeRecommendations(rawAnalysis, allowedDepartments, allowedServices);
  const symptoms = Array.isArray(extractedIntent?.symptoms)
    ? extractedIntent.symptoms.map((symptom) => normalizeString(symptom)).filter(Boolean)
    : extractSymptomsFromText(extractedIntentText || rawAnalysis?.ai_recommendation).filter(Boolean);
  const normalizedPredictedDiseases = predictedDisease
    .map((item) => ({
      disease: normalizeString(item?.disease),
      probability_percentage: clampPercentage(item?.probability_percentage),
    }))
    .filter((item) => item.disease);
  const priority = normalizeString(rawAnalysis?.priority);
  const normalizedRecommendationText = normalizeString(rawAnalysis?.ai_recommendation);
  const isIrrelevant = !CLINICAL_HINT_PATTERN.test(`${transcript} ${normalizedRecommendationText}`) && symptoms.length === 0 && recommendations.length === 0 && predictedDisease.length === 0;
  const guaranteedPredictedDiseases = normalizedPredictedDiseases.length > 0
    ? normalizedPredictedDiseases
    : inferPredictedDiseases({
        transcript,
        symptoms,
        isIrrelevantTranscript: isIrrelevant,
      });
  const guaranteedRecommendation = normalizedRecommendationText || buildGuaranteedRecommendation({
    transcript,
    recommendations,
    symptoms,
    predictedDiseases: guaranteedPredictedDiseases,
    isIrrelevant,
  });

  return {
    extracted_intent: {
      symptoms,
      recommendations,
      confidence_score: clampPercentage(extractedIntent?.confidence_score, symptoms.length > 0 ? 65 : 0),
    },
    predicted_disease: guaranteedPredictedDiseases,
    ai_recommendation: guaranteedRecommendation,
    priority: PRIORITY_LEVELS.has(priority) ? priority : inferPriorityFromText(`${transcript} ${normalizedRecommendationText}`),
    is_irrelevant: isIrrelevant,
  };
};

const buildFallbackAnalysis = ({ transcript, allowedDepartments, allowedServices, rawContent = "", partialAnalysis = null }) => {
  const safePartialAnalysis =
    partialAnalysis && typeof partialAnalysis === "object" && !Array.isArray(partialAnalysis)
      ? partialAnalysis
      : {};
  const transcriptSymptoms = extractSymptomsFromText(transcript);
  const rankedServices = rankServicesFromTranscript({ transcript, allowedServices });
  const fallbackRecommendations = rankedServices.map((service, index) => ({
    department: normalizeString(service.departmentName),
    service_name: normalizeString(service.serviceName),
    service_code: normalizeString(service.serviceCode),
    confidence_score: clampPercentage(Math.max(45, 78 - (index * 12) + Math.min(service.score || 0, 12)), 45),
  }));
  const isIrrelevantTranscript = !CLINICAL_HINT_PATTERN.test(transcript) && transcriptSymptoms.length === 0 && fallbackRecommendations.length === 0;

  const fallbackAnalysis = normalizeAnalysisResult(
    {
      ...safePartialAnalysis,
      extracted_intent:
        safePartialAnalysis.extracted_intent &&
        typeof safePartialAnalysis.extracted_intent === "object" &&
        !Array.isArray(safePartialAnalysis.extracted_intent)
          ? {
              ...safePartialAnalysis.extracted_intent,
              recommendations: Array.isArray(safePartialAnalysis.extracted_intent.recommendations)
                ? safePartialAnalysis.extracted_intent.recommendations
                : fallbackRecommendations,
            }
          : {
              symptoms: transcriptSymptoms,
              recommendations: fallbackRecommendations,
              confidence_score: transcriptSymptoms.length > 0 ? 45 : 0,
            },
      predicted_disease: safePartialAnalysis.predicted_disease || [],
      ai_recommendation:
        normalizeString(safePartialAnalysis.ai_recommendation) ||
        buildFallbackRecommendationText({
          transcript,
          recommendations: fallbackRecommendations,
          symptoms: transcriptSymptoms,
          isIrrelevantTranscript,
        }) ||
        normalizeString(rawContent),
      priority: normalizeString(safePartialAnalysis.priority) || inferPriorityFromText(`${rawContent} ${transcript}`),
    },
    allowedDepartments,
    allowedServices,
    transcript
  );

  return {
    ...fallbackAnalysis,
    ai_recommendation:
      fallbackAnalysis.ai_recommendation && fallbackAnalysis.ai_recommendation.startsWith("{")
        ? ""
        : fallbackAnalysis.ai_recommendation,
  };
};

export async function callFlexAI(message, options = {}) {
  return callFlexAIWithMessages([{ role: "user", content: message }], options);
}

export async function callFlexAIWithMessages(messages, options = {}) {
  if (!FLEX_URL || !FLEX_TOKEN) {
    throw new Error(
      "Flex API configuration is missing. Set REACT_APP_API_URL and REACT_APP_API_KEY in .env.local, then restart npm start."
    );
  }

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

const repairAnalysisJson = async (rawContent, allowedDepartments, allowedServices, issues = []) => {
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
    "recommendations": [
      {
        "department": "string",
        "service_name": "string",
        "service_code": "string",
        "confidence_score": 0
      }
    ],
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

Allowed services:
${JSON.stringify(buildServicesByDepartment(allowedServices), null, 2)}

Schema issues to fix:
${issues.length > 0 ? JSON.stringify(issues, null, 2) : "[]"}

Preserve only these fields: extracted_intent, predicted_disease, ai_recommendation, priority.
Do not add any new fields.
Ensure extracted_intent is an object.
Ensure extracted_intent.recommendations is an array.
Ensure predicted_disease is an array of objects.

Content to repair:
${rawContent}`,
    },
  ];

  const repairedResponse = await callFlexAIWithMessages(repairMessages, {
    responseFormat: JSON_RESPONSE_FORMAT,
  });
  return getMessageContent(repairedResponse);
};

export async function analyzeConsultationTranscript({ transcript, patient, allowedDepartments, allowedServices = [] }) {
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
    allowedServices,
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
      allowedServices,
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
      allowedServices,
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
        allowedServices,
        rawContent: repairedContent || responseContent,
        partialAnalysis: parsedAnalysis,
      })
    : normalizeAnalysisResult(parsedAnalysis, allowedDepartments, allowedServices, transcript);

  return {
    analysis: normalizedAnalysis,
    rawResponseContent: responseContent,
    repairedResponseContent: repairedContent,
    schemaIssues,
    fallbackUsed,
  };
}