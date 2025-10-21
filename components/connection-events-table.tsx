"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ConnectionEvent } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Wifi, WifiOff } from "lucide-react"

interface ConnectionEventsTableProps {
  sensorId: string
  sensorName: string
}

export function ConnectionEventsTable({ sensorId, sensorName }: ConnectionEventsTableProps) {
  const [events, setEvents] = useState<ConnectionEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`/api/sensors/${sensorId}/events`)
        const data = await response.json()
        setEvents(
          data.events.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })),
        )
      } catch (error) {
        console.error("[v0] Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [sensorId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Conexiones - {sensorName}</CardTitle>
        <CardDescription>Registro de conexiones y desconexiones del sensor</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay eventos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {format(event.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {event.eventType === "connect" ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span>{event.eventType === "connect" ? "Conexión" : "Desconexión"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.eventType === "connect" ? "default" : "destructive"}>
                        {event.eventType === "connect" ? "Conectado" : "Desconectado"}
                      </Badge>
                    </TableCell>
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
