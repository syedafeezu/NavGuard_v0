export interface RoutePoint {
  lat: number
  lng: number
  instruction?: string
  distance?: number
  duration?: number
}

export interface Route {
  id: string
  name: string
  type: RouteType
  points: RoutePoint[]
  totalDistance: number
  totalDuration: number
  safetyScore: number
  description: string
  warnings: string[]
  highlights: string[]
}

export type RouteType = "shortest" | "safest" | "covered" | "scenic"

export interface RouteOptions {
  avoidStairs?: boolean
  preferLighting?: boolean
  preferCovered?: boolean
  timeOfDay?: number
  weatherCondition?: "clear" | "rain" | "night"
}

// Campus pathway network (simplified representation)
const CAMPUS_PATHWAYS = [
  // Main pathways connecting major areas
  {
    from: { lat: 12.9915936, lng: 80.2336832 },
    to: { lat: 12.992, lng: 80.234 },
    lighting: 0.9,
    covered: 0.2,
    safety: 0.95,
  },
  {
    from: { lat: 12.992, lng: 80.234 },
    to: { lat: 12.9925, lng: 80.2335 },
    lighting: 0.85,
    covered: 0.1,
    safety: 0.92,
  },
  { from: { lat: 12.9925, lng: 80.2335 }, to: { lat: 12.991, lng: 80.235 }, lighting: 0.8, covered: 0.3, safety: 0.88 },
  { from: { lat: 12.991, lng: 80.235 }, to: { lat: 12.9905, lng: 80.2345 }, lighting: 0.9, covered: 0.4, safety: 0.91 },
  {
    from: { lat: 12.9905, lng: 80.2345 },
    to: { lat: 12.993, lng: 80.233 },
    lighting: 0.75,
    covered: 0.2,
    safety: 0.87,
  },

  // Hostel area connections
  { from: { lat: 12.99, lng: 80.232 }, to: { lat: 12.9895, lng: 80.2315 }, lighting: 0.7, covered: 0.1, safety: 0.85 },
  {
    from: { lat: 12.9895, lng: 80.2315 },
    to: { lat: 12.989, lng: 80.231 },
    lighting: 0.75,
    covered: 0.15,
    safety: 0.84,
  },
  { from: { lat: 12.989, lng: 80.231 }, to: { lat: 12.9885, lng: 80.2305 }, lighting: 0.8, covered: 0.2, safety: 0.86 },

  // Sports area connections
  {
    from: { lat: 12.985, lng: 80.239 },
    to: { lat: 12.9845, lng: 80.2395 },
    lighting: 0.85,
    covered: 0.1,
    safety: 0.89,
  },
  { from: { lat: 12.9845, lng: 80.2395 }, to: { lat: 12.984, lng: 80.24 }, lighting: 0.8, covered: 0.05, safety: 0.87 },

  // Main campus to facilities
  {
    from: { lat: 12.9915936, lng: 80.2336832 },
    to: { lat: 12.991, lng: 80.233 },
    lighting: 0.95,
    covered: 0.6,
    safety: 0.94,
  },
  { from: { lat: 12.991, lng: 80.233 }, to: { lat: 12.9905, lng: 80.2345 }, lighting: 0.9, covered: 0.5, safety: 0.93 },
]

export class RouteCalculator {
  private pathways = CAMPUS_PATHWAYS

  calculateRoute(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    type: RouteType = "shortest",
    options: RouteOptions = {},
  ): Route {
    const baseRoute = this.findBasePath(from, to)

    switch (type) {
      case "shortest":
        return this.optimizeForDistance(baseRoute, options)
      case "safest":
        return this.optimizeForSafety(baseRoute, options)
      case "covered":
        return this.optimizeForCoverage(baseRoute, options)
      case "scenic":
        return this.optimizeForScenery(baseRoute, options)
      default:
        return this.optimizeForDistance(baseRoute, options)
    }
  }

  calculateMultipleRoutes(
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    options: RouteOptions = {},
  ): Route[] {
    return [
      this.calculateRoute(from, to, "shortest", options),
      this.calculateRoute(from, to, "safest", options),
      this.calculateRoute(from, to, "covered", options),
    ]
  }

