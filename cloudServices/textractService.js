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
    console.log("\n   🔧 [Textract Service] Starting text extraction...");
    console.log(`   🔧 [Textract Service] AWS Region: ${process.env.AWS_REGION_S3}`);
    console.log(`   🔧 [Textract Service] Bucket: ${bucketName}`);
    console.log(`   🔧 [Textract Service] File: ${fileName}`);
    
    const params = {
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: fileName,
        },
      },
    };

    console.log("   🔧 [Textract Service] Sending DetectDocumentText command to AWS...");
    const command = new DetectDocumentTextCommand(params);
    const response = await textractClient.send(command);
    console.log("   🔧 [Textract Service] ✅ Received response from AWS Textract");

    // Extract all text from blocks
    console.log("   🔧 [Textract Service] Processing blocks...");
    let extractedText = "";
    const lines = [];
    const words = [];

    if (response.Blocks) {
      console.log(`   🔧 [Textract Service] Total blocks received: ${response.Blocks.length}`);
      
      let lineCount = 0;
      let wordCount = 0;
      let pageCount = 0;
      
      response.Blocks.forEach((block) => {
        if (block.BlockType === "LINE") {
          lines.push(block.Text);
          extractedText += block.Text + "\n";
          lineCount++;
        } else if (block.BlockType === "WORD") {
          words.push(block.Text);
          wordCount++;
        } else if (block.BlockType === "PAGE") {
          pageCount++;
        }
      });
      
      console.log(`   🔧 [Textract Service] Processed: ${pageCount} pages, ${lineCount} lines, ${wordCount} words`);
    } else {
      console.log("   🔧 [Textract Service] ⚠️ No blocks found in response");
    }

    console.log(`   🔧 [Textract Service] Document metadata:`, response.DocumentMetadata);
    console.log("   🔧 [Textract Service] ✅ Text extraction completed successfully");

    return {
      success: true,
      fullText: extractedText.trim(),
      lines: lines,
      words: words,
      documentMetadata: response.DocumentMetadata,
      blockCount: response.Blocks ? response.Blocks.length : 0,
    };
  } catch (error) {
    console.log("   🔧 [Textract Service] ❌ ERROR during text extraction");
    console.error("   🔧 [Textract Service] Error type:", error.name);
    console.error("   🔧 [Textract Service] Error message:", error.message);
    console.error("   🔧 [Textract Service] Error code:", error.code || error.$metadata?.httpStatusCode);
    console.error("   🔧 [Textract Service] Full error:", error);
    throw new Error(`Textract extraction failed: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF,
};
