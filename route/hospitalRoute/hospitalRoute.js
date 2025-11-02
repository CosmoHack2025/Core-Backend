const express = require("express");
const router = express.Router();
const {
  getNearbyHospitals,
} = require("../../controller/hospitalController/hospitalController");

/**
 * @route   POST /api/hospital/nearby
 * @desc    Search for TOP 10 closest medical facilities near given coordinates
 *          Returns hospitals, clinics, and pharmacies
 *          Priority Order: 1. Hospitals, 2. Clinics, 3. Pharmacies
 *          Sorted by: Priority first, then distance from user location
 *          Limit: Top 10 results (closest by priority and distance)
 *          Excludes: Societies, residential areas
 * @access  Public
 * @body    { latitude: number, longitude: number, radius?: number }
 * 
 * @example
 * Request Body:
 * {
 *   "latitude": 28.7041,
 *   "longitude": 77.1025,
 *   "radius": 15000  // Optional, default is 15000 meters (15km)
 * }
 * 
 * Response includes:
 * - Top 10 closest facilities based on priority and distance
 * - Hospitals (Priority 1) first - sorted by distance
 * - Then Clinics/Medical Centers (Priority 2) - sorted by distance
 * - Then Pharmacies/Medical Stores (Priority 3) - sorted by distance
 * - Each facility includes: facilityType, priority, name, address, distance, 
 *   photos, contact, opening hours, availability, ratings, website, and more
 * - totalFound: Total facilities found in search radius
 * - totalCounts: Breakdown of all facilities found (before limiting to 10)
 */
router.post("/nearby", getNearbyHospitals);

module.exports = router;
