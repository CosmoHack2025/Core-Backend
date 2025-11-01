const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllDoctors,
} = require("../../controller/adminController/adminController");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/profile",  getAdminProfile);
router.get("/doctors/pending",getPendingDoctors);
router.get("/doctors/all", getAllDoctors);
router.put("/doctors/:doctorId/approve", approveDoctor);
router.put("/doctors/:doctorId/reject",rejectDoctor);

module.exports = router;
