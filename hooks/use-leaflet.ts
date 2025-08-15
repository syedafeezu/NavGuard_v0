"use client"

import { useEffect, useState } from "react"

export function useLeaflet() {
  const [leaflet, setLeaflet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        const L = await import("leaflet")

        // Import Leaflet CSS
        await import("leaflet/dist/leaflet.css")

        setLeaflet(L)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Failed to load Leaflet:", err)
        setError("Failed to load map library")
        setLoading(false)
      }
    }

    loadLeaflet()
  }, [])

  return { leaflet, loading, error }
}
