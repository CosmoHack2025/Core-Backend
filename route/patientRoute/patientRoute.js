const express = require("express");
const router = express.Router();
const {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
} = require("../../controller/patientController/patientController");

router.post("/register", registerPatient);
router.post("/login", loginPatient);

router.get("/profile", getPatientProfile);
router.put("/profile",updatePatientProfile);

module.exports = router;
