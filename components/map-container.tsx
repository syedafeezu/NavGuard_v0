"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { AlertTriangle, Loader2, Eye, EyeOff, Locate, Navigation, Layers } from "lucide-react"
import { useNavGuard } from "@/contexts/navguard-context"
import { BUILDINGS_DATABASE, BUILDING_CATEGORIES } from "@/lib/buildings-database"
import { IncidentReportModal } from "@/components/incident-report-modal"
import { SafetyHeatmap } from "@/components/safety-heatmap"
import { IncidentMarkers } from "@/components/incident-markers"
import { toast } from "sonner"

interface MapContainerProps {
  userLocation: { lat: number; lng: number } | null
  locationError: string | null
}

export function MapContainer({ userLocation, locationError }: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const userMarkerRef = useRef<google.maps.Marker | null>(null)
  const buildingMarkersRef = useRef<google.maps.Marker[]>([])
  const markerClusterRef = useRef<any>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const initializingRef = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const { state, dispatch } = useNavGuard()

  useEffect(() => {
    if (!googleMapRef.current || !state.currentRoute) return

    const displayRoute = async () => {
      try {
        if (!directionsServiceRef.current || !directionsRendererRef.current) return

        if (
          !state.currentRoute.path ||
          !Array.isArray(state.currentRoute.path) ||
          state.currentRoute.path.length === 0
        ) {
          console.log("Error displaying route: path is undefined")
          return
        }

        const origin = state.currentRoute.path[0]
        const destination = state.currentRoute.path[state.currentRoute.path.length - 1]

        const request: google.maps.DirectionsRequest = {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.WALKING,
        }

        directionsServiceRef.current.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result)

            const route = result.routes[0]
            const leg = route.legs[0]

            toast.success(`Route to ${(state.currentRoute as any).destination || 'destination'}`, {
              description: `${leg.distance?.text} • ${leg.duration?.text} walk`,
              duration: 4000,
            })
          } else {
            console.error("Directions request failed:", status)
            toast.error("Could not calculate route", {
              description: "Using campus roads for navigation",
            })
          }
        })
      } catch (error) {
        console.error("Error displaying route:", error)
      }
    }

    displayRoute()
  }, [state.currentRoute])

  useEffect(() => {
    let mounted = true

    const initializeMap = async () => {
      if (initializingRef.current || googleMapRef.current) return

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        setMapError("Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env")
        return
      }

      initializingRef.current = true

      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places", "geometry", "marker"],
        })

        await loader.load()

        if (!mapRef.current || !mounted) return

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 12.9915936, lng: 80.2336832 },
          zoom: 16,
          minZoom: 14,
          maxZoom: 20,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          mapId: "navguard_campus_map",
        })

        googleMapRef.current = map
        ;(window as any).googleMapRef = map
        directionsServiceRef.current = new google.maps.DirectionsService()
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 6,
            strokeOpacity: 0.8,
          },
        })

        const campusBounds = [
          { lat: 12.985, lng: 80.228 },
          { lat: 12.998, lng: 80.228 },
          { lat: 12.998, lng: 80.24 },
          { lat: 12.985, lng: 80.24 },
        ]

        new google.maps.Polygon({
          paths: campusBounds,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.05,
          map: map,
        })

        BUILDINGS_DATABASE.forEach((building) => {
          const category = BUILDING_CATEGORIES[building.category]

          const marker = new google.maps.Marker({
            position: { lat: building.coordinates.lat, lng: building.coordinates.lng },
            map: map,
            title: building.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: category.color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 10,
            },
          })

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; min-width: 250px; max-width: 320px;">
                <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${category.color}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px;">
                    ${category.icon}
                  </div>
                  <div style="flex: 1;">
                    <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0; color: #111827;">${building.name}</h3>
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">${category.name}</p>
                  </div>
                </div>

                ${building.description ? `<p style="font-size: 14px; color: #374151; margin-bottom: 12px;">${building.description}</p>` : ""}

                ${building.openHours ? `
                  <div style="font-size: 14px; color: #059669; margin-bottom: 8px;">
                    🕐 ${building.openHours}
                  </div>
                ` : ""}

                ${building.safetyScore ? `
                  <div style="font-size: 14px; color: #059669; margin-bottom: 12px;">
                    🛡️ ${building.safetyScore}% Safety Score
                  </div>
                ` : ""}

                <button
                  id="directions-btn-${building.id}"
                  style="width: 100%; padding: 10px 16px; background-color: #3b82f6; color: white; font-size: 14px; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
                  onmouseover="this.style.backgroundColor='#2563eb'"
                  onmouseout="this.style.backgroundColor='#3b82f6'"
                >
                  <span>🧭</span>
                  <span>Get Directions</span>
                </button>
              </div>
            `,
          })

          marker.addListener("click", () => {
            infoWindow.open(map, marker)
            dispatch({ type: "SET_SELECTED_BUILDING", payload: building })

            setTimeout(() => {
              const directionsBtn = document.getElementById(`directions-btn-${building.id}`)
              if (directionsBtn) {
                directionsBtn.onclick = (e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  const mainGate = { lat: 12.995, lng: 80.225 }
                  const destination = building.coordinates

                  const routePath = [mainGate, destination]

                  const route = {
                    path: routePath,
                    distance: Math.round(calculateDistance(mainGate, destination)),
                    duration: Math.round((calculateDistance(mainGate, destination) / 80) * 60),
                    safetyScore: building.safetyScore || 85,
                    type: "Safest Route",
                    destination: building.name,
                  }

                  dispatch({ type: "SET_CURRENT_ROUTE", payload: route })
                  infoWindow.close()
                }
              }
            }, 100)
          })

          buildingMarkersRef.current.push(marker)
        })

        map.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            setReportLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() })
            setShowIncidentReport(true)
          }
        })

        if (mounted) {
          setMapLoaded(true)
          console.log("Google Maps initialized with", BUILDINGS_DATABASE.length, "buildings")
        }
      } catch (error) {
        console.error("Error initializing map:", error)
        if (mounted) {
          setMapError("Failed to load Google Maps. Please check your API key and internet connection.")
        }
      } finally {
        initializingRef.current = false
      }
    }

    initializeMap()

    return () => {
      mounted = false
      initializingRef.current = false
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
      }
      buildingMarkersRef.current.forEach(marker => marker.setMap(null))
      buildingMarkersRef.current = []
      googleMapRef.current = null
      directionsServiceRef.current = null
      directionsRendererRef.current = null
    }
  }, [dispatch])

  useEffect(() => {
    if (!googleMapRef.current || !userLocation || !mapLoaded) return

    const updateUserMarker = () => {
      try {
        if (userMarkerRef.current) {
          userMarkerRef.current.setMap(null)
        }

        const marker = new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: googleMapRef.current,
          title: "Main Gate (Starting Point)",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#16a34a",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
            scale: 12,
          },
          label: {
            text: "🚪",
            color: "#ffffff",
            fontSize: "14px",
          },
        })

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">Main Gate (Starting Point)</h3>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">Your navigation starts here</p>
            </div>
          `,
        })

        marker.addListener("click", () => {
          infoWindow.open(googleMapRef.current, marker)
        })

        userMarkerRef.current = marker
        dispatch({ type: "SET_CURRENT_LOCATION", payload: userLocation })
        console.log("Main gate marker set:", userLocation)
      } catch (error) {
        console.error("Error updating user marker:", error)
      }
    }

    updateUserMarker()
  }, [userLocation, dispatch, mapLoaded])

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported", {
        description: "Your browser doesn't support GPS location",
      })
      return
    }

    setIsLocating(true)
    toast.loading("Finding your location...", { id: "locating" })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        if (googleMapRef.current) {
          googleMapRef.current.panTo({ lat: latitude, lng: longitude })
          googleMapRef.current.setZoom(18)

          const tempMarker = new google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: googleMapRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: "#3b82f6",
              fillOpacity: 0.8,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 8,
            },
          })

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">📍 Your Current Location</h3>
                <p style="font-size: 12px; color: #6b7280; margin: 0;">Accuracy: ±${Math.round(accuracy)}m</p>
              </div>
            `,
          })

          infoWindow.open(googleMapRef.current, tempMarker)

          setTimeout(() => {
            tempMarker.setMap(null)
          }, 5000)

          toast.success("Location found!", {
            id: "locating",
            description: `Accuracy: ±${Math.round(accuracy)} meters`,
          })
        }
        setIsLocating(false)
      },
      (error) => {
        console.error("Geolocation error:", error)
        let errorMessage = "Unable to get your location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }

        toast.error(errorMessage, {
          id: "locating",
          description: "Please check your location settings",
        })
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center space-y-4 p-6">
          <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
          <div>
            <h3 className="font-semibold text-foreground">Map Error</h3>
            <p className="text-sm text-muted-foreground mt-2">{mapError}</p>
            <p className="text-xs text-muted-foreground mt-4">
              Add your Google Maps API key to the .env file:
              <br />
              <code className="bg-muted px-2 py-1 rounded mt-2 inline-block">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
              </code>
            </p>
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
              <p className="text-sm text-muted-foreground">Initializing Google Maps...</p>
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

      <div className="absolute top-4 right-4 flex flex-col space-y-2 sm:space-y-3">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className={`bg-card border border-border rounded-lg p-3 sm:p-2 shadow-lg hover:bg-accent transition-colors touch-manipulation ${
            isLocating ? "opacity-50 cursor-not-allowed" : ""
          }`}
          title="Find my current location"
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : (
            <Locate className="w-5 h-5 text-blue-600" />
          )}
        </button>

        <button
          onClick={() => {
            if (googleMapRef.current && userLocation) {
              googleMapRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng })
              googleMapRef.current.setZoom(16)
              toast.info("Centered on Main Gate")
            }
          }}
          className="bg-card border border-border rounded-lg p-3 sm:p-2 shadow-lg hover:bg-accent transition-colors touch-manipulation"
          title="Center on main gate"
        >
          <Navigation className="w-5 h-5 text-green-600" />
        </button>

        <button
          onClick={() => setShowSafetyHeatmap(!showSafetyHeatmap)}
          className={`bg-card border border-border rounded-lg p-3 sm:p-2 shadow-lg hover:bg-accent transition-colors touch-manipulation ${
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
          className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 sm:p-2 shadow-lg transition-colors touch-manipulation"
          title="Report safety incident"
        >
          <AlertTriangle className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-[calc(100vw-8rem)] sm:max-w-none">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="text-sm font-medium text-foreground">Campus Safe</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Starting from Main Gate</p>
        <p className="text-xs text-muted-foreground hidden sm:block">Search destination to navigate</p>
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
  const R = 6371
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
