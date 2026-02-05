import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Question, QuestionType, QuizGenerationParams, Blueprint } from "../types";

// --- API KEY STATS INTERFACE ---
export interface KeyStats {
  keyMask: string;
  usageCount: number;
  errorCount: number;
  lastUsed: number | null;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'ERROR';
  lastErrorTime: number | null;
}

// In-memory store for stats (resets on page refresh)
const keyUsageStore: Record<string, KeyStats> = {};

// Helper to parse keys from env (comma separated)
const getApiKeys = (): string[] => {
  const envKey = process.env.API_KEY;
  if (!envKey) return [];
  // Support comma separated keys for rotation: "key1,key2,key3"
  return envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

// Initialize stats store if empty
const initStats = () => {
  const keys = getApiKeys();
  keys.forEach(k => {
    if (!keyUsageStore[k]) {
      keyUsageStore[k] = {
        keyMask: `...${k.slice(-6)}`,
        usageCount: 0,
        errorCount: 0,
        lastUsed: null,
        status: 'ACTIVE',
        lastErrorTime: null
      };
    }
  });
};

// Export stats for Dashboard UI
export const getApiKeyStats = (): KeyStats[] => {
  initStats();
  return Object.values(keyUsageStore);
};

// Helper to execute AI calls with rotation mechanism
// If a key hits 429 (Rate Limit) or 503 (Overloaded), it automatically tries the next one.
const executeWithRotation = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("API_KEY not found in environment variables");
  }

  // CRITICAL: Ensure stats are initialized before accessing
  initStats();

  let lastError: any;

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const stats = keyUsageStore[apiKey];
    
    // SKIP LOGIC: Skip key if it was rate limited recently (within last 60 seconds)
    // UNLESS it's the last key available or we are in a desperate retry loop
    if (stats && stats.status === 'RATE_LIMITED' && stats.lastErrorTime && (Date.now() - stats.lastErrorTime < 60000)) {
        // If this is the last key in the list and we haven't found a success yet,
        // we might as well try it instead of failing immediately, OR if we have only 1 key.
        const isLastResort = i === keys.length - 1;
        
        if (!isLastResort) {
             console.warn(`Skipping limited key ${stats.keyMask} (Cooldown active)`);
             continue; 
        } else {
             console.warn(`All keys limited. Forcing retry on last key: ${stats.keyMask}`);
        }
    }

    try {
      // Create a fresh client for this specific key
      const ai = new GoogleGenAI({ apiKey });
      
      const result = await operation(ai);
      
      // Update Stats: Success
      if (keyUsageStore[apiKey]) {
          keyUsageStore[apiKey].usageCount++;
          keyUsageStore[apiKey].lastUsed = Date.now();
          keyUsageStore[apiKey].status = 'ACTIVE'; 
          keyUsageStore[apiKey].errorCount = 0; // Optional: Reset consecutive errors on success
      }

      return result;

    } catch (error: any) {
      lastError = error;
      
      // Check if error is related to Rate Limit (429), Quota, or Server Overload (503)
      const isRateLimit = 
        error.status === 429 || 
        error.status === 503 ||
        error.message?.includes('429') || 
        error.message?.includes('503') ||
        error.message?.includes('quota') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('Resource has been exhausted');

      if (isRateLimit) {
        // Update Stats: Rate Limited
        if (keyUsageStore[apiKey]) {
            keyUsageStore[apiKey].errorCount++;
            keyUsageStore[apiKey].status = 'RATE_LIMITED';
            keyUsageStore[apiKey].lastErrorTime = Date.now();
        }

        console.warn(`Key ...${apiKey.slice(-4)} exhausted (Status: ${error.status || 'Limit'}). Rotating...`);

        // If it's the last key, and we failed, throw the error
        if (i === keys.length - 1) {
          console.error(`All ${keys.length} API Keys exhausted.`);
          throw new Error("Server sibuk atau limit tercapai pada semua API Key. Silakan coba sesaat lagi.");
        }
        
        // Add a tiny delay before switching to prevent rapid-fire banning
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      
      // Update Stats: General Error (Logic error, invalid prompt, etc)
      if (keyUsageStore[apiKey]) {
          keyUsageStore[apiKey].errorCount++;
          keyUsageStore[apiKey].status = 'ERROR';
          keyUsageStore[apiKey].lastErrorTime = Date.now();
      }

      // If it's not a connection/limit error, throw immediately (don't rotate for bad prompts)
      throw error;
    }
  }

  throw lastError || new Error("Unknown error in API rotation");
};

