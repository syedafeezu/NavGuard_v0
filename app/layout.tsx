import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "NavGuard - IIT Madras Campus Safety",
  description: "Comprehensive campus safety navigation app for IIT Madras, Chennai",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
.leaflet-container {
  height: 100% !important;
  width: 100% !important;
  z-index: 1;
}
.leaflet-control-container {
  font-family: ${GeistSans.style.fontFamily};
}
.leaflet-popup-content-wrapper {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
}
.leaflet-popup-tip {
  background: hsl(var(--card));
}
        `}</style>
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
        />
        <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js" />
      </body>
    </html>
  )
}
