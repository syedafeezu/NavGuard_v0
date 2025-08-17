"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Navigation, MapPin, Clock, Shield, Loader2, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNavGuard } from "@/contexts/navguard-context"
import { routeCalculator, type Route } from "@/lib/route-planning"
import { BUILDINGS_DATABASE } from "@/lib/buildings-database"
import type { Building } from "@/lib/buildings-database"

interface RouteCache {
  key: string
  route: Route
  timestamp: number
}

const POPULAR_DESTINATIONS = [
  "Main Building",
  "Central Library",
  "Computer Science Department",
  "Himalaya Hostel",
  "Ganga Hostel",
  "Students Activity Centre",
  "Auditorium",
  "Sports Complex",
]

export function NavigationSearch() {
  const { state, dispatch } = useNavGuard()
  const [selectedDestination, setSelectedDestination] = useState<Building | null>(null)
  const [safestRoute, setSafestRoute] = useState<Route | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const routeCache = useRef<Map<string, RouteCache>>(new Map())

  const filteredDestinations = useMemo(() => {
    if (!searchQuery) {
      return BUILDINGS_DATABASE.filter((building) => POPULAR_DESTINATIONS.includes(building.name)).slice(0, 8)
    }

    return BUILDINGS_DATABASE.filter(
      (building) =>
        building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        building.category.toLowerCase().includes(searchQuery.toLowerCase()),
    ).slice(0, 10)
  }, [searchQuery])

  const calculateSafestRoute = useMemo(() => {
    return async (destination: Building, currentLocation: { lat: number; lng: number }) => {
      const cacheKey = `${currentLocation.lat},${currentLocation.lng}->${destination.coordinates.lat},${destination.coordinates.lng}`
      const cached = routeCache.current.get(cacheKey)

      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        setSafestRoute(cached.route)
        dispatch({ type: "SET_CURRENT_ROUTE", payload: cached.route })
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
      } catch (error) {
        console.error("[v0] Route calculation error:", error)
      } finally {
        setIsCalculating(false)
      }
    }
  }, [dispatch])

  useEffect(() => {
    if (!selectedDestination || !state.currentLocation) return
    calculateSafestRoute(selectedDestination, state.currentLocation)
  }, [selectedDestination, state.currentLocation, calculateSafestRoute])

  const handleDestinationSelect = (building: Building) => {
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
  }

  return (
    <div className="w-full space-y-3">
      <Card className="p-4 shadow-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Navigation className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-foreground">Navigate from Main Gate</span>
        </div>

        <div className="relative">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search campus destinations..."
              className="flex-1 px-3 py-2 border border-border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {!searchQuery && (
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">Popular Destinations</div>
              )}
              {filteredDestinations.map((building) => (
                <button
                  key={building.id}
                  onClick={() => handleDestinationSelect(building)}
                  className="w-full text-left p-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{building.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{building.category}</div>
                    </div>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
              {filteredDestinations.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground text-center">No destinations found</div>
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
      </Card>

      {/* Route Results */}
      {(isCalculating || safestRoute) && (
        <Card className="p-4 shadow-lg">
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
        </Card>
      )}
    </div>
  )
}
