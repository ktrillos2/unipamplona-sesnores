"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SensorReading } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Spinner } from "@/components/ui/spinner"

interface SensorReadingsTableProps {
  sensorId: string
  sensorName: string
}

export function SensorReadingsTable({ sensorId, sensorName }: SensorReadingsTableProps) {
  const [readings, setReadings] = useState<SensorReading[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setPending(true)
        const response = await fetch(`/api/sensors/${sensorId}/readings?page=${page}&pageSize=${pageSize}`)
        const data = await response.json()
        setReadings(
          data.readings.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp),
          })),
        )
        setTotal(data.total ?? 0)
      } catch (error) {
        console.error("Error fetching readings:", error)
      } finally {
        setLoading(false)
        setPending(false)
      }
    }

    fetchReadings()
    const interval = setInterval(fetchReadings, 5000)

    return () => clearInterval(interval)
  }, [sensorId, page, pageSize])

  // Reset a la primera página cuando cambia el sensor
  useEffect(() => {
    setPage(1)
  }, [sensorId, pageSize])

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
        <CardDescription>
          Mostrando {readings.length > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} de {total}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Cargando lecturas...</p>
        ) : readings.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No hay lecturas disponibles</p>
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
