import { Loader2 } from "lucide-react"

export function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center">
          <span className="text-2xl font-bold text-white">N</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">NavGuard</h1>
          <p className="text-muted-foreground">IIT Madras Campus Safety</p>
        </div>

        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm text-muted-foreground">Initializing...</span>
        </div>
      </div>
    </div>
  )
}
