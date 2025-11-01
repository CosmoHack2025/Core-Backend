const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Doctor } = require("../../model");
const { createToken } = require("../../authServices/authService");
const setTokenCookie = require("../../authServices/setTokenCookie");
const clearTokenCookie = require("../../authServices/clearTokenCookie");

const registerDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      specialization,
      licenseNumber,
      phoneNumber,
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ where: { email } });
    if (existingDoctor) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if license number already exists
    if (licenseNumber) {
      const existingLicense = await Doctor.findOne({ where: { licenseNumber } });
      if (existingLicense) {
        return res.status(400).json({ message: "License number already registered" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create doctor (pending approval)
    const doctor = await Doctor.create({
      email,
      password: hashedPassword,
      fullName,
      specialization,
      licenseNumber,
      phoneNumber,
      isApproved: false,
    role: "doctor",
    });

    res.status(201).json({
      message: "Doctor registered successfully. Waiting for admin approval.",
      data: doctor,
    });
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find doctor
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Check if active
    if (!doctor.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Check if approved
    if (!doctor.isApproved) {
      return res.status(403).json({ message: "Account not approved by admin yet" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await doctor.update({ lastLogin: new Date() });

   const token = createToken(doctor);
   setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful",
      token,
      data : doctor,
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const doctorLogout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};


// Get Doctor Profile
const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;

    const doctor = await Doctor.findByPk(doctorId, {
      attributes: { exclude: ["password"] },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({  data: doctor });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Doctor Profile
const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const {
      fullName,
      specialization,
      qualification,
      experience,
      phoneNumber,
      clinicAddress,
      consultationFee,
      bio,
      certificateUrl,
    } = req.body;

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    await doctor.update({
      fullName: fullName || doctor.fullName,
      specialization: specialization || doctor.specialization,
      qualification: qualification || doctor.qualification,
      experience: experience || doctor.experience,
      phoneNumber: phoneNumber || doctor.phoneNumber,
      clinicAddress: clinicAddress || doctor.clinicAddress,
      consultationFee: consultationFee || doctor.consultationFee,
      bio: bio || doctor.bio,
      certificateUrl: certificateUrl || doctor.certificateUrl,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      doctor: {
        id: doctor.id,
        email: doctor.email,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        phoneNumber: doctor.phoneNumber,
        clinicAddress: doctor.clinicAddress,
        consultationFee: doctor.consultationFee,
      },
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  doctorLogout
};
