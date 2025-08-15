"use client"

import { useState, useEffect } from "react"
import { Navigation, MapPin, Clock, Shield, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "@/components/search-input"
import { useSearch } from "@/hooks/use-search"
import { useNavGuard } from "@/contexts/navguard-context"
import { routeCalculator, type Route } from "@/lib/route-planning"
import type { Building } from "@/lib/buildings-database"

export function NavigationSearch() {
  const { state, dispatch } = useNavGuard()
  const [selectedDestination, setSelectedDestination] = useState<Building | null>(null)
  const [safestRoute, setSafestRoute] = useState<Route | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const search = useSearch({ minQueryLength: 2 })

  // Auto-calculate safest route when destination is selected
  useEffect(() => {
    const calculateSafestRoute = async () => {
      if (!selectedDestination || !state.currentLocation) return

      setIsCalculating(true)
      console.log("[v0] Calculating safest route to:", selectedDestination.name)

      try {
        // Simulate API delay for realistic UX
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const routes = routeCalculator.calculateMultipleRoutes(state.currentLocation, selectedDestination.coordinates, {
          timeOfDay: new Date().getHours(),
          preferLighting: true,
          weatherCondition: "clear",
        })

        // Find the safest route (highest safety score)
        const safest = routes.reduce((prev, current) => (current.safetyScore > prev.safetyScore ? current : prev))

        setSafestRoute(safest)
        dispatch({ type: "SET_CURRENT_ROUTE", payload: safest })
        dispatch({ type: "SET_SELECTED_BUILDING", payload: selectedDestination })

        console.log("[v0] Safest route calculated with", safest.safetyScore, "% safety score")
      } catch (error) {
        console.error("[v0] Route calculation error:", error)
      } finally {
        setIsCalculating(false)
      }
    }

    calculateSafestRoute()
  }, [selectedDestination, state.currentLocation, dispatch])

  const handleDestinationSelect = (building: Building) => {
    setSelectedDestination(building)
    search.setQuery(building.name)
  }

  const clearRoute = () => {
    setSelectedDestination(null)
    setSafestRoute(null)
    search.setQuery("")
    dispatch({ type: "SET_CURRENT_ROUTE", payload: null })
    dispatch({ type: "SET_SELECTED_BUILDING", payload: null })
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Navigation className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-foreground">Navigate to Campus Location</span>
        </div>

        <SearchInput
          query={search.query}
          onQueryChange={search.setQuery}
          selectedCategory={search.selectedCategory}
          onCategoryChange={search.setSelectedCategory}
          suggestions={search.suggestions}
          placeholder="Search campus buildings, hostels, facilities..."
        />

        {/* Search Results */}
        {search.hasQuery && search.results.length > 0 && !selectedDestination && (
          <div className="mt-3 max-h-48 overflow-y-auto border border-border rounded-lg">
            {search.results.slice(0, 5).map((building) => (
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
          </div>
        )}
      </Card>

      {/* Route Information */}
      {(isCalculating || safestRoute) && (
        <Card className="p-4">
          {isCalculating ? (
            <div className="flex items-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium text-sm">Calculating Safest Route...</div>
                <div className="text-xs text-muted-foreground">
                  Finding the best path to {selectedDestination?.name}
                </div>
              </div>
            </div>
          ) : (
            safestRoute && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm">Safest Route Found</span>
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

                {safestRoute.warnings.length > 0 && (
                  <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-600">Safety Notice</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">{safestRoute.warnings[0]}</p>
                  </div>
                )}
              </div>
            )
          )}
        </Card>
      )}

      {/* No Location Warning */}
      {!state.currentLocation && (
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-600">Enable location access to get navigation routes</span>
          </div>
        </Card>
      )}
    </div>
  )
}
