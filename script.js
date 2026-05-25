const input = document.getElementById("input");
const askBtn = document.getElementById("askBtn");
const imageBtn = document.getElementById("imageBtn");
const modeIndicator = document.getElementById("modeIndicator");
const chatContainer = document.getElementById("chat-container");

// Use localhost when running the page locally, otherwise use the deployed backend.
const API_URL = (() => {
  const hostname = window.location.hostname;

  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:4300";
  }

  return "https://chatai-with-websearch.onrender.com";
})();

// 🎨 Toggle state for image generation mode
let isImageMode = false;

askBtn.addEventListener("click", handleSendMessage);
imageBtn.addEventListener("click", toggleImageMode);

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    if (isImageMode) {
      handleGenerateImage();
    } else {
      handleSendMessage();
    }
  }
});

// 🎨 Toggle image generation mode
function toggleImageMode() {
  isImageMode = !isImageMode;
  
  // Update button appearance
  if (isImageMode) {
    imageBtn.classList.add("bg-yellow-500", "text-black", "font-bold", "border-yellow-400");
    imageBtn.classList.remove("bg-gray-700", "hover:bg-gray-600", "text-white", "border-gray-600");
    imageBtn.textContent = "🎨 Image Mode ON";
    askBtn.classList.add("opacity-50", "cursor-not-allowed");
    askBtn.disabled = true;
    input.placeholder = "Enter image prompt...";
    modeIndicator.classList.remove("hidden");
  } else {
    imageBtn.classList.remove("bg-yellow-500", "text-black", "font-bold", "border-yellow-400");
    imageBtn.classList.add("bg-gray-700", "hover:bg-gray-600", "text-white", "border-gray-600");
    imageBtn.textContent = "🎨 Image Mode";
    askBtn.classList.remove("opacity-50", "cursor-not-allowed");
    askBtn.disabled = false;
    input.placeholder = "Type a message...";
    modeIndicator.classList.add("hidden");
  }
}

async function handleSendMessage() {
  const text = input.value.trim();
  if (!text) return;

  generateUserMessage(text);
  input.value = "";
  
  // ✅ Create new loading element
  const loading = document.createElement("div");
  loading.className = "my-6 text-gray-400 text-sm animate-pulse";
  loading.textContent = "⏳ Thinking...";
  chatContainer.appendChild(loading);

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    loading.remove();
    generateBotMessage(data.message);
  } catch (err) {
    loading.remove();
    generateBotMessage(`❌ Error: ${err.message}`);
    console.error("Chat error:", err);
  }
}

// 🎨 Handle image generation (BlackForest LLM)
async function handleGenerateImage() {
  const prompt = input.value.trim();
  if (!prompt) {
    alert("Please enter a prompt for image generation");
    return;
  }

  generateUserMessage(`🎨 Generate: ${prompt}`);
  input.value = "";
  
  // ✅ Create new loading element
  const imageLoading = document.createElement("div");
  imageLoading.className = "my-6 text-gray-400 text-sm animate-pulse";
  imageLoading.textContent = "🎨 Generating image...";
  chatContainer.appendChild(imageLoading);

  try {
    console.log("Sending request to:", `${API_URL}/generate-image`);
    
    const response = await fetch(`${API_URL}/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    imageLoading.remove();
    generateImageMessage(data.imageUrl);
  } catch (err) {
    imageLoading.remove();
    generateBotMessage(`❌ Image generation error: ${err.message}`);
    console.error("Image generation error:", err);
  }
}

// USER MESSAGE → RIGHT
function generateUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-end mb-4";

  const msg = document.createElement("div");
  msg.className = "bg-blue-600 text-white p-3 rounded-lg max-w-xs break-words";
  msg.textContent = text;

  wrapper.appendChild(msg);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// BOT MESSAGE → LEFT
function generateBotMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-start mb-4";

  const msg = document.createElement("div");
  msg.className = "bg-gray-700 text-white p-3 rounded-lg max-w-sm break-words";
  msg.textContent = text;

  wrapper.appendChild(msg);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 🎨 IMAGE MESSAGE → LEFT
function generateImageMessage(imageUrl) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-start mb-4";

  const img = document.createElement("img");
  img.src = imageUrl;
  img.className = "rounded-lg max-w-sm shadow-lg cursor-pointer hover:opacity-90 transition-opacity";
  img.alt = "Generated image";
  img.onerror = () => {
    console.error("Failed to load image:", imageUrl);
    generateBotMessage("❌ Failed to load generated image");
  };

  wrapper.appendChild(img);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
