const express = require("express");
const { generateHealthRecommendations } = require("../../controller/recommendationController/gemniController");

const router = express.Router();


router.post("/health-recommendations", generateHealthRecommendations);


module.exports = router;