const { TextractClient, DetectDocumentTextCommand } = require("@aws-sdk/client-textract");

// Initialize Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * Extract text from PDF using AWS Textract
 * @param {string} bucketName - S3 bucket name
 * @param {string} fileName - S3 object key (file name)
 * @returns {Promise<Object>} - Extracted text and metadata
 */
const extractTextFromPDF = async (bucketName, fileName) => {
  try {
    const params = {
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: fileName,
        },
      },
    };

    const command = new DetectDocumentTextCommand(params);
    const response = await textractClient.send(command);

    // Extract all text from blocks
    let extractedText = "";
    const lines = [];
    const words = [];

    if (response.Blocks) {
      response.Blocks.forEach((block) => {
        if (block.BlockType === "LINE") {
          lines.push(block.Text);
          extractedText += block.Text + "\n";
        } else if (block.BlockType === "WORD") {
          words.push(block.Text);
        }
      });
    }

    return {
      success: true,
      fullText: extractedText.trim(),
      lines: lines,
      words: words,
      documentMetadata: response.DocumentMetadata,
      blockCount: response.Blocks ? response.Blocks.length : 0,
    };
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error(`Textract extraction failed: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF,
};
