const express = require("express");
const router = express.Router();
const {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
} = require("../../controller/patientController/patientController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");

router.post("/register", registerPatient);
router.post("/login", loginPatient);

router.get("/profile",checkForAuthenticationCookie('token') , getPatientProfile);
router.put("/profile",checkForAuthenticationCookie('token') ,updatePatientProfile);

module.exports = router;
