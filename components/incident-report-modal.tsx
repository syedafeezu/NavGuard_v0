"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Camera, MapPin, AlertTriangle, Upload, User, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
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
  const modalRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)

  const location = initialLocation || { lat: 12.9915936, lng: 80.2336832 }

  useEffect(() => {
    if (isOpen) {
      // Focus the first focusable element when modal opens
      setTimeout(() => {
        firstFocusableRef.current?.focus()
      }, 100)

      // Announce modal opening to screen readers
      const announcement = document.createElement("div")
      announcement.setAttribute("aria-live", "polite")
      announcement.setAttribute("aria-atomic", "true")
      announcement.className = "sr-only"
      announcement.textContent = "Incident report modal opened. Fill out the form to report a safety incident."
      document.body.appendChild(announcement)

      return () => {
        document.body.removeChild(announcement)
      }
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
    }

    // Trap focus within modal
    if (e.key === "Tab") {
      const focusableElements = modalRef.current?.querySelectorAll(
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

    toast.success(`${files.length} photo(s) uploaded successfully`)
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    toast.info("Photo removed")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentType || !description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.className = "sr-only"
    announcement.textContent = "Submitting incident report, please wait..."
    document.body.appendChild(announcement)

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

    document.body.removeChild(announcement)
    toast.success("Incident report submitted successfully", {
      description: "Your report has been received and will be reviewed by campus security.",
    })

    console.log("[v0] Incident reported:", newIncident)
    onClose()
  }

  if (!isOpen) return null

  const selectedIncidentConfig = incidentType ? INCIDENT_TYPES[incidentType as IncidentType] : null
  const severityConfig = SEVERITY_CONFIG[severity]

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-modal-title"
      aria-describedby="incident-modal-description"
      onKeyDown={handleKeyDown}
    >
      <Card ref={modalRef} className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <h2 id="incident-modal-title" className="font-semibold text-foreground">
              Report Safety Incident
            </h2>
          </div>
          <Button
            ref={firstFocusableRef}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close incident report modal"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div id="incident-modal-description" className="sr-only">
          Use this form to report safety incidents on campus. All fields marked with asterisk are required.
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Location Display */}
          <div
            className="flex items-center space-x-2 p-3 bg-muted rounded-lg"
            role="region"
            aria-label="Report location"
          >
            <MapPin className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-foreground">Report Location</p>
              <p className="text-xs text-muted-foreground">
                Latitude: {location.lat.toFixed(6)}, Longitude: {location.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {/* Incident Type */}
          <div className="space-y-2">
            <Label htmlFor="incident-type">
              Incident Type{" "}
              <span className="text-red-500" aria-label="required">
                *
              </span>
            </Label>
            <Select
              value={incidentType}
              onValueChange={(value) => {
                setIncidentType(value as IncidentType)
                if (value && INCIDENT_TYPES[value as IncidentType]) {
                  setSeverity(INCIDENT_TYPES[value as IncidentType].defaultSeverity)
                }
              }}
              aria-describedby="incident-type-description"
            >
              <SelectTrigger aria-label="Select incident type">
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INCIDENT_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span aria-hidden="true">{config.icon}</span>
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIncidentConfig && (
              <p id="incident-type-description" className="text-xs text-muted-foreground">
                {selectedIncidentConfig.description}
              </p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level</Label>
            <Select
              value={severity}
              onValueChange={(value) => setSeverity(value as IncidentSeverity)}
              aria-describedby="severity-description"
            >
              <SelectTrigger aria-label="Select severity level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                        aria-hidden="true"
                      ></div>
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
                aria-label={`Current severity: ${severityConfig.name}`}
              >
                {severityConfig.name}
              </Badge>
              <p id="severity-description" className="text-xs text-muted-foreground">
                {severityConfig.description}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-red-500" aria-label="required">
                *
              </span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the incident..."
              rows={4}
              required
              maxLength={500}
              aria-describedby="description-help description-count"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <p id="description-help">Provide as much detail as possible to help us address the issue</p>
              <p id="description-count" aria-live="polite">
                {description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                aria-describedby="photo-help"
              >
                <Camera className="w-4 h-4 mr-2" aria-hidden="true" />
                Add Photos
              </Button>
              <p id="photo-help" className="text-xs text-muted-foreground">
                Upload photos to help document the incident (optional)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="Upload incident photos"
              />

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2" role="region" aria-label="Uploaded photos">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Incident photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X className="w-3 h-3" aria-hidden="true" />
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
                  <UserX className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" aria-hidden="true" />
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
              <Switch
                checked={anonymous}
                onCheckedChange={setAnonymous}
                aria-label="Toggle anonymous reporting"
                aria-describedby="anonymous-help"
              />
            </div>
            <p id="anonymous-help" className="sr-only">
              When enabled, your report will be submitted anonymously without recording your contact information
            </p>

            {!anonymous && (
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information</Label>
                <Input
                  id="contact"
                  type="email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="your.email@iitm.ac.in"
                  aria-describedby="contact-help"
                />
                <p id="contact-help" className="text-xs text-muted-foreground">
                  We may contact you for additional information or updates
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={!incidentType || !description.trim() || isSubmitting}
              className="flex-1"
              aria-describedby="submit-help"
            >
              {isSubmitting ? (
                <>
                  <div
                    className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    aria-hidden="true"
                  ></div>
                  <span>Submitting Report...</span>
                  <span className="sr-only">Please wait while your report is being submitted</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Submit Report
                </>
              )}
            </Button>
            <Button
              ref={lastFocusableRef}
              type="button"
              variant="outline"
              onClick={onClose}
              aria-label="Cancel and close modal"
            >
              Cancel
            </Button>
          </div>
          <p id="submit-help" className="sr-only">
            Submit button will be enabled when all required fields are filled
          </p>

          {/* Disclaimer */}
          <div
            className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            role="note"
            aria-label="Important notice"
          >
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
