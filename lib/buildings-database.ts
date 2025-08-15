export interface Building {
  id: string
  name: string
  category: BuildingCategory
  coordinates: { lat: number; lng: number }
  description?: string
  facilities?: string[]
  openHours?: string
  contact?: string
  safetyScore?: number
}

export type BuildingCategory =
  | "academic"
  | "hostel"
  | "dining"
  | "facility"
  | "medical"
  | "sports"
  | "gate"
  | "research"
  | "admin"

export const BUILDING_CATEGORIES: { [key in BuildingCategory]: { name: string; color: string; icon: string } } = {
  academic: { name: "Academic", color: "#3b82f6", icon: "🎓" },
  hostel: { name: "Hostels", color: "#10b981", icon: "🏠" },
  dining: { name: "Dining", color: "#8b5cf6", icon: "🍽️" },
  facility: { name: "Facilities", color: "#f59e0b", icon: "🏢" },
  medical: { name: "Medical", color: "#ef4444", icon: "🏥" },
  sports: { name: "Sports", color: "#06b6d4", icon: "⚽" },
  gate: { name: "Gates", color: "#6b7280", icon: "🚪" },
  research: { name: "Research", color: "#ec4899", icon: "🔬" },
  admin: { name: "Administration", color: "#84cc16", icon: "🏛️" },
}

