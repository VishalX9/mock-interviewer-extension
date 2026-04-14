let chatHistory = [];
let problemDescription = "";
let detectedLanguage = "";
let currentGreeting = ""; 

const chatBox = document.getElementById("chat");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const startBtn = document.getElementById("start-btn");
const hintBtn = document.getElementById("hint-btn");
const feedbackBtn = document.getElementById("feedback-btn");

const setupScreen = document.getElementById("setup-screen");
const mainScreen = document.getElementById("main-screen");
const popupApiKeyInput = document.getElementById("popup-api-key");
const saveKeyBtn = document.getElementById("save-key-btn");
const setupError = document.getElementById("setup-error");


function saveChatState() {
  chrome.storage.local.set({
    savedChatHistory: chatHistory,
    savedProblem: problemDescription,
    savedLanguage: detectedLanguage,
    savedGreeting: currentGreeting
  });
}

document.addEventListener("DOMContentLoaded", () => {

  chrome.storage.sync.get(["geminiApiKey"], (apiResult) => {
    if (!apiResult.geminiApiKey) {

      setupScreen.classList.remove("hidden");
      mainScreen.classList.add("hidden");
    } else {

      setupScreen.classList.add("hidden");
      mainScreen.classList.remove("hidden");
      

      chrome.storage.local.get(["savedChatHistory", "savedProblem", "savedLanguage", "savedGreeting"], (data) => {
        if (data.savedProblem) {
          problemDescription = data.savedProblem;
          detectedLanguage = data.savedLanguage;
          currentGreeting = data.savedGreeting || "";

          chatBox.innerHTML = ""; 
          
          if (currentGreeting) appendMessage(currentGreeting, "ai");

          if (data.savedChatHistory && data.savedChatHistory.length > 0) {
            chatHistory = data.savedChatHistory;
            chatHistory.forEach(msg => {
              const sender = msg.role === "model" ? "ai" : "user";
              const text = msg.parts[0].text;
              appendMessage(text, sender);
            });
          }
        }
      });
    }
  });
});


saveKeyBtn.addEventListener("click", () => {
  const key = popupApiKeyInput.value.trim();
  if (!key) {
    setupError.innerText = "Please enter a valid key.";
    return;
  }
  

  chrome.storage.sync.set({ geminiApiKey: key }, () => {

    setupScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    popupApiKeyInput.value = ""; 
  });
});

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["savedChatHistory", "savedProblem", "savedLanguage", "savedGreeting"], (data) => {
    if (data.savedProblem) {
      problemDescription = data.savedProblem;
      detectedLanguage = data.savedLanguage;
      currentGreeting = data.savedGreeting || "";

      chatBox.innerHTML = ""; 
      
      if (currentGreeting) appendMessage(currentGreeting, "ai");

      if (data.savedChatHistory && data.savedChatHistory.length > 0) {
        chatHistory = data.savedChatHistory;
        chatHistory.forEach(msg => {
          const sender = msg.role === "model" ? "ai" : "user";
          const text = msg.parts[0].text;
          appendMessage(text, sender);
        });
      }
    }
  });
});


function appendMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const msgDiv = document.createElement("div");
  msgDiv.className = "msg ai typing-indicator";
  msgDiv.innerText = "Thinking...";
  msgDiv.id = "typing";
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typingDiv = document.getElementById("typing");
  if (typingDiv) typingDiv.remove();
}


async function callGeminiAPI(userText, role = "user", specialInstruction = null) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["geminiApiKey"], async (result) => {
      if (!result.geminiApiKey) {
        reject(new Error("API key not found. Please set it in options."));
        return;
      }

      if (userText) {
        chatHistory.push({ role: role, parts: [{ text: userText }] });
        saveChatState(); 
      }

      const mode = document.getElementById("mode").value;
      let systemPrompt = `You are an expert technical interviewer evaluating a candidate. 
      The candidate is solving the following problem: ${problemDescription}.
      Your primary language focus is ${detectedLanguage}. 
      
      CRITICAL RULE: Your job is NOT to solve the problem. Do not write the final code. 
      Your only work is to look at their logic, identify underlying structural patterns, ask probing questions, and review their approach.
      Current Interview Mode: ${mode}. Adjust your strictness accordingly.`;

      if (specialInstruction) {
        systemPrompt += `\n\nIMMEDIATE ACTION REQUIRED: ${specialInstruction}`;
      }

      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${result.geminiApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: chatHistory,
              generationConfig: { temperature: 0.4 },
            }),
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || "API request failed");
        }

        const data = await res.json();
        const aiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
        
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        saveChatState(); 

        resolve(aiResponse);
      } catch (error) {
        reject(error);
      }
    });
  });
}


