const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Admin, Doctor } = require("../../model");
const { createToken } = require("../../authServices/authService");
const setTokenCookie = require("../../authServices/setTokenCookie");

const registerAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await Admin.create({
      email,
      password: hashedPassword,
      fullName,
    });


    res.status(201).json({
      message: "Admin registered successfully",
    data: admin
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if active
    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await admin.update({ lastLogin: new Date() });

   const token = createToken(admin);
   setTokenCookie(res, token);


    res.status(200).json({
      message: "Login successful",
      token,
     data : admin
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Admin Profile
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await Admin.findByPk(adminId, {
      attributes: { exclude: ["password"] },
    });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({ data : admin });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await Doctor.findAll({
      where: { isApproved: false, isActive: true },
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Pending doctors retrieved successfully",
      count: pendingDoctors.length,
      doctors: pendingDoctors,
    });
  } catch (error) {
    console.error("Get pending doctors error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const approveDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const adminId = req.user.id;

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.isApproved) {
      return res.status(400).json({ message: "Doctor is already approved" });
    }

    await doctor.update({
      isApproved: true,
      approvedBy: adminId,
      approvedAt: new Date(),
    });

    res.status(200).json({
      message: "Doctor approved successfully",
      doctor: {
        id: doctor.id,
        email: doctor.email,
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        isApproved: doctor.isApproved,
        approvedAt: doctor.approvedAt,
      },
    });
  } catch (error) {
    console.error("Approve doctor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const rejectDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.isApproved) {
      return res.status(400).json({ message: "Doctor is already approved" });
    }

    // Deactivate the doctor account
    await doctor.update({
      isActive: false,
    });

    res.status(200).json({
      message: "Doctor rejected successfully",
      doctor: {
        id: doctor.id,
        email: doctor.email,
        fullName: doctor.fullName,
        isActive: doctor.isActive,
      },
    });
  } catch (error) {
    console.error("Reject doctor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    console.log("\n🔍 Searching doctors...");
    
    const { query } = req.query;
    
    // Build where clause
    const whereClause = { 
      isApproved: true, 
      isActive: true 
    };

    // If query parameter is provided, search in fullName and specialization
    if (query && query.trim() !== "") {
      console.log(`   � Query search: "${query}"`);
      const searchTerm = query.trim();
      
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${searchTerm}%` } },
        { specialization: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }

    console.log("   🔎 Executing search query...");

    const doctors = await Doctor.findAll({
      where: whereClause,
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });

    console.log(`✅ Found ${doctors.length} doctor(s)`);

    res.status(200).json({
      message: "Doctors retrieved successfully",
      count: doctors.length,
      searchQuery: query || null,
      doctors,
    });
  } catch (error) {
    console.error("❌ Get all doctors error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
  getAllDoctors,
};
