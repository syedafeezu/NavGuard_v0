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
import { NavGuardProvider } from "@/contexts/navguard-context"

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  const mainGateLocation = { lat: 12.995, lng: 80.225 }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

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

        <div className="flex-1 flex flex-col relative">
          {/* Navigation Search - positioned above map on mobile, floating on desktop */}
          <div className="block md:absolute md:top-4 md:left-4 md:z-30 md:w-96 p-4 md:p-0">
            <NavigationSearch />
          </div>

          {/* Map Container - full height with proper sizing */}
          <div className="flex-1 w-full h-full min-h-[70vh] md:min-h-[80vh]">
            <MapContainer userLocation={mainGateLocation} locationError={null} />
          </div>

          <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

          <EmergencyButton userLocation={mainGateLocation} />

          <RouteDisplay />
        </div>
      </div>
    </NavGuardProvider>
  )
}
