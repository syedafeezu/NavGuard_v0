"use client"

import { useState, useEffect } from "react"
import { Navigation, MapPin, Clock, Shield, RouteIcon, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchInput } from "@/components/search-input"
import { useSearch } from "@/hooks/use-search"
import { useNavGuard } from "@/contexts/navguard-context"
import { routeCalculator, type Route, type RouteType } from "@/lib/route-planning"
import type { Building } from "@/lib/buildings-database"

interface RoutePlannerProps {
  isOpen: boolean
  onClose: () => void
}

export function RoutePlanner({ isOpen, onClose }: RoutePlannerProps) {
  const { state, dispatch } = useNavGuard()
  const [fromBuilding, setFromBuilding] = useState<Building | null>(null)
  const [toBuilding, setToBuilding] = useState<Building | null>(null)
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [routeType, setRouteType] = useState<RouteType>("shortest")

  const fromSearch = useSearch({ minQueryLength: 2 })
  const toSearch = useSearch({ minQueryLength: 2 })

  useEffect(() => {
    if (state.selectedBuilding && !toBuilding) {
      setToBuilding(state.selectedBuilding)
    }
  }, [state.selectedBuilding, toBuilding])

  const calculateRoutes = async () => {
    if (!fromBuilding || !toBuilding) return

    setIsCalculating(true)

    // Simulate API delay for realistic UX
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      const calculatedRoutes = routeCalculator.calculateMultipleRoutes(
        fromBuilding.coordinates,
        toBuilding.coordinates,
        {
          timeOfDay: new Date().getHours(),
          preferLighting: true,
          weatherCondition: "clear",
        },
      )

      setRoutes(calculatedRoutes)
      setSelectedRoute(calculatedRoutes[0])

      // Update context with selected route
      dispatch({ type: "SET_CURRENT_ROUTE", payload: calculatedRoutes[0] })

      console.log("[v0] Calculated", calculatedRoutes.length, "routes")
    } catch (error) {
      console.error("[v0] Route calculation error:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const selectRoute = (route: Route) => {
    setSelectedRoute(route)
    dispatch({ type: "SET_CURRENT_ROUTE", payload: route })
  }

  const swapLocations = () => {
    const temp = fromBuilding
    setFromBuilding(toBuilding)
    setToBuilding(temp)
    setRoutes([])
    setSelectedRoute(null)
  }

  const useCurrentLocation = () => {
    if (state.currentLocation) {
      // Create a temporary building for current location
      const currentLocationBuilding: Building = {
        id: "current-location",
        name: "Current Location",
        category: "facility",
        coordinates: state.currentLocation,
        description: "Your current position",
      }
      setFromBuilding(currentLocationBuilding)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-foreground">Route Planner</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Location Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">From</span>
              {state.currentLocation && (
                <Button variant="outline" size="sm" onClick={useCurrentLocation}>
                  Use Current Location
                </Button>
              )}
            </div>

            <SearchInput
              query={fromSearch.query}
              onQueryChange={fromSearch.setQuery}
              selectedCategory={fromSearch.selectedCategory}
              onCategoryChange={fromSearch.setSelectedCategory}
              suggestions={fromSearch.suggestions}
              placeholder="Search starting location..."
            />

            {fromSearch.hasQuery && fromSearch.results.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                {fromSearch.results.slice(0, 3).map((building) => (
                  <button
                    key={building.id}
                    onClick={() => {
                      setFromBuilding(building)
                      fromSearch.setQuery(building.name)
                    }}
                    className="w-full text-left p-2 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="font-medium text-sm">{building.name}</div>
                    <div className="text-xs text-muted-foreground">{building.category}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={swapLocations}>
                <ArrowRight className="w-4 h-4 rotate-90" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">To</span>
            </div>

            <SearchInput
              query={toSearch.query}
              onQueryChange={toSearch.setQuery}
              selectedCategory={toSearch.selectedCategory}
              onCategoryChange={toSearch.setSelectedCategory}
              suggestions={toSearch.suggestions}
              placeholder="Search destination..."
            />

            {toSearch.hasQuery && toSearch.results.length > 0 && (
              <div className="max-h-32 overflow-y-auto border border-border rounded-lg">
                {toSearch.results.slice(0, 3).map((building) => (
                  <button
                    key={building.id}
                    onClick={() => {
                      setToBuilding(building)
                      toSearch.setQuery(building.name)
                    }}
                    className="w-full text-left p-2 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="font-medium text-sm">{building.name}</div>
                    <div className="text-xs text-muted-foreground">{building.category}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Route Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Route Preference</label>
            <Select value={routeType} onValueChange={(value) => setRouteType(value as RouteType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shortest">Shortest Route</SelectItem>
                <SelectItem value="safest">Safest Route</SelectItem>
                <SelectItem value="covered">Covered Route</SelectItem>
                <SelectItem value="scenic">Scenic Route</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calculate Button */}
          <Button onClick={calculateRoutes} disabled={!fromBuilding || !toBuilding || isCalculating} className="w-full">
            {isCalculating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Calculating Routes...
              </>
            ) : (
              <>
                <RouteIcon className="w-4 h-4 mr-2" />
                Calculate Routes
              </>
            )}
          </Button>

          {/* Route Results */}
          {routes.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Route Options</h3>

              <Tabs
                value={selectedRoute?.id}
                onValueChange={(value) => {
                  const route = routes.find((r) => r.id === value)
                  if (route) selectRoute(route)
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  {routes.map((route) => (
                    <TabsTrigger key={route.id} value={route.id} className="text-xs">
                      {route.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {routes.map((route) => (
                  <TabsContent key={route.id} value={route.id} className="space-y-3">
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">{route.name}</h4>
                        <Badge
                          variant={
                            route.safetyScore >= 90 ? "default" : route.safetyScore >= 80 ? "secondary" : "destructive"
                          }
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {route.safetyScore}%
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{route.totalDistance}m</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{Math.round(route.totalDuration / 60)} min</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{route.description}</p>

                      {route.highlights.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-foreground">Highlights</h5>
                          <div className="flex flex-wrap gap-1">
                            {route.highlights.map((highlight) => (
                              <Badge key={highlight} variant="outline" className="text-xs">
                                {highlight}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {route.warnings.length > 0 && (
                        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                          <div className="flex items-center space-x-2">
                            <Shield className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-600">Warnings</span>
                          </div>
                          {route.warnings.map((warning) => (
                            <p key={warning} className="text-xs text-yellow-600 mt-1">
                              {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Turn-by-turn directions */}
                    <Card className="p-4">
                      <h5 className="font-medium text-foreground mb-3">Turn-by-turn Directions</h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {route.points.map((point, index) => (
                          <div key={index} className="flex items-start space-x-3 text-sm">
                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-foreground">{point.instruction}</p>
                              {point.distance && point.duration && (
                                <p className="text-xs text-muted-foreground">
                                  {point.distance}m • {Math.round(point.duration / 60)} min
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex space-x-2">
                <Button className="flex-1" onClick={onClose}>
                  Start Navigation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRoutes([])
                    setSelectedRoute(null)
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
