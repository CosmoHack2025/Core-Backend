const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const Doctor = sequelize.define(
  "Doctor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Years of experience",
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clinicAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "admins",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificateUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "URL to uploaded certificate",
    },
  },
  {
    tableName: "doctors",
    timestamps: true,
  }
);

module.exports = Doctor;
