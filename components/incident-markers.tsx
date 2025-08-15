"use client"

import { useEffect, useRef } from "react"
import { useNavGuard } from "@/contexts/navguard-context"
import { INCIDENT_TYPES, SEVERITY_CONFIG, SAMPLE_INCIDENTS } from "@/lib/incident-types"

export function IncidentMarkers() {
  const { state } = useNavGuard()
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    displayIncidentMarkers()
  }, [state.incidents])

  const displayIncidentMarkers = async () => {
    try {
      const L = await import("leaflet")
      const map = (window as any).leafletMapRef

      if (!map) return

      // Remove existing markers
      markersRef.current.forEach((marker) => {
        map.removeLayer(marker)
      })
      markersRef.current = []

      // Combine real incidents with sample data
      const allIncidents = [...state.incidents, ...SAMPLE_INCIDENTS]

      allIncidents.forEach((incident) => {
        const incidentConfig = INCIDENT_TYPES[incident.type]
        const severityConfig = SEVERITY_CONFIG[incident.severity]

        const markerIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm" 
                   style="background-color: ${severityConfig.color}">
                ${incidentConfig.icon}
              </div>
              ${
                incident.severity === "critical"
                  ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>'
                  : ""
              }
            </div>
          `,
          className: "incident-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([incident.location.lat, incident.location.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-3 min-w-64">
              <div class="flex items-center space-x-2 mb-2">
                <span class="text-lg">${incidentConfig.icon}</span>
                <h3 class="font-semibold text-sm">${incidentConfig.name}</h3>
                <span class="px-2 py-1 text-xs rounded-full text-white" style="background-color: ${severityConfig.color}">
                  ${severityConfig.name}
                </span>
              </div>
              
              <p class="text-sm text-gray-700 mb-3">${incident.description}</p>
              
              <div class="space-y-1 text-xs text-gray-600">
                <p><strong>Reported:</strong> ${incident.timestamp.toLocaleString()}</p>
                <p><strong>Status:</strong> <span class="capitalize">${incident.status}</span></p>
                ${
                  incident.reporterContact && !incident.anonymous
                    ? `<p><strong>Contact:</strong> ${incident.reporterContact}</p>`
                    : "<p><strong>Anonymous Report</strong></p>"
                }
              </div>
              
              ${
                incident.photos && incident.photos.length > 0
                  ? `<div class="mt-2">
                  <p class="text-xs font-medium text-gray-600 mb-1">Photos (${incident.photos.length})</p>
                  <div class="flex space-x-1">
                    ${incident.photos
                      .slice(0, 2)
                      .map((photo) => `<img src="${photo}" class="w-12 h-12 object-cover rounded border" />`)
                      .join("")}
                    ${incident.photos.length > 2 ? `<div class="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs">+${incident.photos.length - 2}</div>` : ""}
                  </div>
                </div>`
                  : ""
              }
            </div>
          `)

        markersRef.current.push(marker)
      })

      console.log("[v0] Displayed", allIncidents.length, "incident markers")
    } catch (error) {
      console.error("[v0] Error displaying incident markers:", error)
    }
  }

  return null // This component doesn't render anything visible
}
