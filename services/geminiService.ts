import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Question, QuestionType, QuizGenerationParams, Blueprint, AiProviderConfig } from "../types";
import { dbService } from "./dbService";

// --- API KEY STATS INTERFACE ---
export interface KeyStats {
  keyMask: string;
  usageCount: number;
  errorCount: number;
  lastUsed: number | null;
  status: 'ACTIVE' | 'RATE_LIMITED' | 'ERROR';
  lastErrorTime: number | null;
  source: 'SYSTEM' | 'USER'; // Track where the key comes from
}

// In-memory store for stats (resets on page refresh)
const keyUsageStore: Record<string, KeyStats> = {};

// Helper to parse keys from env (comma separated) - System Keys
const getSystemApiKeys = (): string[] => {
  const envKey = process.env.API_KEY;
  if (!envKey) return [];
  return envKey.split(',').map(k => k.trim()).filter(k => k.length > 0);
};

// Initialize stats store if empty, including custom keys if passed
const initStats = (customKeys: string[] = []) => {
  const systemKeys = getSystemApiKeys();
  const allKeys = [...new Set([...customKeys, ...systemKeys])]; // Deduplicate

  allKeys.forEach(k => {
    if (!keyUsageStore[k]) {
      keyUsageStore[k] = {
        keyMask: `...${k.slice(-6)}`,
        usageCount: 0,
        errorCount: 0,
        lastUsed: null,
        status: 'ACTIVE',
        lastErrorTime: null,
        source: systemKeys.includes(k) ? 'SYSTEM' : 'USER'
      };
    }
  });
};

// Export stats for Dashboard UI
export const getApiKeyStats = (): KeyStats[] => {
  initStats();
  return Object.values(keyUsageStore);
};

// Helper to execute AI calls with Hybrid Rotation (User -> System)
const executeWithRotation = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  userKeys: string[] = [] // Optional user custom keys
): Promise<T> => {
  
  // 1. Determine the pool of keys to use
  // Priority: User Keys -> System Keys
  // We don't merge them initially. We try user keys first, then fallback to system.
  const systemKeys = getSystemApiKeys();
  const validUserKeys = userKeys.filter(k => k && k.length > 10); // Basic validation
  
  // Initialize stats for everything
  initStats(validUserKeys);

  // Strategy: Try all user keys first. If all fail/limit, try system keys.
  const phases = [
      { name: 'USER', keys: validUserKeys },
      { name: 'SYSTEM', keys: systemKeys }
  ];

  let lastError: any;

  for (const phase of phases) {
      if (phase.keys.length === 0) continue;

      for (let i = 0; i < phase.keys.length; i++) {
        const apiKey = phase.keys[i];
        const stats = keyUsageStore[apiKey];
        
        // SKIP LOGIC: Skip key if rate limited recently (within 60s)
        if (stats && stats.status === 'RATE_LIMITED' && stats.lastErrorTime && (Date.now() - stats.lastErrorTime < 60000)) {
            // If it's the very last key in the SYSTEM phase, force retry. Otherwise skip.
            const isLastSystemKey = phase.name === 'SYSTEM' && i === phase.keys.length - 1;
            
            if (!isLastSystemKey) {
                 console.warn(`Skipping limited key ${stats.keyMask} (${stats.source})`);
                 continue; 
            }
        }

        try {
          const ai = new GoogleGenAI({ apiKey });
          const result = await operation(ai);
          
          // Update Stats: Success
          if (keyUsageStore[apiKey]) {
              keyUsageStore[apiKey].usageCount++;
              keyUsageStore[apiKey].lastUsed = Date.now();
              keyUsageStore[apiKey].status = 'ACTIVE'; 
              keyUsageStore[apiKey].errorCount = 0;
          }

          return result;

        } catch (error: any) {
          lastError = error;
          
          const isRateLimit = 
            error.status === 429 || 
            error.status === 503 ||
            error.message?.includes('429') || 
            error.message?.includes('503') ||
            error.message?.includes('quota') ||
            error.message?.includes('overloaded') ||
            error.message?.includes('Resource has been exhausted');

          if (isRateLimit) {
            // Update Stats
            if (keyUsageStore[apiKey]) {
                keyUsageStore[apiKey].errorCount++;
                keyUsageStore[apiKey].status = 'RATE_LIMITED';
                keyUsageStore[apiKey].lastErrorTime = Date.now();
            }
            console.warn(`Key ...${apiKey.slice(-4)} exhausted. Rotating...`);
            
            // Add slight delay
            await new Promise(r => setTimeout(r, 500));
            continue; // Go to next key in this phase
          }
          
          // General Error
          if (keyUsageStore[apiKey]) {
              keyUsageStore[apiKey].errorCount++;
              keyUsageStore[apiKey].status = 'ERROR';
              keyUsageStore[apiKey].lastErrorTime = Date.now();
          }
          throw error; // Don't rotate on bad prompts
        }
      }
      
      // If we finished a phase and didn't return, we loop to the next phase (User -> System)
      console.log(`Phase ${phase.name} exhausted. Switching to next phase...`);
  }

  throw lastError || new Error("Semua API Key (User & System) sedang sibuk atau habis kuota.");
};

