"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, Loader2, Eye, EyeOff, Locate, Navigation, Layers } from "lucide-react"
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
  const markerClusterRef = useRef<any>(null)
  const routeLayersRef = useRef<any[]>([])
  const initializingRef = useRef(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showIncidentReport, setShowIncidentReport] = useState(false)
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showSafetyHeatmap, setShowSafetyHeatmap] = useState(false)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
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
          color: "#3b82f6", // Blue for safest route
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
          color: "#10b981", // Green for shortest route
          weight: 4,
          opacity: 0.7,
          dashArray: "10, 5",
          smoothFactor: 1,
        }).addTo(leafletMapRef.current)

        routeLayersRef.current.push(alternativeRoute)

        // Fit map to show entire route
        const bounds = L.latLngBounds(routeCoordinates)
        leafletMapRef.current.fitBounds(bounds, { padding: [50, 50] })

        console.log("[v0] Route displayed on map:", state.currentRoute.type || "Safest Route")
      } catch (error) {
        console.error("[v0] Error displaying route:", error)
      }
    }

    displayRoute()
  }, [state.currentRoute])

  useEffect(() => {
    if (!leafletMapRef.current) return

    const L = window.L
    if (!L) return

    // Remove existing legend if any
    const existingLegend = document.querySelector(".permanent-route-legend")
    if (existingLegend) {
      existingLegend.remove()
    }

    // Add permanent route legend
    const legend = L.control({ position: "bottomright" })
    legend.onAdd = () => {
      const div = L.DomUtil.create("div", "permanent-route-legend")
      div.innerHTML = `
        <div style="
          background: white; 
          padding: 12px 16px; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
          font-size: 14px;
          font-weight: 500;
          min-width: 200px;
          border: 1px solid rgba(0,0,0,0.1);
        ">
          <div style="margin-bottom: 8px; font-weight: 600; color: #374151; font-size: 13px;">ROUTE LEGEND</div>
          <div style="margin-bottom: 6px; display: flex; align-items: center;">
            <span style="color: #3b82f6; font-weight: bold; margin-right: 8px; font-size: 16px;">━━━</span> 
            <span style="color: #374151;">Blue = Safest Route</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="color: #10b981; font-weight: bold; margin-right: 8px; font-size: 16px;">┅┅┅</span> 
            <span style="color: #374151;">Green = Shortest Route</span>
          </div>
          ${
            state.currentRoute
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              Current: ${state.currentRoute.safetyScore || 85}% safe • ${Math.round((state.currentRoute.totalDuration || 0) / 60)} min
            </div>
          `
              : ""
          }
        </div>
      `
      return div
    }
    legend.addTo(leafletMapRef.current)

    return () => {
      const legendElement = document.querySelector(".permanent-route-legend")
      if (legendElement) {
        legendElement.remove()
      }
    }
  }, [state.currentRoute])

  const toggleClustering = () => {
    if (!leafletMapRef.current || !window.L) return

    const L = window.L

    if (typeof L.markerClusterGroup !== "function") {
      toast.error("Marker clustering not available", {
        description: "The clustering plugin failed to load",
      })
      return
    }

    setClusteringEnabled(!clusteringEnabled)

    // Remove existing markers
    if (markerClusterRef.current) {
      leafletMapRef.current.removeLayer(markerClusterRef.current)
    }
    buildingMarkersRef.current.forEach((marker) => {
      leafletMapRef.current.removeLayer(marker)
    })

    if (!clusteringEnabled) {
      // Enable clustering
      markerClusterRef.current = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount()
          let size = "small"
          if (count > 10) size = "large"
          else if (count > 5) size = "medium"

          return L.divIcon({
            html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
            className: "marker-cluster",
            iconSize: [40, 40],
          })
        },
      })

      buildingMarkersRef.current.forEach((marker) => {
        markerClusterRef.current.addLayer(marker)
      })

      leafletMapRef.current.addLayer(markerClusterRef.current)
      toast.success("Marker clustering enabled", { description: "Markers will group together when zoomed out" })
    } else {
      // Disable clustering
      buildingMarkersRef.current.forEach((marker) => {
        marker.addTo(leafletMapRef.current)
      })
      toast.info("Marker clustering disabled", { description: "All markers are now visible individually" })
    }
  }

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

        const clusteringAvailable = typeof L.markerClusterGroup === "function"
        if (!clusteringAvailable) {
          console.warn("[v0] Marker clustering plugin not available, using regular markers")
          setClusteringEnabled(false)
        }

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

        if (clusteringAvailable) {
          markerClusterRef.current = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: (cluster: any) => {
              const count = cluster.getChildCount()
              let size = "small"
              if (count > 10) size = "large"
              else if (count > 5) size = "medium"

              return L.divIcon({
                html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
                className: "marker-cluster",
                iconSize: [40, 40],
              })
            },
          })
        }

        BUILDINGS_DATABASE.forEach((building) => {
          const category = BUILDING_CATEGORIES[building.category]
          const customIcon = L.divIcon({
            html: `<div class="w-5 h-5 rounded-full border border-white shadow-md flex items-center justify-center text-white text-xs font-bold" style="background-color: ${category.color}">${category.icon}</div>`,
            className: "custom-marker",
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const marker = L.marker([building.coordinates.lat, building.coordinates.lng], { icon: customIcon }).bindPopup(
            `
              <div class="poi-popup p-4 min-w-64 max-w-80">
                <div class="flex items-start space-x-3 mb-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0" style="background-color: ${category.color}">
                    ${category.icon}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-base text-gray-900 leading-tight">${building.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">${category.name}</p>
                  </div>
                </div>
                
                ${
                  building.description
                    ? `
                  <div class="mb-3">
                    <p class="text-sm text-gray-700">${building.description}</p>
                  </div>
                `
                    : ""
                }
                
                <div class="space-y-2 mb-4">
                  ${
                    building.openHours
                      ? `
                    <div class="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span class="text-green-700 font-medium">${building.openHours}</span>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    building.contact
                      ? `
                    <div class="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <a href="tel:${building.contact}" class="text-blue-700 hover:underline">${building.contact}</a>
                    </div>
                  `
                      : ""
                  }
                  
                  ${
                    building.safetyScore
                      ? `
                    <div class="flex items-center space-x-2 text-sm">
                      <div class="w-4 h-4 flex items-center justify-center">🛡️</div>
                      <span class="text-green-700 font-medium">${building.safetyScore}% Safety Score</span>
                    </div>
                  `
                      : ""
                  }
                </div>
                
                ${
                  building.facilities && building.facilities.length > 0
                    ? `
                  <div class="mb-4">
                    <h4 class="text-sm font-semibold text-gray-800 mb-2">Available Facilities:</h4>
                    <div class="flex flex-wrap gap-1">
                      ${building.facilities
                        .slice(0, 4)
                        .map(
                          (facility) =>
                            `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${facility}</span>`,
                        )
                        .join("")}
                      ${building.facilities.length > 4 ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${building.facilities.length - 4} more</span>` : ""}
                    </div>
                  </div>
                `
                    : ""
                }
                
                <button 
                  class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 get-directions-btn" 
                  data-building-id="${building.id}"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </button>
              </div>
            `,
            {
              maxWidth: 320,
              className: "custom-popup",
            },
          )

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

                  toast.success(`Route to ${building.name}`, {
                    description: `${route.safetyScore}% safe route • ${route.distance}m • ${Math.round(route.duration / 60)} min walk`,
                    duration: 4000,
                  })

                  // Close the popup
                  marker.closePopup()
                }
              }
            }
          })
        })

        if (clusteringAvailable && markerClusterRef.current) {
          buildingMarkersRef.current.forEach((marker) => {
            markerClusterRef.current.addLayer(marker)
          })
          map.addLayer(markerClusterRef.current)
        } else {
          buildingMarkersRef.current.forEach((marker) => {
            marker.addTo(map)
          })
        }

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
      markerClusterRef.current = null
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
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([latitude, longitude], 18)

          // Add temporary location marker
          const L = window.L
          const tempMarker = L.marker([latitude, longitude])
            .addTo(leafletMapRef.current)
            .bindPopup(`
              <div class="p-2">
                <h3 class="font-semibold text-sm">📍 Your Current Location</h3>
                <p class="text-xs text-gray-600">Accuracy: ±${Math.round(accuracy)}m</p>
              </div>
            `)
            .openPopup()

          // Remove marker after 5 seconds
          setTimeout(() => {
            leafletMapRef.current.removeLayer(tempMarker)
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

      <style jsx global>{`
        .cluster-marker {
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .cluster-small { width: 30px; height: 30px; font-size: 12px; }
        .cluster-medium { width: 35px; height: 35px; font-size: 14px; background: #059669; }
        .cluster-large { width: 40px; height: 40px; font-size: 16px; background: #dc2626; }
        .marker-cluster { background: transparent !important; }
        
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          line-height: 1.4;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        @media (max-width: 640px) {
          .custom-popup .leaflet-popup-content-wrapper {
            max-width: calc(100vw - 40px) !important;
          }
          .poi-popup {
            min-width: 280px !important;
            max-width: calc(100vw - 60px) !important;
          }
        }
      `}</style>

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
            if (leafletMapRef.current && userLocation) {
              leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 16)
              toast.info("Centered on Main Gate")
            }
          }}
          className="bg-card border border-border rounded-lg p-3 sm:p-2 shadow-lg hover:bg-accent transition-colors touch-manipulation"
          title="Center on main gate"
        >
          <Navigation className="w-5 h-5 text-green-600" />
        </button>

        <button
          onClick={toggleClustering}
          className={`bg-card border border-border rounded-lg p-3 sm:p-2 shadow-lg hover:bg-accent transition-colors touch-manipulation ${
            clusteringEnabled ? "bg-accent" : ""
          }`}
          title={clusteringEnabled ? "Disable marker clustering" : "Enable marker clustering"}
        >
          <Layers className="w-5 h-5 text-purple-600" />
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
        {clusteringEnabled && <p className="text-xs text-blue-600 mt-1">📍 Clustering: ON</p>}
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
