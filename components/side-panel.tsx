"use client"

import { X, Heart, Clock, AlertTriangle, TrendingUp, Navigation, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchInput } from "@/components/search-input"
import { BuildingList } from "@/components/building-list"
import { RoutePlanner } from "@/components/route-planner"
import { DashboardStats } from "@/components/dashboard-stats"
import { useSearch } from "@/hooks/use-search"
import { useNavGuard } from "@/contexts/navguard-context"
import { getPopularBuildings } from "@/lib/buildings-database"
import { useState } from "react"

interface SidePanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SidePanel({ isOpen, onClose }: SidePanelProps) {
  const { state } = useNavGuard()
  const [showRoutePlanner, setShowRoutePlanner] = useState(false)
  const { query, setQuery, selectedCategory, setSelectedCategory, results, suggestions, isSearching, hasQuery } =
    useSearch()

  const popularBuildings = getPopularBuildings()

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      {/* Panel */}
      <div
        className={`
        fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        md:relative md:translate-x-0 md:w-96
        ${isOpen ? "md:block" : "md:hidden"}
      `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Navigation</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="search" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 overflow-hidden px-4 pb-4">
              <div className="space-y-4 h-full flex flex-col">
                <SearchInput
                  query={query}
                  onQueryChange={setQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  suggestions={suggestions}
                />

                <Button onClick={() => setShowRoutePlanner(true)} className="w-full" variant="outline">
                  <Navigation className="w-4 h-4 mr-2" />
                  Plan Route
                </Button>

                <div className="flex-1 overflow-y-auto">
                  {isSearching ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Searching...</p>
                    </div>
                  ) : hasQuery ? (
                    <BuildingList
                      buildings={results}
                      showDistance={!!state.currentLocation}
                      userLocation={state.currentLocation || undefined}
                      onBuildingSelect={onClose}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Popular Destinations
                        </h3>
                        <BuildingList
                          buildings={popularBuildings}
                          showDistance={!!state.currentLocation}
                          userLocation={state.currentLocation || undefined}
                          onBuildingSelect={onClose}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 overflow-y-auto px-4 pb-4">
              <DashboardStats />
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-medium text-foreground">Favorite Places</h3>
                </div>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    No favorite places yet. Tap the heart icon on any building to add it here.
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent" className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-medium text-foreground">Recent Destinations</h3>
                </div>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground text-center">
                    No recent destinations yet. Your navigation history will appear here.
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Safety Status */}
        <div className="p-4 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Campus Safety
            </h3>
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Overall Status</span>
                <span className="text-sm font-medium text-green-600">Safe</span>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full w-4/5"></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Safety Score: 87%</p>
            </Card>
          </div>
        </div>
      </div>

      <RoutePlanner isOpen={showRoutePlanner} onClose={() => setShowRoutePlanner(false)} />
    </>
  )
}
