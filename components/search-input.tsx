"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BUILDING_CATEGORIES, type BuildingCategory } from "@/lib/buildings-database"

interface SearchInputProps {
  query: string
  onQueryChange: (query: string) => void
  selectedCategory?: BuildingCategory
  onCategoryChange: (category: BuildingCategory | undefined) => void
  suggestions: string[]
  placeholder?: string
}

export function SearchInput({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  suggestions,
  placeholder = "Search buildings, hostels, facilities...",
}: SearchInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setFocusedSuggestion(-1)
  }, [suggestions])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedSuggestion((prev) => (prev > 0 ? prev - 1 : prev))
        break
      case "Enter":
        e.preventDefault()
        if (focusedSuggestion >= 0) {
          onQueryChange(suggestions[focusedSuggestion])
          setShowSuggestions(false)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        inputRef.current?.blur()
        break
    }
  }

  const clearSearch = () => {
    onQueryChange("")
    onCategoryChange(undefined)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20"
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Filter className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onCategoryChange(undefined)}>All Categories</DropdownMenuItem>
              {Object.entries(BUILDING_CATEGORIES).map(([key, category]) => (
                <DropdownMenuItem key={key} onClick={() => onCategoryChange(key as BuildingCategory)}>
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {(query || selectedCategory) && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-6 w-6 p-0">
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {selectedCategory && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-xs">
            {BUILDING_CATEGORIES[selectedCategory].icon} {BUILDING_CATEGORIES[selectedCategory].name}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCategoryChange(undefined)}
              className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
            >
              <X className="w-2 h-2" />
            </Button>
          </Badge>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => {
                onQueryChange(suggestion)
                setShowSuggestions(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                index === focusedSuggestion ? "bg-accent" : ""
              }`}
            >
              <Search className="inline w-3 h-3 mr-2 text-muted-foreground" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
