🌐 AI Chatbot with Groq + Tavily Search + Memory

A lightweight and powerful AI chatbot built using Groq LLM, Tavily Web Search, and NodeCache conversation memory.
Supports real-time web search, tool calling, and thread-based memory.

🚀 Features

🔍 Real-time web search using Tavily .


🧠 Per-thread memory (remembers past messages for 24 hours)

🤖 Groq Llama 3.1 model for fast responses

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
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key


Get keys:

Groq key → https://console.groq.com/keys

Tavily key → https://app.tavily.com/api-key

🧩 Project Structure
/project
│── index.js       # main server file (optional)
│── chatbot.js     # your chatbot logic (Groq + Tavily + memory)
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

🌍 How Web Search Works

The LLM decides automatically when it needs web search using the tool_calls feature.

If it requests:

{ "name": "webSearch", "arguments": { "query": "something" } }


→ your code runs webSearch()
→ gives fresh info back to the model
→ second pass generates a final answer

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

app.listen(4300, () => console.log("Server running on 4300"));

🛠️ Technologies Used

Node.js

Groq SDK

Tavily Search

NodeCache

Tool Calling Architecture

🤝 Contributing

Feel free to submit PRs or issues.