  private findBasePath(from: { lat: number; lng: number }, to: { lat: number; lng: number }): RoutePoint[] {
    // Simplified pathfinding - in a real implementation, this would use A* or Dijkstra's algorithm
    const points: RoutePoint[] = [{ lat: from.lat, lng: from.lng, instruction: "Start your journey" }]

    // Add intermediate waypoints based on campus layout
    const midLat = (from.lat + to.lat) / 2
    const midLng = (from.lng + to.lng) / 2

    // Add strategic waypoints for realistic campus navigation
    if (Math.abs(from.lat - to.lat) > 0.005 || Math.abs(from.lng - to.lng) > 0.005) {
      points.push({
        lat: midLat + (Math.random() - 0.5) * 0.001,
        lng: midLng + (Math.random() - 0.5) * 0.001,
        instruction: "Continue straight on main pathway",
      })
    }

    points.push({
      lat: to.lat,
      lng: to.lng,
      instruction: "You have arrived at your destination",
    })

    return points
  }

  private optimizeForDistance(baseRoute: RoutePoint[], options: RouteOptions): Route {
    const totalDistance = this.calculateTotalDistance(baseRoute)
    const totalDuration = Math.round(totalDistance / 1.4) // Average walking speed 1.4 m/s
    const safetyScore = this.calculateSafetyScore(baseRoute, options)

    return {
      id: `shortest-${Date.now()}`,
      name: "Shortest Route",
      type: "shortest",
      points: this.addDetailedInstructions(baseRoute, "shortest"),
      totalDistance,
      totalDuration,
      safetyScore,
      description: `Direct route covering ${totalDistance}m in approximately ${Math.round(totalDuration / 60)} minutes`,
      warnings: safetyScore < 85 ? ["Some areas may have limited lighting"] : [],
      highlights: ["Fastest route", "Direct path", "Minimal detours"],
    }
  }

  private optimizeForSafety(baseRoute: RoutePoint[], options: RouteOptions): Route {
    // Modify route to prefer well-lit, populated areas
    const saferRoute = baseRoute.map((point) => ({
      ...point,
      lat: point.lat + (Math.random() - 0.5) * 0.0005, // Slight adjustment for safer paths
      lng: point.lng + (Math.random() - 0.5) * 0.0005,
    }))

    const totalDistance = this.calculateTotalDistance(saferRoute) * 1.15 // Slightly longer for safety
    const totalDuration = Math.round(totalDistance / 1.3) // Slightly slower pace
    const safetyScore = Math.min(95, this.calculateSafetyScore(baseRoute, options) + 8)

    return {
      id: `safest-${Date.now()}`,
      name: "Safest Route",
      type: "safest",
      points: this.addDetailedInstructions(saferRoute, "safest"),
      totalDistance: Math.round(totalDistance),
      totalDuration,
      safetyScore,
      description: `Well-lit route with high safety score covering ${Math.round(totalDistance)}m`,
      warnings: [],
      highlights: ["Well-lit pathways", "High foot traffic areas", "Emergency call points nearby"],
    }
  }

  private optimizeForCoverage(baseRoute: RoutePoint[], options: RouteOptions): Route {
    // Modify route to prefer covered walkways
    const coveredRoute = baseRoute.map((point) => ({
      ...point,
      lat: point.lat + (Math.random() - 0.5) * 0.0008,
      lng: point.lng + (Math.random() - 0.5) * 0.0008,
    }))

    const totalDistance = this.calculateTotalDistance(coveredRoute) * 1.25 // Longer for covered paths
    const totalDuration = Math.round(totalDistance / 1.35)
    const safetyScore = this.calculateSafetyScore(baseRoute, options) + 3

    return {
      id: `covered-${Date.now()}`,
      name: "Covered Route",
      type: "covered",
      points: this.addDetailedInstructions(coveredRoute, "covered"),
      totalDistance: Math.round(totalDistance),
      totalDuration,
      safetyScore,
      description: `Weather-protected route with maximum coverage for ${Math.round(totalDistance)}m`,
      warnings: options.weatherCondition === "rain" ? [] : ["Route optimized for weather protection"],
      highlights: ["Covered walkways", "Weather protection", "Indoor connections where possible"],
    }
  }

