const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Patient } = require("../../model");
const { createToken } = require("../../authServices/authService");
const setTokenCookie = require("../../authServices/setTokenCookie");
const clearTokenCookie = require("../../authServices/clearTokenCookie");

const registerPatient = async (req, res) => {
  try {
    const { email, password, fullName, gender, phoneNumber } = req.body;

    const existingPatient = await Patient.findOne({ where: { email } });
    if (existingPatient) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = await Patient.create({
      email,
      password: hashedPassword,
      fullName,
      gender,
      phoneNumber,
      
    });

    res.status(201).json({
      message: "Patient registered successfully",
      token,
      data: patient,
    });
  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ where: { email } });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Check if active
    if (!patient.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await patient.update({ lastLogin: new Date() });

    const token = createToken(patient);
    setTokenCookie(res, token);

    res.status(200).json({
      message: "Login successful",
      token,
      data: patient,
    });
  } catch (error) {
    console.error("Patient login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const patientLogout = (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

const getPatientProfile = async (req, res) => {
  try {
    const patientId = req.user.id;
    const patient = await Patient.findByPk(patientId, {
      attributes: { exclude: ["password"] },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({ data: patient });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updatePatientProfile = async (req, res) => {
  try {
    const patientId = req.user.id;
    const {
      fullName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      bloodGroup,
      medicalHistory,
      allergies,
      emergencyContactName,
      emergencyContactNumber,
    } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.update({
      fullName: fullName || patient.fullName,
      dateOfBirth: dateOfBirth || patient.dateOfBirth,
      gender: gender || patient.gender,
      phoneNumber: phoneNumber || patient.phoneNumber,
      address: address || patient.address,
      bloodGroup: bloodGroup || patient.bloodGroup,
      medicalHistory: medicalHistory || patient.medicalHistory,
      allergies: allergies || patient.allergies,
      emergencyContactName:
      emergencyContactName || patient.emergencyContactName,
      emergencyContactNumber:
        emergencyContactNumber || patient.emergencyContactNumber,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      patient: {
        id: patient.id,
        email: patient.email,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        phoneNumber: patient.phoneNumber,
        address: patient.address,
        bloodGroup: patient.bloodGroup,
      },
    });
  } catch (error) {
    console.error("Update patient profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerPatient,
  loginPatient,
  getPatientProfile,
  updatePatientProfile,
  patientLogout
};
