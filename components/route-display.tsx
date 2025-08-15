"use client"

import { useEffect, useRef } from "react"
import { useNavGuard } from "@/contexts/navguard-context"

export function RouteDisplay() {
  const { state } = useNavGuard()
  const routeLayerRef = useRef<any>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    // This will be called when a route is selected
    if (state.currentRoute && window.leafletMapRef) {
      displayRouteOnMap(state.currentRoute)
    }
  }, [state.currentRoute])

  const displayRouteOnMap = async (route: any) => {
    try {
      const L = await import("leaflet")
      const map = window.leafletMapRef

      if (!map) return

      // Remove existing route layer
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current)
      }

      // Create route polyline
      const routeCoordinates = route.points.map((point: any) => [point.lat, point.lng])

      const routeColor = getRouteColor(route.type)

      routeLayerRef.current = L.polyline(routeCoordinates, {
        color: routeColor,
        weight: 4,
        opacity: 0.8,
        dashArray: route.type === "safest" ? "10, 5" : undefined,
      }).addTo(map)

      // Add route markers for key points
      route.points.forEach((point: any, index: number) => {
        if (index === 0 || index === route.points.length - 1 || point.instruction?.includes("turn")) {
          const markerIcon = L.divIcon({
            html: `<div class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
              ${index === 0 ? "S" : index === route.points.length - 1 ? "E" : index + 1}
            </div>`,
            className: "route-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          L.marker([point.lat, point.lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-2">
                <p class="text-sm font-medium">${point.instruction}</p>
                ${point.distance ? `<p class="text-xs text-gray-600">${point.distance}m • ${Math.round(point.duration / 60)} min</p>` : ""}
              </div>
            `)
        }
      })

      // Fit map to route bounds
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [20, 20] })

      console.log("[v0] Route displayed on map:", route.name)
    } catch (error) {
      console.error("[v0] Error displaying route:", error)
    }
  }

  const getRouteColor = (routeType: string): string => {
    switch (routeType) {
      case "shortest":
        return "#3b82f6" // blue
      case "safest":
        return "#10b981" // green
      case "covered":
        return "#f59e0b" // amber
      case "scenic":
        return "#8b5cf6" // purple
      default:
        return "#6b7280" // gray
    }
  }

  return null // This component doesn't render anything visible
}
