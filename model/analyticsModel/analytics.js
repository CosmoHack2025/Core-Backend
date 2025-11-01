const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Analytics = sequelize.define(
  "Analytics",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    diagnosis: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "AI-generated diagnosis from the report",
    },
    keyFindings: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Key findings extracted from the report",
    },
    abnormalValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "List of abnormal values detected",
    },
    normalValues: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "List of normal values detected",
    },
    severity: {
      type: DataTypes.ENUM("low", "moderate", "high", "critical"),
      allowNull: true,
    },
    processedData: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Complete AI response data",
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "failed"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "analytics",
    timestamps: true,
  }
);

module.exports = Analytics;
