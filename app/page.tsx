"use client"

import { useState, useEffect } from "react"
import { MapContainer } from "@/components/map-container"
import { Header } from "@/components/header"
import { SidePanel } from "@/components/side-panel"
import { EmergencyButton } from "@/components/emergency-button"
import { LoadingScreen } from "@/components/loading-screen"
import { RouteDisplay } from "@/components/route-display"
import { EmergencyAlerts } from "@/components/emergency-alerts"
import { NavigationSearch } from "@/components/navigation-search"
import { useGeolocation } from "@/hooks/use-geolocation"
import { NavGuardProvider } from "@/contexts/navguard-context"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const { location, error: locationError } = useGeolocation()

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <NavGuardProvider>
      <div className="h-screen flex flex-col bg-background">
        <Header onMenuClick={() => setSidePanelOpen(true)} />

        <EmergencyAlerts />

        <div className="flex-1 relative">
          <MapContainer userLocation={location} locationError={locationError} />

          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4">
            <NavigationSearch />
          </div>

          <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

          <EmergencyButton userLocation={location} />

          <RouteDisplay />
        </div>
      </div>
    </NavGuardProvider>
  )
}
