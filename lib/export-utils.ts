import type { SensorReading, ConnectionEvent } from "./types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function exportReadingsToCSV(readings: SensorReading[], sensorName: string): void {
  const headers = ["Fecha y Hora", "Temperatura (°C)", "Humedad (%)", "PM2.5 (µg/m³)"]

  const rows = readings.map((reading) => [
    format(reading.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: es }),
    reading.temperature.toFixed(2),
    reading.humidity.toFixed(2),
    reading.pm25.toFixed(2),
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  downloadCSV(csvContent, `lecturas_${sensorName}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`)
}

export function exportEventsToCSV(events: ConnectionEvent[], sensorName: string): void {
  const headers = ["Fecha y Hora", "Tipo de Evento", "Estado"]

  const rows = events.map((event) => [
    format(event.timestamp, "dd/MM/yyyy HH:mm:ss", { locale: es }),
    event.eventType === "connect" ? "Conexión" : "Desconexión",
    event.eventType === "connect" ? "Conectado" : "Desconectado",
  ])

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  downloadCSV(csvContent, `eventos_${sensorName}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`)
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
