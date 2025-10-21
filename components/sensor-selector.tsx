"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Sensor } from "@/lib/types"

interface SensorSelectorProps {
  sensors: Sensor[]
  selectedSensorId: string | null
  onSensorChange: (sensorId: string) => void
}

export function SensorSelector({ sensors, selectedSensorId, onSensorChange }: SensorSelectorProps) {
  return (
    <Select value={selectedSensorId || undefined} onValueChange={onSensorChange}>
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="Selecciona un sensor" />
      </SelectTrigger>
      <SelectContent>
        {sensors.map((sensor) => (
          <SelectItem key={sensor.id} value={sensor.id}>
            {sensor.name} - {sensor.isConnected ? "Conectado" : "Desconectado"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
