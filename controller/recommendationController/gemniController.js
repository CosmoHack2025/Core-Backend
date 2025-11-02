const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const { Analytics, Recommendation, Patient } = require("../../model");



// Vertex AI Configuration
const PROJECT_ID = process.env.VERTEX_PROJECT_ID || 'dolet-app';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!PROJECT_ID) {
  console.error("VERTEX_PROJECT_ID not set in environment");
}



// Initialize Google Auth
let auth;
try {
  auth = new GoogleAuth({
    keyFilename: SERVICE_ACCOUNT_KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  console.log(" Google Auth initialized for Vertex AI");
} catch (err) {
  console.error(" Failed to initialize Google Auth:", err.message);
}




function extractAiText(response) {
  try {
    const candidates = response?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        return parts[0]?.text || null;
      }
    }
    return null;
  } catch (err) {
    console.error("Error extracting AI text:", err);
    return null;
  }
}


async function getAccessToken() {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  } catch (err) {
    console.error("Failed to get access token:", err);
    throw new Error('Authentication failed: ' + err.message);
  }
}


async function generateWithVertexAI(prompt) {
  // Try Gemini 2.5 models first (newest), then fallback to 1.5
  const modelNames = [
    "gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"
  ];

  let lastError = null;
  
  // Get OAuth2 access token
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    throw new Error('Failed to authenticate with Google Cloud: ' + err.message);
  }
  
  for (const modelName of modelNames) {
    try {
      console.log(` Trying Vertex AI model: ${modelName}`);
      
      // Vertex AI REST API endpoint
      const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelName}:generateContent`;
      
      console.log(`📍 Endpoint: ${endpoint}`);
      
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
      };

      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',  
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 1200000
      });

      console.log(` Model ${modelName} succeeded`);
      return response.data;
      
    } catch (err) {
      lastError = err;
      const errorMsg = err?.response?.data?.error?.message || err.message;
      const errorStatus = err?.response?.status;
      console.warn(` Model ${modelName} failed (${errorStatus}):`, errorMsg);
      
      // Log more details for debugging
      if (err?.response?.data) {
        console.warn('Full error response:', JSON.stringify(err.response.data, null, 2));
      }
    }
  }

  throw lastError || new Error('All Vertex AI models failed');
}


const generateHealthRecommendations = async (req, res) => {
  try {
    console.log('\n========== HEALTH RECOMMENDATION GENERATION STARTED ==========');
    console.log('📋 [STEP 1] Fetching analytics data...');

    // Validate auth
    if (!auth) {
      console.error('❌ Google Auth not initialized');
      return res.status(500).json({
        success: false,
        message: "Server configuration error: Google Auth not initialized.",
      });
    }

    // Get analyticsId from request body
    const { analyticsId } = req.body;

    if (!analyticsId) {
      console.error('❌ Validation failed: analyticsId missing');
      return res.status(400).json({
        success: false,
        message: "analyticsId is required in request body.",
      });
    }

    console.log(`🔍 Fetching analytics with ID: ${analyticsId}`);

    // Fetch analytics from database
    const analytics = await Analytics.findByPk(analyticsId, {
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!analytics) {
      console.error('❌ Analytics not found');
      return res.status(404).json({
        success: false,
        message: "Analytics not found with the provided ID.",
      });
    }

    // Check if diagnosis exists
    if (!analytics.diagnosis || !analytics.diagnosis.prediction) {
      console.error('❌ No diagnosis found in analytics');
      return res.status(400).json({
        success: false,
        message: "No diagnosis found in analytics. Please analyze the report first.",
      });
    }

    const { prediction, confidence } = analytics.diagnosis;
    console.log(`✅ Diagnosis fetched: ${prediction} (Confidence: ${confidence || 'N/A'})`);

    // Build health recommendation prompt
    console.log('📝 [STEP 2] Building health recommendation prompt...');
    
    const healthRecommendationPrompt = `You are a professional healthcare advisor AI. Based on the following diagnosis, provide comprehensive, actionable, and patient-friendly health recommendations.

**Diagnosis:** ${prediction}
**Confidence Level:** ${confidence ? (confidence * 100).toFixed(2) + '%' : 'Not specified'}

Please provide recommendations in the following structured format:

## Overview
[Brief explanation of the condition in simple terms]

## Lifestyle Recommendations
- [List specific lifestyle changes]
- [Include diet, exercise, sleep habits]
- [Daily routine adjustments]

## Dietary Guidelines
- [Foods to include]
- [Foods to avoid]
- [Meal timing and portion suggestions]

## Medical Care
- [When to consult a doctor]
- [Regular check-ups needed]
- [Medications or treatments to discuss with healthcare provider]

## Warning Signs
- [Symptoms that require immediate medical attention]
- [When to go to emergency room]

## Self-Monitoring
- [What to track daily/weekly]
- [Tools or apps that can help]
- [Target ranges for measurements]

## Additional Resources
- [Support groups or communities]
- [Reliable information sources]

Please provide practical, evidence-based advice that a patient can easily understand and implement. Be empathetic, clear, and encouraging in your tone.`;

    console.log('✅ Prompt built successfully');

    // Generate recommendations using Vertex AI
    console.log('🤖 [STEP 3] Calling Vertex AI to generate recommendations...');
    let aiResp = null;
    try {
      aiResp = await generateWithVertexAI(healthRecommendationPrompt);
      console.log('✅ AI response received');
    } catch (err) {
      console.error("❌ Vertex AI generation failed:", err.message);
      return res.status(500).json({
        success: false,
        message: "Failed to generate recommendations with AI.",
        error: err?.message || String(err),
      });
    }

    // Extract recommendations from response
    console.log('📄 [STEP 4] Extracting recommendations from AI response...');
    const recommendations = extractAiText(aiResp);

    if (!recommendations) {
      console.error('❌ No recommendations found in AI response');
      return res.status(500).json({
        success: false,
        message: "No recommendations content in AI response",
        response: aiResp,
      });
    }

    console.log(`✅ Recommendations extracted (${recommendations.length} characters)`);

    console.log('💾 [STEP 5] Saving recommendations to database...');

    // Check if recommendation already exists for this analytics
    let recommendation = await Recommendation.findOne({
      where: { analyticsId: analytics.id },
    });

    const recommendationData = {
      analyticsId: analytics.id,
      patientId: analytics.patientId,
      reportId: analytics.reportId,
      recommendations: recommendations, // Save the AI-generated text
      status: "generated",
    };

    if (recommendation) {
      // Update existing recommendation
      await recommendation.update(recommendationData);
      console.log(`✅ Recommendation updated with ID: ${recommendation.id}`);
    } else {
      // Create new recommendation
      recommendation = await Recommendation.create(recommendationData);
      console.log(`✅ Recommendation created with ID: ${recommendation.id}`);
    }

    console.log('✨ [STEP 6] Sending response to client...');
    console.log('========== HEALTH RECOMMENDATION GENERATION ENDED (SUCCESS) ==========\n');

    // Send response with recommendations
    return res.status(200).json({
      success: true,
      message: 'Health recommendations generated and saved successfully',
      data: {
        recommendationId: recommendation.id,
        analyticsId: analytics.id,
        patientId: analytics.patientId,
        patientName: analytics.patient.fullName,
        diagnosis: {
          prediction: prediction,
          confidence: confidence,
        },
        recommendations: recommendations,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt,
      }
    });

  } catch (error) {
    console.error("❌ [ERROR] generateHealthRecommendations failed:", error.message);
    console.log('========== HEALTH RECOMMENDATION GENERATION ENDED (ERROR) ==========\n');
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error?.message ?? String(error)
    });
  }
};


const getRecommendationByAnalytics = async (req, res) => {
  try {
    console.log('\n========== GET RECOMMENDATION STARTED ==========');
    const { analyticsId } = req.params;
   
    console.log(`🔍 [STEP 1] Fetching recommendation for analytics ID: ${analyticsId}`);

    // Fetch recommendation with analytics and patient details
    const recommendation = await Recommendation.findOne({
      where: { analyticsId: analyticsId },
      include: [
        {
          model: Analytics,
          as: "analytics",
          attributes: ["id", "diagnosis", "severity", "status"],
        },
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!recommendation) {
      console.log("❌ No recommendation found for this analytics");
      return res.status(404).json({
        success: false,
        message: "No recommendation found for this analytics. Please generate recommendations first.",
      });
    }

    console.log(`✅ Recommendation found: ${recommendation.id}`);

 

    console.log('✨ [STEP 2] Sending recommendation data...');
    console.log('========== GET RECOMMENDATION ENDED (SUCCESS) ==========\n');

    return res.status(200).json({
      success: true,
      message: "Recommendation retrieved successfully",
     data : recommendation,
    });
  } catch (error) {
    console.error("❌ [ERROR] getRecommendationByAnalytics failed:", error.message);
    console.log('========== GET RECOMMENDATION ENDED (ERROR) ==========\n');
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve recommendation",
      error: error?.message ?? String(error),
    });
  }
};

module.exports = {
  generateHealthRecommendations,
  getRecommendationByAnalytics,
};
