const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Booking = sequelize.define(
  "Booking",
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
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "doctors",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    appointmentType: {
      type: DataTypes.ENUM("videocall", "inperson"),
      allowNull: false,
      defaultValue: "videocall",
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    appointmentTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    reasonForConsultation: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    currentMedications: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    knownAllergies: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "rejected", "completed", "cancelled"),
      defaultValue: "pending",
    },
    doctorResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Doctor's response or notes about the booking",
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Video call link if appointment type is videocall",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
  }
);

module.exports = Booking;
