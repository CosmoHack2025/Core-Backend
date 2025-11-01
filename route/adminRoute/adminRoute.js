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
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

router.get("/profile", checkForAuthenticationCookie("token"), getAdminProfile);
router.get(
  "/doctors/pending",
  checkForAuthenticationCookie("token"),
  getPendingDoctors
);
router.get(
  "/doctors/all",
  checkForAuthenticationCookie("token"),
  getAllDoctors
);
router.put(
  "/doctors/:doctorId/approve",
  checkForAuthenticationCookie("token"),
  approveDoctor
);
router.put(
  "/doctors/:doctorId/reject",
  checkForAuthenticationCookie("token"),
  rejectDoctor
);

module.exports = router;
