const { Report, Patient, Analytics } = require("../../model");
const { extractTextFromPDF } = require("../../cloudServices/textractService");
const {
  extractFeaturesFromLines,
  extractAllNumbers,
  callPredictionAPI,
} = require("../../aiServices/predictionService");


const calculateSeverity = (confidence) => {
  const confidencePercentage = confidence * 100;
  
  if (confidencePercentage < 30) {
    return "low";
  } else if (confidencePercentage >= 30 && confidencePercentage < 50) {
    return "moderate";
  } else if (confidencePercentage >= 50 && confidencePercentage < 80) {
    return "high";
  } else {
    return "critical";
  }
};


const uploadReport = async (req, res) => {
  try {
    console.log("\n========== REPORT UPLOAD STARTED ==========");
    console.log("📥 Step 1: Received upload request");
    
    const patientId = req.user.id;
    console.log(`✅ Patient ID from auth: ${patientId}`);


    // Check if file was uploaded
    console.log("\n📄 Step 2: Checking if file was uploaded...");
    if (!req.file) {
      console.log("❌ No file found in request");
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a PDF file.",
      });
    }
    console.log("✅ File found in request:");
    console.log(`   - Original name: ${req.file.originalname}`);
    console.log(`   - Size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - MIME type: ${req.file.mimetype}`);

    // Verify patient exists
    console.log("\n🔍 Step 3: Verifying patient exists in database...");
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      console.log("❌ Patient not found in database");
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    console.log(`✅ Patient found: ${patient.fullName} (${patient.email})`);

    const fileUrl = req.file.location; // S3 file URL
    const fileName = req.file.key; // S3 file key
    const notes = req.body.notes || "";

    console.log("\n☁️ Step 4: File uploaded to S3:");
    console.log(`   - S3 URL: ${fileUrl}`);
    console.log(`   - S3 Key: ${fileName}`);
    console.log(`   - Bucket: ${process.env.AWS_BUCKET_NAME}`);
    console.log(`   - Notes: ${notes || '(none)'}`);

    // Create report record with "processing" status
    console.log("\n💾 Step 5: Creating report record in database...");
    const report = await Report.create({
      patientId: patientId,
      file: fileUrl,
      status: "processing",
      notes: notes,
    });
    console.log(`✅ Report created with ID: ${report.id}`);
    console.log(`   - Status: ${report.status}`);
    console.log(`   - Created at: ${report.createdAt}`);

    // Extract text from PDF using AWS Textract
    console.log("\n🤖 Step 6: Starting AWS Textract text extraction...");
    console.log(`   - Bucket: ${process.env.AWS_BUCKET_NAME}`);
    console.log(`   - File: ${fileName}`);
    
    let extractedData;
    try {
      extractedData = await extractTextFromPDF(
        process.env.AWS_BUCKET_NAME,
        fileName
      );
      console.log("✅ Textract extraction completed successfully!");
      console.log(`   - Blocks found: ${extractedData.blockCount}`);
      console.log(`   - Lines extracted: ${extractedData.lines.length}`);
      console.log(`   - Words extracted: ${extractedData.words.length}`);
      console.log(`   - Total characters: ${extractedData.fullText.length}`);
      console.log(`   - Document pages: ${extractedData.documentMetadata?.Pages || 'N/A'}`);

      // Update report status to "analyzed" and save extracted text
      console.log("\n📝 Step 7: Updating report with extracted data...");
      await report.update({
        status: "analyzed",
        extractedText: extractedData.fullText,
        extractedLines: extractedData.lines,
        wordCount: extractedData.words.length,
        blockCount: extractedData.blockCount,
        documentMetadata: extractedData.documentMetadata,
      });
      console.log("✅ Report updated with extracted data");
      console.log("✅ Report status updated to 'analyzed'");
    } catch (textractError) {
      console.log("\n❌ Step 7: Textract extraction FAILED!");
      console.error("Textract error details:", textractError);
      
      // Update report status to "failed"
      console.log("⚠️ Updating report status to 'failed'...");
      await report.update({
        status: "failed",
      });
      console.log("✅ Report status updated to 'failed'");
      console.log("========== REPORT UPLOAD ENDED (WITH TEXTRACT ERROR) ==========\n");

      return res.status(500).json({
        success: false,
        message: "PDF uploaded but text extraction failed",
        reportId: report.id,
        fileUrl: fileUrl,
        error: textractError.message,
      });
    }

    console.log("\n✨ Step 8: Preparing response...");
    console.log("✅ All steps completed successfully!");
    console.log("========== REPORT UPLOAD ENDED (SUCCESS) ==========\n");

    return res.status(201).json({
      success: true,
      message: "Report uploaded and text extracted successfully",
      data: {
        report: {
          id: report.id,
          patientId: report.patientId,
          fileUrl: report.file,
          status: report.status,
          notes: report.notes,
          createdAt: report.createdAt,
        },
        extractedText: {
          fullText: extractedData.fullText,
          lines: extractedData.lines,
          wordCount: extractedData.words.length,
          blockCount: extractedData.blockCount,
          documentMetadata: extractedData.documentMetadata,
        },
      },
    });
  } catch (error) {
    console.log("\n💥 CRITICAL ERROR in uploadReport controller!");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    console.log("========== REPORT UPLOAD ENDED (ERROR) ==========\n");
    
    return res.status(500).json({
      success: false,
      message: "Failed to upload report",
      error: error.message,
    });
  }
};