// --- LITELLM / OPENAI COMPATIBLE HELPER ---
const executeLiteLLM = async (
  config: AiProviderConfig['litellm'],
  endpoint: 'chat/completions' | 'images/generations',
  payload: any
): Promise<any> => {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LiteLLM Error (${response.status}): ${errText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("LiteLLM Call Failed:", error);
    throw error;
  }
};

// --- SYSTEM HEALTH CHECK ---
export const validateGeminiConnection = async (): Promise<{success: boolean, message: string, latency: number, keyCount: number}> => {
  const startTime = Date.now();
  
  // Check settings first to see which provider is active
  const settings = await dbService.getSettings();
  const providerConfig = settings.ai.providerConfig;

  if (providerConfig?.provider === 'LITELLM') {
      try {
          await executeLiteLLM(providerConfig.litellm, 'chat/completions', {
              model: providerConfig.litellm.textModel,
              messages: [{ role: "user", content: "Ping" }],
              max_tokens: 5
          });
          const duration = Date.now() - startTime;
          return {
              success: true,
              message: `LiteLLM Active (${providerConfig.litellm.baseUrl})`,
              latency: duration,
              keyCount: 1
          };
      } catch (e: any) {
          return { success: false, message: `LiteLLM Error: ${e.message}`, latency: 0, keyCount: 0 };
      }
  }

  // Default Gemini Check
  const keys = getSystemApiKeys(); // Admin check only checks system keys usually
  
  if (keys.length === 0) {
    return { success: false, message: "API_KEY not found in environment variables", latency: 0, keyCount: 0 };
  }

  try {
    // Ping with rotation using system keys only
    await executeWithRotation(async (ai) => {
        await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ text: "Ping" }] },
        });
    }, []);

    const duration = Date.now() - startTime;
    return { 
      success: true, 
      message: `System Keys Active (Pool: ${keys.length})`, 
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

const sanitizeLatex = (text: string): string => {
  if (!text) return "";
  let clean = text;
  clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, '$$$1$$');
  clean = clean.replace(/\\\[([\s\S]*?)\\\]/g, '$$$1$$');
  clean = clean.replace(/\\displaystyle/g, '');
  clean = clean.replace(/\\begin\{equation\}/g, '$').replace(/\\end\{equation\}/g, '$');
  clean = clean.replace(/\\begin\{align\}/g, '$').replace(/\\end\{align\}/g, '$');
  clean = clean.replace(/\n\s*(\$)/g, ' $1').replace(/(\$)\s*\n/g, '$1 ');
  return clean;
};

