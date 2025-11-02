const express = require("express");
const router = express.Router();
const {
  uploadReport,
  getPatientReports,
  getReportById,
  deleteReport,
  analyzeReportWithAI,
  getReportAnalytics,
} = require("../../controller/reportController/reportController");
const  checkForAuthenticationCookie  = require("../../middleware/authMiddleware");
const upload = require("../../cloudServices/upload");

router.post(
  "/upload",
  checkForAuthenticationCookie('token'),
  upload.single("file"), 
  uploadReport
);


router.get(
  "/my-reports",
  checkForAuthenticationCookie('token'),
  
  getPatientReports
);


router.get(
  "/:reportId",
  checkForAuthenticationCookie('token'),
 
  getReportById
);


router.delete(
  "/:reportId",
  checkForAuthenticationCookie('token'),
 
  deleteReport
);



router.post(
  "/:reportId/analyze",
  checkForAuthenticationCookie('token'),
  analyzeReportWithAI
);


router.get(
  "/:reportId/analytics",
  checkForAuthenticationCookie('token'),
  getReportAnalytics
);

module.exports = router;
