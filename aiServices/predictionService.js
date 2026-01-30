const axios = require("axios");

const AI_MODEL_API = process.env.AI_MODEL_API || "http://localhost:8000/predict";

/**
 * Extract numerical features from extracted text
 * Looks for patterns like "Feature X" followed by numbers
 * @param {Array<string>} lines - Array of text lines from Textract
 * @returns {Array<number>} - Array of extracted feature values
 */
const extractFeaturesFromLines = (lines) => {
  console.log("\n   🔢 [Feature Extraction] Starting feature extraction...");
  const features = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line contains "Feature" followed by a number
    if (line.match(/^Feature\s+\d+$/i)) {
      // The next line should contain the value
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // Try to parse as a number
        const value = parseFloat(nextLine);
        
        if (!isNaN(value)) {
          features.push(value);
          console.log(`   🔢 [Feature Extraction] ${line}: ${value}`);
        }
      }
    }
  }
  
  console.log(`   🔢 [Feature Extraction] ✅ Extracted ${features.length} features`);
  return features;
};

/**
 * Alternative extraction: Extract all numbers from text
 * Use this if the pattern-based extraction doesn't work
 * @param {string} fullText - Complete extracted text
 * @returns {Array<number>} - Array of all numbers found
 */
const extractAllNumbers = (fullText) => {
  console.log("\n   🔢 [Feature Extraction] Using fallback: extracting all numbers...");
  const numberPattern = /\d+\.\d+/g;
  const matches = fullText.match(numberPattern);
  
  if (!matches) {
    console.log("   🔢 [Feature Extraction] ⚠️ No numbers found in text");
    return [];
  }
  
  const numbers = matches.map(m => parseFloat(m));
  console.log(`   🔢 [Feature Extraction] ✅ Extracted ${numbers.length} numbers`);
  return numbers;
};

/**
 * Call AI prediction API with extracted features
 * @param {Array<number>} features - Array of feature values
 * @returns {Promise<Object>} - Prediction result from AI model
 */
const callPredictionAPI = async (features) => {
  try {
    console.log("\n   🤖 [AI Prediction] Calling AI model API...");
    console.log(`   🤖 [AI Prediction] API URL: ${AI_MODEL_API}`);
    console.log(`   🤖 [AI Prediction] Number of features: ${features.length}`);
    console.log(`   🤖 [AI Prediction] Features:`, features);
    
    const payload = { features };
    
    console.log(`   🤖 [AI Prediction] Sending POST request...`);
    const response = await axios.post(AI_MODEL_API, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 seconds timeout
    });
    
    console.log("   🤖 [AI Prediction] ✅ Received response from AI model");
    console.log("   🤖 [AI Prediction] Response data:", response.data);
    
    return {
      success: true,
      prediction: response.data,
      statusCode: response.status,
    };
  } catch (error) {
    console.log("   🤖 [AI Prediction] ❌ Error calling AI model API");
    console.error("   🤖 [AI Prediction] Error type:", error.name);
    console.error("   🤖 [AI Prediction] Error message:", error.message);
    
    if (error.response) {
      console.error("   🤖 [AI Prediction] Response status:", error.response.status);
      console.error("   🤖 [AI Prediction] Response data:", error.response.data);
    }
    
    throw new Error(`AI Prediction API failed: ${error.message}`);
  }
};

module.exports = {
  extractFeaturesFromLines,
  extractAllNumbers,
  callPredictionAPI,
};
