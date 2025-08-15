"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, CheckCircle, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmergencyService, type EmergencyAlert } from "@/lib/emergency-services"

export function EmergencyAlerts() {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    const emergencyService = EmergencyService.getInstance()
    const unsubscribe = emergencyService.subscribe((newAlerts) => {
      setAlerts(newAlerts.filter((alert) => alert.status === "active"))
    })

    return unsubscribe
  }, [])

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }

  const visibleAlerts = alerts.filter((alert) => !dismissedAlerts.has(alert.id))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fixed top-20 left-4 right-4 z-40 space-y-2">
      {visibleAlerts.map((alert) => (
        <Card key={alert.id} className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Emergency Alert</h4>
                    <Badge variant="destructive" className="text-xs">
                      {alert.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {alert.description || "Emergency services have been notified"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-red-600 dark:text-red-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissAlert(alert.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
