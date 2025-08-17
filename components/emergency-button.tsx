"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmergencyPanel } from "./emergency-panel"

interface EmergencyButtonProps {
  userLocation?: { lat: number; lng: number }
}

export function EmergencyButton({ userLocation }: EmergencyButtonProps) {
  const [showPanel, setShowPanel] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleEmergencyClick = () => {
    setShowPanel(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleEmergencyClick()
    }
  }

  return (
    <>
      <Button
        ref={buttonRef}
        onClick={handleEmergencyClick}
        onKeyDown={handleKeyDown}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white shadow-lg z-30 animate-pulse focus:outline-none focus:ring-4 focus:ring-red-300 touch-manipulation"
        size="sm"
        aria-label="Emergency assistance - Call for immediate help"
        aria-describedby="emergency-button-help"
        role="button"
        tabIndex={0}
      >
        <Phone className="w-6 h-6" aria-hidden="true" />
        <span className="sr-only">Emergency button - press to access emergency contacts and services</span>
      </Button>

      <div id="emergency-button-help" className="sr-only">
        Emergency assistance button. Press to access emergency contacts, trigger SOS alerts, and share your location
        with emergency services.
      </div>

      <EmergencyPanel
        isOpen={showPanel}
        onClose={() => {
          setShowPanel(false)
          // Return focus to emergency button when panel closes
          setTimeout(() => buttonRef.current?.focus(), 100)
        }}
        userLocation={userLocation}
      />
    </>
  )
}