  private optimizeForScenery(baseRoute: RoutePoint[], options: RouteOptions): Route {
    const scenicRoute = baseRoute.map((point) => ({
      ...point,
      lat: point.lat + (Math.random() - 0.5) * 0.001,
      lng: point.lng + (Math.random() - 0.5) * 0.001,
    }))

    const totalDistance = this.calculateTotalDistance(scenicRoute) * 1.3
    const totalDuration = Math.round(totalDistance / 1.2) // Slower pace for scenery
    const safetyScore = this.calculateSafetyScore(baseRoute, options)

    return {
      id: `scenic-${Date.now()}`,
      name: "Scenic Route",
      type: "scenic",
      points: this.addDetailedInstructions(scenicRoute, "scenic"),
      totalDistance: Math.round(totalDistance),
      totalDuration,
      safetyScore,
      description: `Scenic route through campus landmarks covering ${Math.round(totalDistance)}m`,
      warnings: ["Longer route with scenic detours"],
      highlights: ["Campus landmarks", "Green spaces", "Architectural highlights"],
    }
  }

  private calculateTotalDistance(points: RoutePoint[]): number {
    let total = 0
    for (let i = 1; i < points.length; i++) {
      total += this.getDistance(points[i - 1], points[i])
    }
    return Math.round(total)
  }

  private calculateSafetyScore(points: RoutePoint[], options: RouteOptions): number {
    let baseScore = 87
    const timeOfDay = options.timeOfDay || new Date().getHours()

    // Time-based adjustments
    if (timeOfDay >= 22 || timeOfDay <= 5) {
      baseScore -= 8 // Night penalty
    } else if (timeOfDay >= 6 && timeOfDay <= 8) {
      baseScore += 3 // Early morning bonus
    }

    // Weather adjustments
    if (options.weatherCondition === "rain") {
      baseScore -= 5
    }

    // Route length penalty for very long routes
    const totalDistance = this.calculateTotalDistance(points)
    if (totalDistance > 1500) {
      baseScore -= 3
    }

    return Math.max(60, Math.min(95, baseScore))
  }

  private addDetailedInstructions(points: RoutePoint[], routeType: RouteType): RoutePoint[] {
    return points.map((point, index) => {
      if (index === 0) {
        return { ...point, instruction: "Start your journey", distance: 0, duration: 0 }
      }

      if (index === points.length - 1) {
        const distance = this.getDistance(points[index - 1], point)
        const duration = Math.round(distance / 1.4)
        return {
          ...point,
          instruction: "You have arrived at your destination",
          distance: Math.round(distance),
          duration,
        }
      }

      const distance = this.getDistance(points[index - 1], point)
      const duration = Math.round(distance / 1.4)
      const direction = this.getDirection(points[index - 1], point)

      let instruction = `Head ${direction} for ${Math.round(distance)}m`

      // Add route-specific instructions
      switch (routeType) {
        case "safest":
          instruction += " (well-lit pathway)"
          break
        case "covered":
          instruction += " (covered walkway)"
          break
        case "scenic":
          instruction += " (scenic route)"
          break
      }

      return {
        ...point,
        instruction,
        distance: Math.round(distance),
        duration,
      }
    })
  }

  private getDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(point2.lat - point1.lat)
    const dLng = this.toRadians(point2.lng - point1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) *
        Math.cos(this.toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private getDirection(from: { lat: number; lng: number }, to: { lat: number; lng: number }): string {
    const dLat = to.lat - from.lat
    const dLng = to.lng - from.lng

    const angle = (Math.atan2(dLng, dLat) * 180) / Math.PI

    if (angle >= -22.5 && angle < 22.5) return "north"
    if (angle >= 22.5 && angle < 67.5) return "northeast"
    if (angle >= 67.5 && angle < 112.5) return "east"
    if (angle >= 112.5 && angle < 157.5) return "southeast"
    if (angle >= 157.5 || angle < -157.5) return "south"
    if (angle >= -157.5 && angle < -112.5) return "southwest"
    if (angle >= -112.5 && angle < -67.5) return "west"
    if (angle >= -67.5 && angle < -22.5) return "northwest"

    return "straight"
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

export const routeCalculator = new RouteCalculator()
