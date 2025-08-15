"use client"

import { MapPin, Clock, Phone, Star } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BUILDING_CATEGORIES, type Building } from "@/lib/buildings-database"
import { useNavGuard } from "@/contexts/navguard-context"

interface BuildingListProps {
  buildings: Building[]
  onBuildingSelect?: (building: Building) => void
  showDistance?: boolean
  userLocation?: { lat: number; lng: number }
}

export function BuildingList({ buildings, onBuildingSelect, showDistance, userLocation }: BuildingListProps) {
  const { dispatch } = useNavGuard()

  const handleBuildingClick = (building: Building) => {
    dispatch({ type: "SET_SELECTED_BUILDING", payload: building })
    onBuildingSelect?.(building)
  }

  const calculateDistance = (building: Building): string => {
    if (!userLocation) return ""

    const R = 6371 // Earth's radius in km
    const dLat = toRadians(building.coordinates.lat - userLocation.lat)
    const dLng = toRadians(building.coordinates.lng - userLocation.lng)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(userLocation.lat)) *
        Math.cos(toRadians(building.coordinates.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c * 1000 // Convert to meters

    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance / 1000).toFixed(1)}km`
  }

  const toRadians = (degrees: number) => degrees * (Math.PI / 180)

  if (buildings.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-medium text-foreground mb-2">No buildings found</h3>
        <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {buildings.map((building) => {
        const category = BUILDING_CATEGORIES[building.category]
        const distance = showDistance && userLocation ? calculateDistance(building) : null

        return (
          <Card key={building.id} className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
            <div onClick={() => handleBuildingClick(building)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{category.icon}</span>
                    <h3 className="font-medium text-foreground">{building.name}</h3>
                    {distance && (
                      <Badge variant="outline" className="text-xs">
                        {distance}
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant="secondary"
                    className="text-xs mb-2"
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                  >
                    {category.name}
                  </Badge>
                </div>

                {building.safetyScore && (
                  <div className="flex items-center space-x-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-muted-foreground">{building.safetyScore}%</span>
                  </div>
                )}
              </div>

              {building.description && <p className="text-sm text-muted-foreground mb-3">{building.description}</p>}

              <div className="space-y-2">
                {building.openHours && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{building.openHours}</span>
                  </div>
                )}

                {building.contact && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{building.contact}</span>
                  </div>
                )}

                {building.facilities && building.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {building.facilities.slice(0, 3).map((facility) => (
                      <Badge key={facility} variant="outline" className="text-xs">
                        {facility}
                      </Badge>
                    ))}
                    {building.facilities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{building.facilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-3">
                <Button size="sm" className="flex-1">
                  <MapPin className="w-3 h-3 mr-1" />
                  Get Directions
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
