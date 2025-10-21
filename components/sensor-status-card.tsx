"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SensorWithLastReading } from "@/lib/types"
import { Thermometer, Droplets, Wind, X } from "lucide-react"
import { useState } from "react"

interface SensorStatusCardProps {
  sensor: SensorWithLastReading
  onDeleted?: (sensorId: string) => void
}

export function SensorStatusCard({ sensor, onDeleted }: SensorStatusCardProps) {
  const { lastReading, isConnected } = sensor
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleting) return
    const ok = window.confirm(`¿Eliminar el sensor "${sensor.name}" y todo su historial? Esta acción no se puede deshacer.`)
    if (!ok) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/sensors/${encodeURIComponent(sensor.id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (onDeleted) onDeleted(sensor.id)
    } catch (e) {
      console.error("Error deleting sensor", e)
      alert("No se pudo eliminar el sensor. Intenta de nuevo.")
    } finally {
      setDeleting(false)
    }
  }

  const getAirQuality = (pm25: number) => {
    if (pm25 <= 12) return { label: "Buena", color: "bg-green-500" }
    if (pm25 <= 35.4) return { label: "Moderada", color: "bg-yellow-500" }
    if (pm25 <= 55.4) return { label: "Dañina (sensibles)", color: "bg-orange-500" }
    if (pm25 <= 150.4) return { label: "Dañina", color: "bg-red-500" }
    return { label: "Muy dañina", color: "bg-purple-600" }
  }

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold truncate" title={sensor.name}>{sensor.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
            {isConnected ? "● Conectado" : "○ Desconectado"}
          </Badge>
          <button
            aria-label="Eliminar sensor"
            title="Eliminar sensor"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {lastReading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Thermometer className="mt-0.5 h-5 w-5 text-red-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Temperatura</p>
                  <p className="text-xl font-bold">{lastReading.temperature.toFixed(1)}°C</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                <Droplets className="mt-0.5 h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Humedad</p>
                  <p className="text-xl font-bold">{lastReading.humidity.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <Wind className="mt-0.5 h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Material Particulado PM2.5</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xl font-bold">{lastReading.pm25.toFixed(1)} µg/m³</p>
                    <Badge className={getAirQuality(lastReading.pm25).color}>
                      {getAirQuality(lastReading.pm25).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin lecturas disponibles</p>
        )}
      </CardContent>
    </Card>
  )
}
