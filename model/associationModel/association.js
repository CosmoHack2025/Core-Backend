const Patient = require("../patientModel/patient");
const Doctor = require("../doctorModel/doctor");
const Admin = require("../adminModel/admin");
const Report = require("../reportModel/report");
const Analytics = require("../analyticsModel/analytics");
const Recommendation = require("../recommendationModel/recommendation");
const Assessment = require("../assesmentModel/assessment");

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

module.exports = {
  Patient,
  Doctor,
  Admin,
  Report,
  Analytics,
  Recommendation,
  Assessment,
};
