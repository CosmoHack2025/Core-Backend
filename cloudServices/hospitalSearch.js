const axios = require("axios");
const {
  GOOGLE_MAPS_API_KEY,
  GOOGLE_MAPS_BASE_URL,
} = require("../config/googleMapsConfig/googleMapsConfig");

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if place is currently open
 * @param {object} openingHours - Opening hours object from Google Places
 * @returns {boolean} True if open now
 */
function isOpenNow(openingHours) {
  if (!openingHours) return null;
  return openingHours.open_now || false;
}

/**
 * Format opening hours
 * @param {object} openingHours - Opening hours object from Google Places
 * @returns {array|null} Formatted opening hours
 */
function formatOpeningHours(openingHours) {
  if (!openingHours || !openingHours.weekday_text) return null;
  return openingHours.weekday_text;
}

/**
 * Get photo URL from Google Places
 * @param {string} photoReference - Photo reference from Google Places
 * @param {number} maxWidth - Maximum width of the photo
 * @returns {string} Photo URL
 */
function getPhotoUrl(photoReference, maxWidth = 400) {
  if (!photoReference) return null;
  return `${GOOGLE_MAPS_BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Determine facility type and priority
 * Priority: 1 = Hospital, 2 = Clinic/Doctor, 3 = Pharmacy
 * @param {object} place - Place object from Google
 * @returns {object} { type: string, priority: number }
 */
function getFacilityTypeAndPriority(place) {
  const types = place.types || [];
  const name = place.name?.toLowerCase() || "";
  
  // Exclude societies, residential areas, etc.
  const excludedKeywords = ['society', 'apartment', 'complex', 'residence', 'residential', 'housing'];
  if (excludedKeywords.some(keyword => name.includes(keyword))) {
    return { type: 'excluded', priority: 99 };
  }
  
  // Priority 1: Hospitals
  if (types.includes('hospital') || name.includes('hospital')) {
    return { type: 'hospital', priority: 1 };
  }
  
  // Priority 2: Clinics and Doctors
  if (types.includes('doctor') || types.includes('clinic') || types.includes('health') || 
      name.includes('clinic') || name.includes('medical center') || name.includes('medical centre')) {
    return { type: 'clinic', priority: 2 };
  }
  
  // Priority 3: Pharmacies/Medical Stores
  if (types.includes('pharmacy') || types.includes('drugstore') || 
      name.includes('pharmacy') || name.includes('medical store') || name.includes('chemist')) {
    return { type: 'pharmacy', priority: 3 };
  }
  
  // Default
  return { type: 'other', priority: 4 };
}

/**
 * Search for hospitals, clinics, and pharmacies near given coordinates
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in meters (default 15000m = 15km)
 * @returns {Promise<Array>} Array of medical facilities with details
 */
async function searchNearbyHospitals(latitude, longitude, radius = 15000) {
  try {
    // Validate inputs
    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error("Latitude must be between -90 and 90");
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error("Longitude must be between -180 and 180");
    }

    // Search for multiple types of medical facilities
    const searchTypes = ['hospital', 'doctor', 'pharmacy'];
    const allPlaces = [];

    // Step 1: Search for each type
    for (const type of searchTypes) {
      try {
        const nearbySearchUrl = `${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`;
        const nearbyResponse = await axios.get(nearbySearchUrl, {
          params: {
            location: `${latitude},${longitude}`,
            radius: radius,
            type: type,
            key: GOOGLE_MAPS_API_KEY,
          },
        });

        if (nearbyResponse.data.status === "OK" && nearbyResponse.data.results) {
          allPlaces.push(...nearbyResponse.data.results);
        }
      } catch (error) {
        console.error(`Error searching for ${type}:`, error.message);
      }
    }

    // Remove duplicates based on place_id
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(place => [place.place_id, place])).values()
    );

    if (uniquePlaces.length === 0) {
      return {
        success: true,
        count: 0,
        hospitals: [],
        message: "No medical facilities found within 15km radius",
      };
    }

    // Step 2: Get detailed information for each facility
    const hospitalsPromises = uniquePlaces.map(async (place) => {
      // Get facility type and priority
      const { type: facilityType, priority } = getFacilityTypeAndPriority(place);
      
      // Skip excluded places
      if (facilityType === 'excluded') {
        return null;
      }
      
      try {
        // Get place details
        const detailsUrl = `${GOOGLE_MAPS_BASE_URL}/place/details/json`;
        const detailsResponse = await axios.get(detailsUrl, {
          params: {
            place_id: place.place_id,
            fields:
              "name,formatted_address,formatted_phone_number,international_phone_number,website,opening_hours,photos,rating,user_ratings_total,types,business_status,url",
            key: GOOGLE_MAPS_API_KEY,
          },
        });

        const details = detailsResponse.data.result || {};
        const location = place.geometry?.location || {};

        // Calculate distance from user
        const distance = calculateDistance(
          latitude,
          longitude,
          location.lat,
          location.lng
        );

        // Check if it's an emergency hospital
        const isEmergency = place.types?.includes("emergency") || 
                           place.name?.toLowerCase().includes("emergency") ||
                           place.name?.toLowerCase().includes("trauma");

        // Get photo URL
        const photoUrl = place.photos && place.photos.length > 0
          ? getPhotoUrl(place.photos[0].photo_reference, 600)
          : null;

        // Format opening hours
        const openingHours = formatOpeningHours(details.opening_hours);
        const isOpen = isOpenNow(details.opening_hours);

        // Create description based on facility type
        let description = "";
        if (facilityType === 'hospital') {
          description = `${place.name} is a ${isEmergency ? "emergency " : ""}hospital located in ${place.vicinity}.`;
        } else if (facilityType === 'clinic') {
          description = `${place.name} is a medical clinic/center located in ${place.vicinity}.`;
        } else if (facilityType === 'pharmacy') {
          description = `${place.name} is a pharmacy/medical store located in ${place.vicinity}.`;
        } else {
          description = `${place.name} is located in ${place.vicinity}.`;
        }
        
        if (details.user_ratings_total) {
          description += ` Rated ${place.rating}/5 by ${details.user_ratings_total} users.`;
        }

        return {
          placeId: place.place_id,
          name: place.name,
          facilityType: facilityType,
          priority: priority,
          address: details.formatted_address || place.vicinity,
          location: {
            latitude: location.lat,
            longitude: location.lng,
          },
          distance: distance,
          distanceText: `${distance} km`,
          contactNumber: details.formatted_phone_number || details.international_phone_number || "Not available",
          emergencyContactNumber: isEmergency 
            ? details.formatted_phone_number || details.international_phone_number || "Not available"
            : "Not specified",
          isEmergencyHospital: isEmergency,
          photo: photoUrl,
          photos: place.photos?.slice(0, 5).map(photo => getPhotoUrl(photo.photo_reference, 600)) || [],
          rating: place.rating || null,
          totalRatings: details.user_ratings_total || 0,
          openingHours: openingHours,
          isOpenNow: isOpen,
          availableNow: isOpen !== null ? isOpen : "Unknown",
          website: details.website || "Not available",
          description: description,
          googleMapsUrl: details.url || `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}&query_place_id=${place.place_id}`,
          businessStatus: details.business_status || "OPERATIONAL",
          types: place.types || [],
        };
      } catch (error) {
        console.error(`Error fetching details for ${place.name}:`, error.message);
        // Return basic info if details fetch fails
        const location = place.geometry?.location || {};
        const distance = calculateDistance(
          latitude,
          longitude,
          location.lat,
          location.lng
        );

        return {
          placeId: place.place_id,
          name: place.name,
          facilityType: facilityType,
          priority: priority,
          address: place.vicinity,
          location: {
            latitude: location.lat,
            longitude: location.lng,
          },
          distance: distance,
          distanceText: `${distance} km`,
          contactNumber: "Not available",
          emergencyContactNumber: "Not available",
          isEmergencyHospital: place.types?.includes("emergency") || false,
          photo: null,
          photos: [],
          rating: place.rating || null,
          totalRatings: 0,
          openingHours: null,
          isOpenNow: null,
          availableNow: "Unknown",
          website: "Not available",
          description: `${place.name} is located in ${place.vicinity}.`,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}&query_place_id=${place.place_id}`,
          businessStatus: "OPERATIONAL",
          types: place.types || [],
        };
      }
    });

    let hospitals = await Promise.all(hospitalsPromises);
    
    // Filter out null values (excluded places)
    hospitals = hospitals.filter(h => h !== null);

    // Sort by priority first (1=hospital, 2=clinic, 3=pharmacy), then by distance
    hospitals.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority; // Lower priority number comes first
      }
      return a.distance - b.distance; // Then sort by distance
    });

    // Get total counts before limiting
    const totalCount = hospitals.length;
    const hospitalCount = hospitals.filter(h => h.facilityType === 'hospital').length;
    const clinicCount = hospitals.filter(h => h.facilityType === 'clinic').length;
    const pharmacyCount = hospitals.filter(h => h.facilityType === 'pharmacy').length;
    const emergencyCount = hospitals.filter(h => h.isEmergencyHospital).length;

    // Limit to top 10 results based on priority and distance
    const topResults = hospitals.slice(0, 10);

    // Count in top 10
    const top10HospitalCount = topResults.filter(h => h.facilityType === 'hospital').length;
    const top10ClinicCount = topResults.filter(h => h.facilityType === 'clinic').length;
    const top10PharmacyCount = topResults.filter(h => h.facilityType === 'pharmacy').length;
    const top10EmergencyCount = topResults.filter(h => h.isEmergencyHospital).length;

    return {
      success: true,
      count: topResults.length,
      totalFound: totalCount,
      searchLocation: {
        latitude,
        longitude,
      },
      searchRadius: `${radius / 1000} km`,
      facilityCounts: {
        hospitals: top10HospitalCount,
        clinics: top10ClinicCount,
        pharmacies: top10PharmacyCount,
        emergencyHospitals: top10EmergencyCount,
      },
      totalCounts: {
        hospitals: hospitalCount,
        clinics: clinicCount,
        pharmacies: pharmacyCount,
        emergencyHospitals: emergencyCount,
      },
      hospitals: topResults,
    };
  } catch (error) {
    console.error("Error in searchNearbyHospitals:", error);
    throw error;
  }
}

module.exports = {
  searchNearbyHospitals,
  calculateDistance,
};
