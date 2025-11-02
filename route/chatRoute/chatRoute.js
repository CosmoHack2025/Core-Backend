const express = require("express");
const {
  startChatSession,
  sendMessage,
  getChatHistory,
  endChatSession,
} = require("../../controller/chatController/chatController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");


const router = express.Router();

// All routes require authentication and patient role
router.post(
  "/start",
  checkForAuthenticationCookie('token') ,
  startChatSession
);

router.post(
  "/:sessionId/message",
  checkForAuthenticationCookie('token') ,
  sendMessage
);

router.get(
  "/:sessionId/history",
  checkForAuthenticationCookie('token') ,
  getChatHistory
);

router.post(
  "/:sessionId/end",
  checkForAuthenticationCookie('token') ,
  endChatSession
);

module.exports = router;
