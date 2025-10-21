"use client"

import { useEffect, useRef, useState } from "react"
import type { SensorWithLastReading } from "@/lib/types"
import { Card } from "@/components/ui/card"

interface SensorMapProps {
  sensors: SensorWithLastReading[]
  onSensorClick?: (sensor: SensorWithLastReading) => void
}

function getAirQualityStatus(pm25: number): { label: string; color: string } {
  if (pm25 <= 12) return { label: "Buena", color: "#22c55e" }
  if (pm25 <= 35.4) return { label: "Moderada", color: "#eab308" }
  if (pm25 <= 55.4) return { label: "Dañina para grupos sensibles", color: "#f97316" }
  if (pm25 <= 150.4) return { label: "Dañina", color: "#ef4444" }
  return { label: "Muy dañina", color: "#991b1b" }
}

export function SensorMap({ sensors, onSensorClick }: SensorMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [L, setL] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const markersRef = useRef<Map<string, any>>(new Map())

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      try {
        const leaflet = await import("leaflet")
        setL(leaflet.default)

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link")
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)
        }
      } catch (error) {
        console.error("Error loading Leaflet:", error)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!L || !mapRef.current || map) return

    try {
      const timer = setTimeout(() => {
        if (!mapRef.current) return

        const newMap = L.map(mapRef.current).setView([7.3797, -72.6517], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(newMap)

        newMap.whenReady(() => {
          setMap(newMap)
          setMapReady(true)
        })
      }, 100)

      return () => {
        clearTimeout(timer)
        if (map) {
          map.remove()
        }
      }
    } catch (error) {
      console.error("Error initializing map:", error)
    }
  }, [L, map])

  // Update markers when sensors change
  useEffect(() => {
    if (!map || !L || !mapReady || !sensors.length) return

    try {
      // Clear existing markers
      markersRef.current.forEach((marker) => {
        try {
          marker.remove()
        } catch (e) {
          console.error("Error removing marker:", e)
        }
      })
      markersRef.current.clear()

      // Add new markers
      sensors.forEach((sensor) => {
        try {
          const isConnected = sensor.isConnected
          const iconColor = isConnected ? "#22c55e" : "#ef4444"

          const icon = L.divIcon({
            className: "custom-marker",
            html: `
            <div style="
              width: 32px;
              height: 32px;
              background-color: ${iconColor};
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            ">
              <div style="
                width: 12px;
                height: 12px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })

          const marker = L.marker([sensor.latitude, sensor.longitude], { icon })

          marker.addTo(map)

          const airQuality = sensor.lastReading ? getAirQualityStatus(sensor.lastReading.pm25) : null

          marker.bindPopup(
            `
            <div style="min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px;">${sensor.name}</h3>
              <p style="margin: 4px 0;"><strong>Estado:</strong> ${isConnected ? "✅ Conectado" : "❌ Desconectado"}</p>
              ${
                sensor.lastReading
                  ? `
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;" />
                <p style="margin: 4px 0;"><strong>🌡️ Temperatura:</strong> ${sensor.lastReading.temperature.toFixed(1)}°C</p>
                <p style="margin: 4px 0;"><strong>💧 Humedad:</strong> ${sensor.lastReading.humidity.toFixed(1)}%</p>
                <p style="margin: 4px 0;"><strong>🌫️ PM2.5:</strong> ${sensor.lastReading.pm25.toFixed(1)} µg/m³</p>
                ${
                  airQuality
                    ? `<p style="margin: 4px 0;"><strong>Calidad del aire:</strong> <span style="color: ${airQuality.color}; font-weight: bold;">${airQuality.label}</span></p>`
                    : ""
                }
              `
                  : "<p>Sin lecturas disponibles</p>"
              }
            </div>
          `,
          )

          if (sensor.lastReading) {
            const tooltipContent = `
              <div style="text-align: center;">
                <strong>${sensor.name}</strong><br/>
                🌡️ ${sensor.lastReading.temperature.toFixed(1)}°C | 
                💧 ${sensor.lastReading.humidity.toFixed(1)}% | 
                🌫️ ${sensor.lastReading.pm25.toFixed(1)} µg/m³
              </div>
            `
            marker.bindTooltip(tooltipContent, {
              permanent: false,
              direction: "top",
              offset: [0, -20],
            })
          } else {
            marker.bindTooltip(`<strong>${sensor.name}</strong><br/>Sin lecturas`, {
              permanent: false,
              direction: "top",
              offset: [0, -20],
            })
          }

          marker.on("click", () => {
            if (onSensorClick) {
              onSensorClick(sensor)
            }
          })

          markersRef.current.set(sensor.id, marker)
        } catch (error) {
          console.error(`Error adding marker for sensor ${sensor.id}:`, error)
        }
      })

      // Fit bounds to show all sensors
      if (sensors.length > 0 && markersRef.current.size > 0) {
        try {
          const bounds = L.latLngBounds(sensors.map((s) => [s.latitude, s.longitude]))
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        } catch (error) {
          console.error("Error fitting bounds:", error)
        }
      }
    } catch (error) {
      console.error("Error updating markers:", error)
    }
  }, [map, L, mapReady, sensors, onSensorClick])

  return (
    <Card className="relative h-full overflow-hidden">
      <div ref={mapRef} className="h-full w-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="text-muted-foreground">Cargando mapa...</p>
        </div>
      )}
      {mapReady && sensors.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <p className="text-muted-foreground">No hay sensores registrados</p>
        </div>
      )}
    </Card>
  )
}
