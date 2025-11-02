const { ChatSession, ChatMessage, Patient, Doctor } = require("../../model");
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");

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

// Helper function to call Gemini API
async function callGeminiAPI(prompt) {
  const modelNames = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];

  let lastError = null;
  const accessToken = await getAccessToken();

  for (const modelName of modelNames) {
    try {
      const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}:generateContent`;

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      };

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000,
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


const startChatSession = async (req, res) => {
  try {
    console.log("\n========== CHAT SESSION START ==========");
    const patientId = req.user.id;
    console.log(`✅ Patient ID: ${patientId}`);

    // Create new chat session
    const chatSession = await ChatSession.create({
      patientId: patientId,
      status: "active",
    });

    console.log(`✅ Chat session created: ${chatSession.sessionId}`);

    // Create initial welcome message
    const welcomeMessage = await ChatMessage.create({
      sessionId: chatSession.sessionId,
      patientId: patientId,
      messageType: "bot",
      message:
        " Welcome to Healthcare Assistant! How can I help you today?\n\nPlease select an option:\n1️⃣ General Query - Ask any health-related question\n2️⃣ Specific Query - Browse doctors or analyze reports",
      context: {
        step: "initial",
        options: ["general_query", "specific_query"],
      },
    });

    console.log("========== CHAT SESSION START ENDED ==========\n");

    return res.status(201).json({
      success: true,
      message: "Chat session started successfully",
      data: {
        sessionId: chatSession.sessionId,
        status: chatSession.status,
        welcomeMessage: {
          id: welcomeMessage.id,
          messageType: welcomeMessage.messageType,
          message: welcomeMessage.message,
          context: welcomeMessage.context,
          createdAt: welcomeMessage.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error starting chat session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start chat session",
      error: error.message,
    });
  }
};

/**
 * Send message to chatbot (Patient only)
 */
const sendMessage = async (req, res) => {
  try {
    console.log("\n========== PROCESS CHAT MESSAGE ==========");
    const { sessionId } = req.params;
    const { message, selectedOption } = req.body;
    const patientId = req.user.id;

    console.log(`📝 Session: ${sessionId}`);
    console.log(`💬 Message: ${message}`);
    console.log(`🎯 Selected Option: ${selectedOption}`);

    // Verify session exists and belongs to patient
    const session = await ChatSession.findOne({
      where: { sessionId: sessionId, patientId: patientId, status: "active" },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found or inactive",
      });
    }

    // Save user message
    await ChatMessage.create({
      sessionId: sessionId,
      patientId: patientId,
      messageType: "user",
      message: message || selectedOption,
      context: { selectedOption: selectedOption },
    });

    let botResponse;
    let context = {};

    // Route based on selected option
    if (selectedOption === "general_query") {
      // General query - ask for the question
      botResponse = {
        message:
          "💬 Please type your health-related question, and I'll do my best to help you.",
        context: {
          step: "awaiting_general_query",
          queryType: "general",
        },
      };
    } else if (selectedOption === "specific_query") {
      // Specific query - show options
      botResponse = {
        message:
          "🔍 What would you like to do?\n\n1️⃣ Browse Doctors - Find and search for doctors\n2️⃣ Analyze Report - Go to report analysis page",
        context: {
          step: "specific_query_options",
          options: ["browse_doctors", "analyze_report"],
        },
      };
    } else if (selectedOption === "browse_doctors") {
      // Browse doctors - show options
      botResponse = {
        message:
          "👨‍⚕️ How would you like to browse doctors?\n\n1️⃣ All Doctors - View all available doctors\n2️⃣ Specific Doctor - Search by name or specialization",
        context: {
          step: "browse_doctor_options",
          options: ["all_doctors", "specific_doctor"],
        },
      };
    } else if (selectedOption === "analyze_report") {
      // Analyze report - redirect to analysis page
      botResponse = {
        message:
          "📊 Redirecting you to the Report Analysis page...\n\nYou can upload and analyze your medical reports there.",
        context: {
          step: "redirect",
          action: "analyze_report",
          redirectUrl: "/patient/reports",
        },
      };
    } else if (selectedOption === "all_doctors") {
      // Fetch all doctors
      try {
        const doctors = await Doctor.findAll({
          where: { isApproved: true, isActive: true },
          attributes: [
            "id",
            "fullName",
            "specialization",
            "experience",
            "consultationFee",
            "clinicAddress",
          ],
          order: [["createdAt", "DESC"]],
        });

        botResponse = {
          message: `👨‍⚕️ Found ${doctors.length} available doctor(s).\n\nWould you like to:\n1️⃣ See another list\n2️⃣ Search for specific doctor\n3️⃣ Start new query`,
          context: {
            step: "doctors_result",
            doctors: doctors,
            options: ["all_doctors", "specific_doctor", "start_new"],
          },
        };
      } catch (error) {
        console.error("Error fetching doctors:", error);
        botResponse = {
          message:
            "❌ Sorry, I couldn't fetch the doctors list. Please try again.",
          context: { step: "error" },
        };
      }
    } else if (selectedOption === "specific_doctor") {
      // Ask for search keyword
      botResponse = {
        message:
          "🔎 Please enter the doctor's name or specialization you're looking for:",
        context: {
          step: "awaiting_doctor_search",
        },
      };
    } else if (selectedOption === "start_new") {
      // Start new query
      botResponse = {
        message:
          "👋 How can I help you?\n\nPlease select an option:\n1️⃣ General Query - Ask any health-related question\n2️⃣ Specific Query - Browse doctors or analyze reports",
        context: {
          step: "initial",
          options: ["general_query", "specific_query"],
        },
      };
    } else {
      // Check context from last bot message
      const lastBotMessage = await ChatMessage.findOne({
        where: { sessionId: sessionId, messageType: "bot" },
        order: [["createdAt", "DESC"]],
      });

      if (
        lastBotMessage &&
        lastBotMessage.context &&
        lastBotMessage.context.step
      ) {
        const lastStep = lastBotMessage.context.step;

        if (lastStep === "awaiting_general_query") {
          // Call Gemini API for general query
          console.log("🤖 Calling Gemini API for general query...");
          try {
            const prompt = `You are a helpful healthcare assistant. A patient has asked: "${message}". Please provide a helpful, accurate, and empathetic response. Keep it concise and easy to understand. If it's a medical emergency, advise them to seek immediate medical attention.`;

            const aiResponse = await callGeminiAPI(prompt);

            botResponse = {
              message: `${aiResponse}\n\n---\n\nWould you like to:\n1️⃣ Ask another question\n2️⃣ Browse doctors\n3️⃣ Start new query`,
              context: {
                step: "general_query_result",
                options: [
                  "awaiting_general_query",
                  "browse_doctors",
                  "start_new",
                ],
              },
            };
          } catch (error) {
            console.error("Error calling Gemini API:", error);
            botResponse = {
              message:
                "❌ Sorry, I couldn't process your question at the moment. Please try again.",
              context: { step: "error" },
            };
          }
        } else if (lastStep === "awaiting_doctor_search") {
          // Search for doctors
          try {
            const searchQuery = message.trim();
            const doctors = await Doctor.findAll({
              where: {
                isApproved: true,
                isActive: true,
                [require("sequelize").Op.or]: [
                  {
                    fullName: {
                      [require("sequelize").Op.iLike]: `%${searchQuery}%`,
                    },
                  },
                  {
                    specialization: {
                      [require("sequelize").Op.iLike]: `%${searchQuery}%`,
                    },
                  },
                ],
              },
              attributes: [
                "id",
                "fullName",
                "specialization",
                "experience",
                "consultationFee",
                "clinicAddress",
              ],
              order: [["createdAt", "DESC"]],
            });

            botResponse = {
              message: `🔍 Found ${doctors.length} doctor(s) matching "${searchQuery}".\n\nWould you like to:\n1️⃣ Search again\n2️⃣ See all doctors\n3️⃣ Start new query`,
              context: {
                step: "doctors_result",
                doctors: doctors,
                searchQuery: searchQuery,
                options: ["specific_doctor", "all_doctors", "start_new"],
              },
            };
          } catch (error) {
            console.error("Error searching doctors:", error);
            botResponse = {
              message:
                "❌ Sorry, I couldn't search for doctors. Please try again.",
              context: { step: "error" },
            };
          }
        } else {
          botResponse = {
            message:
              "🤔 I didn't understand that. Let's start over.\n\nHow can I help you?\n1️⃣ General Query\n2️⃣ Specific Query",
            context: {
              step: "initial",
              options: ["general_query", "specific_query"],
            },
          };
        }
      } else {
        botResponse = {
          message:
            "🤔 I didn't understand that. Let's start over.\n\nHow can I help you?\n1️⃣ General Query\n2️⃣ Specific Query",
          context: {
            step: "initial",
            options: ["general_query", "specific_query"],
          },
        };
      }
    }

    // Save bot response
    const botMessage = await ChatMessage.create({
      sessionId: sessionId,
      patientId: patientId,
      messageType: "bot",
      message: botResponse.message,
      context: botResponse.context,
    });

    console.log("✅ Bot response sent");
    console.log("========== PROCESS CHAT MESSAGE ENDED ==========\n");

    return res.status(200).json({
      success: true,
      message: "Message processed successfully",
      data: {
        botMessage: {
          id: botMessage.id,
          messageType: botMessage.messageType,
          message: botMessage.message,
          context: botMessage.context,
          createdAt: botMessage.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error processing message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process message",
      error: error.message,
    });
  }
};

/**
 * Get chat history for a session
 */
const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const patientId = req.user.id;

    // Verify session belongs to patient
    const session = await ChatSession.findOne({
      where: { sessionId: sessionId, patientId: patientId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Chat session not found",
      });
    }

    // Get all messages
    const messages = await ChatMessage.findAll({
      where: { sessionId: sessionId },
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Chat history retrieved successfully",
      data: {
        sessionId: session.sessionId,
        status: session.status,
        startedAt: session.startedAt,
        messages: messages,
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
      error: error.message,
    });
  }
};

/**
 * End chat session
 */
const endChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const patientId = req.user.id;

    // Find and update session
    const session = await ChatSession.findOne({
      where: { sessionId: sessionId, patientId: patientId, status: "active" },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Active chat session not found",
      });
    }

    await session.update({
      status: "closed",
      endedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Chat session ended successfully",
    });
  } catch (error) {
    console.error("Error ending chat session:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to end chat session",
      error: error.message,
    });
  }
};

module.exports = {
  startChatSession,
  sendMessage,
  getChatHistory,
  endChatSession,
};