export const generateQuizContent = async (
  params: QuizGenerationParams,
  factCheck: boolean = true
): Promise<{ questions: Question[], blueprint: Blueprint[] }> => {
  
  // CHECK PROVIDER CONFIG
  const settings = await dbService.getSettings();
  const providerConfig = settings.ai.providerConfig;
  const useLiteLLM = providerConfig?.provider === 'LITELLM';

  const subjectSpecifics = getSubjectInstruction(params.subject, params.subjectCategory);
  const cognitiveRange = params.cognitiveLevels.join(', ');
  const typesList = params.types.join(', ');

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

  let distributionInstruction = "";
  if (params.types.length > 1) {
      distributionInstruction = `
      CRITICAL DISTRIBUTION RULE:
      The user has selected multiple question types: [${typesList}].
      You MUST distribute the ${params.questionCount} questions approximately evenly among these selected types.
      Group questions of the same type together.
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
    2. For 'ESSAY' and 'SHORT_ANSWER', 'options' must be an empty array.
    3. For 'COMPLEX_MULTIPLE_CHOICE', 'correctAnswer' should be a string containing all correct keys (e.g., "A, C").
    4. For 'MULTIPLE_CHOICE', provide exactly ${params.mcOptionCount} options.
    5. Generate a 'Blueprint' (Kisi-kisi) for every question mapping it to a Basic Competency (KD/CP) and Indicator.
    6. FORMATTING: Ensure all text is formatted for direct rendering. Do not use markdown headers (#) or bolding (**) in the question text unless necessary. STRICTLY NO newlines inside the question stem. All math must be inline.
    7. Output JSON ONLY.
  `;

  if (params.readingMode === 'grouped') {
    systemInstruction += `\n8. STIMULUS (GROUPED MODE - STRICT):
    - Create ONE single, long reading passage (wacana) of 300-500 words.
    - Copy this EXACT same passage string into the 'stimulus' field of EVERY question.
    - All questions must relate to this single passage.
    - DO NOT vary the 'stimulus' string even by a single character between questions.`;
  } else if (params.readingMode === 'simple' || params.enableReadingPassages) {
    systemInstruction += `\n8. STIMULUS (SIMPLE MODE):
    - Provide a unique, short 'stimulus' string specifically for EACH question.`;
  }

  if (factCheck) {
     systemInstruction += `\nSTRICT FACT CHECKING: Ensure all historical dates, scientific formulas, and factual statements are verified.`;
  }

  // Gemini Schema
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: Object.values(QuestionType) },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            cognitiveLevel: { type: Type.STRING },
            stimulus: { type: Type.STRING, nullable: true },
            imagePrompt: { type: Type.STRING, nullable: true },
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
    // RETRY LOGIC FOR ROBUSTNESS
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: any;

    while (attempts < maxAttempts) {
        try {
            let text = "";

            if (useLiteLLM && providerConfig?.litellm) {
                // --- LITELLM PATH ---
                const messages = [
                    { role: "system", content: systemInstruction + "\n\nIMPORTANT: You must return valid JSON matching the described structure. Do not include any markdown formatting or conversational text." },
                    { role: "user", content: `Generate ${params.questionCount} questions about ${params.topic}.` }
                ];

                // If this is a retry, add the previous error context
                if (attempts > 0 && lastError) {
                     messages.push({ role: "user", content: "The previous response was invalid JSON. Please regenerate the JSON strictly following the schema." });
                }

                if (params.refImageBase64 && attempts === 0) {
                     // OpenAI Vision format (only on first attempt to save tokens/complexity)
                     messages[1].content = [
                         { type: "text", text: `Generate ${params.questionCount} questions about ${params.topic}. Use this image as reference.` },
                         { type: "image_url", image_url: { url: params.refImageBase64 } }
                     ] as any;
                }

                // Remove response_format if it caused issues or just keep it? 
                // Some providers fail with it. Let's try-catch the call with it, fallback without.
                let result;
                try {
                    result = await executeLiteLLM(providerConfig.litellm, 'chat/completions', {
                        model: providerConfig.litellm.textModel,
                        messages: messages,
                        response_format: { type: "json_object" }, 
                        temperature: 0.7
                    });
                } catch (e: any) {
                    // If 400 error (likely due to response_format not supported), try without
                    if (e.message.includes('400') || e.message.includes('unsupported')) {
                        console.warn("LiteLLM json_object mode failed, retrying without...");
                        result = await executeLiteLLM(providerConfig.litellm, 'chat/completions', {
                            model: providerConfig.litellm.textModel,
                            messages: messages,
                            temperature: 0.7
                        });
                    } else {
                        throw e;
                    }
                }

                text = result.choices?.[0]?.message?.content || "";

            } else {
                // --- GEMINI PATH ---
                // Gemini doesn't need the retry loop as much because it has native schema enforcement, 
                // but we keep it inside the loop for consistency if we ever want to retry Gemini too.
                // For now, if Gemini fails, we just throw because executeWithRotation handles its own retries.
                if (attempts > 0) throw lastError; // Don't retry Gemini here, it's expensive and usually unnecessary with schema

                const textModel = 'gemini-3-flash-preview';
                const response = await executeWithRotation(async (ai) => {
                  return await ai.models.generateContent({
                    model: textModel,
                    contents: [
                      {
                        role: 'user',
                        parts: [
                          { text: `Generate ${params.questionCount} questions about ${params.topic}.` },
                          ...(params.refImageBase64 ? [{
                            inlineData: {
                              mimeType: "image/jpeg",
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
                      safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                      ]
                    }
                  });
                }, params.userApiKeys); 
                text = response.text || "";
            }

            if (!text || text.trim().length === 0) {
                throw new Error("AI returned empty response.");
            }
            
            // Robust JSON Cleaning
            const cleanJson = (str: string) => {
                let cleaned = str.replace(/```json\s*/g, "").replace(/```\s*/g, "");
                const firstOpen = cleaned.indexOf('{');
                const lastClose = cleaned.lastIndexOf('}');
                if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
                    cleaned = cleaned.substring(firstOpen, lastClose + 1);
                }
                return cleaned;
            };

            text = cleanJson(text);

            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch (e) {
                console.error(`JSON Parse Error (Attempt ${attempts + 1}):`, text);
                throw new Error("Invalid JSON");
            }
            
            let processedQuestions = parsed.questions.map((q: any, idx: number) => ({
              ...q,
              id: `gen-${Date.now()}-${idx}`,
              text: sanitizeLatex(q.text),
              explanation: sanitizeLatex(q.explanation),
              options: q.options ? q.options.map((opt: string) => sanitizeLatex(opt)) : [],
              stimulus: sanitizeLatex(q.stimulus),
              hasImage: !!q.imagePrompt,
              hasImageInOptions: false,
              imageUrl: undefined 
            }));

            if (params.readingMode === 'grouped' && processedQuestions.length > 0) {
                const masterStimulus = processedQuestions.find((q: any) => q.stimulus && q.stimulus.trim().length > 0)?.stimulus;
                if (masterStimulus) {
                    processedQuestions = processedQuestions.map((q: any) => ({
                        ...q,
                        stimulus: masterStimulus 
                    }));
                }
            }

            return {
              questions: processedQuestions,
              blueprint: parsed.blueprint || []
            };

        } catch (error) {
            lastError = error;
            attempts++;
            console.warn(`Generation attempt ${attempts} failed:`, error);
            if (attempts >= maxAttempts) throw error;
        }
    }
    
    throw lastError;

  } catch (error) {
    console.error("Generation Error:", error);
    throw error;
  }
};

export const generateImageForQuestion = async (prompt: string, userKeys: string[] = []): Promise<string> => {
  const settings = await dbService.getSettings();
  const providerConfig = settings.ai.providerConfig;
  const useLiteLLM = providerConfig?.provider === 'LITELLM';

  try {
    if (useLiteLLM && providerConfig?.litellm) {
        // --- LITELLM IMAGE PATH ---
        const result = await executeLiteLLM(providerConfig.litellm, 'images/generations', {
            model: providerConfig.litellm.imageModel,
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
        });
        
        const b64 = result.data?.[0]?.b64_json;
        if (b64) {
            return `data:image/png;base64,${b64}`;
        } else if (result.data?.[0]?.url) {
            // If URL returned, we might need to fetch it if it's not accessible directly or to convert to base64
            // For now, return URL if it's a public URL, but base64 is safer for canvas/printing
            return result.data[0].url;
        }

    } else {
        // --- GEMINI IMAGE PATH ---
        const imageModel = 'gemini-2.5-flash-image';
        const response = await executeWithRotation(async (ai) => {
          return await ai.models.generateContent({
            model: imageModel,
            contents: prompt,
          });
        }, userKeys);

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
               return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
          }
        }
    }
    
    return generateSvgFallback(prompt);

  } catch (error) {
    console.warn("Image gen failed, using SVG fallback", error);
    return generateSvgFallback(prompt);
  }
};

const generateSvgFallback = (prompt: string): string => {
  const bg = "#fff7ed";
  const stroke = "#f97316";
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