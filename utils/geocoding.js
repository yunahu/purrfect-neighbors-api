import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding.js";

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_ACCESS_TOKEN });

export const getPlaceName = async (longitude, latitude) => {
    try {
      const geocodeResponse = await geocodingClient.reverseGeocode({
        query: [longitude, latitude],
        types: ['place'],
        limit: 1
      }).send();
  
      if (!geocodeResponse.body.features.length) {
        throw new Error("Invalid coordinates.");
      }
  
      return geocodeResponse.body.features[0].place_name;
    } catch (error) {
        throw new Error("Geocoding failed.");
    }
  };