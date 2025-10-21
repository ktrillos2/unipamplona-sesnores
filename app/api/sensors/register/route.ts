import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sensorId, name, latitude, longitude } = body

    if (!sensorId || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: sensorId, name, latitude, longitude" },
        { status: 400 },
      )
    }

    const sensor = await dbOperations.registerSensor({
      id: sensorId,
      name,
      latitude: Number.parseFloat(latitude),
      longitude: Number.parseFloat(longitude),
    })

    return NextResponse.json({ success: true, sensor })
  } catch (error) {
    console.error("[v0] Error registering sensor:", error)
    return NextResponse.json({ error: "Failed to register sensor" }, { status: 500 })
  }
}
