const {
  searchNearbyHospitals,
} = require("../../cloudServices/hospitalSearch");

/**
 * Search for all types of hospitals near user's location
 * Accepts latitude and longitude from request body
 * Returns all hospitals including regular and emergency hospitals
 */
const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const radius = process.env.EMERGENCY_HOSPITAL_RADIUS

    // Validate inputs
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Convert latitude and longitude to numbers
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Validate coordinate ranges
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude format",
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    // Use custom radius or default to 15km (15000 meters)
    const searchRadius = radius ? parseInt(radius) : 15000;

    // Search for all types of medical facilities (hospitals, clinics, pharmacies)
    const result = await searchNearbyHospitals(lat, lon, searchRadius);

    const { facilityCounts, totalFound, totalCounts } = result;

    return res.status(200).json({
      success: true,
      message: result.count > 0 
        ? `Showing top ${result.count} closest medical facilities (Found ${totalFound} total within ${searchRadius / 1000}km radius) - ${facilityCounts.hospitals} hospitals, ${facilityCounts.clinics} clinics, ${facilityCounts.pharmacies} pharmacies`
        : "No medical facilities found within the specified radius",
      data: result,
    });
  } catch (error) {
    console.error("Error in getNearbyHospitals:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search for nearby hospitals",
      error: error.message,
    });
  }
};

module.exports = {
  getNearbyHospitals,
};
