const { ChatSession, ChatMessage } = require("../../model");
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");
const { v4: uuidv4 } = require("uuid");

// Vertex AI Configuration
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || "dolet-app";
const LOCATION = process.env.VERTEX_LOCATION || "us-central1";
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// Initialize Google Auth
let auth;
try {
  auth = new GoogleAuth({
    keyFilename: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
} catch (err) {
  console.error("Failed to initialize Google Auth:", err.message);
}

// Helper function to get access token
async function getAccessToken() {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  } catch (err) {
    throw new Error("Authentication failed: " + err.message);
  }
}

// Helper function to call Gemini API with conversation history
async function callGeminiAPI(conversationHistory) {
  const modelNames = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];

  let lastError = null;
  const accessToken = await getAccessToken();

  for (const modelName of modelNames) {
    try {
      const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}:generateContent`;

      const requestBody = {
        contents: conversationHistory,
        systemInstruction: {
          parts: [
            {
              text: "You are a helpful healthcare assistant. Be clear, accurate, and empathetic. IMPORTANT: Respond in 2 to 4 short lines (not a big paragraph). Keep each line concise. Avoid long explanations. If more context is needed, ask ONE brief follow-up question. If outside your scope, advise consulting a healthcare professional."
            }
          ]
        },
        generationConfig: {
          // Keep answers short (roughly a few lines)
          maxOutputTokens: 256,
          temperature: 0.4,
          topP: 0.9,
        },
      };

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 1200000,
      });

      // Extract text from response
      const aiText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      if (aiText) {
        return aiText;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${modelName} failed:`, err.message);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

function formatConciseLines(text, { minLines = 2, maxLines = 5, maxCharsPerLine = 120 } = {}) {
  if (!text) return "";

  const normalized = String(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!normalized) return "";

  const wrapLine = (line) => {
    const words = String(line).trim().split(/\s+/).filter(Boolean);
    const out = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxCharsPerLine) {
        current = next;
      } else {
        if (current) out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
    return out;
  };

  // 1) Start from existing newlines
  let lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 2) If it's a single line / paragraph, split by sentences
  if (lines.length <= 1) {
    const sentences = normalized
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    lines = sentences.length ? sentences : [normalized];
  }

  // 3) Wrap long lines
  lines = lines.flatMap((l) => wrapLine(l));

  // 4) Enforce max lines
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
  }

  // 5) Enforce min lines
  if (lines.length < minLines) {
    const single = lines[0] || normalized;
    const wrapped = wrapLine(single);
    lines = wrapped.length >= minLines ? wrapped.slice(0, minLines) : [single, "Can you share a bit more detail?"]; 
  }

  // Final safety trim
  lines = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines);

  while (lines.length < minLines) {
    lines.push("Can you share a bit more detail?");
  }

  return lines.join("\n");
}


/**
 * Start a new chat session
 * Available for all users (logged in or not)
 */
const startChat = async (req, res) => {
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Get user ID if authenticated, otherwise use null
    const userId = req.user ? req.user.id : null;

    return res.status(201).json({
      success: true,
      message: "Chat session started successfully",
      data: {
        sessionId: sessionId,
        userId: userId,
        welcomeMessage: "Welcome to Healthcare Assistant! How can I help you today?",
      },
    });
  } catch (error) {
    console.error("Error starting chat session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start chat session",
      error: error.message,
    });
  }
};

/**
 * Send message and get Gemini AI response
 * Available for all users (logged in or not)
 * Supports multiple messages in one session
 */
const chat = async (req, res) => {
  try {
    const { sessionId, message, conversationHistory } = req.body;

    // Validate inputs
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: "Session ID and message are required",
      });
    }

    console.log(`\n� Chat Session: ${sessionId}`);
    console.log(`� User Message: ${message}`);

    // Prepare conversation history for Gemini
    // conversationHistory should be an array of {role: "user"/"model", parts: [{text: "..."}]}
    let geminiHistory = [];
    
    if (conversationHistory && Array.isArray(conversationHistory)) {
      geminiHistory = conversationHistory;
    }

    // Add current user message
    geminiHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Call Gemini API
    console.log("🤖 Calling Gemini API...");
    try {
      const aiResponse = await callGeminiAPI(geminiHistory);

      const formattedResponse = formatConciseLines(aiResponse, {
        minLines: 2,
        maxLines: 5,
        maxCharsPerLine: 120,
      });

      console.log("✅ Gemini response received");

      return res.status(200).json({
        success: true,
        message: "Chat response generated successfully",
        data: {
          sessionId: sessionId,
          userMessage: message,
          botResponse: formattedResponse,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("❌ Gemini API Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get AI response. Please try again.",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("❌ Error in chat:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message,
    });
  }
};

module.exports = {
  startChat,
  chat,
};
