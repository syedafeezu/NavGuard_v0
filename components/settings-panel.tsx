"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Settings, Bell, MapPin, Shield } from "lucide-react"

interface UserSettings {
  notifications: boolean
  locationSharing: boolean
  darkMode: boolean
  emergencyContacts: string[]
  safetyRadius: number
  routePreference: "shortest" | "safest" | "covered"
  autoReporting: boolean
}

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    locationSharing: true,
    darkMode: false,
    emergencyContacts: [],
    safetyRadius: 100,
    routePreference: "safest",
    autoReporting: false,
  })

  const [newContact, setNewContact] = useState("")

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("navguard-settings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem("navguard-settings", JSON.stringify(newSettings))
  }

  const addEmergencyContact = () => {
    if (newContact.trim() && !settings.emergencyContacts.includes(newContact.trim())) {
      updateSetting("emergencyContacts", [...settings.emergencyContacts, newContact.trim()])
      setNewContact("")
    }
  }

  const removeEmergencyContact = (contact: string) => {
    updateSetting(
      "emergencyContacts",
      settings.emergencyContacts.filter((c) => c !== contact),
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Notifications */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-sm">
                Push notifications
              </Label>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => updateSetting("notifications", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-reporting" className="text-sm">
                Auto incident reporting
              </Label>
              <Switch
                id="auto-reporting"
                checked={settings.autoReporting}
                onCheckedChange={(checked) => updateSetting("autoReporting", checked)}
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Privacy
            </h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="location-sharing" className="text-sm">
                Location sharing
              </Label>
              <Switch
                id="location-sharing"
                checked={settings.locationSharing}
                onCheckedChange={(checked) => updateSetting("locationSharing", checked)}
              />
            </div>
          </div>

          {/* Safety */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Preferences
            </h4>
            <div className="space-y-2">
              <Label className="text-sm">Default route preference</Label>
              <Select
                value={settings.routePreference}
                onValueChange={(value: "shortest" | "safest" | "covered") => updateSetting("routePreference", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shortest">Shortest Path</SelectItem>
                  <SelectItem value="safest">Safest Route</SelectItem>
                  <SelectItem value="covered">Covered Walkways</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Safety alert radius: {settings.safetyRadius}m</Label>
              <Slider
                value={[settings.safetyRadius]}
                onValueChange={([value]) => updateSetting("safetyRadius", value)}
                max={500}
                min={50}
                step={25}
                className="w-full"
              />
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="font-medium">Personal Emergency Contacts</h4>
            <div className="flex gap-2">
              <Input
                placeholder="Phone number or email"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addEmergencyContact()}
              />
              <Button onClick={addEmergencyContact} size="sm">
                Add
              </Button>
            </div>
            <div className="space-y-1">
              {settings.emergencyContacts.map((contact, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{contact}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEmergencyContact(contact)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} className="flex-1">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
