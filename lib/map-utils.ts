export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapLocation {
  lat: number
  lng: number
}

// IIT Madras campus bounds
export const CAMPUS_BOUNDS: MapBounds = {
  north: 12.998,
  south: 12.985,
  east: 80.24,
  west: 80.228,
}

// Campus center coordinates
export const CAMPUS_CENTER: MapLocation = {
  lat: 12.9915936,
  lng: 80.2336832,
}

// Default map configuration
export const MAP_CONFIG = {
  defaultZoom: 16,
  minZoom: 14,
  maxZoom: 19,
  tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(point1: MapLocation, point2: MapLocation): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000 // Convert to meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Check if a location is within campus bounds
export function isWithinCampus(location: MapLocation): boolean {
  return (
    location.lat >= CAMPUS_BOUNDS.south &&
    location.lat <= CAMPUS_BOUNDS.north &&
    location.lng >= CAMPUS_BOUNDS.west &&
    location.lng <= CAMPUS_BOUNDS.east
  )
}

// Generate safety score based on various factors
export function calculateSafetyScore(
  location: MapLocation,
  timeOfDay: number = new Date().getHours(),
  incidents: any[] = [],
): number {
  let score = 95 // Base safety score

  // Time-based adjustments
  if (timeOfDay >= 22 || timeOfDay <= 5) {
    score -= 10 // Night time penalty
  } else if (timeOfDay >= 6 && timeOfDay <= 8) {
    score += 5 // Early morning bonus
  }

  // Distance from campus center (safer near center)
  const distanceFromCenter = calculateDistance(location, CAMPUS_CENTER)
  if (distanceFromCenter > 1000) {
    score -= 5 // Penalty for being far from center
  }

  // Recent incidents in the area
  const nearbyIncidents = incidents.filter((incident) => {
    const distance = calculateDistance(location, incident.location)
    return distance < 200 // Within 200 meters
  })

  score -= nearbyIncidents.length * 3 // Penalty for nearby incidents

  // Ensure score stays within reasonable bounds
  return Math.max(60, Math.min(95, score))
}
