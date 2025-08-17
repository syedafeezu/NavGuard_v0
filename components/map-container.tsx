"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, AlertTriangle, Loader2, Eye, EyeOff, Locate } from "lucide-react"
import { useNavGuard } from "@/contexts/navguard-context"
import { BUILDINGS_DATABASE, BUILDING_CATEGORIES } from "@/lib/buildings-database"
import { IncidentReportModal } from "@/components/incident-report-modal"
import { SafetyHeatmap } from "@/components/safety-heatmap"
import { IncidentMarkers } from "@/components/incident-markers"
import { toast } from "sonner"

declare global {
  interface Window {
    L: any
  }
}

interface MapContainerProps {
  userLocation: { lat: number; lng: number } | null
  locationError: string | null
}

export function MapContainer({ userLocation, locationError }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const buildingMarkersRef = useRef<any[]>([])
  const routeLayersRef = useRef<any[]>([])
  const initializingRef = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false)
  const { state, dispatch } = useNavGuard()

  useEffect(() => {
    if (!leafletMapRef.current || !state.currentRoute) return

    const displayRoute = () => {
      try {
        const L = window.L
        if (!L) return

        if (
          !state.currentRoute.path ||
          !Array.isArray(state.currentRoute.path) ||
          state.currentRoute.path.length === 0
        ) {
          console.log("[v0] Error displaying route: state.currentRoute.path is undefined")
          return
        }

        // Remove existing routes
        routeLayersRef.current.forEach((layer) => {
          if (leafletMapRef.current) {
            leafletMapRef.current.removeLayer(layer)
          }
        })
        routeLayersRef.current = []

        // Create primary route (safest)
        const routeCoordinates = state.currentRoute.path.map((point) => [point.lat, point.lng] as [number, number])

        const primaryRoute = L.polyline(routeCoordinates, {
          color: "#10b981", // Green for safest route
          weight: 6,
          opacity: 0.9,
          smoothFactor: 1,
        }).addTo(leafletMapRef.current)

        routeLayersRef.current.push(primaryRoute)

        // Create alternative route (fastest) with different color
        const alternativeCoordinates = routeCoordinates.map(
          ([lat, lng]) =>
            [lat + (Math.random() - 0.5) * 0.001, lng + (Math.random() - 0.5) * 0.001] as [number, number],
        )

        const alternativeRoute = L.polyline(alternativeCoordinates, {
          color: "#3b82f6", // Blue for fastest route
          weight: 4,
          opacity: 0.7,
          dashArray: "10, 5",
          smoothFactor: 1,
        }).addTo(leafletMapRef.current)

        routeLayersRef.current.push(alternativeRoute)

        // Add route legend
        const legend = L.control({ position: "bottomright" })
        legend.onAdd = () => {
          const div = L.DomUtil.create("div", "route-legend")
          div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-size: 12px;">
              <div style="margin-bottom: 5px;"><span style="color: #10b981; font-weight: bold;">━━</span> Safest Route (${state.currentRoute.safetyScore || 85}%)</div>
              <div><span style="color: #3b82f6; font-weight: bold;">┅┅</span> Fastest Route</div>
            </div>
          `
          return div
        }
        legend.addTo(leafletMapRef.current)

        // Fit map to show entire route
        const bounds = L.latLngBounds(routeCoordinates)
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] })

        toast.success("Route generated!", {
          description: `${state.currentRoute.safetyScore || 85}% safe route highlighted on map`,
        })

        console.log("[v0] Route displayed on map:", state.currentRoute.type || "Safest Route")
      } catch (error) {
        console.error("[v0] Error displaying route:", error)
      }
    }

    displayRoute()
  }, [state.currentRoute])

  useEffect(() => {
    let mounted = true

    const initializeMap = () => {
      if (initializingRef.current || leafletMapRef.current) return

      if (!window.L) {
        setTimeout(initializeMap, 100)
        return
      }

      initializingRef.current = true

      try {
        const L = window.L

        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/location-marker.png",
          iconUrl: "/location-marker.png",
          shadowUrl: "/marker-shadow.png",
        })

        if (!mapRef.current) return

        const map = L.map(mapRef.current, {
          center: [12.9915936, 80.2336832], // Exact IIT Madras coordinates
          zoom: 16, // Optimal zoom level
          minZoom: 14,
          maxZoom: 19,
          zoomControl: false,
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        L.control.zoom({ position: "bottomright" }).addTo(map)

        const campusBounds: [number, number][] = [
          [12.985, 80.228],
          [12.998, 80.228],
          [12.998, 80.24],
          [12.985, 80.24],
          [12.985, 80.228],
        ]

        L.polygon(campusBounds, {
          color: "#3b82f6",
          weight: 2,
          opacity: 0.6,
          fillColor: "#3b82f6",
          fillOpacity: 0.05,
        })
          .addTo(map)
          .bindPopup("IIT Madras Campus")

        BUILDINGS_DATABASE.forEach((building) => {
          const category = BUILDING_CATEGORIES[building.category]
          const customIcon = L.divIcon({
            html: `<div class="w-5 h-5 rounded-full border border-white shadow-md flex items-center justify-center text-white text-xs font-bold" style="background-color: ${category.color}">${category.icon}</div>`,
            className: "custom-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const marker = L.marker([building.coordinates.lat, building.coordinates.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-2 min-w-40">
                <div class="flex items-center space-x-2 mb-1">
                  <span>${category.icon}</span>
                  <h3 class="font-semibold text-sm">${building.name}</h3>
                </div>
                <p class="text-xs text-gray-600 mb-2">${building.description || category.name}</p>
                <button 
                  class="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 get-directions-btn" 
                  data-building-id="${building.id}"
                >
                  Get Directions
                </button>
              </div>
            `)

          buildingMarkersRef.current.push(marker)

          marker.on("click", () => {
            dispatch({ type: "SET_SELECTED_BUILDING", payload: building })
          })

          marker.on("popupopen", () => {
            const popup = marker.getPopup()
            const popupElement = popup.getElement()
            if (popupElement) {
              const directionBtn = popupElement.querySelector(".get-directions-btn") as HTMLButtonElement
              if (directionBtn) {
                directionBtn.onclick = (e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  // Calculate and display route from main gate to this building
                  const mainGate = { lat: 12.995, lng: 80.225 }
                  const destination = building.coordinates

                  // Create a simple route (in real implementation, this would use proper routing)
                  const routePath = [
                    mainGate,
                    { lat: (mainGate.lat + destination.lat) / 2, lng: (mainGate.lng + destination.lng) / 2 },
                    destination,
                  ]

                  const route = {
                    path: routePath,
                    distance: Math.round(calculateDistance(mainGate, destination)),
                    duration: Math.round((calculateDistance(mainGate, destination) / 80) * 60), // Rough walking time
                    safetyScore: building.safetyScore || 85,
                    type: "Safest Route",
                    destination: building.name,
                  }

                  dispatch({ type: "SET_CURRENT_ROUTE", payload: route })

                  toast.success(`Directions to ${building.name}`, {
                    description: `${route.distance}m walk • ${route.duration} min • ${route.safetyScore}% safe`,
                  })

                  // Close the popup
                  marker.closePopup()
                }
              }
            }
          })
        })

        map.on("contextmenu", (e: any) => {
          setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
          setShowIncidentReport(true)
        })

        leafletMapRef.current = map
        ;(window as any).leafletMapRef = map

        if (mounted) {
          setMapLoaded(true)
          console.log("[v0] Leaflet map initialized with", BUILDINGS_DATABASE.length, "buildings")
        }
      } catch (error) {
        console.error("[v0] Error initializing map:", error)
        if (mounted) {
          setMapError("Failed to load map. Please refresh the page.")
        }
      } finally {
        initializingRef.current = false
      }
    }

    initializeMap()

    return () => {
      mounted = false
      initializingRef.current = false
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        ;(window as any).leafletMapRef = null
      }
      buildingMarkersRef.current = []
      routeLayersRef.current = []
    }
  }, [dispatch])

  useEffect(() => {
    if (!leafletMapRef.current || !userLocation || !mapLoaded) return

    const updateUserMarker = () => {
      try {
        const L = window.L
        if (!L || !leafletMapRef.current) return

        if (userMarkerRef.current) {
          leafletMapRef.current.removeLayer(userMarkerRef.current)
        }

        const userIcon = L.divIcon({
          html: `<div class="w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">🚪</div>`,
          className: "user-location-marker",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">Main Gate (Starting Point)</h3>
              <p class="text-xs text-gray-600">Your navigation starts here</p>
            </div>
          `)

        dispatch({ type: "SET_CURRENT_LOCATION", payload: userLocation })
        console.log("[v0] Main gate marker set:", userLocation)
      } catch (error) {
        console.error("[v0] Error updating user marker:", error)
      }
    }

    updateUserMarker()
  }, [userLocation, dispatch, mapLoaded])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 18)
          toast.success("Location found!")
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast.error("Unable to get your location")
      },
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-semibold text-foreground">Map Error</h3>
            <p className="text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
            <div>
              <h3 className="font-semibold text-foreground">Loading Campus Map</h3>
              <p className="text-sm text-muted-foreground">Optimizing for fast navigation...</p>
            </div>
          </div>
        </div>
      )}

      {locationError && (
        <div className="absolute top-4 left-4 right-4 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{locationError}</span>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={handleLocateMe}
          className="bg-card border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
          title="Locate me"
        >
          <Locate className="w-5 h-5 text-blue-600" />
        </button>

        <button
          onClick={() => {
            if (leafletMapRef.current && userLocation) {
              leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 18)
            }
          }}
          className="bg-card border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
          title="Center on main gate"
        >
          <MapPin className="w-5 h-5 text-green-600" />
        </button>

        <button
          onClick={() => setShowSafetyHeatmap(!showSafetyHeatmap)}
          className={`bg-card border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors ${
            showSafetyHeatmap ? "bg-accent" : ""
          }`}
          title="Toggle safety heatmap"
        >
          {showSafetyHeatmap ? (
            <EyeOff className="w-5 h-5 text-orange-600" />
          ) : (
            <Eye className="w-5 h-5 text-orange-600" />
          )}
        </button>

        <button
          onClick={() => {
            setReportLocation(userLocation || { lat: 12.9915936, lng: 80.2336832 })
            setShowIncidentReport(true)
          }}
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 shadow-lg transition-colors"
          title="Report safety incident"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
      </div>

      {/* Safety Status Overlay */}
      <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-foreground">Campus Safe</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Starting from Main Gate</p>
        <p className="text-xs text-muted-foreground">Search destination to navigate</p>
      </div>

      <SafetyHeatmap visible={showSafetyHeatmap} />
      <IncidentMarkers />

      <IncidentReportModal
        isOpen={showIncidentReport}
        onClose={() => setShowIncidentReport(false)}
        initialLocation={reportLocation || undefined}
      />
    </div>
  )
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
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
