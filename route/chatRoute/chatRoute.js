const express = require("express");
const {
  startChat,
  chat,
} = require("../../controller/chatController/chatController");

const router = express.Router();


router.post("/start", startChat);


router.post("/", chat);

module.exports = router;
