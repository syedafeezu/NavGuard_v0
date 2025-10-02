"use client"

import { useEffect, useRef } from "react"
import { useNavGuard } from "@/contexts/navguard-context"
import { INCIDENT_TYPES, SEVERITY_CONFIG, SAMPLE_INCIDENTS } from "@/lib/incident-types"

export function IncidentMarkers() {
  const { state } = useNavGuard()
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    displayIncidentMarkers()

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []
    }
  }, [state.incidents])

  const displayIncidentMarkers = () => {
    try {
      const map = (window as any).googleMapRef

      if (!map) return

      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current = []

      const allIncidents = [...state.incidents, ...SAMPLE_INCIDENTS]

      allIncidents.forEach((incident) => {
        const incidentConfig = INCIDENT_TYPES[incident.type]
        const severityConfig = SEVERITY_CONFIG[incident.severity]

        const marker = new google.maps.Marker({
          position: { lat: incident.location.lat, lng: incident.location.lng },
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: severityConfig.color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 12,
          },
          label: {
            text: incidentConfig.icon,
            color: "#ffffff",
            fontSize: "12px",
          },
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 250px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">${incidentConfig.icon}</span>
                <h3 style="font-weight: 600; font-size: 14px; margin: 0;">${incidentConfig.name}</h3>
                <span style="padding: 4px 8px; font-size: 12px; border-radius: 9999px; color: white; background-color: ${severityConfig.color}">
                  ${severityConfig.name}
                </span>
              </div>

              <p style="font-size: 14px; color: #374151; margin-bottom: 12px;">${incident.description}</p>

              <div style="font-size: 12px; color: #6b7280;">
                <p style="margin: 4px 0;"><strong>Reported:</strong> ${incident.timestamp.toLocaleString()}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="text-transform: capitalize;">${incident.status}</span></p>
                ${
                  incident.reporterContact && !incident.anonymous
                    ? `<p style="margin: 4px 0;"><strong>Contact:</strong> ${incident.reporterContact}</p>`
                    : '<p style="margin: 4px 0;"><strong>Anonymous Report</strong></p>'
                }
              </div>

              ${
                incident.photos && incident.photos.length > 0
                  ? `<div style="margin-top: 8px;">
                  <p style="font-size: 12px; font-weight: 500; color: #6b7280; margin-bottom: 4px;">Photos (${incident.photos.length})</p>
                  <div style="display: flex; gap: 4px;">
                    ${incident.photos
                      .slice(0, 2)
                      .map((photo) => `<img src="${photo}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb;" />`)
                      .join("")}
                    ${incident.photos.length > 2 ? `<div style="width: 48px; height: 48px; background-color: #f3f4f6; border-radius: 4px; border: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 12px;">+${incident.photos.length - 2}</div>` : ""}
                  </div>
                </div>`
                  : ""
              }
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(map, marker)
        })

        markersRef.current.push(marker)
      })

      console.log("Displayed", allIncidents.length, "incident markers")
    } catch (error) {
      console.error("Error displaying incident markers:", error)
    }
  }

  return null
}
