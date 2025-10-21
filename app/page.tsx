"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { SensorStatusCard } from "@/components/sensor-status-card"
import { SensorReadingsTable } from "@/components/sensor-readings-table"
import { ConnectionEventsTable } from "@/components/connection-events-table"
import { SensorSelector } from "@/components/sensor-selector"
import { ExportDialog } from "@/components/export-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import type { SensorWithLastReading } from "@/lib/types"
import { MapPin, Activity } from "lucide-react"

const SensorMap = dynamic(() => import("@/components/sensor-map").then((mod) => mod.SensorMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-muted/50">
      <p className="text-muted-foreground">Cargando mapa...</p>
    </div>
  ),
})

export default function Home() {
  const [sensors, setSensors] = useState<SensorWithLastReading[]>([])
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState(false)

  useEffect(() => {
    // Open a WebSocket for live updates (optional for dashboard view)
    const url = new URL(typeof window !== "undefined" ? window.location.href : "http://localhost")
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:"
    url.pathname = "/api/ws"
    const ws = new WebSocket(url.toString())
    ws.onopen = () => setWsConnected(true)
    ws.onclose = () => setWsConnected(false)
    ws.onerror = () => setWsConnected(false)
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data as string)
        if (data?.type === "reading:update" && data.sensorId) {
          // Optionally update UI instantly if server broadcasts
          setSensors((prev) =>
            prev.map((s) =>
              s.id === data.sensorId
                ? {
                    ...s,
                    lastReading: {
                      id: data.id || `${data.sensorId}-${Date.now()}`,
                      sensorId: data.sensorId,
                      timestamp: new Date(),
                      temperature: data.temperature,
                      humidity: data.humidity,
                      pm25: data.pm25,
                    },
                  }
                : s,
            ),
          )
        }
      } catch {}
    }
    return () => {
      try {
        ws.close()
      } catch {}
    }
  }, [])

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const response = await fetch("/api/sensors/list")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.sensors && Array.isArray(data.sensors)) {
          setSensors(data.sensors)
          setError(null)

          if (!selectedSensorId && data.sensors.length > 0) {
            setSelectedSensorId(data.sensors[0].id)
          }
        } else {
          console.error("[v0] Invalid data format:", data)
          setSensors([])
          setError(data.error || "Formato de datos inválido")
        }
      } catch (error) {
        console.error("[v0] Error fetching sensors:", error)
        setSensors([])
        setError(error instanceof Error ? error.message : "Error al cargar sensores")
      } finally {
        setLoading(false)
      }
    }

    fetchSensors()
    const interval = setInterval(fetchSensors, 5000)

    return () => clearInterval(interval)
  }, [selectedSensorId])

  const selectedSensor = Array.isArray(sensors) ? sensors.find((s) => s.id === selectedSensorId) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />

      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 text-sm">
          <span className={wsConnected ? "text-green-600" : "text-muted-foreground"}>
            {wsConnected ? "● WebSocket conectado" : "○ WebSocket desconectado"}
          </span>
        </div>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Cargando sensores...</p>
          </div>
        ) : error ? (
          <Card className="mx-auto max-w-2xl border-destructive">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Activity className="h-16 w-16 text-destructive" />
              <p className="text-lg font-semibold text-destructive">Error al cargar datos</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="w-full rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2 font-semibold">Posibles soluciones:</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Verifica que la base de datos esté configurada correctamente</li>
                  <li>Ejecuta los scripts de inicialización de la base de datos</li>
                  <li>Revisa la consola del navegador para más detalles</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : sensors.length === 0 ? (
          <Card className="mx-auto max-w-2xl">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Activity className="h-16 w-16 text-muted-foreground" />
              <p className="text-lg font-semibold">No hay sensores registrados</p>
              <div className="w-full rounded-lg bg-muted p-4 text-sm">
                <p className="mb-2 font-semibold">Para registrar un sensor desde tu ESP32:</p>
                <code className="block rounded bg-background p-2">
                  POST /api/sensors/register
                  <br />
                  {`{ "sensorId": "ESP32_001", "name": "Sensor 1", "latitude": 7.3797, "longitude": -72.6517 }`}
                </code>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Map Section */}
            <Card>
              <CardContent className="p-0">
                <div className="flex items-center gap-2 border-b px-4 py-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Ubicación de Sensores</h2>
                </div>
                <div className="h-[500px]">
                  <SensorMap sensors={sensors} onSensorClick={(sensor) => setSelectedSensorId(sensor.id)} />
                </div>
              </CardContent>
            </Card>

            {/* Status Cards */}
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 text-primary" />
                Estado de Sensores
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sensors.map((sensor) => (
                  <SensorStatusCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            </div>

            {/* Detailed View */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <SensorSelector
                  sensors={sensors}
                  selectedSensorId={selectedSensorId}
                  onSensorChange={setSelectedSensorId}
                />
                {selectedSensor && <ExportDialog sensorId={selectedSensor.id} sensorName={selectedSensor.name} />}
              </div>

              {selectedSensor && (
                <Tabs defaultValue="readings" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="readings">Lecturas del Sensor</TabsTrigger>
                    <TabsTrigger value="events">Historial de Conexiones</TabsTrigger>
                  </TabsList>
                  <TabsContent value="readings" className="mt-4">
                    <SensorReadingsTable sensorId={selectedSensor.id} sensorName={selectedSensor.name} />
                  </TabsContent>
                  <TabsContent value="events" className="mt-4">
                    <ConnectionEventsTable sensorId={selectedSensor.id} sensorName={selectedSensor.name} />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
