"use client"

import { useEffect, useRef } from "react"
import { useNavGuard } from "@/contexts/navguard-context"
import { SAMPLE_INCIDENTS } from "@/lib/incident-types"

interface SafetyHeatmapProps {
  visible: boolean
}

export function SafetyHeatmap({ visible }: SafetyHeatmapProps) {
  const { state } = useNavGuard()
  const heatmapLayerRef = useRef<any>(null)

  useEffect(() => {
    if (!visible) {
      removeHeatmap()
      return
    }

    displayHeatmap()
  }, [visible, state.incidents])

  const displayHeatmap = async () => {
    try {
      const L = await import("leaflet")
      const map = (window as any).leafletMapRef

      if (!map) return

      // Remove existing heatmap
      removeHeatmap()

      // Combine real incidents with sample data for demonstration
      const allIncidents = [...state.incidents, ...SAMPLE_INCIDENTS]

      // Create safety zones based on incidents
      const safetyZones = generateSafetyZones(allIncidents)

      safetyZones.forEach((zone) => {
        const circle = L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          fillColor: zone.color,
          color: zone.color,
          weight: 1,
          opacity: 0.6,
          fillOpacity: 0.3,
        }).addTo(map)

        circle.bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold text-sm">${zone.level} Safety Zone</h4>
            <p class="text-xs text-gray-600">${zone.incidents} incident(s) reported</p>
            <p class="text-xs text-gray-600">Safety Score: ${zone.safetyScore}%</p>
          </div>
        `)

        if (!heatmapLayerRef.current) {
          heatmapLayerRef.current = []
        }
        heatmapLayerRef.current.push(circle)
      })

      console.log("[v0] Safety heatmap displayed with", safetyZones.length, "zones")
    } catch (error) {
      console.error("[v0] Error displaying safety heatmap:", error)
    }
  }

  const removeHeatmap = () => {
    if (heatmapLayerRef.current && (window as any).leafletMapRef) {
      const map = (window as any).leafletMapRef
      heatmapLayerRef.current.forEach((layer: any) => {
        map.removeLayer(layer)
      })
      heatmapLayerRef.current = null
    }
  }

  const generateSafetyZones = (incidents: any[]) => {
    const zones: any[] = []
    const gridSize = 0.002 // Approximately 200m grid

    // Create a grid of safety zones
    for (let lat = 12.985; lat <= 12.998; lat += gridSize) {
      for (let lng = 80.228; lng <= 80.245; lng += gridSize) {
        const nearbyIncidents = incidents.filter((incident) => {
          const distance = calculateDistance({ lat, lng }, incident.location)
          return distance <= 300 // 300m radius
        })

        let safetyScore = 95 // Base safety score
        let color = "#10b981" // Green (safe)
        let level = "High"

        if (nearbyIncidents.length > 0) {
          // Reduce safety score based on incidents
          safetyScore -= nearbyIncidents.length * 10

          // Adjust for severity
          nearbyIncidents.forEach((incident) => {
            switch (incident.severity) {
              case "critical":
                safetyScore -= 20
                break
              case "high":
                safetyScore -= 15
                break
              case "medium":
                safetyScore -= 10
                break
              case "low":
                safetyScore -= 5
                break
            }
          })

          safetyScore = Math.max(30, safetyScore)

          if (safetyScore < 60) {
            color = "#ef4444" // Red (unsafe)
            level = "Low"
          } else if (safetyScore < 80) {
            color = "#f59e0b" // Orange (moderate)
            level = "Medium"
          }
        }

        // Only add zones with incidents or low safety scores
        if (nearbyIncidents.length > 0 || safetyScore < 90) {
          zones.push({
            lat,
            lng,
            radius: 150,
            color,
            level,
            incidents: nearbyIncidents.length,
            safetyScore: Math.round(safetyScore),
          })
        }
      }
    }

    return zones
  }

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371000 // Earth's radius in meters
    const dLat = toRadians(point2.lat - point1.lat)
    const dLng = toRadians(point2.lng - point1.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180)
  }

  return null // This component doesn't render anything visible
}
