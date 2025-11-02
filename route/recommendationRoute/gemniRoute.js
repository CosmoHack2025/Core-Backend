const express = require("express");
const { generateHealthRecommendations, getRecommendationByAnalytics } = require("../../controller/recommendationController/gemniController");
const checkForAuthenticationCookie = require("../../middleware/authMiddleware");

const router = express.Router();

router.post("/health-recommendations", generateHealthRecommendations);


router.get("/analytics/:analyticsId",checkForAuthenticationCookie('token'), getRecommendationByAnalytics);

module.exports = router;