const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Report = sequelize.define(
  "Report",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("uploaded", "processing", "analyzed", "failed"),
      defaultValue: "uploaded",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    extractedText: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    extractedLines: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    wordCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    blockCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    documentMetadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "reports",
    timestamps: true,
  }
);

module.exports = Report;
