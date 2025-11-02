const Patient = require("../patientModel/patient");
const Doctor = require("../doctorModel/doctor");
const Admin = require("../adminModel/admin");
const Report = require("../reportModel/report");
const Analytics = require("../analyticsModel/analytics");
const Recommendation = require("../recommendationModel/recommendation");
const Assessment = require("../assesmentModel/assessment");
const Booking = require("../scheduleBooking/booking");
const Contact = require("../contactModel/contact");
const ChatSession = require("../chatModel/chatSession");
const ChatMessage = require("../chatModel/chatMessage");

// Patient - Booking (One-to-Many)
Patient.hasMany(Booking, {
  foreignKey: "patientId",
  as: "bookings",
  onDelete: "CASCADE",
});
Booking.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// Doctor - Booking (One-to-Many)
Doctor.hasMany(Booking, {
  foreignKey: "doctorId",
  as: "bookings",
  onDelete: "CASCADE",
});
Booking.belongsTo(Doctor, {
  foreignKey: "doctorId",
  as: "doctor",
});

// Admin - Doctor (Doctor approval by Admin)
Admin.hasMany(Doctor, {
  foreignKey: "approvedBy",
  as: "approvedDoctors",
});
Doctor.belongsTo(Admin, {
  foreignKey: "approvedBy",
  as: "approver",
});

// Patient - Report (One-to-Many)
Patient.hasMany(Report, {
  foreignKey: "patientId",
  as: "reports",
  onDelete: "CASCADE",
});
Report.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// Report - Analytics (One-to-One)
Report.hasOne(Analytics, {
  foreignKey: "reportId",
  as: "analytics",
  onDelete: "CASCADE",
});
Analytics.belongsTo(Report, {
  foreignKey: "reportId",
  as: "report",
});

// Patient - Analytics (One-to-Many)
Patient.hasMany(Analytics, {
  foreignKey: "patientId",
  as: "analytics",
  onDelete: "CASCADE",
});
Analytics.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// Analytics - Recommendation (One-to-One)
Analytics.hasOne(Recommendation, {
  foreignKey: "analyticsId",
  as: "recommendation",
  onDelete: "CASCADE",
});
Recommendation.belongsTo(Analytics, {
  foreignKey: "analyticsId",
  as: "analytics",
});

// Patient - Recommendation (One-to-Many)
Patient.hasMany(Recommendation, {
  foreignKey: "patientId",
  as: "recommendations",
  onDelete: "CASCADE",
});
Recommendation.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// Report - Recommendation (One-to-Many)
Report.hasMany(Recommendation, {
  foreignKey: "reportId",
  as: "recommendations",
  onDelete: "CASCADE",
});
Recommendation.belongsTo(Report, {
  foreignKey: "reportId",
  as: "report",
});

// Recommendation - Assessment (One-to-Many)
Recommendation.hasMany(Assessment, {
  foreignKey: "recommendationId",
  as: "assessments",
  onDelete: "SET NULL",
});
Assessment.belongsTo(Recommendation, {
  foreignKey: "recommendationId",
  as: "recommendation",
});

// Patient - Assessment (One-to-Many)
Patient.hasMany(Assessment, {
  foreignKey: "patientId",
  as: "assessments",
  onDelete: "CASCADE",
});
Assessment.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// Admin - Contact (Contact reply by Admin)
Admin.hasMany(Contact, {
  foreignKey: "repliedBy",
  as: "contactReplies",
  onDelete: "SET NULL",
});
Contact.belongsTo(Admin, {
  foreignKey: "repliedBy",
  as: "admin",
});

// Patient - ChatSession (One-to-Many)
Patient.hasMany(ChatSession, {
  foreignKey: "patientId",
  as: "chatSessions",
  onDelete: "CASCADE",
});
ChatSession.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

// ChatSession - ChatMessage (One-to-Many)
ChatSession.hasMany(ChatMessage, {
  foreignKey: "sessionId",
  sourceKey: "sessionId",
  as: "messages",
  onDelete: "CASCADE",
});
ChatMessage.belongsTo(ChatSession, {
  foreignKey: "sessionId",
  targetKey: "sessionId",
  as: "session",
});

// Patient - ChatMessage (One-to-Many)
Patient.hasMany(ChatMessage, {
  foreignKey: "patientId",
  as: "chatMessages",
  onDelete: "CASCADE",
});
ChatMessage.belongsTo(Patient, {
  foreignKey: "patientId",
  as: "patient",
});

module.exports = {
  Patient,
  Doctor,
  Admin,
  Report,
  Analytics,
  Recommendation,
  Assessment,
  Booking,
  Contact,
  ChatSession,
  ChatMessage,
};
