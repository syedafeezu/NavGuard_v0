"use client"

import { useState, useEffect, useRef } from "react"

interface GeolocationState {
  location: { lat: number; lng: number } | null
  error: string | null
  loading: boolean
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  })

  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by this browser",
        loading: false,
      })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        const shouldUpdate =
          !lastLocationRef.current ||
          calculateDistance(
            lastLocationRef.current.lat,
            lastLocationRef.current.lng,
            newLocation.lat,
            newLocation.lng,
          ) > 5

        if (shouldUpdate) {
          if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current)
          }

          updateTimeoutRef.current = setTimeout(() => {
            setState({
              location: newLocation,
              error: null,
              loading: false,
            })
            lastLocationRef.current = newLocation
          }, 500) // 500ms debounce
        } else if (state.loading) {
          setState((prev) => ({ ...prev, loading: false }))
        }
      },
      (error) => {
        setState({
          location: null,
          error: error.message,
          loading: false,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 30000, // Reduced from 60000 to 30000
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [state.loading])

  return state
}
