const input = document.getElementById("input");
const askBtn = document.getElementById("askBtn");
const chatContainer = document.getElementById("chat-container");
const loading=document.createElement('div')
loading.className='my-6 animate-pulse '
loading.textContent="Thinking..."

askBtn.addEventListener("click", handleSendMessage);
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendMessage();
});

async function handleSendMessage() {
  const text = input.value.trim();
  if (!text) return;

  generateUserMessage(text);
  input.value = "";
   chatContainer.appendChild(loading)
  
  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    const data = await response.json();
    generateBotMessage(data.message);
  } catch (err) {
    generateBotMessage(` Error: ${err.message}`);
  }
}

// USER MESSAGE → RIGHT
function generateUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-end";

  const msg = document.createElement("div");
  msg.className = "bg-neutral-800 p-3 rounded-xl max-w-xs";
  msg.textContent = text;

  wrapper.appendChild(msg);
  chatContainer.appendChild(wrapper);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// BOT MESSAGE → LEFT

function generateBotMessage(text) {
   
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-start";
  

  const msg = document.createElement("div");
  msg.className = "bg-blue-600 p-3 rounded-xl max-w-xs";
  msg.textContent = text;
loading.remove();
  wrapper.appendChild(msg);
  chatContainer.appendChild(wrapper);
 chatContainer.scrollTop = chatContainer.scrollHeight;


}
