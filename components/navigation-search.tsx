"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  Navigation,
  MapPin,
  Clock,
  Shield,
  Loader2,
  ChevronDown,
  Search,
  GraduationCap,
  Home,
  Utensils,
  BuildingIcon,
  Heart,
  Zap,
  DoorOpen,
  FlaskConical,
  Settings,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useNavGuard } from "@/contexts/navguard-context"
import { routeCalculator, type Route } from "@/lib/route-planning"
import { BUILDINGS_DATABASE, BUILDING_CATEGORIES, searchBuildings } from "@/lib/buildings-database"
import type { BuildingCategory } from "@/lib/buildings-database"

interface RouteCache {
  key: string
  route: Route
  timestamp: number
}

const CATEGORY_ICONS: { [key in BuildingCategory]: React.ComponentType<any> } = {
  academic: GraduationCap,
  hostel: Home,
  dining: Utensils,
  facility: BuildingIcon,
  medical: Heart,
  sports: Zap,
  gate: DoorOpen,
  research: FlaskConical,
  admin: Settings,
}

const POPULAR_DESTINATIONS = [
  "Main Building (Admin)",
  "Central Library",
  "Computer Science Department",
  "Students Activities Center (SAC)",
  "Health Center",
  "Sports Complex",
  "Himalaya Mess",
  "Main Gate",
]

