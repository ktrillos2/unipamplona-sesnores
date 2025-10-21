"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Download, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { exportReadingsToCSV, exportEventsToCSV } from "@/lib/export-utils"
import type { SensorReading, ConnectionEvent } from "@/lib/types"

interface ExportDialogProps {
  sensorId: string
  sensorName: string
}

export function ExportDialog({ sensorId, sensorName }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportType, setExportType] = useState<"readings" | "events">("readings")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!startDate || !endDate) {
      alert("Por favor selecciona un rango de fechas")
      return
    }

    setLoading(true)

    try {
      if (exportType === "readings") {
        const response = await fetch(
          `/api/sensors/${sensorId}/readings?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        const data = await response.json()
        const readings: SensorReading[] = data.readings.map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        }))

        if (readings.length === 0) {
          alert("No hay lecturas en el rango de fechas seleccionado")
          return
        }

        exportReadingsToCSV(readings, sensorName)
      } else {
        const response = await fetch(
          `/api/sensors/${sensorId}/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        const data = await response.json()
        const events: ConnectionEvent[] = data.events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }))

        if (events.length === 0) {
          alert("No hay eventos en el rango de fechas seleccionado")
          return
        }

        exportEventsToCSV(events, sensorName)
      }

      setOpen(false)
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
      alert("Error al exportar los datos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exportar Datos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Datos Históricos</DialogTitle>
          <DialogDescription>Selecciona el tipo de datos y el rango de fechas para exportar</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de datos</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as "readings" | "events")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="readings" id="readings" />
                <Label htmlFor="readings" className="font-normal">
                  Lecturas de sensores
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="events" id="events" />
                <Label htmlFor="events" className="font-normal">
                  Historial de conexiones
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Fecha de inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Fecha de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={loading || !startDate || !endDate}>
            {loading ? "Exportando..." : "Exportar CSV"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