startBtn.addEventListener("click", () => {
  chrome.storage.local.remove(["savedChatHistory", "savedProblem", "savedLanguage", "savedGreeting"]);
  chatBox.innerHTML = ""; 
  chatHistory = []; 
  currentGreeting = "";
  appendMessage("Initializing interview environment...", "ai");

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_PROBLEM_CONTEXT" }, async (res) => {
      if (!res || !res.text) {
        chatBox.innerHTML = "";
        appendMessage("Could not extract problem description. Are you on a LeetCode problem page?", "ai");
        return;
      }

      problemDescription = res.text;
      detectedLanguage = res.language; 
      
      currentGreeting = `Problem loaded successfully. I see you are coding in ${detectedLanguage}. I'm your interviewer. Are you ready? Explain your initial thoughts.`;
      saveChatState(); 
      
      chatBox.innerHTML = "";
      appendMessage(currentGreeting, "ai");
    });
  });
});

async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  if (!problemDescription) {
    appendMessage("Please click 'Start' first to load the problem.", "ai");
    userInput.value = "";
    return;
  }


  appendMessage(text, "user");
  userInput.value = "";
  showTyping();


  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_CURRENT_CODE" }, async (res) => {
      
      let specialInstruction = null;
      

      if (res && res.code && res.code.trim() !== "") {
        specialInstruction = `
        [SYSTEM CONTEXT - DO NOT MENTION THIS BLOCK DIRECTLY]
        The candidate currently has the following code written in their editor:
        \n${res.code}\n
        Use this code to understand their context, but respond directly to their message: "${text}"
        `;
      }


      try {
        const aiText = await callGeminiAPI(text, "user", specialInstruction);
        removeTyping();
        appendMessage(aiText, "ai");
      } catch (error) {
        removeTyping();
        appendMessage(`System Error: ${error.message}`, "ai");
      }
    });
  });
}

sendBtn.addEventListener("click", handleSend);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

hintBtn.addEventListener("click", async () => {
  if (!problemDescription) return;
  appendMessage("Could I get a small hint to point me in the right direction?", "user");
  showTyping();
  try {
    const aiText = await callGeminiAPI(
      "Could I get a small hint?", "user", 
      "Provide a subtle conceptual hint about the data structure or algorithm pattern. Do NOT give the solution or pseudo-code."
    );
    removeTyping();
    appendMessage(aiText, "ai");
  } catch (error) {
    removeTyping();
    appendMessage(`System Error: ${error.message}`, "ai");
  }
});


feedbackBtn.addEventListener("click", () => {
  if (!problemDescription) return;

  appendMessage("Can you review the code I have written so far?", "user");
  showTyping();

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_CURRENT_CODE" }, async (res) => {
      
      let specialInstruction = "Evaluate the candidate's current approach based on what they have said so far.";
      
      if (res && res.code && res.code.trim() !== "") {
        specialInstruction = `
        The candidate has explicitly written the following code in the editor:
        \n\n${res.code}\n\n
        Review this code. Point out any logical errors, missing edge cases, or Time/Space complexity bottlenecks. 
        DO NOT rewrite the code for them. Guide them to find the bug themselves.`;
      } else {
        removeTyping();
        appendMessage("(System Note: Code area appears empty or could not be read. Asking AI to review verbal logic instead.)", "ai");
        showTyping();
      }

      try {
        const aiText = await callGeminiAPI("Review my current code.", "user", specialInstruction);
        removeTyping();
        appendMessage(aiText, "ai");
      } catch (error) {
        removeTyping();
        appendMessage(`System Error: ${error.message}`, "ai");
      }
    });
  });
});