import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sensorId } = body

    if (!sensorId) {
      return NextResponse.json({ error: "Missing required field: sensorId" }, { status: 400 })
    }

    const sensor = await dbOperations.getSensor(sensorId)
    if (!sensor) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    await dbOperations.updateSensorConnection(sensorId, false)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error disconnecting sensor:", error)
    return NextResponse.json({ error: "Failed to disconnect sensor" }, { status: 500 })
  }
}
