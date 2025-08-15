"use client"

import { useState, useEffect, useMemo } from "react"
import { searchBuildings, type BuildingCategory } from "@/lib/buildings-database"

interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
}

export function useSearch(options: UseSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 1 } = options

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | undefined>()
  const [isSearching, setIsSearching] = useState(false)

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setIsSearching(false)
    }, debounceMs)

    if (query !== debouncedQuery) {
      setIsSearching(true)
    }

    return () => clearTimeout(timer)
  }, [query, debounceMs, debouncedQuery])

  // Perform the search
  const results = useMemo(() => {
    if (debouncedQuery.length < minQueryLength && !selectedCategory) {
      return []
    }

    return searchBuildings(debouncedQuery, selectedCategory)
  }, [debouncedQuery, selectedCategory, minQueryLength])

  // Get search suggestions based on partial query
  const suggestions = useMemo(() => {
    if (query.length < 2) return []

    const allBuildings = searchBuildings("")
    const matchingBuildings = allBuildings.filter((building) =>
      building.name.toLowerCase().includes(query.toLowerCase()),
    )

    return matchingBuildings.slice(0, 5).map((building) => building.name)
  }, [query])

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    suggestions,
    isSearching,
    hasQuery: debouncedQuery.length >= minQueryLength || !!selectedCategory,
  }
}
