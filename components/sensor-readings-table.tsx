"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SensorReading } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface SensorReadingsTableProps {
  sensorId: string
  sensorName: string
}

export function SensorReadingsTable({ sensorId, sensorName }: SensorReadingsTableProps) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await fetch(`/api/sensors/${sensorId}/readings?limit=50`)
        const data = await response.json()
        setReadings(
          data.readings.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        )
      } catch (error) {
        console.error("Error fetching readings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReadings()
    const interval = setInterval(fetchReadings, 5000)

    return () => clearInterval(interval)
  }, [sensorId])

  const getQualityBadge = (pm25: number) => {
    if (pm25 <= 12) return <Badge className="bg-green-500">Buena</Badge>
    if (pm25 <= 35.4) return <Badge className="bg-yellow-500">Moderada</Badge>
    if (pm25 <= 55.4) return <Badge className="bg-orange-500">Dañina (sensibles)</Badge>
    if (pm25 <= 150.4) return <Badge className="bg-red-500">Dañina</Badge>
    return <Badge className="bg-purple-600">Muy dañina</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lecturas de {sensorName}</CardTitle>
        <CardDescription>Últimas 50 lecturas registradas del sensor</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Cargando lecturas...</p>
        ) : readings.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No hay lecturas disponibles</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Temperatura</TableHead>
                  <TableHead>Humedad</TableHead>
                  <TableHead>PM2.5</TableHead>
                  <TableHead>Calidad del Aire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {readings.map((reading) => (
                  <TableRow key={reading.id}>
                    <TableCell className="font-medium">
                      {format(reading.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>{reading.temperature.toFixed(1)}°C</TableCell>
                    <TableCell>{reading.humidity.toFixed(1)}%</TableCell>
                    <TableCell>{reading.pm25.toFixed(1)} µg/m³</TableCell>
                    <TableCell>{getQualityBadge(reading.pm25)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
