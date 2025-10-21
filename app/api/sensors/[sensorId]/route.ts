import { type NextRequest, NextResponse } from "next/server"
import { dbOperations } from "@/lib/db-operations"

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ sensorId: string }> }) {
  try {
    const { sensorId } = await params

    const sensor = await dbOperations.getSensor(sensorId)
    if (!sensor) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    await dbOperations.deleteSensor(sensorId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting sensor:", error)
    return NextResponse.json({ error: "Failed to delete sensor" }, { status: 500 })
  }
}
