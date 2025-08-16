"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

interface Location {
  lat: number
  lng: number
}

interface Building {
  id: string
  name: string
  category: string
  coordinates: Location
  description?: string
}

interface Route {
  id: string
  from: Building
  to: Building
  distance: number
  duration: number
  safetyScore: number
  path: Location[]
}

interface Incident {
  id: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  location: Location
  description: string
  timestamp: Date
  anonymous: boolean
  photos?: string[]
}

interface NavGuardState {
  currentLocation: Location | null
  selectedBuilding: Building | null
  currentRoute: Route | null
  incidents: Incident[]
  buildings: Building[]
  favorites: string[]
  searchQuery: string
  mapCenter: Location
  mapZoom: number
}

type NavGuardAction =
  | { type: "SET_CURRENT_LOCATION"; payload: Location }
  | { type: "SET_SELECTED_BUILDING"; payload: Building | null }
  | { type: "SET_CURRENT_ROUTE"; payload: Route | null }
  | { type: "ADD_INCIDENT"; payload: Incident }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "ADD_FAVORITE"; payload: string }
  | { type: "REMOVE_FAVORITE"; payload: string }
  | { type: "SET_MAP_CENTER"; payload: Location }
  | { type: "SET_MAP_ZOOM"; payload: number }

const initialState: NavGuardState = {
  currentLocation: { lat: 12.995, lng: 80.225 }, // Main Gate coordinates
  selectedBuilding: null,
  currentRoute: null,
  incidents: [],
  buildings: [],
  favorites: [],
  searchQuery: "",
  mapCenter: { lat: 12.9915936, lng: 80.2336832 }, // IIT Madras center
  mapZoom: 16,
}

function navGuardReducer(state: NavGuardState, action: NavGuardAction): NavGuardState {
  switch (action.type) {
    case "SET_CURRENT_LOCATION":
      return { ...state, currentLocation: action.payload }
    case "SET_SELECTED_BUILDING":
      return { ...state, selectedBuilding: action.payload }
    case "SET_CURRENT_ROUTE":
      return { ...state, currentRoute: action.payload }
    case "ADD_INCIDENT":
      return { ...state, incidents: [...state.incidents, action.payload] }
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload }
    case "ADD_FAVORITE":
      return { ...state, favorites: [...state.favorites, action.payload] }
    case "REMOVE_FAVORITE":
      return { ...state, favorites: state.favorites.filter((id) => id !== action.payload) }
    case "SET_MAP_CENTER":
      return { ...state, mapCenter: action.payload }
    case "SET_MAP_ZOOM":
      return { ...state, mapZoom: action.payload }
    default:
      return state
  }
}

const NavGuardContext = createContext<{
  state: NavGuardState
  dispatch: React.Dispatch<NavGuardAction>
} | null>(null)

export function NavGuardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(navGuardReducer, initialState)

  return <NavGuardContext.Provider value={{ state, dispatch }}>{children}</NavGuardContext.Provider>
}

export function useNavGuard() {
  const context = useContext(NavGuardContext)
  if (!context) {
    throw new Error("useNavGuard must be used within a NavGuardProvider")
  }
  return context
}
