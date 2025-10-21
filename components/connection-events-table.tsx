"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ConnectionEvent } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Wifi, WifiOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"

interface ConnectionEventsTableProps {
  sensorId: string
  sensorName: string
}

export function ConnectionEventsTable({ sensorId, sensorName }: ConnectionEventsTableProps) {
  const [events, setEvents] = useState<ConnectionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setPending(true)
        const response = await fetch(`/api/sensors/${sensorId}/events?page=${page}&pageSize=${pageSize}`)
        const data = await response.json()
        setEvents(
          data.events.map((e: any) => ({
            ...e,
            timestamp: new Date(e.timestamp),
          })),
        )
        setTotal(data.total ?? 0)
      } catch (error) {
        console.error("[v0] Error fetching events:", error)
      } finally {
        setLoading(false)
        setPending(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [sensorId, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [sensorId, pageSize])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Conexiones - {sensorName}</CardTitle>
        <CardDescription>
          Mostrando {events.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} de {total}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay eventos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(parseInt(val, 10))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Cantidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">por página</span>
              {pending && <Spinner className="ml-2 size-4 text-muted-foreground" />}
            </div>
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

            {Math.ceil(total / pageSize) > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPage((p) => Math.max(1, p - 1))
                      }}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.max(5, page + 2))
                    .map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(p)
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        const totalPages = Math.ceil(total / pageSize)
                        setPage((p) => Math.min(totalPages, p + 1))
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
