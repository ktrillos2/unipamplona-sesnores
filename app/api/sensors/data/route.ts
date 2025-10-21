import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"
import type { SensorReading } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sensorId, temperature, humidity, pm25 } = body

    if (!sensorId || temperature === undefined || humidity === undefined || pm25 === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: sensorId, temperature, humidity, pm25" },
        { status: 400 },
      )
    }

    const sensor = await dbOperations.getSensor(sensorId)
    if (!sensor) {
      return NextResponse.json({ error: "Sensor not registered. Please register the sensor first." }, { status: 404 })
    }

    const reading: SensorReading = {
      sensorId,
      timestamp: new Date().toISOString(),
      temperature: Number.parseFloat(temperature),
      humidity: Number.parseFloat(humidity),
      pm25: Number.parseFloat(pm25),
    }

    await dbOperations.addReading(reading)

    return NextResponse.json({ success: true, reading })
  } catch (error) {
    console.error("Error saving sensor data:", error)
    return NextResponse.json({ error: "Failed to save sensor data" }, { status: 500 })
  }
}
