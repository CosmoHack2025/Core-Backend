const { Report, Patient } = require("../../model");
const { extractTextFromPDF } = require("../../cloudServices/textractService");

/**
 * Upload PDF report and extract text using AWS Textract
 */
const uploadReport = async (req, res) => {
  try {
    const patientId = req.user.id; // From auth middleware
    const userRole = req.user.role; // From auth middleware

    // Ensure only patients can upload reports
    if (userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can upload reports",
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a PDF file.",
      });
    }

    // Verify patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const fileUrl = req.file.location; // S3 file URL
    const fileName = req.file.key; // S3 file key
    const notes = req.body.notes || "";

    // Create report record with "processing" status
    const report = await Report.create({
      patientId: patientId,
      file: fileUrl,
      status: "processing",
      notes: notes,
    });

    // Extract text from PDF using AWS Textract
    let extractedData;
    try {
      extractedData = await extractTextFromPDF(
        process.env.AWS_BUCKET_NAME,
        fileName
      );

      // Update report status to "analyzed"
      await report.update({
        status: "analyzed",
      });
    } catch (textractError) {
      console.error("Textract error:", textractError);
      
      // Update report status to "failed"
      await report.update({
        status: "failed",
      });

      return res.status(500).json({
        success: false,
        message: "PDF uploaded but text extraction failed",
        reportId: report.id,
        fileUrl: fileUrl,
        error: textractError.message,
      });
    }

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
    console.error("Error uploading report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload report",
      error: error.message,
    });
  }
};

/**
 * Get all reports for the logged-in patient
 */
const getPatientReports = async (req, res) => {
  try {
    const patientId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view their reports",
      });
    }

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
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: Patient,
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Patients can only view their own reports
    // Doctors and admins can view any report (you can adjust this logic)
    if (userRole === "patient" && report.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this report",
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

/**
 * Delete a report
 */
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findByPk(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Only the patient who uploaded can delete (or admin)
    if (userRole === "patient" && report.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this report",
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

module.exports = {
  uploadReport,
  getPatientReports,
  getReportById,
  deleteReport,
};
