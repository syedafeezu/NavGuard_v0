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
      const routeData = route.points || route.path
      if (!route || !routeData || !Array.isArray(routeData) || routeData.length === 0) {
        console.error("[v0] Invalid route data:", route)
        return
      }

      const L = (window as any).L
      const map = (window as any).leafletMapRef

      if (!L || !map) {
        console.error("[v0] Leaflet not available")
        return
      }

      // Remove existing route layer
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current)
      }

      const routeCoordinates = routeData.map((point: any) => [point.lat, point.lng])

      const routeColor = getRouteColor(route.type)

      routeLayerRef.current = L.polyline(routeCoordinates, {
        color: routeColor,
        weight: 4,
        opacity: 0.8,
        dashArray: route.type?.toLowerCase().includes("safest") ? "10, 5" : undefined,
      }).addTo(map)

      if (route.points) {
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
                  <p class="text-sm font-medium">${point.instruction || "Waypoint"}</p>
                  ${point.distance ? `<p class="text-xs text-gray-600">${point.distance}m • ${Math.round(point.duration / 60)} min</p>` : ""}
                </div>
              `)
          }
        })
      } else if (route.path) {
        const startIcon = L.divIcon({
          html: `<div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">S</div>`,
          className: "route-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        const endIcon = L.divIcon({
          html: `<div class="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">E</div>`,
          className: "route-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        L.marker([route.path[0].lat, route.path[0].lng], { icon: startIcon })
          .addTo(map)
          .bindPopup(`<div class="p-2"><p class="text-sm font-medium">Start: Main Gate</p></div>`)

        L.marker([route.path[route.path.length - 1].lat, route.path[route.path.length - 1].lng], { icon: endIcon })
          .addTo(map)
          .bindPopup(
            `<div class="p-2"><p class="text-sm font-medium">Destination: ${route.destination || "Unknown"}</p></div>`,
          )
      }

      // Fit map to route bounds
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [20, 20] })

      console.log("[v0] Route displayed on map:", route.name || route.type || "Unknown Route")
    } catch (error) {
      console.error("[v0] Error displaying route:", error)
    }
  }

  const getRouteColor = (routeType: string): string => {
    const type = routeType?.toLowerCase() || ""
    if (type.includes("shortest")) return "#3b82f6" // blue
    if (type.includes("safest")) return "#10b981" // green
    if (type.includes("covered")) return "#f59e0b" // amber
    if (type.includes("scenic")) return "#8b5cf6" // purple
    return "#6b7280" // gray
  }

  return null // This component doesn't render anything visible
}
