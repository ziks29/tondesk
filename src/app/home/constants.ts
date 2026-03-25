export const MODELS = [
  {
    id: "google/gemini-2.0-flash-001",
    name: "Google Gemini 2.0 Flash",
    desc: "Fast & Smart (Default)",
  },
  {
    id: "stepfun/step-3.5-flash:free",
    name: "StepFun Step 3.5 Flash",
    desc: "Efficient & Cost-effective",
  },
  {
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    desc: "Advanced Reasoning",
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Google Gemini 3 Flash Preview",
    desc: "Latest Preview Model",
  },
] as const;

export const TOP_UP_AMOUNTS = [0.5, 1, 2] as const;

export const DEFAULT_MODEL_ID = "google/gemini-2.0-flash-001";

export const DEFAULT_SYSTEM_PROMPT = `You are a strict Telegram support agent.
Use ONLY the provided knowledge base to answer.
If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."
Return STRICT JSON only with this shape:
{"reply":"string"}
Never include markdown or extra text outside JSON.`;
