"use client"

import { useState } from "react"
import { Phone, MapPin, AlertTriangle, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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

  if (!isOpen) return null

  const handleCall = (contact: EmergencyContact) => {
    console.log(`[v0] Calling ${contact.name} at ${contact.phone}`)
    // In a real app, this would initiate a phone call
    window.open(`tel:${contact.phone}`)
  }

  const handleSOS = async () => {
    if (!userLocation) {
      alert("Location not available. Please enable GPS.")
      return
    }

    setIsTriggering(true)
    try {
      const emergencyService = EmergencyService.getInstance()
      const alertId = await emergencyService.triggerSOS(userLocation, sosDescription)
      await emergencyService.sendLocationToContacts(userLocation)

      console.log(`[v0] SOS triggered with ID: ${alertId}`)
      alert("SOS alert sent! Emergency services have been notified.")
      onClose()
    } catch (error) {
      console.error("[v0] Failed to trigger SOS:", error)
      alert("Failed to send SOS. Please try calling directly.")
    } finally {
      setIsTriggering(false)
    }
  }

  const handleShareLocation = () => {
    if (!userLocation) {
      alert("Location not available")
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
      alert("Location copied to clipboard!")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Emergency Response
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* SOS Button */}
          <div className="space-y-3">
            <Button
              onClick={handleSOS}
              disabled={isTriggering || !userLocation}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
            >
              {isTriggering ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Sending SOS...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  TRIGGER SOS
                </>
              )}
            </Button>

            <Textarea
              placeholder="Optional: Describe your emergency..."
              value={sosDescription}
              onChange={(e) => setSosDescription(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Location Sharing */}
          <Button
            onClick={handleShareLocation}
            variant="outline"
            className="w-full bg-transparent"
            disabled={!userLocation}
          >
            <MapPin className="w-4 h-4 mr-2" />
            Share My Location
          </Button>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Emergency Contacts</h3>
            <div className="space-y-2">
              {EMERGENCY_CONTACTS.map((contact) => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{contact.name}</h4>
                        {contact.available24h && (
                          <Badge variant="secondary" className="text-xs">
                            24/7
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{contact.description}</p>
                      <p className="text-sm font-mono">{contact.phone}</p>
                    </div>
                    <Button onClick={() => handleCall(contact)} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Phone className="w-4 h-4" />
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
