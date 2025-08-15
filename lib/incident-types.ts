export interface Incident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  location: { lat: number; lng: number }
  description: string
  timestamp: Date
  anonymous: boolean
  photos?: string[]
  reporterContact?: string
  status: IncidentStatus
  adminNotes?: string
  resolvedAt?: Date
}

export type IncidentType =
  | "poor-lighting"
  | "unsafe-area"
  | "broken-infrastructure"
  | "wildlife-sighting"
  | "flooding"
  | "construction-hazard"
  | "medical-emergency"
  | "security-concern"
  | "lost-found"
  | "harassment"
  | "theft"
  | "other"

export type IncidentSeverity = "low" | "medium" | "high" | "critical"

export type IncidentStatus = "reported" | "investigating" | "in-progress" | "resolved" | "dismissed"

export const INCIDENT_TYPES: {
  [key in IncidentType]: {
    name: string
    description: string
    icon: string
    color: string
    defaultSeverity: IncidentSeverity
  }
} = {
  "poor-lighting": {
    name: "Poor Lighting",
    description: "Inadequate lighting in pathways or areas",
    icon: "💡",
    color: "#f59e0b",
    defaultSeverity: "medium",
  },
  "unsafe-area": {
    name: "Unsafe Area",
    description: "General safety concerns in specific locations",
    icon: "⚠️",
    color: "#ef4444",
    defaultSeverity: "high",
  },
  "broken-infrastructure": {
    name: "Broken Infrastructure",
    description: "Damaged roads, walkways, or facilities",
    icon: "🔧",
    color: "#f97316",
    defaultSeverity: "medium",
  },
  "wildlife-sighting": {
    name: "Wildlife Sighting",
    description: "Potentially dangerous wildlife encounters",
    icon: "🐍",
    color: "#84cc16",
    defaultSeverity: "low",
  },
  flooding: {
    name: "Flooding/Water logging",
    description: "Water accumulation blocking pathways",
    icon: "🌊",
    color: "#06b6d4",
    defaultSeverity: "medium",
  },
  "construction-hazard": {
    name: "Construction Hazard",
    description: "Unsafe construction sites or equipment",
    icon: "🚧",
    color: "#f59e0b",
    defaultSeverity: "high",
  },
  "medical-emergency": {
    name: "Medical Emergency",
    description: "Someone requiring immediate medical attention",
    icon: "🚑",
    color: "#dc2626",
    defaultSeverity: "critical",
  },
  "security-concern": {
    name: "Security Concern",
    description: "Suspicious activities or security issues",
    icon: "🛡️",
    color: "#7c3aed",
    defaultSeverity: "high",
  },
  "lost-found": {
    name: "Lost & Found",
    description: "Lost items or found belongings",
    icon: "🔍",
    color: "#10b981",
    defaultSeverity: "low",
  },
  harassment: {
    name: "Harassment",
    description: "Inappropriate behavior or harassment",
    icon: "🚫",
    color: "#dc2626",
    defaultSeverity: "high",
  },
  theft: {
    name: "Theft",
    description: "Stolen items or theft incidents",
    icon: "🔒",
    color: "#991b1b",
    defaultSeverity: "high",
  },
  other: {
    name: "Other",
    description: "Other safety or security concerns",
    icon: "❓",
    color: "#6b7280",
    defaultSeverity: "medium",
  },
}

export const SEVERITY_CONFIG: {
  [key in IncidentSeverity]: {
    name: string
    color: string
    bgColor: string
    description: string
  }
} = {
  low: {
    name: "Low",
    color: "#10b981",
    bgColor: "#10b98120",
    description: "Minor issue, no immediate danger",
  },
  medium: {
    name: "Medium",
    color: "#f59e0b",
    bgColor: "#f59e0b20",
    description: "Moderate concern, should be addressed",
  },
  high: {
    name: "High",
    color: "#ef4444",
    bgColor: "#ef444420",
    description: "Serious issue requiring prompt attention",
  },
  critical: {
    name: "Critical",
    color: "#dc2626",
    bgColor: "#dc262620",
    description: "Immediate danger, requires urgent response",
  },
}

// Sample incidents for demonstration
export const SAMPLE_INCIDENTS: Incident[] = [
  {
    id: "inc-001",
    type: "poor-lighting",
    severity: "medium",
    location: { lat: 12.989, lng: 80.232 },
    description: "Street light near Alakananda Hostel is not working",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    anonymous: false,
    status: "reported",
    reporterContact: "student@iitm.ac.in",
  },
  {
    id: "inc-002",
    type: "broken-infrastructure",
    severity: "high",
    location: { lat: 12.991, lng: 80.234 },
    description: "Large pothole on main pathway causing safety hazard",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    anonymous: true,
    status: "in-progress",
    adminNotes: "Maintenance team notified",
  },
  {
    id: "inc-003",
    type: "wildlife-sighting",
    severity: "low",
    location: { lat: 12.985, lng: 80.238 },
    description: "Snake spotted near sports complex",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    anonymous: false,
    status: "resolved",
    resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
]
