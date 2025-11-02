const { DataTypes } = require("sequelize");
const { sequelize } = require("../../dbConnection/dbConfig");

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "chat_sessions",
        key: "sessionId",
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
    messageType: {
      type: DataTypes.ENUM("user", "bot", "system"),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    context: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Additional context data like selected options, query results, etc.",
    },
    queryType: {
      type: DataTypes.ENUM("general", "specific", "browse_doctor", "analyze_report"),
      allowNull: true,
    },
  },
  {
    tableName: "chat_messages",
    timestamps: true,
  }
);

module.exports = ChatMessage;