export function NavigationSearch() {
  const { state, dispatch } = useNavGuard()
  const [selectedDestination, setSelectedDestination] = useState<any | null>(null)
  const [safestRoute, setSafestRoute] = useState<Route | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  const routeCache = useRef<Map<string, RouteCache>>(new Map())

  const groupedDestinations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    if (!query) {
      // Show popular destinations when no search query
      const popular = BUILDINGS_DATABASE.filter((building) => POPULAR_DESTINATIONS.includes(building.name))
      return { popular }
    }

    // Search across all buildings with enhanced matching
    const searchResults = searchBuildings(query)

    // Group results by category
    const grouped: { [key: string]: any[] } = {}

    searchResults.forEach((building) => {
      const categoryName = BUILDING_CATEGORIES[building.category].name
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(building)
    })

    // Sort categories by relevance and limit results
    Object.keys(grouped).forEach((category) => {
      grouped[category] = grouped[category].slice(0, 5) // Limit per category
    })

    return grouped
  }, [searchQuery])

  const calculateSafestRoute = useMemo(() => {
    return async (destination: any, currentLocation: { lat: number; lng: number }) => {
      const cacheKey = `${currentLocation.lat},${currentLocation.lng}->${destination.coordinates.lat},${destination.coordinates.lng}`
      const cached = routeCache.current.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        setSafestRoute(cached.route)
        dispatch({ type: "SET_CURRENT_ROUTE", payload: cached.route })
        toast.success("Route generated!", {
          description: `${cached.route.safetyScore}% safe, ${Math.round(cached.route.totalDuration / 60)} min walk`,
          duration: 4000,
        })
        return
      }

      setIsCalculating(true)

      try {
        const routes = routeCalculator.calculateMultipleRoutes(currentLocation, destination.coordinates, {
          timeOfDay: new Date().getHours(),
          preferLighting: true,
          weatherCondition: "clear",
        })

        const safest = routes.reduce((prev, current) => (current.safetyScore > prev.safetyScore ? current : prev))

        routeCache.current.set(cacheKey, {
          key: cacheKey,
          route: safest,
          timestamp: Date.now(),
        })

        setSafestRoute(safest)
        dispatch({ type: "SET_CURRENT_ROUTE", payload: safest })
        dispatch({ type: "SET_SELECTED_BUILDING", payload: destination })
        toast.success("Safest route generated!", {
          description: `${safest.safetyScore}% safe, ${Math.round(safest.totalDuration / 60)} min walk`,
          duration: 4000,
        })
      } catch (error) {
        console.error("[v0] Route calculation error:", error)
        toast.error("Route calculation failed", {
          description: "Please try selecting another destination",
          duration: 3000,
        })
      } finally {
        setIsCalculating(false)
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (!selectedDestination || !state.currentLocation) return
    calculateSafestRoute(selectedDestination, state.currentLocation)
  }, [selectedDestination, state.currentLocation, calculateSafestRoute])

  const handleDestinationSelect = (building: any) => {
    setSelectedDestination(building)
    setSearchQuery(building.name)
    setShowDropdown(false)
  }

  const clearRoute = () => {
    setSelectedDestination(null)
    setSafestRoute(null)
    setSearchQuery("")
    dispatch({ type: "SET_CURRENT_ROUTE", payload: null })
    dispatch({ type: "SET_SELECTED_BUILDING", payload: null })
    dispatch({ type: "SET_MAP_CENTER", payload: { lat: 12.9915, lng: 80.2336 } })
    dispatch({ type: "SET_MAP_ZOOM", payload: 15 })
    toast.info("Route cleared", {
      description: "Map reset to show full campus",
      duration: 2000,
    })
  }

  return (
    <div
      className={`w-full space-y-3 transition-all duration-300 ${
        isExpanded ? "md:bg-background/95 md:backdrop-blur-sm" : "md:bg-background/80 md:backdrop-blur-sm"
      } md:rounded-lg md:shadow-lg md:border md:border-border/50`}
    >
      <Card
        className={`shadow-lg transition-all duration-300 ${
          !isExpanded ? "md:bg-transparent md:shadow-none md:border-none" : ""
        }`}
      >
        <div className={`p-4 ${!isExpanded ? "md:p-2" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              <span className={`font-medium text-foreground transition-all ${!isExpanded ? "md:text-sm" : ""}`}>
                Navigate from Main Gate
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {(selectedDestination || safestRoute) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRoute}
                  className="text-xs hover:bg-destructive/10 hover:text-destructive"
                >
                  Clear Route
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="md:hidden">
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

          <div className={`transition-all duration-300 ${isExpanded ? "block" : "hidden md:block"}`}>
            <div className="relative">
              <div className="flex">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search campus destinations..."
                    className="w-full pl-10 pr-3 py-2 border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="rounded-l-none border-l-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                  {Object.entries(groupedDestinations).map(([categoryName, buildings]) => (
                    <div key={categoryName}>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b bg-muted/50 flex items-center space-x-2">
                        {categoryName === "popular" ? (
                          <>
                            <MapPin className="w-3 h-3" />
                            <span>Popular Destinations</span>
                          </>
                        ) : (
                          <>
                            {(() => {
                              const category = Object.entries(BUILDING_CATEGORIES).find(
                                ([_, cat]) => cat.name === categoryName,
                              )?.[0] as BuildingCategory
                              const IconComponent = category ? CATEGORY_ICONS[category] : BuildingIcon
                              return <IconComponent className="w-3 h-3" />
                            })()}
                            <span>{categoryName}</span>
                          </>
                        )}
                      </div>
                      {buildings.map((building) => {
                        const IconComponent = CATEGORY_ICONS[building.category]
                        return (
                          <button
                            key={building.id}
                            onClick={() => handleDestinationSelect(building)}
                            className="w-full text-left p-3 hover:bg-accent transition-colors border-b border-border/50 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs"
                                  style={{ backgroundColor: BUILDING_CATEGORIES[building.category].color }}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{building.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {building.description || BUILDING_CATEGORIES[building.category].name}
                                  </div>
                                  {building.safetyScore && (
                                    <div className="flex items-center space-x-1 mt-1">
                                      <Shield className="w-3 h-3 text-green-600" />
                                      <span className="text-xs text-green-600">{building.safetyScore}% safe</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                  {Object.keys(groupedDestinations).length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                      No destinations found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedDestination && !isCalculating && !safestRoute && (
              <Button
                onClick={() => calculateSafestRoute(selectedDestination, state.currentLocation!)}
                className="w-full mt-3"
              >
                Find Safe Routes
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Route Results */}
      {(isCalculating || safestRoute) && (
        <Card
          className={`shadow-lg transition-all duration-300 ${
            !isExpanded ? "md:bg-background/90 md:backdrop-blur-sm" : ""
          }`}
        >
          <div className="p-4">
            {isCalculating ? (
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Calculating Route...</div>
                  <div className="text-xs text-muted-foreground">From Main Gate to {selectedDestination?.name}</div>
                </div>
              </div>
            ) : (
              safestRoute && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-sm">Safe Routes Highlighted</span>
                    </div>
                    <button
                      onClick={clearRoute}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{safestRoute.totalDistance}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{Math.round(safestRoute.totalDuration / 60)} min</span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        safestRoute.safetyScore >= 90
                          ? "default"
                          : safestRoute.safetyScore >= 80
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      {safestRoute.safetyScore}% Safe
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground">{safestRoute.description}</div>

                  {safestRoute.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {safestRoute.highlights.slice(0, 3).map((highlight) => (
                        <Badge key={highlight} variant="outline" className="text-xs">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