export const BUILDINGS_DATABASE: Building[] = [
  // Academic Buildings
  {
    id: "main-building",
    name: "Main Building (Admin)",
    category: "admin",
    coordinates: { lat: 12.9915936, lng: 80.2336832 },
    description: "Central administrative building of IIT Madras",
    facilities: ["Director's Office", "Registrar", "Academic Section"],
    openHours: "9:00 AM - 5:00 PM",
    contact: "+91-44-2257-4020",
    safetyScore: 95,
  },
  {
    id: "cse-dept",
    name: "Computer Science Department",
    category: "academic",
    coordinates: { lat: 12.992, lng: 80.234 },
    description: "Department of Computer Science and Engineering",
    facilities: ["Classrooms", "Labs", "Faculty Offices"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 92,
  },
  {
    id: "ee-dept",
    name: "Electrical Engineering Department",
    category: "academic",
    coordinates: { lat: 12.9925, lng: 80.2335 },
    description: "Department of Electrical Engineering",
    facilities: ["Classrooms", "Labs", "Research Centers"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 91,
  },
  {
    id: "me-dept",
    name: "Mechanical Engineering Department",
    category: "academic",
    coordinates: { lat: 12.991, lng: 80.235 },
    description: "Department of Mechanical Engineering",
    facilities: ["Workshops", "Labs", "Design Studios"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 90,
  },
  {
    id: "ce-dept",
    name: "Civil Engineering Department",
    category: "academic",
    coordinates: { lat: 12.9905, lng: 80.2345 },
    description: "Department of Civil Engineering",
    facilities: ["Structural Labs", "Environmental Labs"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 89,
  },
  {
    id: "che-dept",
    name: "Chemical Engineering Department",
    category: "academic",
    coordinates: { lat: 12.993, lng: 80.233 },
    description: "Department of Chemical Engineering",
    facilities: ["Process Labs", "Research Facilities"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 88,
  },
  {
    id: "ae-dept",
    name: "Aerospace Engineering Department",
    category: "academic",
    coordinates: { lat: 12.9935, lng: 80.2325 },
    description: "Department of Aerospace Engineering",
    facilities: ["Wind Tunnel", "Flight Simulator"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 87,
  },
  {
    id: "physics-dept",
    name: "Physics Department",
    category: "academic",
    coordinates: { lat: 12.9895, lng: 80.235 },
    description: "Department of Physics",
    facilities: ["Research Labs", "Lecture Halls"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 90,
  },
  {
    id: "chemistry-dept",
    name: "Chemistry Department",
    category: "academic",
    coordinates: { lat: 12.99, lng: 80.2355 },
    description: "Department of Chemistry",
    facilities: ["Chemical Labs", "Research Centers"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 89,
  },
  {
    id: "math-dept",
    name: "Mathematics Department",
    category: "academic",
    coordinates: { lat: 12.9885, lng: 80.234 },
    description: "Department of Mathematics",
    facilities: ["Classrooms", "Computer Lab"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 92,
  },
  {
    id: "humanities-dept",
    name: "Humanities Department",
    category: "academic",
    coordinates: { lat: 12.988, lng: 80.2345 },
    description: "Department of Humanities and Social Sciences",
    facilities: ["Seminar Halls", "Library"],
    openHours: "8:00 AM - 6:00 PM",
    safetyScore: 91,
  },
  {
    id: "management-studies",
    name: "Management Studies",
    category: "academic",
    coordinates: { lat: 12.9875, lng: 80.235 },
    description: "Department of Management Studies",
    facilities: ["Case Study Rooms", "Auditorium"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 93,
  },

  // Hostels
  {
    id: "alakananda-hostel",
    name: "Alakananda Hostel",
    category: "hostel",
    coordinates: { lat: 12.99, lng: 80.232 },
    description: "Student residential hostel",
    facilities: ["Mess", "Common Room", "Gym"],
    safetyScore: 85,
  },
  {
    id: "bharani-hostel",
    name: "Bharani Hostel",
    category: "hostel",
    coordinates: { lat: 12.9895, lng: 80.2315 },
    description: "Student residential hostel",
    facilities: ["Mess", "Study Room", "Recreation"],
    safetyScore: 86,
  },
  {
    id: "cauvery-hostel",
    name: "Cauvery Hostel",
    category: "hostel",
    coordinates: { lat: 12.989, lng: 80.231 },
    description: "Student residential hostel",
    facilities: ["Mess", "Library", "Sports Room"],
    safetyScore: 84,
  },
  {
    id: "godavari-hostel",
    name: "Godavari Hostel",
    category: "hostel",
    coordinates: { lat: 12.9885, lng: 80.2305 },
    description: "Student residential hostel",
    facilities: ["Mess", "Computer Room"],
    safetyScore: 85,
  },
  {
    id: "jamuna-hostel",
    name: "Jamuna Hostel",
    category: "hostel",
    coordinates: { lat: 12.988, lng: 80.23 },
    description: "Student residential hostel",
    facilities: ["Mess", "Common Areas"],
    safetyScore: 83,
  },
  {
    id: "krishna-hostel",
    name: "Krishna Hostel",
    category: "hostel",
    coordinates: { lat: 12.9875, lng: 80.2295 },
    description: "Student residential hostel",
    facilities: ["Mess", "Study Hall"],
    safetyScore: 86,
  },
  {
    id: "mandakini-hostel",
    name: "Mandakini Hostel",
    category: "hostel",
    coordinates: { lat: 12.987, lng: 80.229 },
    description: "Student residential hostel",
    facilities: ["Mess", "Recreation Room"],
    safetyScore: 84,
  },
  {
    id: "narmada-hostel",
    name: "Narmada Hostel",
    category: "hostel",
    coordinates: { lat: 12.9865, lng: 80.2285 },
    description: "Student residential hostel",
    facilities: ["Mess", "Gym"],
    safetyScore: 85,
  },
  {
    id: "saraswati-hostel",
    name: "Saraswati Hostel",
    category: "hostel",
    coordinates: { lat: 12.986, lng: 80.228 },
    description: "Student residential hostel",
    facilities: ["Mess", "Music Room"],
    safetyScore: 87,
  },
  {
    id: "tapti-hostel",
    name: "Tapti Hostel",
    category: "hostel",
    coordinates: { lat: 12.9855, lng: 80.2275 },
    description: "Student residential hostel",
    facilities: ["Mess", "Study Areas"],
    safetyScore: 84,
  },
  {
    id: "sharavati-hostel",
    name: "Sharavati Hostel",
    category: "hostel",
    coordinates: { lat: 12.985, lng: 80.227 },
    description: "Student residential hostel",
    facilities: ["Mess", "Common Room"],
    safetyScore: 85,
  },
  {
    id: "ganga-hostel",
    name: "Ganga Hostel",
    category: "hostel",
    coordinates: { lat: 12.9845, lng: 80.2265 },
    description: "Student residential hostel",
    facilities: ["Mess", "Recreation"],
    safetyScore: 86,
  },

  // Essential Services & Facilities
  {
    id: "central-library",
    name: "Central Library",
    category: "facility",
    coordinates: { lat: 12.991, lng: 80.233 },
    description: "Main library with extensive collection",
    facilities: ["Reading Halls", "Digital Resources", "Archives"],
    openHours: "8:00 AM - 11:00 PM",
    safetyScore: 94,
  },
  {
    id: "sac",
    name: "Students Activities Center (SAC)",
    category: "facility",
    coordinates: { lat: 12.9905, lng: 80.2345 },
    description: "Hub for student activities and events",
    facilities: ["Auditorium", "Meeting Rooms", "Cafeteria"],
    openHours: "8:00 AM - 10:00 PM",
    safetyScore: 93,
  },
  {
    id: "health-center",
    name: "Health Center",
    category: "medical",
    coordinates: { lat: 12.9925, lng: 80.235 },
    description: "Campus medical facility",
    facilities: ["Emergency Care", "Pharmacy", "Consultation"],
    openHours: "24/7",
    contact: "+91-44-2257-5111",
    safetyScore: 96,
  },
  {
    id: "post-office",
    name: "Post Office",
    category: "facility",
    coordinates: { lat: 12.992, lng: 80.2355 },
    description: "Campus postal services",
    facilities: ["Mail Services", "Courier"],
    openHours: "9:00 AM - 5:00 PM",
    safetyScore: 90,
  },
  {
    id: "sbi-bank",
    name: "SBI Bank",
    category: "facility",
    coordinates: { lat: 12.9915, lng: 80.236 },
    description: "State Bank of India branch",
    facilities: ["ATM", "Banking Services"],
    openHours: "10:00 AM - 4:00 PM",
    safetyScore: 92,
  },
  {
    id: "canara-bank",
    name: "Canara Bank",
    category: "facility",
    coordinates: { lat: 12.991, lng: 80.2365 },
    description: "Canara Bank branch",
    facilities: ["ATM", "Banking Services"],
    openHours: "10:00 AM - 4:00 PM",
    safetyScore: 91,
  },
  {
    id: "campus-central",
    name: "Campus Central",
    category: "facility",
    coordinates: { lat: 12.9895, lng: 80.237 },
    description: "Central shopping and services area",
    facilities: ["Shops", "Services", "Food Court"],
    openHours: "8:00 AM - 10:00 PM",
    safetyScore: 88,
  },

  // Dining Facilities
  {
    id: "himalaya-mess",
    name: "Himalaya Mess",
    category: "dining",
    coordinates: { lat: 12.99, lng: 80.2375 },
    description: "Main dining facility",
    facilities: ["Vegetarian", "Non-Vegetarian"],
    openHours: "7:00 AM - 10:00 PM",
    safetyScore: 87,
  },
  {
    id: "ganga-mess",
    name: "Ganga Mess",
    category: "dining",
    coordinates: { lat: 12.9885, lng: 80.238 },
    description: "Student dining facility",
    facilities: ["Vegetarian Meals"],
    openHours: "7:00 AM - 10:00 PM",
    safetyScore: 86,
  },
  {
    id: "krishna-mess",
    name: "Krishna Mess",
    category: "dining",
    coordinates: { lat: 12.987, lng: 80.2385 },
    description: "Student dining facility",
    facilities: ["Mixed Cuisine"],
    openHours: "7:00 AM - 10:00 PM",
    safetyScore: 85,
  },

  // Sports Facilities
  {
    id: "sports-complex",
    name: "Sports Complex",
    category: "sports",
    coordinates: { lat: 12.985, lng: 80.239 },
    description: "Main sports facility",
    facilities: ["Indoor Courts", "Gym", "Equipment"],
    openHours: "6:00 AM - 10:00 PM",
    safetyScore: 89,
  },
  {
    id: "swimming-pool",
    name: "Swimming Pool",
    category: "sports",
    coordinates: { lat: 12.9845, lng: 80.2395 },
    description: "Olympic-size swimming pool",
    facilities: ["Pool", "Changing Rooms"],
    openHours: "6:00 AM - 8:00 PM",
    safetyScore: 88,
  },
  {
    id: "tennis-courts",
    name: "Tennis Courts",
    category: "sports",
    coordinates: { lat: 12.984, lng: 80.24 },
    description: "Multiple tennis courts",
    facilities: ["4 Courts", "Equipment Rental"],
    openHours: "6:00 AM - 9:00 PM",
    safetyScore: 87,
  },
  {
    id: "cricket-ground",
    name: "Cricket Ground",
    category: "sports",
    coordinates: { lat: 12.9835, lng: 80.2405 },
    description: "Main cricket ground",
    facilities: ["Full Ground", "Practice Nets"],
    openHours: "6:00 AM - 8:00 PM",
    safetyScore: 86,
  },
  {
    id: "football-ground",
    name: "Football Ground",
    category: "sports",
    coordinates: { lat: 12.983, lng: 80.241 },
    description: "Football field",
    facilities: ["Full Field", "Floodlights"],
    openHours: "6:00 AM - 9:00 PM",
    safetyScore: 85,
  },
  {
    id: "basketball-courts",
    name: "Basketball Courts",
    category: "sports",
    coordinates: { lat: 12.9825, lng: 80.2415 },
    description: "Multiple basketball courts",
    facilities: ["3 Courts", "Floodlights"],
    openHours: "6:00 AM - 9:00 PM",
    safetyScore: 87,
  },

  // Gates
  {
    id: "main-gate",
    name: "Main Gate",
    category: "gate",
    coordinates: { lat: 12.995, lng: 80.225 },
    description: "Primary entrance to campus",
    facilities: ["Security", "Visitor Registration"],
    openHours: "24/7",
    safetyScore: 95,
  },
  {
    id: "velachery-gate",
    name: "Velachery Gate",
    category: "gate",
    coordinates: { lat: 12.998, lng: 80.235 },
    description: "Velachery side entrance",
    facilities: ["Security Check"],
    openHours: "6:00 AM - 10:00 PM",
    safetyScore: 92,
  },
  {
    id: "taramani-gate",
    name: "Taramani Gate",
    category: "gate",
    coordinates: { lat: 12.985, lng: 80.245 },
    description: "Taramani side entrance",
    facilities: ["Security Check"],
    openHours: "6:00 AM - 10:00 PM",
    safetyScore: 91,
  },
  {
    id: "back-gate",
    name: "Back Gate",
    category: "gate",
    coordinates: { lat: 12.982, lng: 80.225 },
    description: "Rear entrance",
    facilities: ["Limited Access"],
    openHours: "7:00 AM - 7:00 PM",
    safetyScore: 88,
  },

  // Research Centers
  {
    id: "research-park",
    name: "IITM Research Park",
    category: "research",
    coordinates: { lat: 12.996, lng: 80.24 },
    description: "Technology business incubator",
    facilities: ["Startups", "Labs", "Conference Halls"],
    openHours: "9:00 AM - 6:00 PM",
    safetyScore: 93,
  },
  {
    id: "incubation-cell",
    name: "Incubation Cell",
    category: "research",
    coordinates: { lat: 12.9955, lng: 80.2405 },
    description: "Student startup incubator",
    facilities: ["Co-working Space", "Mentorship"],
    openHours: "9:00 AM - 9:00 PM",
    safetyScore: 91,
  },
  {
    id: "central-workshop",
    name: "Central Workshop",
    category: "facility",
    coordinates: { lat: 12.994, lng: 80.231 },
    description: "Central manufacturing facility",
    facilities: ["Machine Shop", "Fabrication"],
    openHours: "8:00 AM - 5:00 PM",
    safetyScore: 89,
  },
  {
    id: "icsr-building",
    name: "IC&SR Building",
    category: "research",
    coordinates: { lat: 12.9935, lng: 80.2365 },
    description: "Instrumentation and Control Systems Research",
    facilities: ["Research Labs", "Testing Facilities"],
    openHours: "8:00 AM - 8:00 PM",
    safetyScore: 90,
  },
  {
    id: "central-instrumentation",
    name: "Central Instrumentation Facility",
    category: "research",
    coordinates: { lat: 12.993, lng: 80.237 },
    description: "Advanced instrumentation facility",
    facilities: ["Analytical Equipment", "Testing"],
    openHours: "9:00 AM - 6:00 PM",
    safetyScore: 92,
  },
]

// Search and filter functions
export function searchBuildings(query: string, category?: BuildingCategory): Building[] {
  const normalizedQuery = query.toLowerCase().trim()

  if (!normalizedQuery && !category) {
    return BUILDINGS_DATABASE
  }

  return BUILDINGS_DATABASE.filter((building) => {
    const matchesQuery =
      !normalizedQuery ||
      building.name.toLowerCase().includes(normalizedQuery) ||
      building.description?.toLowerCase().includes(normalizedQuery) ||
      building.facilities?.some((facility) => facility.toLowerCase().includes(normalizedQuery))

    const matchesCategory = !category || building.category === category

    return matchesQuery && matchesCategory
  })
}

export function getBuildingsByCategory(category: BuildingCategory): Building[] {
  return BUILDINGS_DATABASE.filter((building) => building.category === category)
}

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS_DATABASE.find((building) => building.id === id)
}

export function getPopularBuildings(): Building[] {
  // Return buildings with high safety scores and important facilities
  return BUILDINGS_DATABASE.filter((building) => (building.safetyScore || 0) >= 90)
    .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
    .slice(0, 8)
}

export function getNearbyBuildings(location: { lat: number; lng: number }, radiusKm = 0.5): Building[] {
  return BUILDINGS_DATABASE.filter((building) => {
    const distance = calculateDistance(location, building.coordinates)
    return distance <= radiusKm * 1000 // Convert km to meters
  })
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat)
  const dLng = toRadians(point2.lng - point1.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c * 1000 // Convert to meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}
