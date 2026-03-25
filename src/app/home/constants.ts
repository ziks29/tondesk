export const MODELS = [
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    desc: "Fast & Smart (Default) • Web Search ✓",
  },
  {
    id: "anthropic/claude-3.5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    desc: "Lightweight & Efficient • Web Search ✓",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    desc: "Powerful Reasoning",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B",
    desc: "Free Tier",
  },
  { id: "deepseek/deepseek-chat", name: "DeepSeek V3", desc: "Advanced Logic" },
] as const;

export const TOP_UP_AMOUNTS = [0.5, 1, 2] as const;

export const DEFAULT_MODEL_ID = "google/gemini-2.0-flash-001";

export const DEFAULT_SYSTEM_PROMPT = `You are a strict Telegram support agent.
Use ONLY the provided knowledge base to answer.
If answer is not present in the KB, reply exactly: "I can only answer from the provided knowledge base."
Return STRICT JSON only with this shape:
{"reply":"string"}
Never include markdown or extra text outside JSON.`;
