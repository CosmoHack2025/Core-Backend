const express = require("express");
const router = express.Router();
const {
  createBooking,
  getDoctorBookings,
  getDoctorBookingById,
  respondToBooking,
} = require("../../controller/bookingController/bookingController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");

// Patient routes
router.post("/create", checkForAuthenticationCookie("token"), createBooking);


// Doctor routes
router.get(
  "/doctor/all",
  checkForAuthenticationCookie("token"),
  getDoctorBookings
);
router.get(
  "/doctor/:bookingId",
  checkForAuthenticationCookie("token"),
  getDoctorBookingById
);
router.put(
  "/doctor/:bookingId/respond",
  checkForAuthenticationCookie("token"),
  respondToBooking
);

module.exports = router;
