export interface EmergencyContact {
  id: string
  name: string
  phone: string
  type: "security" | "medical" | "fire" | "police" | "personal"
  description: string
  available24h: boolean
}

export interface EmergencyAlert {
  id: string
  type: "sos" | "medical" | "security" | "fire"
  location: { lat: number; lng: number }
  timestamp: Date
  userId: string
  status: "active" | "responded" | "resolved"
  description?: string
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    id: "iit-security",
    name: "IIT Madras Security",
    phone: "+91-44-2257-4001",
    type: "security",
    description: "Campus security control room",
    available24h: true,
  },
  {
    id: "iit-medical",
    name: "IIT Health Centre",
    phone: "+91-44-2257-4002",
    type: "medical",
    description: "Campus medical emergency",
    available24h: true,
  },
  {
    id: "chennai-police",
    name: "Chennai Police",
    phone: "100",
    type: "police",
    description: "Emergency police services",
    available24h: true,
  },
  {
    id: "fire-service",
    name: "Fire Service",
    phone: "101",
    type: "fire",
    description: "Fire and rescue services",
    available24h: true,
  },
  {
    id: "ambulance",
    name: "Ambulance",
    phone: "108",
    type: "medical",
    description: "Emergency medical services",
    available24h: true,
  },
]

export class EmergencyService {
  private static instance: EmergencyService
  private alerts: EmergencyAlert[] = []
  private listeners: ((alerts: EmergencyAlert[]) => void)[] = []

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService()
    }
    return EmergencyService.instance
  }

  async triggerSOS(location: { lat: number; lng: number }, description?: string): Promise<string> {
    const alert: EmergencyAlert = {
      id: `sos-${Date.now()}`,
      type: "sos",
      location,
      timestamp: new Date(),
      userId: "current-user",
      status: "active",
      description,
    }

    this.alerts.push(alert)
    this.notifyListeners()

    // Simulate emergency response
    setTimeout(() => {
      this.updateAlertStatus(alert.id, "responded")
    }, 30000)

    return alert.id
  }

  async sendLocationToContacts(location: { lat: number; lng: number }): Promise<void> {
    const message = `Emergency! I need help. My location: https://maps.google.com/?q=${location.lat},${location.lng}`
    console.log("[v0] Sending location to emergency contacts:", message)
    // In a real app, this would send SMS/notifications
  }

  updateAlertStatus(alertId: string, status: EmergencyAlert["status"]): void {
    const alert = this.alerts.find((a) => a.id === alertId)
    if (alert) {
      alert.status = status
      this.notifyListeners()
    }
  }

  getActiveAlerts(): EmergencyAlert[] {
    return this.alerts.filter((alert) => alert.status === "active")
  }

  subscribe(listener: (alerts: EmergencyAlert[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.alerts))
  }
}
