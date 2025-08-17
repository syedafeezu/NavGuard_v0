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
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header onMenuClick={() => setSidePanelOpen(true)} />

        <EmergencyAlerts />

        <div className="flex-1 flex flex-col relative min-h-0">
          <div className="w-full sm:absolute sm:top-4 sm:left-4 sm:z-30 sm:w-80 sm:max-w-[calc(100vw-2rem)] p-2 sm:p-0 bg-background sm:bg-transparent border-b sm:border-b-0 border-border sm:border-none">
            <NavigationSearch />
          </div>

          <div className="flex-1 w-full h-full min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] relative">
            <MapContainer userLocation={mainGateLocation} locationError={null} />
          </div>

          <SidePanel isOpen={sidePanelOpen} onClose={() => setSidePanelOpen(false)} />

          <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
            <EmergencyButton userLocation={mainGateLocation} />
          </div>

          <RouteDisplay />
        </div>
      </div>
    </NavGuardProvider>
  )
}