const getPatientReports = async (req, res) => {
  try {
    const patientId = req.user.id;

    const reports = await Report.findAll({
      where: { patientId: patientId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching patient reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: error.message,
    });
  }
};

/**
 * Get a specific report by ID
 */
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;


    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch report",
      error: error.message,
    });
  }
};


const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
  
    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    await report.destroy();

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
};


const analyzeReportWithAI = async (req, res) => {
  try {
    console.log("\n========== AI REPORT ANALYSIS STARTED ==========");
    const { reportId } = req.params;
    const userId = req.user.id;

    console.log(`📊 Step 1: Fetching report from database`);
    console.log(`   - Report ID: ${reportId}`);

    // Fetch the report with extracted text
    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!report) {
      console.log("❌ Report not found");
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    console.log(`✅ Report found: ${report.id}`);
    console.log(`   - Status: ${report.status}`);
    console.log(`   - Patient: ${report.patient.fullName}`);
    console.log(`   - File URL: ${report.file}`);
    console.log(`   - Has extracted text: ${!!report.extractedText}`);
    console.log(`   - Has extracted lines: ${!!report.extractedLines}`);
    console.log(`   - Word count: ${report.wordCount || 0}`);
    console.log(`   - Block count: ${report.blockCount || 0}`);


    
    // Check if report has been analyzed
    if (report.status !== "analyzed") {
      console.log(`❌ Report status is '${report.status}', not 'analyzed'`);
      return res.status(400).json({
        success: false,
        message: `Report must be analyzed first. Current status: ${report.status}`,
      });
    }


    // Check if report has been analyzed
    if (report.status !== "analyzed") {
      console.log(`❌ Report status is '${report.status}', not 'analyzed'`);
      return res.status(400).json({
        success: false,
        message: `Report must be analyzed first. Current status: ${report.status}`,
      });
    }

    // Check if extracted text exists in database
    if (!report.extractedText && !report.extractedLines) {
      console.log("❌ No extracted text found in database");
      return res.status(400).json({
        success: false,
        message: "No extracted text available for this report. Please re-upload the report.",
      });
    }

    console.log("\n🔢 Step 2: Extracting numerical features from database text...");
    
    // Try pattern-based extraction first using the lines array
    let features = extractFeaturesFromLines(report.extractedLines || []);
    
    // If pattern-based extraction didn't find enough features, try extracting all numbers
    if (features.length === 0) {
      console.log("   ⚠️ Pattern-based extraction found 0 features, trying fallback...");
      features = extractAllNumbers(report.extractedText || "");
    }

    if (features.length === 0) {
      console.log("❌ No numerical features found in report");
      return res.status(400).json({
        success: false,
        message: "No numerical features found in the report for analysis",
      });
    }

    console.log(`✅ Extracted ${features.length} features:`, features);

    console.log("\n🤖 Step 3: Calling AI prediction API...");
    let predictionResult;
    try {
      predictionResult = await callPredictionAPI(features);
      console.log("✅ AI prediction completed successfully");
      console.log("   AI Response:", predictionResult.prediction);
    } catch (error) {
      console.log("❌ AI prediction failed");
      return res.status(500).json({
        success: false,
        message: "Failed to get prediction from AI model",
        error: error.message,
      });
    }

    console.log("\n� Step 4: Generating health recommendations...");
    
    // Generate health recommendations based on diagnosis
 

    console.log("\n�💾 Step 5: Saving analytics to database...");
    
    // Check if analytics already exists for this report
    let analytics = await Analytics.findOne({
      where: { reportId: report.id }
    });

    // Calculate severity based on confidence score
    const confidence = predictionResult.prediction.confidence;
    const severity = calculateSeverity(confidence);
    console.log(`    Confidence: ${(confidence * 100).toFixed(2)}% → Severity: ${severity.toUpperCase()}`);
    
    const analyticsData = {
      reportId: report.id,
      patientId: report.patientId,
      diagnosis: {
        prediction: predictionResult.prediction.prediction,
        confidence: predictionResult.prediction.confidence,
      },
      severity: severity,
      processedData: {
        aiPrediction: predictionResult.prediction,
        features: features,
        featureCount: features.length,
      
        analyzedAt: new Date(),
      },
      status: "completed",
    };

    console.log("   Saving diagnosis:", analyticsData.diagnosis);
    console.log("   Severity level:", severity);


    if (analytics) {
      // Update existing analytics
      await analytics.update(analyticsData);
      console.log(`✅ Analytics updated with ID: ${analytics.id}`);
    } else {
      // Create new analytics
      analytics = await Analytics.create(analyticsData);
      console.log(`✅ Analytics created with ID: ${analytics.id}`);
    }

    console.log("\n✨ Step 5: Preparing response...");
    console.log("✅ All steps completed successfully!");
    console.log("========== AI REPORT ANALYSIS ENDED (SUCCESS) ==========\n");

    return res.status(200).json({
      success: true,
      message: "Report analyzed successfully and saved to analytics",
      data: {
        reportId: report.id,
        patientId: report.patientId,
        patientName: report.patient.fullName,
        fileUrl: report.file,
        features: {
          count: features.length,
          values: features,
        },
        aiPrediction: predictionResult.prediction,
        severity: severity,
        analytics: {
          id: analytics.id,
          status: analytics.status,
          severity: severity,
          createdAt: analytics.createdAt,
          updatedAt: analytics.updatedAt,
        },
        analyzedAt: new Date(),
      },
    });
  } catch (error) {
    console.log("\n💥 CRITICAL ERROR in analyzeReportWithAI!");
    console.error("Error details:", error);
    console.error("Error stack:", error.stack);
    console.log("========== AI REPORT ANALYSIS ENDED (ERROR) ==========\n");

    return res.status(500).json({
      success: false,
      message: "Failed to analyze report",
      error: error.message,
    });
  }
};

/**
 * Get analytics for a specific report
 */
const getReportAnalytics = async (req, res) => {
  try {
    const { reportId } = req.params;

    console.log(`\n📊 Fetching analytics for report: ${reportId}`);

    // First, verify the report exists and user has access
    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }


    // Fetch analytics
    const analytics = await Analytics.findOne({
      where: { reportId: reportId },
      include: [
        {
          model: Report,
          as: "report",
          attributes: ["id", "file", "status", "createdAt"],
        },
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email"],
        },
      ],
    });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "No analytics found for this report. Please analyze the report first.",
      });
    }

    console.log(`✅ Analytics found: ${analytics.id}`);

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: error.message,
    });
  }
};

module.exports = {
  uploadReport,
  getPatientReports,
  getReportById,
  deleteReport,
  analyzeReportWithAI,
  getReportAnalytics,
};
