const express = require("express");
const router = express.Router();
const {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
} = require("../../controller/doctorController/doctorController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");


router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.get("/profile",checkForAuthenticationCookie('token') ,  getDoctorProfile);
router.put("/profile",checkForAuthenticationCookie('token') , updateDoctorProfile);

module.exports = router;
