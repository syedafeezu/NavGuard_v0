"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react"
import { useNavGuard } from "@/contexts/navguard-context"
import { BUILDINGS_DATABASE, BUILDING_CATEGORIES } from "@/lib/buildings-database"
import { IncidentReportModal } from "@/components/incident-report-modal"
import { SafetyHeatmap } from "@/components/safety-heatmap"
import { IncidentMarkers } from "@/components/incident-markers"

interface MapContainerProps {
  userLocation: { lat: number; lng: number } | null
  locationError: string | null
}

export function MapContainer({ userLocation, locationError }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const buildingMarkersRef = useRef<any[]>([])
  const initializingRef = useRef(false) // Add flag to prevent multiple initializations
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false)
  const { state, dispatch } = useNavGuard()

  useEffect(() => {
    let mounted = true

    const initializeMap = async () => {
      if (initializingRef.current || leafletMapRef.current) return
      initializingRef.current = true

      try {
        // Dynamic import of Leaflet to avoid SSR issues
        const L = await import("leaflet")

        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "/location-marker.png",
          iconUrl: "/location-marker.png",
          shadowUrl: "/marker-shadow.png",
        })

        if (!mapRef.current) return

        // Initialize map centered on IIT Madras
        const map = L.map(mapRef.current, {
          center: [state.mapCenter.lat, state.mapCenter.lng],
          zoom: state.mapZoom,
          minZoom: 14,
          maxZoom: 19,
          zoomControl: false,
        })

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        // Add custom zoom control
        L.control
          .zoom({
            position: "bottomright",
          })
          .addTo(map)

        // Add campus boundary (approximate IIT Madras boundary)
        const campusBounds = [
          [12.985, 80.228],
          [12.998, 80.228],
          [12.998, 80.24],
          [12.985, 80.24],
          [12.985, 80.228],
        ]

        L.polygon(campusBounds, {
          color: "#3b82f6",
          weight: 2,
          opacity: 0.8,
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
        })
          .addTo(map)
          .bindPopup("IIT Madras Campus Boundary")

        BUILDINGS_DATABASE.forEach((building) => {
          const category = BUILDING_CATEGORIES[building.category]

          const customIcon = L.divIcon({
            html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold" style="background-color: ${category.color}">
              ${category.icon}
            </div>`,
            className: "custom-marker",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker([building.coordinates.lat, building.coordinates.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-3 min-w-48">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="text-lg">${category.icon}</span>
                  <h3 class="font-semibold text-sm">${building.name}</h3>
                </div>
                <p class="text-xs text-gray-600 mb-2">${building.description || category.name}</p>
                ${building.openHours ? `<p class="text-xs text-gray-500 mb-2">⏰ ${building.openHours}</p>` : ""}
                ${building.safetyScore ? `<p class="text-xs text-green-600 mb-3">🛡️ Safety: ${building.safetyScore}%</p>` : ""}
                <button class="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                  Get Directions
                </button>
              </div>
            `)

          buildingMarkersRef.current.push(marker)

          // Add click handler to select building
          marker.on("click", () => {
            dispatch({ type: "SET_SELECTED_BUILDING", payload: building })
          })
        })

        map.on("contextmenu", (e: any) => {
          setReportLocation({ lat: e.latlng.lat, lng: e.latlng.lng })
          setShowIncidentReport(true)
        })

        // Map event listeners
        map.on("moveend", () => {
          const center = map.getCenter()
          dispatch({
            type: "SET_MAP_CENTER",
            payload: { lat: center.lat, lng: center.lng },
          })
        })

        map.on("zoomend", () => {
          dispatch({
            type: "SET_MAP_ZOOM",
            payload: map.getZoom(),
          })
        })

        leafletMapRef.current = map
        // Make map available globally for other components
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
        initializingRef.current = false // Reset initialization flag
      }
    }

    initializeMap()

    return () => {
      mounted = false
      initializingRef.current = false // Reset flag on cleanup
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
        ;(window as any).leafletMapRef = null
      }
      buildingMarkersRef.current = []
    }
  }, [dispatch]) // Removed state.mapCenter and state.mapZoom dependencies

  // Update user location marker
  useEffect(() => {
    if (!leafletMapRef.current || !userLocation || !mapLoaded) return

    const updateUserMarker = async () => {
      try {
        const L = await import("leaflet")

        if (!leafletMapRef.current) {
          console.log("[v0] Map not ready for user marker update")
          return
        }

        // Remove existing user marker
        if (userMarkerRef.current) {
          leafletMapRef.current.removeLayer(userMarkerRef.current)
        }

        // Create user location marker
        const userIcon = L.divIcon({
          html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
          className: "user-location-marker",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(leafletMapRef.current)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">Your Location</h3>
              <p class="text-xs text-gray-600">
                ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}
              </p>
            </div>
          `)

        // Update context with current location
        dispatch({
          type: "SET_CURRENT_LOCATION",
          payload: userLocation,
        })

        console.log("[v0] User location marker updated:", userLocation)
      } catch (error) {
        console.error("[v0] Error updating user marker:", error)
      }
    }

    updateUserMarker()
  }, [userLocation, dispatch, mapLoaded])

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
      <div ref={mapRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 backdrop-blur-sm">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
            <div>
              <h3 className="font-semibold text-foreground">Loading Campus Map</h3>
              <p className="text-sm text-muted-foreground">Loading {BUILDINGS_DATABASE.length} campus locations...</p>
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

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 space-y-2">
        <button
          onClick={() => {
            if (leafletMapRef.current && userLocation) {
              leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 18)
            }
          }}
          className="bg-card border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
          title="Center on my location"
        >
          <MapPin className="w-5 h-5 text-blue-600" />
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
        <p className="text-xs text-muted-foreground mt-1">Safety Score: 87%</p>
        <p className="text-xs text-muted-foreground">Right-click to report incidents</p>
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
