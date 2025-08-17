"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Phone, MapPin, AlertTriangle, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { EMERGENCY_CONTACTS, EmergencyService, type EmergencyContact } from "@/lib/emergency-services"

interface EmergencyPanelProps {
  isOpen: boolean
  onClose: () => void
  userLocation?: { lat: number; lng: number }
}

export function EmergencyPanel({ isOpen, onClose, userLocation }: EmergencyPanelProps) {
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null)
  const [sosDescription, setSosDescription] = useState("")
  const [isTriggering, setIsTriggering] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Focus the first focusable element when panel opens
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)

      // Announce panel opening to screen readers
      const announcement = document.createElement("div")
      announcement.setAttribute("aria-live", "assertive")
      announcement.setAttribute("aria-atomic", "true")
      announcement.className = "sr-only"
      announcement.textContent = "Emergency panel opened. Access emergency contacts and SOS features."
      document.body.appendChild(announcement)

      return () => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement)
        }
      }
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }

    // Trap focus within panel
    if (e.key === "Tab") {
      const focusableElements = panelRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  if (!isOpen) return null

  const handleCall = (contact: EmergencyContact) => {
    console.log(`[v0] Calling ${contact.name} at ${contact.phone}`)
    toast.success(`Calling ${contact.name}`, {
      description: `Dialing ${contact.phone}`,
    })
    // In a real app, this would initiate a phone call
    window.open(`tel:${contact.phone}`)
  }

  const handleSOS = async () => {
    if (!userLocation) {
      toast.error("Location not available", {
        description: "Please enable GPS to use SOS features",
      })
      return
    }

    setIsTriggering(true)

    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "assertive")
    announcement.className = "sr-only"
    announcement.textContent = "SOS alert is being sent to emergency services. Please wait."
    document.body.appendChild(announcement)

    try {
      const emergencyService = EmergencyService.getInstance()
      const alertId = await emergencyService.triggerSOS(userLocation, sosDescription)
      await emergencyService.sendLocationToContacts(userLocation)

      console.log(`[v0] SOS triggered with ID: ${alertId}`)
      toast.success("SOS alert sent successfully!", {
        description: "Emergency services have been notified of your location and situation.",
      })
      onClose()
    } catch (error) {
      console.error("[v0] Failed to trigger SOS:", error)
      toast.error("Failed to send SOS alert", {
        description: "Please try calling emergency services directly.",
      })
    } finally {
      setIsTriggering(false)
      document.body.removeChild(announcement)
    }
  }

  const handleShareLocation = () => {
    if (!userLocation) {
      toast.error("Location not available", {
        description: "Unable to determine your current location",
      })
      return
    }

    const locationUrl = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
    if (navigator.share) {
      navigator.share({
        title: "My Current Location",
        text: "I am sharing my location with you",
        url: locationUrl,
      })
    } else {
      navigator.clipboard.writeText(locationUrl)
      toast.success("Location copied to clipboard!", {
        description: "Share this link with emergency contacts",
      })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-panel-title"
      aria-describedby="emergency-panel-description"
      onKeyDown={handleKeyDown}
    >
      <Card ref={panelRef} className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle id="emergency-panel-title" className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            Emergency Response
          </CardTitle>
          <Button
            ref={firstFocusableRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close emergency panel"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </CardHeader>

        <div id="emergency-panel-description" className="sr-only">
          Emergency response panel with SOS alerts, location sharing, and direct access to emergency contacts.
        </div>

        <CardContent className="space-y-4">
          {/* SOS Button */}
          <div className="space-y-3" role="region" aria-labelledby="sos-section">
            <h3 id="sos-section" className="sr-only">
              SOS Emergency Alert
            </h3>
            <Button
              onClick={handleSOS}
              disabled={isTriggering || !userLocation}
              className="w-full bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white h-12 text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-red-300"
              aria-describedby="sos-help"
            >
              {isTriggering ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                  <span>Sending SOS...</span>
                  <span className="sr-only">SOS alert is being sent, please wait</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" aria-hidden="true" />
                  TRIGGER SOS
                </>
              )}
            </Button>
            <p id="sos-help" className="text-xs text-muted-foreground">
              Sends immediate alert to emergency services with your location
            </p>

            <Textarea
              placeholder="Optional: Describe your emergency..."
              value={sosDescription}
              onChange={(e) => setSosDescription(e.target.value)}
              className="min-h-[60px]"
              aria-label="Emergency description"
              aria-describedby="sos-description-help"
            />
            <p id="sos-description-help" className="sr-only">
              Optional field to provide additional details about your emergency situation
            </p>
          </div>

          {/* Location Sharing */}
          <Button
            onClick={handleShareLocation}
            variant="outline"
            className="w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!userLocation}
            aria-describedby="location-help"
          >
            <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
            Share My Location
          </Button>
          <p id="location-help" className="text-xs text-muted-foreground">
            {userLocation ? "Share your current location with others" : "Location not available - enable GPS"}
          </p>

          {/* Emergency Contacts */}
          <div className="space-y-3" role="region" aria-labelledby="contacts-section">
            <h3 id="contacts-section" className="font-semibold text-sm">
              Emergency Contacts
            </h3>
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((contact) => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{contact.name}</h4>
                        {contact.available24h && (
                          <Badge variant="secondary" className="text-xs" aria-label="Available 24 hours">
                            24/7
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{contact.description}</p>
                      <p className="text-sm font-mono" aria-label={`Phone number ${contact.phone}`}>
                        {contact.phone}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleCall(contact)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 focus:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
                      aria-label={`Call ${contact.name} at ${contact.phone}`}
                    >
                      <Phone className="w-4 h-4" aria-hidden="true" />
                      <span className="sr-only">Call</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
