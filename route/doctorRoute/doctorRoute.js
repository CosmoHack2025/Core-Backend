const express = require("express");
const router = express.Router();
const {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
} = require("../../controller/doctorController/doctorController");


router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.get("/profile",  getDoctorProfile);
router.put("/profile", updateDoctorProfile);

module.exports = router;
