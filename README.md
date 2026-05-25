🌐 AI Chatbot with Hugging Face + web Search + Memory

A lightweight and powerful AI chatbot built using Hugging Face DeepSeek R1 for text, Hugging Face image generation, Tavily Web Search, and NodeCache conversation memory.
Supports automatic web search, text chat, image generation, and thread-based memory.

🚀 Features

🔍 Real-time web search using Tavily .


🧠 Per-thread memory (remembers past messages for 24 hours)

🤖 DeepSeek R1 distill model for text responses

🎨 Hugging Face text-to-image generation

⚙️ Automatic tool calling (LLM decides when to search the web)

🪶 Clean, modular code

🔁 Simple generate(message, threadId) function for easy integration

📦 Installation
1️⃣ Clone the repo
git clone https://github.com/yourusername/your-repo.git
cd your-repo

2️⃣ Install dependencies
npm install

3️⃣ Create .env file
TAVILY_API_KEY=your_tavily_key
HUGGINGFACE_API_TOKEN=your_hugging_face_token
HUGGINGFACE_TEXT_MODEL=deepseek-ai/DeepSeek-R1-Distill-Qwen-7B

Optional:
HUGGINGFACE_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell


Get keys:

Tavily key → https://app.tavily.com/api-key

Hugging Face token → https://huggingface.co/settings/tokens

🧩 Project Structure
/project
│── index.js       # main server file (optional)
│── chatbot.js     # your chatbot logic (Hugging Face + Tavily + memory)
│── package.json
│── .env
│── README.md

🔥 How to Use the Chatbot
Import and call the generate() function:
import { generate } from "./chatbot.js";

const reply = await generate("What is the price of iPhone 16?", "user1");
console.log(reply);

Clear memory:
import { clearMemory } from "./chatbot.js";

clearMemory("user1");

🧠 Conversation Memory

Memory is stored using NodeCache

Each threadId has its own private history

Auto-expires after 24 hours

You can create multiple user sessions:

generate("hello", "userA");
generate("hello", "userB");

### How Web Search Works

The text model decides automatically when it needs web search.

When a question looks factual, recent, or time-sensitive, the backend runs `webSearch()` first, then sends the fresh results back to the model for the final answer.

📡 Example API Endpoint

If you want a simple Express server:

import express from "express";
import { generate } from "./chatbot.js";

const app = express();
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message, threadId } = req.body;

  const reply = await generate(message, threadId || "default");
  res.json({ reply });
});

app.listen(4300, () => console.log("Server running on 4300"));<img width="2816" height="1536" alt="flow-chart" src="https://github.com/user-attachments/assets/66dbf0fc-c5d8-4c41-80b3-ebc499c1d56c" />


🛠️ Technologies Used

Node.js

OpenAI-compatible Hugging Face router

Tavily Search

NodeCache


Tool Calling Architecture

🤝 Contributing

Feel free to submit PRs or issues.


