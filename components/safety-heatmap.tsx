"use client"

import { useEffect, useRef } from "react"
import { useNavGuard } from "@/contexts/navguard-context"
import { SAMPLE_INCIDENTS } from "@/lib/incident-types"

interface SafetyHeatmapProps {
  visible: boolean
}

export function SafetyHeatmap({ visible }: SafetyHeatmapProps) {
  const { state } = useNavGuard()
  const heatmapLayerRef = useRef<google.maps.Circle[]>([])

  useEffect(() => {
    if (!visible) {
      removeHeatmap()
      return
    }

    displayHeatmap()

    return () => {
      removeHeatmap()
    }
  }, [visible, state.incidents])

  const displayHeatmap = () => {
    try {
      const map = (window as any).googleMapRef

      if (!map) return

      removeHeatmap()

      const allIncidents = [...state.incidents, ...SAMPLE_INCIDENTS]

      const safetyZones = generateSafetyZones(allIncidents)

      safetyZones.forEach((zone) => {
        const circle = new google.maps.Circle({
          center: { lat: zone.lat, lng: zone.lng },
          radius: zone.radius,
          fillColor: zone.color,
          fillOpacity: 0.3,
          strokeColor: zone.color,
          strokeOpacity: 0.6,
          strokeWeight: 1,
          map: map,
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">${zone.level} Safety Zone</h4>
              <p style="font-size: 12px; color: #6b7280; margin: 2px 0;">${zone.incidents} incident(s) reported</p>
              <p style="font-size: 12px; color: #6b7280; margin: 2px 0;">Safety Score: ${zone.safetyScore}%</p>
            </div>
          `,
        })

        google.maps.event.addListener(circle, "click", (e: google.maps.MapMouseEvent) => {
          infoWindow.setPosition(e.latLng)
          infoWindow.open(map)
        })

        heatmapLayerRef.current.push(circle)
      })

      console.log("Safety heatmap displayed with", safetyZones.length, "zones")
    } catch (error) {
      console.error("Error displaying safety heatmap:", error)
    }
  }

  const removeHeatmap = () => {
    heatmapLayerRef.current.forEach(circle => circle.setMap(null))
    heatmapLayerRef.current = []
  }

  const generateSafetyZones = (incidents: any[]) => {
    const zones: any[] = []
    const gridSize = 0.002

    for (let lat = 12.985; lat <= 12.998; lat += gridSize) {
      for (let lng = 80.228; lng <= 80.245; lng += gridSize) {
        const nearbyIncidents = incidents.filter((incident) => {
          const distance = calculateDistance({ lat, lng }, incident.location)
          return distance <= 300
        })

        let safetyScore = 95
        let color = "#10b981"
        let level = "High"

        if (nearbyIncidents.length > 0) {
          safetyScore -= nearbyIncidents.length * 10

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
            color = "#ef4444"
            level = "Low"
          } else if (safetyScore < 80) {
            color = "#f59e0b"
            level = "Medium"
          }
        }

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
    const R = 6371000
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

  return null
}
