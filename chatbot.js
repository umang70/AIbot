import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";
import OpenAI from "openai";

dotenv.config();

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const hfClient = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HUGGINGFACE_API_TOKEN,
});
const huggingFaceToken = process.env.HUGGINGFACE_API_TOKEN;
const huggingFaceTextModel =
  process.env.HUGGINGFACE_TEXT_MODEL || "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B";
const huggingFaceImageModel =
  process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";

// Store conversation history per thread/user
const conversationMemory = new NodeCache({ stdTTL: 60 * 60 * 24 }); // 24 hour expiry

async function webSearch({ query }) {
  console.log("🔍 webSearch called with query:", query);
  const res = await tvly.search(query);

  if (res.answer) {
    return `Web summary:\n${res.answer}`;
  }

  const top = (res.results || []).slice(0, 3);
  const lines = top.map((r, i) => {
    return `Result ${i + 1}:
Title: ${r.title}
Snippet: ${r.content?.slice(0, 200) || ""}`;
  });

  return `Web summary (top results):\n${lines.join("\n\n")}`;
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}

function shouldUseWebSearchFallback(question) {
  return /\b(latest|current|today|now|recent|news|launch|price|stock|score|winner|won|released|released on|who is|when did|this year|yesterday|tomorrow)\b/i.test(
    question
  );
}

async function callTextModel(messages, temperature = 0.2) {
  const response = await hfClient.chat.completions.create({
    model: huggingFaceTextModel,
    temperature,
    messages,
  });

  return response.choices?.[0]?.message?.content?.trim() || "";
}

async function decideSearchPlan(userQuestion, conversationHistory) {
  const plannerMessages = [
    {
      role: "system",
      content: `Decide whether the user needs a web search.
Return only valid JSON with this shape:
{"action":"answer"|"webSearch","query":"string"}

Use webSearch for factual, recent, time-sensitive, or live information.
Use answer for creative, opinion, personal, or general explanation questions.
If you choose answer, set query to an empty string.`,
    },
    ...conversationHistory.slice(-6),
    {
      role: "user",
      content: userQuestion,
    },
  ];

  const plannerText = await callTextModel(plannerMessages, 0);
  const jsonText = extractJsonObject(plannerText) || plannerText;

  try {
    const parsed = JSON.parse(jsonText);
    if (parsed?.action === "webSearch" || parsed?.action === "answer") {
      return {
        action: parsed.action,
        query:
          typeof parsed.query === "string" && parsed.query.trim()
            ? parsed.query.trim()
            : userQuestion,
      };
    }
  } catch (err) {
    // Fall through to heuristic planning below.
  }

  if (shouldUseWebSearchFallback(userQuestion)) {
    return { action: "webSearch", query: userQuestion };
  }

  return { action: "answer", query: "" };
}

// 🎨 Generate image using Hugging Face Inference API
async function generateImage(prompt) {
  console.log("🎨 Generating image with prompt:", prompt);
  
  try {
    if (!huggingFaceToken) {
      throw new Error("HUGGINGFACE_API_TOKEN is not set");
    }

    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${huggingFaceImageModel}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${huggingFaceToken}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face request failed (${response.status}): ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${imageBuffer.toString("base64")}`;
  } catch (err) {
    console.error("❌ Image generation error:", err.message);
    throw new Error(`Image generation failed: ${err.message}`);
  }
}

async function askOnce(userQuestion, threadId) {
  // Get conversation history
  let conversationHistory = conversationMemory.get(threadId) || [];
  const plan = await decideSearchPlan(userQuestion, conversationHistory);

  if (plan.action === "answer") {
    const answerMessages = [
      {
        role: "system",
        content: `You are a friendly, helpful AI assistant with memory of previous conversations.
      Do not guess or make up facts.
      Speak casually but stay accurate.
      Answer the user's message directly and concisely.
      Do not add preambles like "it seems" or "here's".
      If the user asks something personal, creative, or opinion-based, reply normally.
      If the user asks about real-world events, companies, technology, dates, launches, or news, rely on web search when provided.`,
      },
      ...conversationHistory,
      {
        role: "user",
        content: userQuestion,
      },
    ];

    const answer = await callTextModel(answerMessages, 0.4);

    conversationHistory.push({ role: "user", content: userQuestion });
    conversationHistory.push({ role: "assistant", content: answer });
    conversationMemory.set(threadId, conversationHistory);

    return answer;
  }

  const toolResultText = await webSearch({ query: plan.query });

  const secondMessages = [
    {
      role: "system",
      content: `You have access to web search results.
    Use them to answer the user's question accurately.
    Do not invent facts.
    Keep the response casual, short, clear, and direct.
    Do not mention internal reasoning or the search process.`,
    },
    ...conversationHistory,
    {
      role: "user",
      content: userQuestion,
    },
    {
      role: "system",
      content: `Web search results:\n${toolResultText}`,
    },
  ];

  const answer = await callTextModel(secondMessages, 0.3);
  
  conversationHistory.push({ role: "user", content: userQuestion });
  conversationHistory.push({ role: "assistant", content: answer });
  conversationMemory.set(threadId, conversationHistory);

  return answer;
}

// 🔥 Generate text response
export async function generate(userMessage, threadId = "default") {
  if (!userMessage || !userMessage.trim()) {
    throw new Error("userMessage is empty");
  }

  const answer = await askOnce(userMessage.trim(), threadId);
  return answer;
}

// 🎨 Generate image
export async function generateImageResponse(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt is empty");
  }

  const imageUrl = await generateImage(prompt.trim());
  return imageUrl;
}

export function clearMemory(threadId) {
  conversationMemory.del(threadId);
}
