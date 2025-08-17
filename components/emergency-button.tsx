"use client"

import { useState } from "react"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmergencyPanel } from "./emergency-panel"

interface EmergencyButtonProps {
  userLocation?: { lat: number; lng: number }
}

export function EmergencyButton({ userLocation }: EmergencyButtonProps) {
  const [showPanel, setShowPanel] = useState(false)

  const handleEmergencyClick = () => {
    setShowPanel(true)
  }

  return (
    <>
      <Button
        onClick={handleEmergencyClick}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg z-30 animate-pulse"
        size="sm"
      >
        <Phone className="w-6 h-6" />
      </Button>

      <EmergencyPanel isOpen={showPanel} onClose={() => setShowPanel(false)} userLocation={userLocation} />
    </>
  )
}
