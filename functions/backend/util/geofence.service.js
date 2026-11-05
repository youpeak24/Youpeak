"use strict";
const db = require("./connection");

const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const resolveAgency = async ({ latitude, longitude, district, state, city }) => {
  try {
    const agencies = await db.find("agencies", { isActive: true });
    if (!agencies || agencies.length === 0) return null;

    if (latitude && longitude) {
      for (const agency of agencies) {
        if (
          agency.geofenceCenter &&
          agency.geofenceCenter.latitude &&
          agency.geofenceCenter.longitude &&
          agency.radiusKm > 0
        ) {
          const dist = getDistanceInKm(
            latitude,
            longitude,
            agency.geofenceCenter.latitude,
            agency.geofenceCenter.longitude
          );
          if (dist <= agency.radiusKm) {
            return agency._id || agency.id;
          }
        }
      }
    }

    if (district || state) {
      const match = agencies.find((agency) => {
        const districtMatch =
          district &&
          agency.district &&
          agency.district.toLowerCase() === district.toLowerCase();
        const stateMatch =
          state &&
          agency.state &&
          agency.state.toLowerCase() === state.toLowerCase();
        return districtMatch || stateMatch;
      });
      if (match) return match._id || match.id;
    }

    return null;
  } catch (error) {
    console.error("Error resolving agency geofence:", error);
    return null;
  }
};

module.exports = { resolveAgency, getDistanceInKm };
