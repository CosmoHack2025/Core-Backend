const express = require("express");
const router = express.Router();
const upload = require("../../cloudServices/upload");
const {
  uploadReport,
  getPatientReports,
  getReportById,
  deleteReport,
} = require("../../controller/reportController/reportController");
const  checkForAuthenticationCookie  = require("../../middleware/authMiddleware");

router.post(
  "/upload",
  checkForAuthenticationCookie('token'),
 
  upload.single("reportFile"), 
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

module.exports = router;