// --- SYSTEM HEALTH CHECK ---
export const validateGeminiConnection = async (): Promise<{success: boolean, message: string, latency: number, keyCount: number}> => {
  const startTime = Date.now();
  const keys = getApiKeys();
  
  if (keys.length === 0) {
    return { success: false, message: "API_KEY not found in environment variables", latency: 0, keyCount: 0 };
  }

  try {
    // Try to ping with the first key just to check connectivity
    // We use executeWithRotation here too to ensure we use a valid key
    await executeWithRotation(async (ai) => {
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: "Ping" }] },
        });
    });

    const duration = Date.now() - startTime;
    return { 
      success: true, 
      message: `Active & Responding (Pool: ${keys.length} Keys)`, 
      latency: duration, 
      keyCount: keys.length 
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Connection failed", latency: 0, keyCount: keys.length };
  }
};

// --- PROMPT ENGINEERING HELPERS ---

const getSubjectInstruction = (subject: string, category: string): string => {
  const base = `Subject: ${subject} (${category}).`;
  
  if (['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Matematika Peminatan', 'Matematika Terapan', 'IPAS'].includes(subject)) {
    return `${base} CRITICAL LATEX RULES: 
    1. ALWAYS use INLINE format with single '$' delimiters (e.g. "Calculate $E=mc^2$"). 
    2. NEVER use block delimiters like '$$', '\\[' or '\\begin{equation}'. 
    3. NEVER insert line breaks (\\n) before or after equations; they must flow naturally within the sentence.
    4. Use '\\text{...}' for text inside equations.
    5. Simplify fractions where possible to keep vertical height small.`;
  }
  if (subject === 'Bahasa Arab') {
    return `${base} CRITICAL: Content must be in Arabic script (Amiri font compatible). Use correct Tashkeel/Harakat where necessary for clarity. Ensure Right-to-Left (RTL) context logic.`;
  }
  if (subject === 'Bahasa Jepang') {
    return `${base} CRITICAL: Use appropriate Kanji, Hiragana, and Katakana. Context: Noto Sans JP.`;
  }
  if (subject === 'Bahasa Korea') {
    return `${base} CRITICAL: Use Hangul with correct spacing and honorifics. Context: Noto Serif KR.`;
  }
  if (subject === 'Bahasa Mandarin') {
    return `${base} CRITICAL: Use Traditional Characters (繁體中文). Context: Noto Sans TC.`;
  }
  if (subject === 'Pendidikan Agama Islam dan Budi Pekerti') {
     return `${base} Include relevant Dalil (Quran/Hadith) in explanations where applicable.`;
  }
  
  return base;
};

// Helper to clean LaTeX and force inline
const sanitizeLatex = (text: string): string => {
  if (!text) return "";
  
  let clean = text;
  
  // 1. Replace Block delimiters $$...$$ with $...$
  clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, '$$$1$$');
  
  // 2. Replace \[...\] with $...$
  clean = clean.replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$');
  
  // 3. Remove \displaystyle which forces large vertical spacing
  clean = clean.replace(/\\displaystyle/g, '');
  
  // 4. Remove equation environments
  clean = clean.replace(/\\begin\{equation\}/g, '$').replace(/\\end\{equation\}/g, '$');
  clean = clean.replace(/\\begin\{align\}/g, '$').replace(/\\end\{align\}/g, '$');
  
  // 5. Fix common newlines often added by AI around Math
  // This regex finds newlines surrounding $...$ and removes them
  clean = clean.replace(/\n\s*(\$)/g, ' $1').replace(/(\$)\s*\n/g, '$1 ');

  return clean;
};

