// import express from 'express';
// import { generate, clearMemory } from './chatbot.js';

// const app = express();
// const port = 4300;

// app.use(express.json());
// app.use(express.static('frontend')); 

// app.get('/', (req, res) => {
//   res.sendFile('frontend/index.html', { root: '.' });
// });

// app.post('/chat', async (req, res) => {
//   try {
//     const { message, threadId = "default" } = req.body;
    
//     if (!message || !message.trim()) {
//       return res.status(400).json({ error: 'Message is empty' });
//     }
    
//     const result = await generate(message, threadId);
//     res.json({ message: result, threadId });
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ error: err.message || 'Internal server error' });
//   }
// });

// app.post('/clear-memory', (req, res) => {
//   try {
//     const { threadId = "default" } = req.body;
//     clearMemory(threadId);
//     res.json({ message: 'Memory cleared' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generate, clearMemory } from "./chatbot.js";

dotenv.config();

const app = express();

// 🔥 IMPORTANT for Render (it sets PORT in env)
const PORT = process.env.PORT || 4300;

app.use(cors());          // allow frontend (GitHub Pages) to call this API
app.use(express.json());

// ✅ Simple health check
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

// 💬 Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, threadId = "default" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is empty" });
    }

    const result = await generate(message, threadId);
    res.json({ message: result, threadId });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 🧠 Clear memory endpoint
app.post("/clear-memory", (req, res) => {
  try {
    const { threadId = "default" } = req.body;
    clearMemory(threadId);
    res.json({ message: "Memory cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
