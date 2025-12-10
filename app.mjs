import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

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

async function askOnce(userQuestion) {
  const baseMessages = [
    {
      role: "system",
      content: `You are a friendly gen z girl, helpful AI assistant.  
Use the webSearch tool for anything that requires up-to-date or factual information.  
Do not guess or make up facts.  
Speak casually but stay accurate.  
If the user asks something personal, creative, or opinion-based, reply normally without web search.  
If the user asks about real-world events, companies, technology, dates, launches, or news, ALWAYS perform a web search first for recent information . 
`,
    },
    {
      role: "user",
      content: userQuestion,
    },
  ];

  // 1️⃣ First call – let LLM decide if it needs webSearch
  const first = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: baseMessages,
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the recent info on the internet",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "price of iphone 17'",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: "auto",
  });

  const toolCalls = first.choices[0].message.tool_calls;

  // If LLM didn’t request a tool → just answer normally
  if (!toolCalls || toolCalls.length === 0) {
    console.log("💬 Answer (no tool needed):", first.choices[0].message.content);
    return;
  }

  const toolCall = toolCalls[0];
  const fnName = toolCall.function.name;
  const fnArgs = JSON.parse(toolCall.function.arguments);

  let toolResultText = "";

  if (fnName === "webSearch") {
    toolResultText = await webSearch(fnArgs);
  }

  // 2️⃣ Second call – tell LLM: only give the date
  const secondMessages = [
    {
      role: "system",
      content:
      `Do NOT call webSearch for:
   - personal questions
   - general explanations
   - opinions
   - fictional or hypothetical content

Only use webSearch when factual data is needed.`,
    },
    {
      role: "user",
      content: userQuestion,
    },
    {
      role: "assistant",
      tool_calls: [toolCall],
    },
    {
      role: "tool",
      tool_call_id: toolCall.id,
      name: fnName,
      content: toolResultText,
    },
  ];

  const second = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0,
    messages: secondMessages,
  });

  console.log( second.choices[0].message.content);
}

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("🔁 Ask me about launch dates (e.g. 'when samsung s25 was launched').");
  console.log("Type 'exit' to quit.\n");

  while (true) {
    const q = await rl.question("❓ Your question: ");

    if (!q.trim()) continue;
    if (q.toLowerCase() === "exit") break;

    try {
      await askOnce(q.trim());
    } catch (err) {
      console.error("❌ Error:", err.message || err);
    }

    console.log(); // blank line between questions
  }

  rl.close();
}

main().catch(console.error);
