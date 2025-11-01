const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Recommendation = sequelize.define(
  "Recommendation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    analyticsId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "analytics",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    reportId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "reports",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    recommendations: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "AI-generated recommendations based on analytics",
    },
    urgencyLevel: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      allowNull: true,
    },
    suggestedAssessments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "List of suggested assessments/tests",
    },
    status: {
      type: DataTypes.ENUM("pending", "generated", "failed"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "recommendations",
    timestamps: true,
  }
);

module.exports = Recommendation;
