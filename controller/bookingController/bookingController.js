const { Booking, Doctor, Patient } = require("../../model");
const {
  sendBookingNotificationToDoctor,
  sendBookingResponseToPatient,
} = require("../../emailService/bookingEmailService");

const createBooking = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      doctorId,
      appointmentType,
      appointmentDate,
      appointmentTime,
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      reasonForConsultation,
      currentMedications,
      knownAllergies,
    } = req.body;


    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (!doctor.isApproved) {
      return res.status(400).json({ message: "Doctor is not approved yet" });
    }

    // Create booking
    const booking = await Booking.create({
      patientId,
      doctorId,
      appointmentType,
      appointmentDate,
      appointmentTime,
      fullName,
      email,
      phoneNumber,
      dateOfBirth,
      reasonForConsultation,
      currentMedications,
      knownAllergies,
      status: "pending",
    });

    // Send email notification to doctor
    try {
      await sendBookingNotificationToDoctor(doctor.email, booking, doctor.fullName);
    } catch (emailError) {
      console.error("Error sending email to doctor:", emailError);
    }

    res.status(201).json({
      message: "Booking created successfully. Waiting for doctor's confirmation.",
     data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getDoctorBookings = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status } = req.query;

    const whereClause = { doctorId };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email", "phoneNumber"],
        },
      ],
      order: [["appointmentDate", "ASC"], ["appointmentTime", "ASC"]],
    });

    res.status(200).json({
      message: "Bookings retrieved successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get doctor bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDoctorBookingById = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      where: { id: bookingId, doctorId },
      include: [
        {
          model: Patient,
          as: "patient",
          attributes: ["id", "fullName", "email", "phoneNumber", "bloodGroup", "medicalHistory", "allergies"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ data : booking });
  } catch (error) {
    console.error("Get doctor booking by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const respondToBooking = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { bookingId } = req.params;
    const { status, doctorResponse, meetingLink } = req.body;

  
    const booking = await Booking.findOne({
      where: { id: bookingId, doctorId },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }

    await booking.update({
      status,
      doctorResponse,
      meetingLink: meetingLink || null,
      respondedAt: new Date(),
    });

    // Send email to patient
    try {
      await sendBookingResponseToPatient(booking.email, booking, status, doctorResponse, meetingLink);
    } catch (emailError) {
      console.error("Error sending email to patient:", emailError);
    }

    res.status(200).json({
      message: `Booking ${status} successfully`,
     data: booking,
    });
  } catch (error) {
    console.error("Respond to booking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPatientBookings = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status } = req.query;

    const whereClause = { patientId };
    if (status) {
      whereClause.status = status;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "fullName", "email", "phoneNumber", "specialization", "qualification"],
        },
      ],
      order: [["appointmentDate", "ASC"], ["appointmentTime", "ASC"]],
    });

    res.status(200).json({
      message: "Bookings retrieved successfully",
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get patient bookings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPatientBookingById = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { bookingId } = req.params;

    const booking = await Booking.findOne({
      where: { id: bookingId, patientId },
      include: [
        {
          model: Doctor,
          as: "doctor",
          attributes: ["id", "fullName", "email", "phoneNumber", "specialization", ],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ data: booking });
  } catch (error) {
    console.error("Get patient booking by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBooking,
  getDoctorBookings,
  getDoctorBookingById,
  respondToBooking,
  getPatientBookings,
  getPatientBookingById,
};
