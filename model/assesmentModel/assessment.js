const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Assessment = sequelize.define(
  "Assessment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    recommendationId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "recommendations",
        key: "id",
      },
      onDelete: "SET NULL",
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
    assessmentTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assessmentType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "e.g., Mental Health, Physical Fitness, Nutrition, Sleep Quality, etc.",
    },
    questions: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of assessment questions",
    },
    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Patient's answers to assessment questions",
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Assessment score",
    },
    maxScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: "Maximum possible score",
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Assessment result interpretation",
    },
    status: {
      type: DataTypes.ENUM("suggested", "in_progress", "completed", "skipped"),
      defaultValue: "suggested",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "assessments",
    timestamps: true,
  }
);

module.exports = Assessment;
