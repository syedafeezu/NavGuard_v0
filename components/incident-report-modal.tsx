"use client"

import type React from "react"

import { useState, useRef } from "react"
import { X, Camera, MapPin, AlertTriangle, Upload, User, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNavGuard } from "@/contexts/navguard-context"
import {
  INCIDENT_TYPES,
  SEVERITY_CONFIG,
  type IncidentType,
  type IncidentSeverity,
  type Incident,
} from "@/lib/incident-types"

interface IncidentReportModalProps {
  isOpen: boolean
  onClose: () => void
  initialLocation?: { lat: number; lng: number }
}

export function IncidentReportModal({ isOpen, onClose, initialLocation }: IncidentReportModalProps) {
  const { dispatch } = useNavGuard()
  const [incidentType, setIncidentType] = useState<IncidentType | "">("")
  const [severity, setSeverity] = useState<IncidentSeverity>("medium")
  const [description, setDescription] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [contact, setContact] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const location = initialLocation || { lat: 12.9915936, lng: 80.2336832 }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotos((prev) => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentType || !description.trim()) return

    setIsSubmitting(true)

    // Simulate API submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      type: incidentType as IncidentType,
      severity,
      location,
      description: description.trim(),
      timestamp: new Date(),
      anonymous,
      photos: photos.length > 0 ? photos : undefined,
      reporterContact: anonymous ? undefined : contact,
      status: "reported",
    }

    dispatch({ type: "ADD_INCIDENT", payload: newIncident })

    // Reset form
    setIncidentType("")
    setSeverity("medium")
    setDescription("")
    setAnonymous(false)
    setContact("")
    setPhotos([])
    setIsSubmitting(false)

    console.log("[v0] Incident reported:", newIncident)
    onClose()
  }

  if (!isOpen) return null

  const selectedIncidentConfig = incidentType ? INCIDENT_TYPES[incidentType as IncidentType] : null
  const severityConfig = SEVERITY_CONFIG[severity]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-foreground">Report Safety Incident</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Location Display */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <MapPin className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-foreground">Report Location</p>
              <p className="text-xs text-muted-foreground">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Incident Type */}
          <div className="space-y-2">
            <Label htmlFor="incident-type">Incident Type *</Label>
            <Select
              value={incidentType}
              onValueChange={(value) => {
                setIncidentType(value as IncidentType)
                if (value && INCIDENT_TYPES[value as IncidentType]) {
                  setSeverity(INCIDENT_TYPES[value as IncidentType].defaultSeverity)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INCIDENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span>{config.icon}</span>
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIncidentConfig && (
              <p className="text-xs text-muted-foreground">{selectedIncidentConfig.description}</p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select value={severity} onValueChange={(value) => setSeverity(value as IncidentSeverity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}></div>
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                style={{
                  backgroundColor: severityConfig.bgColor,
                  color: severityConfig.color,
                  borderColor: severityConfig.color,
                }}
              >
                {severityConfig.name}
              </Badge>
              <p className="text-xs text-muted-foreground">{severityConfig.description}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the incident..."
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="space-y-3">
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Add Photos
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Anonymous Reporting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                {anonymous ? (
                  <UserX className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">Anonymous Report</p>
                  <p className="text-xs text-muted-foreground">
                    {anonymous
                      ? "Your identity will not be recorded"
                      : "Contact information will be saved for follow-up"}
                  </p>
                </div>
              </div>
              <Switch checked={anonymous} onCheckedChange={setAnonymous} />
            </div>

            {!anonymous && (
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information</Label>
                <Input
                  id="contact"
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="your.email@iitm.ac.in"
                />
                <p className="text-xs text-muted-foreground">
                  We may contact you for additional information or updates
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button type="submit" disabled={!incidentType || !description.trim() || isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Submitting Report...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> For medical emergencies or immediate safety threats, please call emergency services
              directly. This reporting system is for non-urgent safety concerns and infrastructure issues.
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}