export const generateQuizContent = async (
  params: QuizGenerationParams,
  factCheck: boolean = true
): Promise<{ questions: Question[], blueprint: Blueprint[] }> => {
  const textModel = 'gemini-3-flash-preview';

  // 1. Construct the System Instruction
  const subjectSpecifics = getSubjectInstruction(params.subject, params.subjectCategory);
  
  const cognitiveRange = params.cognitiveLevels.join(', ');
  const typesList = params.types.join(', ');

  // Mapping language code to full English name for prompt clarity
  const langMap: Record<string, string> = {
      'ID': 'Indonesian (Bahasa Indonesia)',
      'EN': 'English',
      'AR': 'Arabic (Bahasa Arab)',
      'JP': 'Japanese',
      'KR': 'Korean',
      'CN': 'Mandarin Chinese (Traditional)',
      'DE': 'German',
      'FR': 'French'
  };
  const targetLanguage = langMap[params.languageContext] || 'Indonesian';

  // DISTRIBUTION LOGIC: 
  // If multiple types are selected, strictly instruct the AI to mix them.
  let distributionInstruction = "";
  if (params.types.length > 1) {
      distributionInstruction = `
      CRITICAL DISTRIBUTION RULE:
      The user has selected multiple question types: [${typesList}].
      You MUST distribute the ${params.questionCount} questions approximately evenly among these selected types.
      
      Example: If 10 questions are requested and types are [MULTIPLE_CHOICE, ESSAY], you MUST generate 5 Multiple Choice and 5 Essay questions.
      Group questions of the same type together (e.g., all Multiple Choice first, then all Essays).
      `;
  }

  let systemInstruction = `
    You are an expert curriculum developer for the Indonesian 'Kurikulum Merdeka'.
    Your task is to generate a high-quality exam quiz based on the provided parameters.

    ${subjectSpecifics}
    
    Target Audience: ${params.level} - ${params.grade}
    Topic: ${params.topic}
    Sub-Topic: ${params.subTopic || 'General'}
    
    Reference Material:
    ${params.materialText ? `Use the following summary text as the PRIMARY source for questions:\n"${params.materialText.substring(0, 10000)}..."` : 'Use your general knowledge base aligned with the curriculum.'}

    Configuration:
    - Total Questions: ${params.questionCount}
    - Difficulty: ${params.difficulty}
    - Cognitive Levels allowed: ${cognitiveRange}
    - Question Types allowed: ${typesList}
    - Multiple Choice Options: ${params.mcOptionCount} (only for MC type)
    - Image Requirements: Approximately ${params.imageQuestionCount} questions must require a visual aid. For these, provide a highly descriptive 'imagePrompt'.

    ${distributionInstruction}

    Rules:
    1. OUTPUT LANGUAGE: The entire quiz (questions, options, explanations) MUST be generated in ${targetLanguage}. 
       Exception: Specific terminology or quotes required by the subject (e.g., Quran verses in Arabic, English terms in IT) should remain in their original form, but the surrounding question text must be in ${targetLanguage}.
    2. For 'ESSAY' and 'SHORT_ANSWER', 'options' must be an empty array.
    3. For 'COMPLEX_MULTIPLE_CHOICE', 'correctAnswer' should be a string containing all correct keys (e.g., "A, C").
    4. For 'MULTIPLE_CHOICE', provide exactly ${params.mcOptionCount} options.
    5. Generate a 'Blueprint' (Kisi-kisi) for every question mapping it to a Basic Competency (KD/CP) and Indicator.
    6. FORMATTING: Ensure all text is formatted for direct rendering. Do not use markdown headers (#) or bolding (**) in the question text unless necessary. STRICTLY NO newlines inside the question stem unless it is a distinct paragraph. All math must be inline.
    7. Output JSON ONLY.
  `;

  // --- IMPROVED READING MODE LOGIC ---
  if (params.readingMode === 'grouped') {
    systemInstruction += `\n8. STIMULUS (GROUPED MODE - CRITICAL):
    - Generate ONE SINGLE, COMPREHENSIVE reading passage (wacana) containing 3-5 paragraphs (approx. 300-500 words).
    - The passage must be complex enough to support all ${params.questionCount} questions.
    - All questions must be derived from this SINGLE shared passage.
    - IMPORTANT: Copy the EXACT SAME passage text into the 'stimulus' field for EVERY question object in the JSON array. Do not generate short snippets.`;
  } else if (params.readingMode === 'simple' || params.enableReadingPassages) {
    systemInstruction += `\n8. STIMULUS (SIMPLE MODE):
    - Provide a unique, short 'stimulus' string (1 paragraph, dialogue, or case) specifically for EACH question.`;
  }

  if (factCheck) {
     systemInstruction += `\nSTRICT FACT CHECKING: Ensure all historical dates, scientific formulas, and factual statements are verified. If uncertain about a specific detail, verify logic step-by-step.`;
  }

  // 2. Define Schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The question stem. Use single '$' for inline LaTeX math. No line breaks." },
            type: { type: Type.STRING, enum: Object.values(QuestionType) },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            cognitiveLevel: { type: Type.STRING },
            stimulus: { type: Type.STRING, nullable: true, description: "Reading passage or context." },
            imagePrompt: { type: Type.STRING, nullable: true, description: "Prompt for Gemini Image gen if visual is needed." },
          },
          required: ['text', 'type', 'options', 'correctAnswer', 'explanation', 'difficulty', 'cognitiveLevel']
        }
      },
      blueprint: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            questionNumber: { type: Type.INTEGER },
            basicCompetency: { type: Type.STRING },
            indicator: { type: Type.STRING },
            cognitiveLevel: { type: Type.STRING },
            difficulty: { type: Type.STRING }
          }
        }
      }
    }
  };

  try {
    // 3. Generate Text Content WITH ROTATION
    const response = await executeWithRotation(async (ai) => {
      return await ai.models.generateContent({
        model: textModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: `Generate ${params.questionCount} questions about ${params.topic}.` },
              // If reference image exists, add it to prompt context
              ...(params.refImageBase64 ? [{
                inlineData: {
                  mimeType: "image/jpeg", // Assuming jpeg for simplicity, logic handles base64
                  data: params.refImageBase64.split(',')[1] 
                }
              }, { text: "Use this image as a reference context for the questions." }] : [])
            ]
          }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7,
          // Add Safety Settings to prevent blocking harmless educational content
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        }
      });
    });

    let text = response.text;
    
    // Safety check for empty response
    if (!text || text.trim().length === 0) {
        // Fallback: Try to retrieve from candidates if text accessor failed but data exists
        const candidate = response.candidates?.[0];
        if (candidate?.finishReason !== 'STOP') {
             throw new Error(`AI generation stopped unexpectedly. Reason: ${candidate?.finishReason || 'Unknown'}`);
        }
        throw new Error("AI returned empty response. Try reducing question count or changing topic.");
    }
    
    // Clean potential markdown wrapping if somehow the model adds it despite mimeType
    text = text.trim();
    if (text.startsWith("```json")) {
        text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (text.startsWith("```")) {
        text = text.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error. Raw Text:", text);
        throw new Error("Gagal memproses format data dari AI (Invalid JSON). Silakan coba lagi.");
    }
    
    // 4. Post-process & Sanitize Math
    const processedQuestions = parsed.questions.map((q: any, idx: number) => ({
      ...q,
      id: `gen-${Date.now()}-${idx}`,
      text: sanitizeLatex(q.text), // Sanitize Text
      explanation: sanitizeLatex(q.explanation), // Sanitize Explanation
      options: q.options ? q.options.map((opt: string) => sanitizeLatex(opt)) : [], // Sanitize Options
      stimulus: sanitizeLatex(q.stimulus), // Sanitize Stimulus
      hasImage: !!q.imagePrompt,
      hasImageInOptions: false,
      imageUrl: undefined 
    }));

    return {
      questions: processedQuestions,
      blueprint: parsed.blueprint || []
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const generateImageForQuestion = async (prompt: string): Promise<string> => {
  const imageModel = 'gemini-2.5-flash-image';

  try {
    // USE ROTATION FOR IMAGES TOO
    const response = await executeWithRotation(async (ai) => {
      return await ai.models.generateContent({
        model: imageModel,
        contents: prompt,
      });
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return generateSvgFallback(prompt);

  } catch (error) {
    console.warn("Image gen failed (rotation exhausted), using SVG fallback", error);
    return generateSvgFallback(prompt);
  }
};

const generateSvgFallback = (prompt: string): string => {
  const bg = "#fff7ed"; // brand-50
  const stroke = "#f97316"; // brand-500
  const text = prompt.length > 30 ? prompt.substring(0, 30) + "..." : prompt;
  
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bg}"/>
      <circle cx="200" cy="150" r="80" stroke="${stroke}" stroke-width="3" fill="none" opacity="0.5"/>
      <path d="M150 150 L250 150 M200 100 L200 200" stroke="${stroke}" stroke-width="3" opacity="0.5"/>
      <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#c2410c">
        ${text}
      </text>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="#ea580c">
        IMG
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};