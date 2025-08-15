"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Route, Shield, AlertTriangle, Clock, TrendingUp } from "lucide-react"

interface DashboardStats {
  totalRoutes: number
  safetyScore: number
  incidentsReported: number
  emergencyContacts: number
  lastLocationUpdate: Date
  weeklyActivity: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRoutes: 0,
    safetyScore: 0,
    incidentsReported: 0,
    emergencyContacts: 5,
    lastLocationUpdate: new Date(),
    weeklyActivity: 0,
  })

  useEffect(() => {
    // Simulate loading stats from local storage or API
    const loadStats = () => {
      const savedStats = localStorage.getItem("navguard-stats")
      if (savedStats) {
        setStats(JSON.parse(savedStats))
      } else {
        // Initialize with sample data
        setStats({
          totalRoutes: 12,
          safetyScore: 85,
          incidentsReported: 3,
          emergencyContacts: 5,
          lastLocationUpdate: new Date(),
          weeklyActivity: 7,
        })
      }
    }

    loadStats()
  }, [])

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getSafetyScoreBadge = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    return "Needs Attention"
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Your Safety Dashboard</h3>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="w-4 h-4" />
              Routes Planned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoutes}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSafetyScoreColor(stats.safetyScore)}`}>{stats.safetyScore}%</div>
            <Badge variant="secondary" className="text-xs">
              {getSafetyScoreBadge(stats.safetyScore)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Incidents Reported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incidentsReported}</div>
            <p className="text-xs text-muted-foreground">Helping campus safety</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyActivity}</div>
            <p className="text-xs text-muted-foreground">Days active</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last Location Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{stats.lastLocationUpdate.toLocaleString()}</p>
          <Badge variant="outline" className="text-xs mt-1">
            GPS Active
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
