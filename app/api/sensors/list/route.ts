import { NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function GET() {
  try {
    const sensors = await dbOperations.getAllSensors()
    

    if (!sensors || !Array.isArray(sensors)) {
      console.error("[v0] Invalid sensors data from database")
      return NextResponse.json({ sensors: [] })
    }

    // Add last reading to each sensor
    const sensorsWithReadings = await Promise.all(
      sensors.map(async (sensor) => {
        const readings = await dbOperations.getReadingsBySensor(sensor.id, 1)
        return {
          ...sensor,
          lastReading: readings[0] || null,
        }
      }),
    )

    return NextResponse.json({ sensors: sensorsWithReadings })
  } catch (error) {
    console.error("[v0] Error fetching sensors:", error)
    return NextResponse.json(
      {
        sensors: [],
        error: error instanceof Error ? error.message : "Failed to fetch sensors",
      },
      { status: 500 },
    )
  }
}
